"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { z } from "zod";

import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FormInput } from "@/components/form/form-input";
import { FormSelect } from "@/components/form/form-select";
import { FormTextarea } from "@/components/form/form-textarea";

const CURRENCIES = [
  { label: "TL", value: "TRY" },
  { label: "USD", value: "USD" },
  { label: "EUR", value: "EUR" },
  { label: "GBP", value: "GBP" },
  { label: "CHF", value: "CHF" },
];

const identitySchema = z.object({
  identity_type: z.enum(["Customer", "Supplier"]),
  name: z
    .string()
    .min(1, "İsim / Unvan zorunludur.")
    .max(255, "En fazla 255 karakter."),
  email: z
    .string()
    .max(255)
    .refine((v) => v === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), {
      message: "Geçerli bir e-posta girin.",
    }),
  phone: z.string().max(50),
  tax_office: z.string().max(255),
  tax_number: z.string().max(50),
  due_days: z.coerce
    .number({ invalid_type_error: "Sayı girin." })
    .int("Tam sayı olmalıdır.")
    .min(0, "Negatif olamaz.")
    .max(9999),
  discount_rate: z.coerce
    .number({ invalid_type_error: "Sayı girin." })
    .min(0, "Negatif olamaz.")
    .max(100, "0-100 arasında olmalıdır."),
  currency: z.string().min(1, "Para birimi seçin."),
  address: z.string().max(1000),
  bank_info: z.string().max(1000),
});

type IdentityFormValues = z.infer<typeof identitySchema>;

const DEFAULT_VALUES: IdentityFormValues = {
  identity_type: "Customer",
  name: "",
  email: "",
  phone: "",
  tax_office: "",
  tax_number: "",
  due_days: 0,
  discount_rate: 0,
  currency: "TRY",
  address: "",
  bank_info: "",
};

interface IdentityFormProps {
  initialType?: "Customer" | "Supplier";
}

export function IdentityForm({ initialType = "Customer" }: IdentityFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const methods = useForm<IdentityFormValues>({
    resolver: zodResolver(identitySchema),
    defaultValues: { ...DEFAULT_VALUES, identity_type: initialType },
  });

  const selectedType = methods.watch("identity_type");

  async function onSubmit(data: IdentityFormValues) {
    setError(null);
    setSaving(true);
    try {
      await api("/identities/", {
        method: "POST",
        body: {
          identity_type: data.identity_type,
          name: data.name.trim(),
          email: data.email.trim() || null,
          phone: data.phone.trim() || null,
          tax_office: data.tax_office.trim() || null,
          tax_number: data.tax_number.trim() || null,
          due_days: data.due_days,
          discount_rate: data.discount_rate,
          currency: data.currency,
          address: data.address.trim() || null,
          bank_info: data.bank_info.trim() || null,
        },
      });
      router.push(
        data.identity_type === "Supplier" ? "/suppliers" : "/customers",
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Kayıt oluşturulamadı.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-6">
        {/* Cari tipi secimi */}
        <Card>
          <CardContent className="p-4">
            <div className="flex w-fit gap-1 rounded-lg bg-muted p-1">
              <TypeButton
                active={selectedType === "Customer"}
                onClick={() => methods.setValue("identity_type", "Customer")}
              >
                Müşteri
              </TypeButton>
              <TypeButton
                active={selectedType === "Supplier"}
                onClick={() => methods.setValue("identity_type", "Supplier")}
              >
                Tedarikçi
              </TypeButton>
            </div>
          </CardContent>
        </Card>

        {/* Temel bilgiler */}
        <Card>
          <CardHeader>
            <CardTitle>Temel Bilgiler</CardTitle>
            <CardDescription>
              {selectedType === "Customer"
                ? "Müşteri kartının temel bilgileri."
                : "Tedarikçi kartının temel bilgileri."}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <FormInput
              name="name"
              label="İsmi / Unvanı"
              placeholder="Acme Ltd. Şti."
              required
              containerClassName="sm:col-span-2 lg:col-span-1"
            />
            <FormSelect
              name="currency"
              label="Para Birimi"
              options={CURRENCIES}
              required
            />
            <FormInput
              name="due_days"
              label="Vadesi (gün)"
              type="number"
              placeholder="0"
              hint="Vade gün sayısı (0 = peşin)."
              containerClassName="sm:col-span-2 lg:col-span-1"
            />
            <FormInput
              name="discount_rate"
              label="Sabit İskonto (%)"
              type="number"
              step="0.01"
              min="0"
              max="100"
              placeholder="0"
              containerClassName="sm:col-span-2 lg:col-span-1"
            />
          </CardContent>
        </Card>

        {/* Iletisim & vergi */}
        <Card>
          <CardHeader>
            <CardTitle>İletişim & Vergi</CardTitle>
            <CardDescription>İletişim ve vergi kimlik bilgileri.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <FormInput name="email" label="E-Posta" type="email" placeholder="ornek@firma.com" />
            <FormInput name="phone" label="Cep Telefonu" type="tel" placeholder="+90 5xx xxx xx xx" />
            <FormInput name="tax_office" label="Vergi Dairesi" placeholder="Vergi dairesi adı" />
            <FormInput
              name="tax_number"
              label="Vergi / TC Kimlik No"
              placeholder="1234567890"
            />
          </CardContent>
        </Card>

        {/* Adres & banka */}
        <Card>
          <CardHeader>
            <CardTitle>Adres & Banka</CardTitle>
            <CardDescription>Fatura adresi ve banka bilgileri.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <FormTextarea name="address" label="Adres" rows={4} placeholder="Fatura adresi" />
            <FormTextarea
              name="bank_info"
              label="Banka Bilgileri"
              rows={4}
              placeholder="IBAN, banka adı, hesap no"
            />
          </CardContent>
        </Card>

        {error && (
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            Kayıt oluşturulamadı: {error}
          </div>
        )}

        {/* Aksiyonlar */}
        <div className="flex items-center justify-end gap-3">
          <Button
            type="button"
            variant="outline"
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

function TypeButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-md px-4 py-1.5 text-sm font-medium transition-colors",
        active
          ? "bg-background text-foreground shadow-sm"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}