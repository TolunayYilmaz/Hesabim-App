import { PageHeader } from "@/components/dashboard/page-header";
import { ModulePlaceholder } from "@/components/dashboard/module-placeholder";

export default function StockPage() {
  return (
    <div>
      <PageHeader
        title="Stok Hareketleri"
        description="Giriş, çıkış ve üretim hareketleri."
      />
      <ModulePlaceholder
        title="Stok Hareketleri"
        description="Depo bazında giriş/çıkış hareketleri ve mevcut stok seviyeleri burada listelenecek."
      />
    </div>
  );
}