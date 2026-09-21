"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/dashboard/page-header";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import { api } from "@/lib/api";

interface ProductRow {
  id: string;
  name: string;
  barcode: string;
  category: string;
  brand: string;
  unit_price: number;
  stock: number;
}

const tl = (value: number) =>
  new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
  }).format(value);

// Veritabani bosken tasarimi gormek icin ornek (mock) urunler.
const MOCK_PRODUCTS: ProductRow[] = [
  {
    id: "mock-1",
    name: "Buğday Tohumu (Çeşme-99)",
    barcode: "8681234567011",
    category: "Tohum",
    brand: "Agrovork",
    unit_price: 1250.5,
    stock: 340,
  },
  {
    id: "mock-2",
    name: "Kombine Gübre 18-46-0 (50 kg)",
    barcode: "8681234567028",
    category: "Gübre",
    brand: "Örnek Marka 1",
    unit_price: 845,
    stock: 120,
  },
  {
    id: "mock-3",
    name: "Zirai Mücadele İlacı – Mantar İlacı",
    barcode: "8681234567035",
    category: "Zirai İlaç",
    brand: "Agrovork",
    unit_price: 620.75,
    stock: 18,
  },
  {
    id: "mock-4",
    name: "Mısır Tohumu (ADA-9510)",
    barcode: "8681234567042",
    category: "Tohum",
    brand: "Örnek Marka 1",
    unit_price: 1890,
    stock: 76,
  },
  {
    id: "mock-5",
    name: "Üre Gübresi %46 (25 kg)",
    barcode: "8681234567059",
    category: "Gübre",
    brand: "Agrovork",
    unit_price: 412.25,
    stock: 205,
  },
];

export default function ProductsPage() {
  const router = useRouter();
  const [rows, setRows] = useState<ProductRow[]>(MOCK_PRODUCTS);

  // Gercek veri varsa onu goster, bos ise mock veri tabloda kalsin.
  useEffect(() => {
    api<ProductRow[]>("/products")
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) setRows(data);
      })
      .catch(() => {
        /* API hazir degilse mock veri gozukmeye devam eder */
      });
  }, []);

  const columns: DataTableColumn<ProductRow>[] = [
    { header: "Ürün Hizmet Adı", accessorKey: "name" },
    { header: "Barkod", accessorKey: "barcode", className: "font-mono" },
    {
      header: "Kategori",
      accessorKey: "category",
      render: (row) => (
        <Badge variant="secondary" className="bg-[#a5f3fc] text-gray-800">
          {row.category}
        </Badge>
      ),
    },
    { header: "Marka", accessorKey: "brand" },
    {
      header: "Satış Fiyatı",
      accessorKey: "unit_price",
      align: "right",
      className: "font-semibold",
      render: (row) => tl(Number(row.unit_price) || 0),
    },
    {
      header: "Stok Miktarı",
      accessorKey: "stock",
      align: "right",
      render: (row) => {
        const stock = Number(row.stock) || 0;
        return (
          <Badge
            variant={stock <= 20 ? "warning" : stock <= 0 ? "destructive" : "success"}
          >
            {stock} adet
          </Badge>
        );
      },
    },
  ];

  return (
    <div>
      <PageHeader
        title="Ürünler"
        description="Ürün kartları, barkod, kategori ve fiyat bilgileri."
      />
      <DataTable
        columns={columns}
        data={rows}
        getRowId={(row) => row.id}
        searchPlaceholder="Ürün, barkod veya kategori ara..."
        addLabel="Yeni Ürün Ekle"
        onAdd={() => router.push("/products/new")}
      />
    </div>
  );
}