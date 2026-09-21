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
const PAYMENT_SCHEDULES = [
  "Her Ay",
  "İki Ayda Bir",
  "Üç Ayda Bir",
  "Dört Ayda Bir",
  "Altı Ayda Bir",
  "Yılda Bir",
].map((s) => ({ label: s, value: s }));

interface CashAccount {
  id: string;
  name: string;
  currency: string;
  balance: number;
}

const creditSchema = z.object({
  name: z.string().min(1, "Kredi adı zorunludur.").max(255),
  remaining_debt: z.coerce
    .number({ invalid_type_error: "Kalan borç tutarı girin." })
    .min(0, "Kalan borç tutarı sıfırdan küçük olamaz."),
  remaining_installments: z.coerce
    .number({ invalid_type_error: "Taksit sayısı girin." })
    .int("Taksit sayısı tam sayı olmalıdır.")
    .min(0)
    .max(144, "Maksimum 144 taksit girebilirsiniz."),
  first_installment_date: z.string().nullable(),
  payment_schedule: z.enum([
    "Her Ay",
    "İki Ayda Bir",
    "Üç Ayda Bir",
    "Dört Ayda Bir",
    "Altı Ayda Bir",
    "Yılda Bir",
  ]),
  cash_account_id: z.string().nullable(),
  notes: z.string().max(1000),
});

type CreditFormValues = z.infer<typeof creditSchema>;

export function CreditForm() {
  const router = useRouter();
  const [cashAccounts, setCashAccounts] = useState<CashAccount[]>([]);
  const [accountsLoading, setAccountsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const methods = useForm<CreditFormValues>({
    resolver: zodResolver(creditSchema),
    defaultValues: {
      name: "",
      remaining_debt: 0,
      remaining_installments: 0,
      first_installment_date: null,
      payment_schedule: "Her Ay",
      cash_account_id: null,
      notes: "",
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

  async function onSubmit(data: CreditFormValues) {
    setError(null);
    setSaving(true);
    try {
      await api("/credits/", {
        method: "POST",
        body: {
          name: data.name.trim(),
          remaining_debt: data.remaining_debt,
          remaining_installments: data.remaining_installments,
          first_installment_date: data.first_installment_date || null,
          payment_schedule: data.payment_schedule,
          cash_account_id: data.cash_account_id || null,
          notes: data.notes.trim() || null,
        },
      });
      router.push("/credits");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kredi oluşturulamadı.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Kredi Bilgileri</CardTitle>
            <CardDescription>
              Krediyi ve ödeme takvimini belirleyin.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <FormInput
              name="name"
              label="Kredi Adı"
              placeholder="Kredi adını girin"
              required
            />
            <FormInput
              name="remaining_debt"
              label="Kalan Borç Tutarı"
              type="number"
              step="0.01"
              min="0"
              placeholder="0,00"
              required
            />
            <FormInput
              name="remaining_installments"
              label="Kalan Taksit Sayısı (Maksimum 144 taksit girebilirsiniz)"
              type="number"
              min="0"
              max="144"
              placeholder="0"
              required
            />
            <FormDatePicker name="first_installment_date" label="Sıradaki İlk Taksit Tarihi" />
            <FormSelect
              name="payment_schedule"
              label="Ödeme Takvimi"
              options={PAYMENT_SCHEDULES}
              required
            />
            <FormSelect
              name="cash_account_id"
              label="Ödediğiniz Hesap"
              options={accountOptions}
              placeholder={
                accountsLoading ? "Hesaplar yükleniyor..." : "Hesap seçin"
              }
              disabled={accountsLoading}
            />
            <FormTextarea
              name="notes"
              label="Notlar"
              rows={3}
              containerClassName="sm:col-span-2"
            />
          </CardContent>
        </Card>

        {error && (
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            Kredi oluşturulamadı: {error}
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