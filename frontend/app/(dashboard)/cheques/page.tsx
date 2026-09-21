import { PageHeader } from "@/components/dashboard/page-header";
import { ModulePlaceholder } from "@/components/dashboard/module-placeholder";

export default function ChequesPage() {
  return (
    <div>
      <PageHeader
        title="Çek / Senet"
        description="Portföydeki, ciro edilen ve tahsil edilen çek & senetler."
      />
      <ModulePlaceholder
        title="Çek / Senet Listesi"
        description="Çek ve senetlerin durumu (portföyde, ciro edildi, tahsil edildi) burada takip edilecek."
      />
    </div>
  );
}