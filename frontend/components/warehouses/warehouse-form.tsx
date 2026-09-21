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

const warehouseSchema = z.object({
  name: z.string().min(1, "Depo adı zorunludur.").max(255),
});

type WarehouseFormValues = z.infer<typeof warehouseSchema>;

export function WarehouseForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const methods = useForm<WarehouseFormValues>({
    resolver: zodResolver(warehouseSchema),
    defaultValues: { name: "" },
  });

  async function onSubmit(data: WarehouseFormValues) {
    setError(null);
    setSaving(true);
    try {
      await api("/warehouses/", {
        method: "POST",
        body: { name: data.name.trim() },
      });
      router.push("/warehouses");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Depo oluşturulamadı.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Depo Bilgileri</CardTitle>
            <CardDescription>Yeni depo ekleyin.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <FormInput
              name="name"
              label="Depo Adı"
              placeholder="Depo adını girin"
              required
            />
          </CardContent>
        </Card>

        {error && (
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            Depo oluşturulamadı: {error}
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