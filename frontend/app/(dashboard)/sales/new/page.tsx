import { PageHeader } from "@/components/dashboard/page-header";
import { DocumentForm } from "@/components/documents/document-form";

export default function NewSalePage() {
  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Satış Faturası"
        description="Belge başlığını ve kalemlerini doldurun."
      />
      <DocumentForm defaultTransactionType="Faturalar" mode="sales" />
    </div>
  );
}