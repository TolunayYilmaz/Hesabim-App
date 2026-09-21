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
import { FormInput } from "@/components/form/form-input";

const variantSchema = z.object({
  name: z.string().min(1, "Varyant ismi zorunludur.").max(255),
  value: z.string().min(1, "Varyant değeri zorunludur.").max(255),
});

type VariantFormValues = z.infer<typeof variantSchema>;

export function VariantForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const methods = useForm<VariantFormValues>({
    resolver: zodResolver(variantSchema),
    defaultValues: { name: "", value: "" },
  });

  async function onSubmit(data: VariantFormValues) {
    setError(null);
    setSaving(true);
    try {
      await api("/variants/", {
        method: "POST",
        body: { name: data.name.trim(), value: data.value.trim() },
      });
      router.push("/variants");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Varyant oluşturulamadı.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Varyant Bilgileri</CardTitle>
            <CardDescription>
              Ürün varyantlarını yönetin.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <FormInput
              name="name"
              label={'Varyant İsmi Örneğin: "Renk, "Ebat", "Beden" vs...'}
              placeholder="Örnek: Renk"
              required
            />
            <FormInput
              name="value"
              label="Varyant Değeri"
              placeholder="Örnek: Kırmızı"
              required
            />
          </CardContent>
        </Card>

        {error && (
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            Varyant oluşturulamadı: {error}
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