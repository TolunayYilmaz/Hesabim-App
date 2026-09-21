"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  FileSpreadsheet,
  Layers,
  PackagePlus,
  Save,
  ScanBarcode,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader } from "@/components/dashboard/page-header";
import { api, ApiError, DEMO_ACCOUNT_EMAIL, getAuthUser } from "@/lib/api";

const CATEGORY_OPTIONS = ["Tohum", "Gübre", "Zirai İlaç"];

const BRAND_OPTIONS = ["Örnek Marka 1", "Agrovork"];

const VAT_OPTIONS = ["0", "1", "10", "20"];

// Hizli arama icin yerel urun katalogu (mock).
const CATALOG = [
  {
    name: "Buğday Tohumu (Çeşme-99)",
    barcode: "8681234567011",
    category: "Tohum",
    brand: "Agrovork",
    unit_price: 1250.5,
  },
  {
    name: "Kombine Gübre 18-46-0 (50 kg)",
    barcode: "8681234567028",
    category: "Gübre",
    brand: "Örnek Marka 1",
    unit_price: 845,
  },
  {
    name: "Zirai Mücadele İlacı – Mantar İlacı",
    barcode: "8681234567035",
    category: "Zirai İlaç",
    brand: "Agrovork",
    unit_price: 620.75,
  },
  {
    name: "Mısır Tohumu (ADA-9510)",
    barcode: "8681234567042",
    category: "Tohum",
    brand: "Örnek Marka 1",
    unit_price: 1890,
  },
  {
    name: "Üre Gübresi %46 (25 kg)",
    barcode: "8681234567059",
    category: "Gübre",
    brand: "Agrovork",
    unit_price: 412.25,
  },
];

export default function NewProductPage() {
  const router = useRouter();

  const [quick, setQuick] = useState("");
  const [name, setName] = useState("");
  const [barcode, setBarcode] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("Tohum");
  const [brand, setBrand] = useState("Agrovork");
  const [vat, setVat] = useState("20");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [excelName, setExcelName] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const isDemo =
    getAuthUser()?.email?.toLowerCase() === DEMO_ACCOUNT_EMAIL.toLowerCase();

  // Hizli arama katalogu yalnizca demo hesaba gosterilir.
  const suggestions = isDemo && quick.trim()
    ? CATALOG.filter(
        (item) =>
          item.name.toLowerCase().includes(quick.trim().toLowerCase()) ||
          item.barcode.includes(quick.trim()),
      )
    : [];

  const fillFromCatalog = (item: (typeof CATALOG)[number]) => {
    setName(item.name);
    setBarcode(item.barcode);
    setPrice(String(item.unit_price));
    setCategory(item.category);
    setBrand(item.brand);
    setQuick("");
  };

  const resetFields = () => {
    setName("");
    setBarcode("");
    setPrice("");
  };

  async function submitProduct(andNavigate: boolean) {
    setError(null);
    setSaved(false);
    if (!name.trim()) {
      setError("Ürün adı boş bırakılamaz.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        barcode: barcode.trim() || undefined,
        category: category === "Tüm kategoriler" ? undefined : category,
        brand: brand === "Tüm markalar" ? undefined : brand,
        unit_price: Number(price) || 0,
        tax_rate: Number(vat) || 0,
      };
      await api("/products", { method: "POST", body: payload });
      setSaved(true);
      if (andNavigate) {
        router.push("/products");
      } else {
        resetFields();
      }
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Ürün kaydedilemedi. Lütfen tekrar deneyin.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="Yeni Ürün / Hizmet"
        description="Ürün bilgilerini doldurun ve kaydedin."
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PackagePlus className="h-5 w-5 text-[#34d399]" />
            Ürün Kartı
          </CardTitle>
          <CardDescription>
            Ürünü hızlıca arayıp seçebilir ya da alanları elle doldurabilirsiniz.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Hizli arama / barkod */}
          <div className="space-y-2">
            <Label>Ürün isminden arayın ya da barkod okutun...</Label>
            <div className="relative">
              <ScanBarcode className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={quick}
                onChange={(e) => setQuick(e.target.value)}
                placeholder="Örn: tohum, 868123... veya ürün adı"
                className="pl-9"
              />
              {suggestions.length > 0 && (
                <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-md border bg-popover shadow-md">
                  {suggestions.map((item) => (
                    <button
                      key={item.barcode}
                      type="button"
                      onClick={() => fillFromCatalog(item)}
                      className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-[#a5f3fc]"
                    >
                      <span className="truncate">{item.name}</span>
                      <span className="shrink-0 font-mono text-xs text-muted-foreground">
                        {item.barcode}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Temel alanlar */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="name">Ürün Adı</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Örn: Buğday Tohumu"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="barcode">Barkod</Label>
              <Input
                id="barcode"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                placeholder="Örn: 8681234567011"
                className="font-mono"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="price">Satış Fiyatı</Label>
              <Input
                id="price"
                type="number"
                min="0"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0,00"
              />
            </div>
          </div>

          {/* Secimler */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label>Kategori</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Tüm kategoriler">Tüm kategoriler</SelectItem>
                  {CATEGORY_OPTIONS.map((opt) => (
                    <SelectItem key={opt} value={opt}>
                      {opt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Marka</Label>
              <Select value={brand} onValueChange={setBrand}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Tüm markalar">Tüm markalar</SelectItem>
                  {BRAND_OPTIONS.map((opt) => (
                    <SelectItem key={opt} value={opt}>
                      {opt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>KDV Oranı</Label>
              <Select value={vat} onValueChange={setVat}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {VAT_OPTIONS.map((opt) => (
                    <SelectItem key={opt} value={opt}>
                      %{opt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Excel dosya secimi */}
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={(e) => setExcelName(e.target.files?.[0]?.name ?? null)}
          />
          {excelName && (
            <div className="flex items-center gap-2 rounded-md border bg-muted p-3 text-sm">
              <FileSpreadsheet className="h-4 w-4 text-amber-600" />
              <span className="truncate">{excelName}</span>
              <Badge variant="warning" className="ml-auto shrink-0">
                Yakında
              </Badge>
            </div>
          )}

          {/* Toplu guncelleme paneli */}
          {bulkOpen && (
            <div className="rounded-md border border-[#22d3ee]/40 bg-[#cffafe]/60 p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-800">
                <Layers className="h-4 w-4 text-[#0e7490]" />
                Toplu Ürün Güncelleme
                <Badge variant="warning" className="ml-auto shrink-0">
                  Yakında
                </Badge>
              </div>
              <p className="mt-1 text-sm text-gray-600">
                Listeden seçtiğiniz ürünlere kategori, marka ve KDV oranı toplu
                uygulanacaktır.
              </p>
            </div>
          )}

          {error && (
            <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </p>
          )}
          {saved && (
            <p className="flex items-center gap-2 rounded-md bg-emerald-50 p-3 text-sm text-emerald-800">
              <CheckCircle2 className="h-4 w-4" />
              Ürün başarıyla kaydedildi.
            </p>
          )}

          {/* Aksiyon butonlari */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button
              type="button"
              onClick={() => submitProduct(false)}
              disabled={saving}
              className="bg-[#6ee7b7] font-semibold text-gray-800 shadow-sm hover:bg-[#34d399]"
            >
              <PackagePlus className="h-4 w-4" />
              Yeni Ürün/Hizmet Ekle
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => fileRef.current?.click()}
              disabled={saving}
              className="bg-[#fde047] font-semibold text-gray-800 shadow-sm hover:bg-[#facc15]"
            >
              <FileSpreadsheet className="h-4 w-4" />
              Excelden Ürün Yükle
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setBulkOpen((v) => !v)}
              disabled={saving}
              className="bg-[#67e8f9] font-semibold text-gray-800 shadow-sm hover:bg-[#22d3ee]"
            >
              <Layers className="h-4 w-4" />
              Toplu Ürün Güncelleme
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="ml-auto"
              onClick={(e) => {
                e.preventDefault();
                submitProduct(true);
              }}
            >
              <Save className="h-4 w-4" />
              {saving ? "Kaydediliyor..." : "Kaydet"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => router.back()}
              disabled={saving}
            >
              <ArrowLeft className="h-4 w-4" />
              Geri
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}