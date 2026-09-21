"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { z } from "zod";

import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FormDatePicker } from "@/components/form/form-date-picker";
import { FormInput } from "@/components/form/form-input";
import { FormSelect } from "@/components/form/form-select";
import { FormTextarea } from "@/components/form/form-textarea";

/* JSON'daki "options" listeleri - degerler birebir korunur */
const PAYMENT_METHODS = [
  { label: "Nakit", value: "Nakit" },
  { label: "Havale/EFT", value: "Havale/EFT" },
];

const COLLECTION_BANKS = [
  "Akbank",
  "Aktifbank",
  "Albaraka Türk",
  "AlternatifBank",
  "Anadolubank",
  "Burgan Bank",
  "Citibank",
  "Denizbank",
  "Garanti Bankası",
].map((b) => ({ label: b, value: b }));

interface CashAccount {
  id: string;
  name: string;
  currency: string;
  balance: number;
}

const chequeBondSchema = z.object({
  collection_date: z.string().nullable(),
  payment_date: z.string().nullable(),
  amount: z.coerce
    .number({ invalid_type_error: "Çek tutarı girin." })
    .gt(0, "Çek tutarı sıfırdan büyük olmalıdır."),
  currency_rate: z.coerce.number().min(0, "Kur sıfırdan küçük olamaz."),
  deduction: z.coerce.number().min(0, "Masraf kesintisi sıfırdan küçük olamaz."),
  cash_account_id: z.string().nullable(),
  payment_method: z.enum(["Nakit", "Havale/EFT"]),
  bank_name: z.string().min(1, "Tahsile verilen bankayı seçin."),
  description: z.string().max(1000),
});

type ChequeBondFormValues = z.infer<typeof chequeBondSchema>;

export function ChequeBondForm() {
  const router = useRouter();
  const [cashAccounts, setCashAccounts] = useState<CashAccount[]>([]);
  const [accountsLoading, setAccountsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const methods = useForm<ChequeBondFormValues>({
    resolver: zodResolver(chequeBondSchema),
    defaultValues: {
      collection_date: null,
      payment_date: null,
      amount: undefined as unknown as number,
      currency_rate: 1,
      deduction: 0,
      cash_account_id: null,
      payment_method: "Nakit",
      bank_name: "",
      description: "",
    },
  });

  useEffect(() => {
    api<CashAccount[]>("/cash-accounts/")
      .then(setCashAccounts)
      .catch(() => setCashAccounts([]))
      .finally(() => setAccountsLoading(false));
  }, []);

  const accountOptions = cashAccounts.map((a) => ({
    label: `${a.name} · ${a.currency}`,
    value: a.id,
  }));

  async function onSubmit(data: ChequeBondFormValues) {
    setError(null);
    setSaving(true);
    try {
      await api("/cheques-bonds/", {
        method: "POST",
        body: {
          collection_date: data.collection_date || null,
          payment_date: data.payment_date || null,
          amount: data.amount,
          currency_rate: data.currency_rate,
          deduction: data.deduction,
          cash_account_id: data.cash_account_id || null,
          payment_method: data.payment_method,
          bank_name: data.bank_name,
          description: data.description.trim() || null,
        },
      });
      router.push("/cheques-bonds");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Çek/Senet oluşturulamadı.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Çek / Senet İşlemleri</CardTitle>
            <CardDescription>
              Çek veya senet tahsilat bilgilerini girin.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <FormDatePicker name="collection_date" label="Tahsilat Tarihi" />
            <FormDatePicker name="payment_date" label="Ödeme Tarihi" />
            <FormInput
              name="amount"
              label="Çek Tutarı"
              type="number"
              step="0.01"
              min="0"
              placeholder="0,00"
              required
            />
            <FormInput
              name="currency_rate"
              label="Kur"
              type="number"
              step="0.0001"
              min="0"
              placeholder="1,00"
            />
            <FormInput
              name="deduction"
              label="Masraf Kesintisi"
              type="number"
              step="0.01"
              min="0"
              placeholder="0,00"
            />
            <FormSelect
              name="cash_account_id"
              label="Kasa/Hesap"
              options={accountOptions}
              placeholder={
                accountsLoading ? "Hesaplar yükleniyor..." : "Kasa/Hesap seçin"
              }
              disabled={accountsLoading}
            />
            <FormSelect
              name="payment_method"
              label="Ödeme Şekli"
              options={PAYMENT_METHODS}
              required
            />
            <FormSelect
              name="bank_name"
              label="Tahsile Verilen Banka"
              options={COLLECTION_BANKS}
              placeholder="Tahsile verilen bankayı seçin"
              required
            />
            <FormTextarea
              name="description"
              label="Açıklama"
              rows={3}
              containerClassName="sm:col-span-2 lg:col-span-3"
            />
          </CardContent>
        </Card>

        {error && (
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            Çek/Senet oluşturulamadı: {error}
          </div>
        )}

        <div className="flex justify-end">
          <Button type="submit" disabled={saving}>
            <Save className="h-4 w-4" />
            {saving ? "Kaydediliyor..." : "Kaydet"}
          </Button>
        </div>
      </form>
    </FormProvider>
  );
}