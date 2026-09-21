from datetime import date
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query

from app.deps import get_company_id, get_user_client_dep
from app.schemas.reports import (
    CashReportResponse,
    DocumentStat,
    InventoryReportResponse,
    SalesReportResponse,
)

router = APIRouter(prefix="/reports", tags=["Gelismis Raporlar"])

# "Islem Turu (Satis/Alis Raporu Icin)" secenekleri -> RPC type token'i
ISLEM_TURU_MAP = {
    "Borç hareketleri": "DEBIT",
    "Alacak hareketleri": "Tahsilat",
    "Müşteri tahsilatları": "Tahsilat",
    "Tedarikçi ödemeleri": "Odeme",
    "Virman hareketleri": "Virman",
    "Kredi ödemeleri": "Kredi",
}

# "Belge Durumu" secenekleri -> (doc_type, status) eslesmesi
BELGE_DURUMU_MAP = {
    "Faturalar": ("selected", None),
    "Açık İrsaliyeler": ("Waybill", "Open"),
    "Faturalaşmış İrsaliyeler": ("SalesInvoice", "Invoiced"),
    "Sipariş/Proforma/Taslak": ("Proposal", "Draft"),
    "İptal Edilmişler": ("SalesInvoice", "Cancelled"),
}

# "Stok Durumu (Envanter Raporu Icin)" secenekleri
STOK_DURUMU_OPTIONS = {
    "Stokta olanları göster": "INSTOCK",
    "Stokta olmayanları göster": "OUTOFSTOCK",
    "Kritik stok seviyesindekileri göster": "CRITICAL",
    "Tümünü göster": "ALL",
}


def _d(value: Optional[date]):
    return value.isoformat() if value else None


def _type_token(raw: str) -> str:
    if not raw or raw in ("Tüm hareketler",):
        return "ALL"
    return ISLEM_TURU_MAP.get(raw, raw)


def _doc_filters(belge_durumu: str):
    """Belge Durumu secenegine gore documents filtrelerini dondurur."""
    if not belge_durumu:
        return None
    matched = BELGE_DURUMU_MAP.get(belge_durumu)
    if matched is None:
        return None
    if matched[0] == "selected":
        return {"doc_type": ["SalesInvoice", "PurchaseInvoice"], "status": None}
    return {"doc_type": matched[0], "status": matched[1]}


@router.get("/sales", response_model=SalesReportResponse)
def sales_report(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    musteri_id: Optional[UUID] = Query(default=None, alias="musteri_id"),
    islem_turu: str = "Tüm hareketler",
    belge_durumu: Optional[str] = None,
    cari_durum: Optional[str] = None,
    risk_ustu: bool = False,
    company_id: str = Depends(get_company_id),
    client=Depends(get_user_client_dep),
):
    """Satis/Alis raporu: cari bazinda finansal hareket ozeti + cari durum.

    - islem_turu: Islem Turu secenegi (Borc/Alacak/Virman/Kredi/...)
    - belge_durumu: secilen Belge Durumuna ait belge sayisi/ozeti
    - cari_durum: cari ozet bloğunun odaklandigi secenek (gosterim icin)
    - risk_ustu: yalnizca finansal hareketi olan (risk teskil eden) cariler
    """
    res = client.rpc(
        "report_sales",
        {
            "p_company_id": company_id,
            "p_start": _d(start_date),
            "p_end": _d(end_date),
            "p_identity": str(musteri_id) if musteri_id else None,
            "p_type": _type_token(islem_turu),
        },
    ).execute().data

    cari = client.rpc("report_cari", {"p_company_id": company_id}).execute().data

    document_stats = None
    doc_filter = _doc_filters(belge_durumu or "Faturalar")
    if doc_filter is not None:
        q = (
            client.table("documents")
            .select("total_amount")
            .eq("company_id", company_id)
        )
        if start_date:
            q = q.gte("issue_date", str(start_date))
        if end_date:
            q = q.lte("issue_date", str(end_date))
        if doc_filter["status"]:
            q = q.eq("doc_type", doc_filter["doc_type"]).eq("status", doc_filter["status"])
        else:
            q = q.in_("doc_type", doc_filter["doc_type"])
        docs = q.execute().data
        document_stats = DocumentStat(
            count=len(docs),
            total=float(sum(float(d.get("total_amount") or 0) for d in docs)),
        )

    data = dict(res)
    data["cari_ozet"] = cari
    data["document_stats"] = (
        document_stats.model_dump() if document_stats else None
    )

    if risk_ustu:
        data["rows"] = [r for r in data["rows"] if float(r.get("net") or 0) != 0]

    return SalesReportResponse.model_validate(data)


@router.get("/inventory", response_model=InventoryReportResponse)
def inventory_report(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    stok_durumu: str = "Tümünü göster",
    company_id: str = Depends(get_company_id),
    client=Depends(get_user_client_dep),
):
    """Envanter raporu: end_date'e kadar anlik stok + donem hareketleri.

    - stok_durumu: Stok Durumu secenegi (stokta olan/olmayan/kritik/tumu)
    - start_date: hareket ozeti icin baslangic; anlik stok end_date itibariyle
    """
    res = client.rpc(
        "report_inventory",
        {"p_company_id": company_id, "p_end": _d(end_date)},
    ).execute().data

    mode = STOK_DURUMU_OPTIONS.get(stok_durumu, "ALL")
    rows = []
    for r in res:
        stock = float(r.get("stock") or 0)
        critical = float(r.get("reorder_level") or 0)
        if mode == "INSTOCK" and stock <= 0:
            continue
        if mode == "OUTOFSTOCK" and stock > 0:
            continue
        if mode == "CRITICAL" and stock > critical:
            continue
        rows.append(r)

    return InventoryReportResponse(rows=rows, product_count=len(rows))


@router.get("/cash", response_model=CashReportResponse)
def cash_report(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    kasa_id: Optional[UUID] = None,
    islem_turu: str = "Tüm hareketler",
    devir: bool = False,
    company_id: str = Depends(get_company_id),
    client=Depends(get_user_client_dep),
):
    """Kasa/Banka raporu: hesap bazinda devir + donem giris/cikis ozeti.

    - kasa_id: kasa/banka hesabi filtresi (bos = tum kasa ve hesaplar)
    - islem_turu: Islem Turu secenegi
    - devir: "Devir bakiyeyi dahil et" secenegi
    """
    res = client.rpc(
        "report_cash",
        {
            "p_company_id": company_id,
            "p_start": _d(start_date),
            "p_end": _d(end_date),
            "p_cash": str(kasa_id) if kasa_id else None,
            "p_type": _type_token(islem_turu),
            "p_devir": devir,
        },
    ).execute().data
    return CashReportResponse.model_validate(res)