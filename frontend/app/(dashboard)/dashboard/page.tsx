"use client";

import { useEffect, useState } from "react";

import { api } from "@/lib/api";
import { PageHeader } from "@/components/dashboard/page-header";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface DashboardSummary {
  cash_balance: string;
  customer_balance: string;
  supplier_balance: string;
  product_count: number;
  pending_cheques: number;
  pending_cheques_amount: string;
  monthly_expenses: string;
}

const fmt = (v: string | number | undefined) =>
  new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
  }).format(Number(v ?? 0));

export default function OverviewPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<DashboardSummary>("/dashboard/summary")
      .then(setSummary)
      .catch((e) => setError(e.message));
  }, []);

  return (
    <div>
      <PageHeader
        title="Genel Bakış"
        description="Finansal durum, stok ve son hareketlerin özeti."
      />

      {error && (
        <p className="mb-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          Veri yüklenemedi: {error} — giriş yaptığınızdan ve firma seçtiğinizden emin olun.
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <KpiCard label="Kasa / Banka Toplamı" value={fmt(summary?.cash_balance)} />
        <KpiCard label="Müşteri Alacakları" value={fmt(summary?.customer_balance)} />
        <KpiCard label="Satıcı Borçları" value={fmt(summary?.supplier_balance)} />
        <KpiCard label="Bu Ayki Masraflar" value={fmt(summary?.monthly_expenses)} />
        <KpiCard
          label="Bekleyen Çek / Senet"
          value={`${summary?.pending_cheques ?? 0} adet · ${fmt(
            summary?.pending_cheques_amount,
          )}`}
        />
        <KpiCard label="Aktif Ürün Sayısı" value={String(summary?.product_count ?? 0)} />
      </div>
    </div>
  );
}

function KpiCard({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}