"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Save, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  FormProvider,
  useFieldArray,
  useForm,
  useWatch,
} from "react-hook-form";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FormDatePicker } from "@/components/form/form-date-picker";
import { FormInput } from "@/components/form/form-input";
import { FormSelect } from "@/components/form/form-select";
import { FormTextarea } from "@/components/form/form-textarea";

/* JSON'daki "options" degerleri birebir */
const TRANSACTION_TYPES = [
  "Faturalar",
  "Açık İrsaliyeler",
  "Faturalaşmış İrsaliyeler",
  "Sipariş/Proforma/Taslak",
  "İptal Edilmişler",
].map((t) => ({ label: t, value: t }));

const TRANSACTION_TO_DOC_TYPE: Record<string, { docType: string; status: string }> = {
  "Faturalar": { docType: "SalesInvoice", status: "Draft" },
  "Açık İrsaliyeler": { docType: "Waybill", status: "Open" },
  "Faturalaşmış İrsaliyeler": { docType: "SalesInvoice", status: "Invoiced" },
  "Sipariş/Proforma/Taslak": { docType: "Proposal", status: "Draft" },
  "İptal Edilmişler": { docType: "SalesInvoice", status: "Cancelled" },
};

const TAX_RATES = ["0", "1", "10", "20"].map((t) => ({ label: t, value: t }));

interface IdentityOption {
  id: string;
  name: string;
  phone: string | null;
  tax_number: string | null;
  tax_office: string | null;
  address: string | null;
}

interface ProductOption {
  id: string;
  name: string;
  barcode: string | null;
}

const lineSchema = z.object({
  product_id: z.string().min(1, "Ürün seçin."),
  quantity: z.coerce
    .number({ invalid_type_error: "Miktar girin." })
    .gt(0, "Miktar sıfırdan büyük olmalıdır."),
  unit_price: z.coerce.number().min(0),
  discount: z.coerce.number().min(0),
  tax_rate: z.coerce.number().min(0).max(100),
});

const documentSchema = z.object({
  transaction_type: z.string(),
  identity_id: z.string().min(1, "Müşteri seçin."),
  phone: z.string().max(50),
  tax_office: z.string().max(255),
  tax_no: z.string().max(50),
  address: z.string().max(1000),
  document_no: z.string().min(1, "Belge no zorunludur.").max(50),
  issue_date: z.string().min(1, "İşlem tarihi zorunludur."),
  due_date: z.string().nullable(),
  items: z.array(lineSchema).min(1, "En az bir ürün kalemi ekleyin."),
});

type DocumentFormValues = z.infer<typeof documentSchema>;

const fmt = (n: number) =>
  n.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export interface DocumentFormProps {
  defaultTransactionType: string;
  mode?: "sales" | "proposal";
}

export function DocumentForm({
  defaultTransactionType,
  mode = "sales",
}: DocumentFormProps) {
  const router = useRouter();
  const identityRef = useRef<HTMLDivElement>(null);
  const [identities, setIdentities] = useState<IdentityOption[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const methods = useForm<DocumentFormValues>({
    resolver: zodResolver(documentSchema),
    defaultValues: {
      transaction_type: defaultTransactionType,
      identity_id: "",
      phone: "",
      tax_office: "",
      tax_no: "",
      address: "",
      document_no: "",
      issue_date: "",
      due_date: null,
      items: [
        { product_id: "", quantity: 1, unit_price: 0, discount: 0, tax_rate: 0 },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: methods.control,
    name: "items",
  });

  const itemsRows = useWatch({ control: methods.control, name: "items" });
  const identityId = useWatch({ control: methods.control, name: "identity_id" });

  const lineNet = (r?: (typeof itemsRows)[number]) =>
    (Number(r?.quantity || 0) * Number(r?.unit_price || 0)) - Number(r?.discount || 0);
  const lineTotal = (r?: (typeof itemsRows)[number]) =>
    lineNet(r) * (1 + Number(r?.tax_rate || 0) / 100);
  const grandTotal = (itemsRows ?? []).reduce((sum, r) => sum + lineTotal(r), 0);

  useEffect(() => {
    Promise.all([
      api<IdentityOption[]>("/identities/by-type/Customer").catch(() => []),
      api<ProductOption[]>("/products/").catch(() => []),
    ])
      .then(([c, p]) => {
        setIdentities(c);
        setProducts(p);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const identity = identities.find((i) => i.id === identityId);
    if (!identity) return;
    methods.setValue("phone", identity.phone ?? "");
    methods.setValue("tax_no", identity.tax_number ?? "");
    methods.setValue("tax_office", identity.tax_office ?? "");
    methods.setValue("address", identity.address ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [identityId]);

  const identityOptions = identities.map((i) => ({ label: i.name, value: i.id }));
  const productOptions = products.map((p) => ({
    label: p.barcode ? `${p.name} (${p.barcode})` : p.name,
    value: p.id,
  }));

  function focusIdentity() {
    identityRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  async function onSubmit(data: DocumentFormValues) {
    setError(null);
    setSaving(true);
    try {
      const mapped = TRANSACTION_TO_DOC_TYPE[data.transaction_type] ?? {
        docType: "SalesInvoice",
        status: "Draft",
      };
      await api("/documents/", {
        method: "POST",
        body: {
          identity_id: data.identity_id,
          doc_type: mapped.docType,
          status: mapped.status,
          document_no: data.document_no.trim(),
          issue_date: data.issue_date,
          due_date: data.due_date || null,
          phone: data.phone.trim() || null,
          tax_office: data.tax_office.trim() || null,
          tax_no: data.tax_no.trim() || null,
          address: data.address.trim() || null,
          items: data.items.map((i) => ({
            product_id: i.product_id,
            quantity: i.quantity,
            unit_price: i.unit_price,
            discount: i.discount,
            tax_rate: i.tax_rate,
          })),
        },
      });
      router.push(mode === "proposal" ? "/proposals" : "/sales");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Belge oluşturulamadı.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-6">
        {/* ===================== BELGE BAŞLIĞI ===================== */}
        <div ref={identityRef}>
          <Card>
            <CardHeader>
              <CardTitle>Belge Başlığı</CardTitle>
              <CardDescription>
                Müşteri ve belge bilgilerini girin.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <FormSelect
                name="transaction_type"
                label="İşlem Tipi"
                options={TRANSACTION_TYPES}
                required
              />
              <FormSelect
                name="identity_id"
                label="İsim / Unvan"
                options={identityOptions}
                placeholder={loading ? "Müşteriler yükleniyor..." : "Müşteri seçin"}
                disabled={loading}
                required
              />
              <FormInput name="phone" label="Telefon" placeholder="Telefon numarası" />
              <FormInput
                name="tax_no"
                label="Vergi Dairesi / TC Kimlik No"
                placeholder="Vergi dairesi / TC kimlik no"
              />
              <FormInput
                name="document_no"
                label="Belge No"
                placeholder="Belge numarası"
                required
              />
              <FormDatePicker name="issue_date" label="İşlem Tarihi" required />
              <FormDatePicker name="due_date" label="Vade Tarihi" />
              <FormTextarea
                name="address"
                label="Adres"
                rows={3}
                containerClassName="sm:col-span-2 lg:col-span-3"
              />
            </CardContent>
          </Card>
        </div>

        {/* ===================== BELGE KALEMLERİ ===================== */}
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>Belge Kalemleri</CardTitle>
              <CardDescription>Ürün kalemlerini girin.</CardDescription>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                append({
                  product_id: "",
                  quantity: 1,
                  unit_price: 0,
                  discount: 0,
                  tax_rate: 0,
                })
              }
            >
              <Plus className="h-4 w-4" />
              Kalem Ekle
            </Button>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table className="min-w-[900px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>Ürün Adı</TableHead>
                    <TableHead className="w-24 text-right">Miktar</TableHead>
                    <TableHead className="w-32 text-right">Birim Fiyat</TableHead>
                    <TableHead className="w-28 text-right">İndirim</TableHead>
                    <TableHead className="w-32 text-right">Net Tutar</TableHead>
                    <TableHead className="w-24">KDV (%)</TableHead>
                    <TableHead className="w-32 text-right">Toplam</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fields.map((field, index) => {
                    const row = itemsRows?.[index];
                    return (
                      <TableRow key={field.id}>
                        <TableCell>
                          <FormSelect
                            name={`items.${index}.product_id`}
                            options={productOptions}
                            placeholder={loading ? "Ürünler yükleniyor..." : "Ürün seçin"}
                            disabled={loading}
                            containerClassName="w-52"
                          />
                        </TableCell>
                        <TableCell>
                          <FormInput
                            name={`items.${index}.quantity`}
                            type="number"
                            step="any"
                            min="0"
                            className="h-8 text-right"
                          />
                        </TableCell>
                        <TableCell>
                          <FormInput
                            name={`items.${index}.unit_price`}
                            type="number"
                            step="0.01"
                            min="0"
                            className="h-8 text-right"
                          />
                        </TableCell>
                        <TableCell>
                          <FormInput
                            name={`items.${index}.discount`}
                            type="number"
                            step="0.01"
                            min="0"
                            className="h-8 text-right"
                          />
                        </TableCell>
                        <TableCell className="text-right tabular-nums text-muted-foreground">
                          {fmt(lineNet(row))}
                        </TableCell>
                        <TableCell>
                          <FormSelect
                            name={`items.${index}.tax_rate`}
                            options={TAX_RATES}
                            containerClassName="w-20"
                          />
                        </TableCell>
                        <TableCell className="text-right font-medium tabular-nums">
                          {fmt(lineTotal(row))}
                        </TableCell>
                        <TableCell>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => remove(index)}
                            aria-label="Kalemi kaldır"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
            <div className="mt-4 flex justify-end gap-8 text-sm">
              <div className="text-muted-foreground">
                Genel Toplam
              </div>
              <div className="font-semibold tabular-nums">₺ {fmt(grandTotal)}</div>
            </div>
          </CardContent>
        </Card>

        {error && (
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            Belge oluşturulamadı: {error}
          </div>
        )}

        {/* ===================== BUTONLAR ===================== */}
        <div className="flex flex-wrap items-center justify-end gap-3">
          {mode === "sales" ? (
            <>
              <Button asChild type="button" variant="outline">
                <Link href="/identities/new?type=Customer">
                  Yeni Müşteriye Satış Gir
                </Link>
              </Button>
              <Button type="button" variant="outline" onClick={focusIdentity}>
                Kayıtlı Müşteriye Satış Gir
              </Button>
              <Button asChild type="button" variant="outline">
                <Link href="/proposals/new">Kayıtlı Müşteriye Teklif Hazırla</Link>
              </Button>
            </>
          ) : (
            <Button asChild type="button" variant="outline">
              <Link href="/sales/new">Kayıtlı Müşteriye Satış Gir</Link>
            </Button>
          )}
          <Button type="submit" disabled={saving}>
            <Save className="h-4 w-4" />
            {saving ? "Kaydediliyor..." : "Kaydet"}
          </Button>
        </div>
      </form>
    </FormProvider>
  );
}