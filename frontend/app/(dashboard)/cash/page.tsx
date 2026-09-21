import { PageHeader } from "@/components/dashboard/page-header";
import { ModulePlaceholder } from "@/components/dashboard/module-placeholder";

export default function CashPage() {
  return (
    <div>
      <PageHeader
        title="Kasa & Banka"
        description="Kasa, banka hesapları ve finansal hareketler."
      />
      <ModulePlaceholder
        title="Kasa & Banka Hesapları"
        description="Kasa, banka TL, POS ve şirket ortağı hesapları ile tahsilat/ödeme takibi burada listelenecek."
      />
    </div>
  );
}