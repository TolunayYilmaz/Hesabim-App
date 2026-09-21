import { PageHeader } from "@/components/dashboard/page-header";
import { CreditForm } from "@/components/credits/credit-form";

export default function NewCreditPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="Kredi Ekleme"
        description="Kredi bilgilerini doldurun ve kaydedin."
      />
      <CreditForm />
    </div>
  );
}