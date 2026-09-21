import { PageHeader } from "@/components/dashboard/page-header";
import { ChequeBondForm } from "@/components/cheques-bonds/cheque-bond-form";

export default function NewChequeBondPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Yeni Çek / Senet İşlemi"
        description="Çek veya senet tahsilat bilgilerini doldurun ve kaydedin."
      />
      <ChequeBondForm />
    </div>
  );
}