"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Factory } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FormProvider, useForm, useWatch } from "react-hook-form";
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

/* JSON'daki secenekler (API bos/temizken kullanilacak kurtarma degerleri) */
const FALLBACK_PRODUCTS: Product[] = [
  { id: "tecnofert", name: "TECNOFERT" },
  { id: "adilon", name: "ADİLON" },
  { id: "agrovork", name: "AGROVORK" },
];
const FALLBACK_WAREHOUSES: Warehouse[] = [
  { id: "ana-depo", name: "Ana Depo" },
  { id: "buyuk-depo", name: "BÜYÜK DEPO" },
];

interface Product {
  id: string;
  name: string;
  barcode?: string | null;
  brand?: string | null;
  category?: string | null;
}

interface Warehouse {
  id: string;
  name: string;
}

interface Variant {
  id: string;
  name: string;
  value: string;
}

const productionSchema = z
  .object({
    production_date: z.string().min(1, "Üretim tarihi zorunludur."),
    quantity: z.coerce
      .number({ invalid_type_error: "Üretim miktarı girin." })
      .gt(0, "Üretim miktarı sıfırdan büyük olmalıdır."),
    product_id: z.string().min(1, "Ürün seçin."),
    variant_id: z.string().nullable(),
    warehouse_id: z.string().min(1, "Depo seçin."),
    brand: z.string(),
    category: z.string(),
    description: z.string().max(1000),
    approved: z.boolean(),
  })
  .superRefine((values, ctx) => {
    if (!values.approved) {
      ctx.addIssue({
        code: "custom",
        path: ["approved"],
        message: "Üretimi onaylamalısınız.",
      });
    }
  });

type ProductionFormValues = z.infer<typeof productionSchema>;

export function ProductionForm() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [approved, setApproved] = useState(false);

  const methods = useForm<ProductionFormValues>({
    resolver: zodResolver(productionSchema),
    defaultValues: {
      production_date: "",
      quantity: undefined as unknown as number,
      product_id: "",
      variant_id: null,
      warehouse_id: "",
      brand: "",
      category: "",
      description: "",
      approved: false,
    },
  });

  const selectedProductId = useWatch({ control: methods.control, name: "product_id" });

  useEffect(() => {
    Promise.all([
      api<Product[]>("/products/").catch(() => FALLBACK_PRODUCTS),
      api<Warehouse[]>("/warehouses/").catch(() => FALLBACK_WAREHOUSES),
      api<Variant[]>("/variants/").catch(() => []),
    ])
      .then(([p, w, v]) => {
        setProducts(p);
        setWarehouses(w);
        setVariants(v);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const product = products.find((p) => p.id === selectedProductId);
    if (!product) return;
    if (product.brand) methods.setValue("brand", product.brand);
    if (product.category) methods.setValue("category", product.category);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProductId]);

  const productOptions = products.map((p) => ({
    label: p.barcode ? `${p.name} (${p.barcode})` : p.name,
    value: p.id,
  }));

  const brands: string[] = [];
  for (const p of products) {
    if (p.brand && !brands.includes(p.brand)) brands.push(p.brand);
  }
  const brandOptions = brands.map((b) => ({ label: b, value: b }));

  const categories: string[] = [];
  for (const p of products) {
    if (p.category && !categories.includes(p.category)) categories.push(p.category);
  }
  const categoryOptions = categories.map((c) => ({ label: c, value: c }));

  const variantOptions = variants.map((v) => ({
    label: `${v.name}: ${v.value}`,
    value: v.id,
  }));
  const warehouseOptions = warehouses.map((w) => ({
    label: w.name,
    value: w.id,
  }));

  async function onSubmit(data: ProductionFormValues) {
    setError(null);
    setSaving(true);
    try {
      await api("/production/", {
        method: "POST",
        body: {
          production_date: data.production_date,
          quantity: data.quantity,
          product_id: data.product_id,
          variant_id: data.variant_id || null,
          warehouse_id: data.warehouse_id,
          brand: data.brand || null,
          category: data.category || null,
          description: data.description.trim() || null,
        },
      });
      router.push("/production");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Üretim kaydı oluşturulamadı.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Üretim Fişi</CardTitle>
            <CardDescription>
              Neo al - Yarı mamul veya üretim kaydını girin.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <FormDatePicker name="production_date" label="Üretim tarihi" required />
            <FormInput
              name="quantity"
              label="Üretim yaptığınız miktarı girin"
              type="number"
              step="0.001"
              min="0"
              placeholder="0"
              required
            />
            <FormSelect
              name="product_id"
              label="Ürün Adı / Kodu"
              options={productOptions}
              placeholder={loading ? "Ürünler yükleniyor..." : "Ürün seçin"}
              disabled={loading}
              required
            />
            <FormSelect
              name="warehouse_id"
              label="Üretimin gireceği depoyu seçin"
              options={warehouseOptions}
              placeholder={loading ? "Depolar yükleniyor..." : "Depo seçin"}
              disabled={loading}
              required
            />
            <FormSelect
              name="brand"
              label="Marka"
              options={brandOptions}
              placeholder="Marka seçin (opsiyonel)"
            />
            <FormSelect
              name="category"
              label="Kategori"
              options={categoryOptions}
              placeholder="Kategori seçin (opsiyonel)"
            />
            <FormSelect
              name="variant_id"
              label="Üretilen varyantı seçin"
              options={variantOptions}
              placeholder={
                loading ? "Varyantlar yükleniyor..." : "Varyant seçin (opsiyonel)"
              }
              disabled={loading}
            />
            <FormTextarea
              name="description"
              label="Açıklama girin"
              placeholder="isteğe bağlı"
              rows={3}
              containerClassName="sm:col-span-2"
            />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <FormCheckbox
              name="approved"
              label="Onaylıyorum"
              description="Girilen üretim miktarının stok kaydını oluşturmayı onaylıyorum."
              onChange={setApproved}
            />
          </CardContent>
        </Card>

        {error && (
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            Üretim kaydı oluşturulamadı: {error}
          </div>
        )}

        <div className="flex justify-end">
          <Button type="submit" disabled={saving || !approved}>
            <Factory className="h-4 w-4" />
            {saving ? "Kaydediliyor..." : "Yeni Üretim Yap"}
          </Button>
        </div>
      </form>
    </FormProvider>
  );
}