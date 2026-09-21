"use client";

import {
  BarChart3,
  FileDown,
  FileSpreadsheet,
  Loader2,
  Printer,
} from "lucide-react";
import { useEffect, useState } from "react";

import { PageHeader } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { api } from "@/lib/api";

const ISLEM_TURLERI = [
  "Tüm hareketler",
  "Borç hareketleri",
  "Alacak hareketleri",
  "Müşteri tahsilatları",
  "Tedarikçi ödemeleri",
  "Virman hareketleri",
  "Kredi ödemeleri",
];

const BELGE_DURUMLARI = [
  "Faturalar",
  "Açık İrsaliyeler",
  "Faturalaşmış İrsaliyeler",
  "Sipariş/Proforma/Taslak",
  "İptal Edilmişler",
];

const STOK_DURUMLARI = [
  "Stokta olanları göster",
  "Stokta olmayanları göster",
  "Kritik stok seviyesindekileri göster",
  "Tümünü göster",
];

const CARI_DURUMLARI = [
  "Vadesi geçen alacaklarınız",
  "Vadesi geçen borçlarınız",
  "Borçlular",
  "Alacaklılar",
];

interface SalesRow {
  identity_name?: string;
  identity_type?: string | null;
  movement_count?: number;
  credit_total?: number;
  debit_total?: number;
  net?: number;
}

interface SalesReport {
  rows: SalesRow[];
  totals: { credit_total: number; debit_total: number; net: number };
  document_stats?: { count: number; total: number } | null;
  cari_ozet: {
    overdue_receivable_count: number;
    overdue_receivable_amount: number;
    overdue_payable_count: number;
    overdue_payable_amount: number;
    debtors: { identity_name: string; balance: number }[];
    creditors: { identity_name: string; balance: number }[];
  };
}

interface InventoryRow {
  product_name?: string;
  barcode?: string | null;
  category?: string | null;
  brand?: string | null;
  reorder_level?: number;
  total_in?: number;
  total_out?: number;
  stock?: number;
}

interface InventoryReport {
  rows: InventoryRow[];
  product_count: number;
}

interface CashAccountRow {
  cash_account_name?: string;
  currency?: string | null;
  opening_balance?: number;
  period_in?: number;
  period_out?: number;
  net?: number;
  closing_balance?: number;
}

interface CashTypeRow {
  transaction_type?: string;
  movement_count?: number;
  total?: number;
}

interface CashReport {
  accounts: CashAccountRow[];
  type_rows: CashTypeRow[];
  total_in: number;
  total_out: number;
}

const tl = (v?: number) =>
  (v ?? 0).toLocaleString("tr-TR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export default function ReportsPage() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [kasaId, setKasaId] = useState("");
  const [islemTuru, setIslemTuru] = useState("Tüm hareketler");
  const [belgeDurumu, setBelgeDurumu] = useState("Faturalar");
  const [stokDurumu, setStokDurumu] = useState("Tümünü göster");
  const [cariDurum, setCariDurum] = useState("Vadesi geçen alacaklarınız");
  const [devir, setDevir] = useState(false);
  const [riskUstu, setRiskUstu] = useState(false);

  const [cashAccounts, setCashAccounts] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [sales, setSales] = useState<SalesReport | null>(null);
  const [inventory, setInventory] = useState<InventoryReport | null>(null);
  const [cash, setCash] = useState<CashReport | null>(null);

  useEffect(() => {
    api<{ id: string; name: string }[]>("/cash-accounts")
      .then((rows) => {
        const sorted = [...rows].sort((a, b) => a.name.localeCompare(b.name));
        setCashAccounts(sorted);
      })
      .catch(() => setCashAccounts([]));
  }, []);

  async function hazirla() {
    setLoading(true);
    setError("");
    try {
      const salesParams = new URLSearchParams();
      if (startDate) salesParams.set("start_date", startDate);
      if (endDate) salesParams.set("end_date", endDate);
      salesParams.set("islem_turu", islemTuru);
      salesParams.set("belge_durumu", belgeDurumu);
      salesParams.set("cari_durum", cariDurum);
      if (riskUstu) salesParams.set("risk_ustu", "true");

      const invParams = new URLSearchParams();
      if (startDate) invParams.set("start_date", startDate);
      if (endDate) invParams.set("end_date", endDate);
      invParams.set("stok_durumu", stokDurumu);

      const cashParams = new URLSearchParams();
      if (startDate) cashParams.set("start_date", startDate);
      if (endDate) cashParams.set("end_date", endDate);
      if (kasaId && cashAccounts.some((acc) => acc.id === kasaId)) {
        cashParams.set("kasa_id", kasaId);
      }
      cashParams.set("islem_turu", islemTuru);
      if (devir) cashParams.set("devir", "true");

      const [salesRes, inventoryRes, cashRes] = await Promise.all([
        api<SalesReport>(`/reports/sales?${salesParams.toString()}`),
        api<InventoryReport>(`/reports/inventory?${invParams.toString()}`),
        api<CashReport>(`/reports/cash?${cashParams.toString()}`),
      ]);
      setSales(salesRes);
      setInventory(inventoryRes);
      setCash(cashRes);
    } catch (e) {
      setError((e as Error).message ?? "Rapor hazırlanamadı.");
    } finally {
      setLoading(false);
    }
  }

  function excelIer() {
    const lines: string[] = [];

    if (sales) {
      lines.push("Satış / Alış Raporu");
      lines.push("Cari;Tür;Hareket Sayısı;Alacak (Giriş);Borç (Çıkış);Net");
      for (const r of sales.rows) {
        lines.push(
          `${r.identity_name ?? ""};${r.identity_type ?? ""};${r.movement_count ?? 0};${tl(
            r.credit_total,
          )};${tl(r.debit_total)};${tl(r.net)}`,
        );
      }
      lines.push(`TOPLAM;;;${tl(sales.totals.credit_total)};${tl(sales.totals.debit_total)};${tl(sales.totals.net)}`);
    }

    if (inventory) {
      lines.push("");
      lines.push("Envanter Raporu");
      lines.push("Ürün;Barkod;Kategori;Marka;Giriş;Çıkış;Stok");
      for (const r of inventory.rows) {
        lines.push(
          `${r.product_name ?? ""};${r.barcode ?? ""};${r.category ?? ""};${r.brand ?? ""};${tl(
            r.total_in,
          )};${tl(r.total_out)};${tl(r.stock)}`,
        );
      }
    }

    if (cash) {
      lines.push("");
      lines.push("Kasa / Banka Raporu");
      lines.push("Hesap;Para Birimi;Devir;Dönem Giriş;Dönem Çıkış;Net;Kapanış");
      for (const a of cash.accounts) {
        lines.push(
          `${a.cash_account_name ?? ""};${a.currency ?? ""};${tl(a.opening_balance)};${tl(
            a.period_in,
          )};${tl(a.period_out)};${tl(a.net)};${tl(a.closing_balance)}`,
        );
      }
    }

    if (lines.length === 0) return;
    const blob = new Blob(["\uFEFF" + lines.join("\n")], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "raporlar.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <PageHeader
        title="Gelişmiş Raporlar"
        description="Kasa/banka, satış/alış ve envanter raporlarını filtreleyerek üretin."
      />

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Rapor Filtreleri</CardTitle>
          <CardDescription>
            Tarih aralığını ve filtreleri seçip raporu hazırlayın.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="start-date">Başlangıç Tarihi</Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end-date">Bitiş Tarihi</Label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Kasa/Banka (Finans Raporu İçin)</Label>
              <Select value={kasaId} onValueChange={setKasaId}>
                <SelectTrigger>
                  <SelectValue placeholder="Tüm kasa ve hesaplar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Tüm kasa ve hesaplar</SelectItem>
                  {cashAccounts.length > 0 ? (
                    cashAccounts.map((acc) => (
                      <SelectItem key={acc.id} value={acc.id}>
                        {acc.name}
                      </SelectItem>
                    ))
                  ) : (
                    <>
                      <SelectItem value="kasa">Kasa (0,00 TL)</SelectItem>
                      <SelectItem value="banka-tl">Banka TL Hesabı</SelectItem>
                      <SelectItem value="banka-usd">Banka USD Hesabı</SelectItem>
                      <SelectItem value="pos">POS Hesabı</SelectItem>
                      <SelectItem value="kk">Kredi Kartım</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>İşlem Türü (Satış/Alış Raporu İçin)</Label>
              <Select value={islemTuru} onValueChange={setIslemTuru}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ISLEM_TURLERI.map((opt) => (
                    <SelectItem key={opt} value={opt}>
                      {opt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Belge Durumu</Label>
              <Select value={belgeDurumu} onValueChange={setBelgeDurumu}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BELGE_DURUMLARI.map((opt) => (
                    <SelectItem key={opt} value={opt}>
                      {opt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Stok Durumu (Envanter Raporu İçin)</Label>
              <Select value={stokDurumu} onValueChange={setStokDurumu}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STOK_DURUMLARI.map((opt) => (
                    <SelectItem key={opt} value={opt}>
                      {opt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Cari Durum (Geciken Alacak/Borç Raporu İçin)</Label>
              <Select value={cariDurum} onValueChange={setCariDurum}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CARI_DURUMLARI.map((opt) => (
                    <SelectItem key={opt} value={opt}>
                      {opt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-2">
              <Checkbox
                id="devir"
                checked={devir}
                onCheckedChange={(v) => setDevir(v === true)}
              />
              <Label htmlFor="devir" className="cursor-pointer">
                Devir bakiyeyi dahil et
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="risk"
                checked={riskUstu}
                onCheckedChange={(v) => setRiskUstu(v === true)}
              />
              <Label htmlFor="risk" className="cursor-pointer">
                Risk limitini aşanları göster
              </Label>
            </div>
          </div>

          {error && (
            <p className="mt-4 text-sm font-medium text-destructive">{error}</p>
          )}

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Button onClick={hazirla} disabled={loading}>
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <BarChart3 className="h-4 w-4" />
              )}
              Raporu Hazırla
            </Button>
            <Button
              variant="outline"
              onClick={excelIer}
              disabled={loading}
              className="bg-[#fde047] font-semibold text-gray-800 shadow-sm hover:bg-[#facc15]"
            >
              <FileSpreadsheet className="h-4 w-4" />
              Excel Olarak İndir
            </Button>
            <Button
              variant="outline"
              onClick={() => window.print()}
              disabled={loading}
              className="bg-[#fde047] font-semibold text-gray-800 shadow-sm hover:bg-[#facc15]"
            >
              <Printer className="h-4 w-4" />
              PDF Olarak İndir
            </Button>
          </div>
        </CardContent>
      </Card>

      {sales && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Satış / Alış Raporu</CardTitle>
            <CardDescription>Cari bazında finansal hareket özeti.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">
                Belge Durumu: {belgeDurumu} — {sales.document_stats?.count ?? 0} belge,{" "}
                {tl(sales.document_stats?.total)} TL
              </Badge>
              <Badge variant="secondary">
                Cari Durum: {cariDurum}
                {cariDurum === "Vadesi geçen alacaklarınız" &&
                  ` — ${sales.cari_ozet.overdue_receivable_count} belge, ${tl(
                    sales.cari_ozet.overdue_receivable_amount,
                  )} TL`}
                {cariDurum === "Vadesi geçen borçlarınız" &&
                  ` — ${sales.cari_ozet.overdue_payable_count} belge, ${tl(
                    sales.cari_ozet.overdue_payable_amount,
                  )} TL`}
                {cariDurum === "Borçlular" && ` — ${sales.cari_ozet.debtors.length} cari`}
                {cariDurum === "Alacaklılar" && ` — ${sales.cari_ozet.creditors.length} cari`}
              </Badge>
            </div>
            <div className="overflow-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cari</TableHead>
                    <TableHead>Tür</TableHead>
                    <TableHead className="text-right">Hareket</TableHead>
                    <TableHead className="text-right">Alacak (Giriş)</TableHead>
                    <TableHead className="text-right">Borç (Çıkış)</TableHead>
                    <TableHead className="text-right">Net</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sales.rows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground">
                        Rapor döneminde hareket bulunamadı.
                      </TableCell>
                    </TableRow>
                  ) : (
                    sales.rows.map((r, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-medium">
                          {r.identity_name}
                        </TableCell>
                        <TableCell>{r.identity_type}</TableCell>
                        <TableCell className="text-right">
                          {r.movement_count}
                        </TableCell>
                        <TableCell className="text-right">{tl(r.credit_total)}</TableCell>
                        <TableCell className="text-right">{tl(r.debit_total)}</TableCell>
                        <TableCell
                          className={
                            "text-right font-semibold " +
                            ((r.net ?? 0) >= 0 ? "text-emerald-600" : "text-destructive")
                          }
                        >
                          {tl(r.net)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            <div className="flex flex-wrap gap-4 text-sm">
              <span>
                Toplam Alacak:{" "}
                <strong className="text-emerald-600">{tl(sales.totals.credit_total)} TL</strong>
              </span>
              <span>
                Toplam Borç:{" "}
                <strong className="text-destructive">{tl(sales.totals.debit_total)} TL</strong>
              </span>
              <span>
                Net: <strong>{tl(sales.totals.net)} TL</strong>
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {inventory && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Envanter Raporu</CardTitle>
            <CardDescription>
              {stokDurumu} — {inventory.product_count} ürün listelendi.
            </CardDescription>
          </CardHeader>
          <CardContent className="overflow-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ürün</TableHead>
                  <TableHead>Barkod</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead>Marka</TableHead>
                  <TableHead className="text-right">Kritik Seviye</TableHead>
                  <TableHead className="text-right">Giriş</TableHead>
                  <TableHead className="text-right">Çıkış</TableHead>
                  <TableHead className="text-right">Stok</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inventory.rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground">
                      Filtreye uygun ürün bulunamadı.
                    </TableCell>
                  </TableRow>
                ) : (
                  inventory.rows.map((r, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium">{r.product_name}</TableCell>
                      <TableCell>{r.barcode}</TableCell>
                      <TableCell>{r.category}</TableCell>
                      <TableCell>{r.brand}</TableCell>
                      <TableCell className="text-right">{tl(r.reorder_level)}</TableCell>
                      <TableCell className="text-right">{tl(r.total_in)}</TableCell>
                      <TableCell className="text-right">{tl(r.total_out)}</TableCell>
                      <TableCell
                        className={
                          "text-right font-semibold " +
                          ((r.stock ?? 0) <= 0 ? "text-destructive" : "")
                        }
                      >
                        {tl(r.stock)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {cash && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Kasa / Banka Raporu</CardTitle>
            <CardDescription>
              {islemTuru}
              {devir ? " — devir bakiyesi dahil" : " — devir bakiyesi hariç"}.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="overflow-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Hesap</TableHead>
                    <TableHead>Para Birimi</TableHead>
                    <TableHead className="text-right">Devir</TableHead>
                    <TableHead className="text-right">Dönem Giriş</TableHead>
                    <TableHead className="text-right">Dönem Çıkış</TableHead>
                    <TableHead className="text-right">Net</TableHead>
                    <TableHead className="text-right">Kapanış</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cash.accounts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground">
                        Kasa / banka hesabı bulunamadı.
                      </TableCell>
                    </TableRow>
                  ) : (
                    cash.accounts.map((a, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-medium">
                          {a.cash_account_name}
                        </TableCell>
                        <TableCell>{a.currency}</TableCell>
                        <TableCell className="text-right">{tl(a.opening_balance)}</TableCell>
                        <TableCell className="text-right text-emerald-600">
                          {tl(a.period_in)}
                        </TableCell>
                        <TableCell className="text-right text-destructive">
                          {tl(a.period_out)}
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {tl(a.net)}
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {tl(a.closing_balance)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {cash.type_rows.length > 0 && (
              <div className="overflow-auto rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>İşlem Türü</TableHead>
                      <TableHead className="text-right">Adet</TableHead>
                      <TableHead className="text-right">Tutar</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cash.type_rows.map((t, idx) => (
                      <TableRow key={idx}>
                        <TableCell>{t.transaction_type}</TableCell>
                        <TableCell className="text-right">{t.movement_count}</TableCell>
                        <TableCell className="text-right">{tl(t.total)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            <div className="flex flex-wrap gap-4 text-sm">
              <span>
                Toplam Giriş:{" "}
                <strong className="text-emerald-600">{tl(cash.total_in)} TL</strong>
              </span>
              <span>
                Toplam Çıkış:{" "}
                <strong className="text-destructive">{tl(cash.total_out)} TL</strong>
              </span>
              <span>
                Net: <strong>{tl(cash.total_in - cash.total_out)} TL</strong>
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {!sales && !inventory && !cash && (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
            <FileDown className="h-10 w-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Rapor sonuçları için yukarıdan filtreleri seçip{" "}
              <strong>Raporu Hazırla</strong> butonuna basın.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}