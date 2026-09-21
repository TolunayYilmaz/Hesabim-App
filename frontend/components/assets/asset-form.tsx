"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
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
import { FormTextarea } from "@/components/form/form-textarea";

const assetSchema = z.object({
  name: z.string().min(1, "Demirbaş adı zorunludur.").max(255),
  serial_number: z.string().max(255),
  purchase_date: z.string().nullable(),
  price: z.coerce.number().min(0, "Fiyatı sıfırdan küçük olamaz."),
  description: z.string().max(1000),
});

type AssetFormValues = z.infer<typeof assetSchema>;

export function AssetForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const methods = useForm<AssetFormValues>({
    resolver: zodResolver(assetSchema),
    defaultValues: {
      name: "",
      serial_number: "",
      purchase_date: null,
      price: 0,
      description: "",
    },
  });

  async function onSubmit(data: AssetFormValues) {
    setError(null);
    setSaving(true);
    try {
      await api("/assets/", {
        method: "POST",
        body: {
          name: data.name.trim(),
          serial_number: data.serial_number.trim() || null,
          purchase_date: data.purchase_date || null,
          price: data.price,
          description: data.description.trim() || null,
        },
      });
      router.push("/assets");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Demirbaş oluşturulamadı.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Demirbaş Bilgileri</CardTitle>
            <CardDescription>
              Firma demirbaşlarını kaydedin.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <FormInput
              name="name"
              label="Demirbaş Adı"
              placeholder="Demirbaş adını girin"
              required
            />
            <FormInput
              name="serial_number"
              label="Seri No"
              placeholder="varsa seri no, plaka no vs girebilirsiniz."
            />
            <FormDatePicker name="purchase_date" label="Alış Tarihi (isteğe bağlı)" />
            <FormInput
              name="price"
              label="Fiyatı (isteğe bağlı)"
              type="number"
              step="0.01"
              min="0"
              placeholder="0,00"
            />
            <FormTextarea
              name="description"
              label="Açıklaması"
              rows={4}
              containerClassName="sm:col-span-2"
            />
          </CardContent>
        </Card>

        {error && (
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            Demirbaş oluşturulamadı: {error}
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