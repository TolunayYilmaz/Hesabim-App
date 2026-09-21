import { PageHeader } from "@/components/dashboard/page-header";
import { DocumentForm } from "@/components/documents/document-form";

export default function NewProposalPage() {
  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Teklif"
        description="Müşteriye teklif hazırlayın."
      />
      <DocumentForm defaultTransactionType="Sipariş/Proforma/Taslak" mode="proposal" />
    </div>
  );
}