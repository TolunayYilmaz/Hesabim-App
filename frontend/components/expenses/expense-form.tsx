"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Archive, ArrowLeft, Save } from "lucide-react";
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
import { FormCheckbox } from "@/components/form/form-checkbox";
import { FormDatePicker } from "@/components/form/form-date-picker";
import { FormInput } from "@/components/form/form-input";
import { FormSelect } from "@/components/form/form-select";
import { FormTextarea } from "@/components/form/form-textarea";

/* JSON'daki "options" listeleri - label/option degerleri birebir korunur */
const COST_ACCOUNTS = [
  "Bakım/Onarım",
  "Ceza",
  "Kasko/Sigorta",
  "Kiralama",
  "Muayene",
  "Vergi",
  "Yakıt",
  "Aidat",
  "Elektrik",
].map((c) => ({ label: c, value: c }));

const PAYMENT_OPTIONS = [
  { label: "Daha sonra ödenecek", value: "Daha sonra ödenecek" },
  { label: "Ödendi", value: "Ödendi" },
];

const TAX_RATES = ["0", "1", "4", "5", "8", "10", "18", "20"].map((t) => ({
  label: t,
  value: t,
}));

interface CashAccount {
  id: string;
  name: string;
  currency: string;
  balance: number;
}

const costSchema = z
  .object({
    expense_date: z.string().min(1, "İşlem tarihi zorunludur."),
    document_no: z.string().max(50),
    payment_date: z.string().nullable(),
    amount: z.coerce
      .number({ invalid_type_error: "Tutar girin." })
      .gt(0, "Tutar sıfırdan büyük olmalıdır."),
    is_recurring: z.boolean(),
    category: z.string().min(1, "Masraf kalemi seçin."),
    payment_status: z.enum(["Daha sonra ödenecek", "Ödendi"]),
    cash_account_id: z.string().nullable(),
    tax_rate: z.coerce.number().min(0).max(20),
    description: z.string().max(1000),
  })
  .superRefine((values, ctx) => {
    if (values.payment_status === "Ödendi" && !values.cash_account_id) {
      ctx.addIssue({
        code: "custom",
        path: ["cash_account_id"],
        message: "Ödendi durumunda Kasa/Hesap seçin.",
      });
    }
  });

type CostFormValues = z.infer<typeof costSchema>;

export function ExpenseForm() {
  const router = useRouter();
  const [cashAccounts, setCashAccounts] = useState<CashAccount[]>([]);
  const [accountsLoading, setAccountsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const methods = useForm<CostFormValues>({
    resolver: zodResolver(costSchema),
    defaultValues: {
      expense_date: "",
      document_no: "",
      payment_date: null,
      amount: undefined as unknown as number,
      is_recurring: false,
      category: "",
      payment_status: "Daha sonra ödenecek",
      cash_account_id: null,
      tax_rate: 0,
      description: "",
    },
  });

  const paymentStatus = methods.watch("payment_status");
  const isPaid = paymentStatus === "Ödendi";

  useEffect(() => {
    api<CashAccount[]>("/cash-accounts/")
      .then(setCashAccounts)
      .catch(() => setCashAccounts([]))
      .finally(() => setAccountsLoading(false));
  }, []);

  const cashOptions = cashAccounts.map((a) => ({
    label: `${a.name} · ${a.currency}`,
    value: a.id,
  }));

  async function onSubmit(data: CostFormValues) {
    setError(null);
    setSaving(true);
    try {
      await api("/expenses/", {
        method: "POST",
        body: {
          expense_date: data.expense_date,
          document_no: data.document_no.trim() || null,
          payment_date: data.payment_date || null,
          amount: data.amount,
          is_recurring: data.is_recurring,
          category: data.category,
          payment_status: data.payment_status,
          cash_account_id: isPaid ? data.cash_account_id : null,
          tax_rate: data.tax_rate,
          description: data.description.trim() || null,
        },
      });
      router.push("/expenses");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Masraf oluşturulamadı.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Masraf Bilgileri</CardTitle>
            <CardDescription>
              Masraf kalemini ve ödeme durumunu belirleyin.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <FormDatePicker
              name="expense_date"
              label="İşlem Tarihi"
              required
            />
            <FormInput
              name="document_no"
              label="Fiş/Belge No"
              placeholder="Fiş veya belge numarası"
            />
            <FormDatePicker name="payment_date" label="Ödeme Tarihi" />

            <FormInput
              name="amount"
              label="Tutar (KDV Dahil)"
              type="number"
              step="0.01"
              min="0"
              placeholder="0,00"
              required
            />
            <FormSelect
              name="category"
              label="Masraf Kalemi"
              options={COST_ACCOUNTS}
              placeholder="Masraf kalemi seçin"
              required
            />
            <FormSelect
              name="payment_status"
              label="Ödeme Durumu"
              options={PAYMENT_OPTIONS}
              required
            />

            {isPaid && (
              <FormSelect
                name="cash_account_id"
                label="Kasa/Hesap"
                options={cashOptions}
                placeholder={
                  accountsLoading
                    ? "Hesaplar yükleniyor..."
                    : "Ödemeyi yaptığınız hesabı seçin"
                }
                disabled={accountsLoading}
                required
              />
            )}
            <FormSelect
              name="tax_rate"
              label="KDV Oranı (%)"
              options={TAX_RATES}
              required
            />
            <FormTextarea
              name="description"
              label="Açıklama"
              rows={3}
              containerClassName="sm:col-span-2 lg:col-span-3"
            />
            <FormCheckbox
              name="is_recurring"
              label="Tekrarlayan masraf kaydı oluştur"
              description="Her ay aynı tutarda otomatik masraf kaydı oluşturulur."
              containerClassName="sm:col-span-2 lg:col-span-3"
            />
          </CardContent>
        </Card>

        {error && (
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            Masraf oluşturulamadı: {error}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/expenses")}
            disabled={saving}
          >
            <Archive className="h-4 w-4" />
            Arşiv Belgesi Yükle
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.back()}
            disabled={saving}
          >
            <ArrowLeft className="h-4 w-4" />
            Geri Dön
          </Button>
          <Button type="submit" disabled={saving}>
            <Save className="h-4 w-4" />
            {saving ? "Kaydediliyor..." : "Kaydet"}
          </Button>
        </div>
      </form>
    </FormProvider>
  );
}