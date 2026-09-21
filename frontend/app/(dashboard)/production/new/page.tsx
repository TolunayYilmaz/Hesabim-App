import { PageHeader } from "@/components/dashboard/page-header";
import { ProductionForm } from "@/components/production/production-form";

export default function NewProductionPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Üretim Fişi"
        description="Üretilen ürünü, miktarı ve gireceği depoyu belirleyin."
      />
      <ProductionForm />
    </div>
  );
}