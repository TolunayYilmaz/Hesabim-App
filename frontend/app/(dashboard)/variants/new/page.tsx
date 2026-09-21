import { PageHeader } from "@/components/dashboard/page-header";
import { VariantForm } from "@/components/variants/variant-form";

export default function NewVariantPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="Varyant Ekleme"
        description="Varyant ismi ve değerini girin."
      />
      <VariantForm />
    </div>
  );
}