import { PageHeader } from "@/components/dashboard/page-header";
import { ModulePlaceholder } from "@/components/dashboard/module-placeholder";

export default function PurchasesPage() {
  return (
    <div>
      <PageHeader
        title="Alışlar"
        description="Alış faturaları ve tedarikçi ödemeleri."
      />
      <ModulePlaceholder
        title="Alış Belgeleri"
        description="Alış faturası oluşturma ve liste burada yer alacak."
      />
    </div>
  );
}