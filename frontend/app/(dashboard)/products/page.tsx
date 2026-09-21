import { PageHeader } from "@/components/dashboard/page-header";
import { ModulePlaceholder } from "@/components/dashboard/module-placeholder";

export default function ProductsPage() {
  return (
    <div>
      <PageHeader
        title="Ürünler"
        description="Ürün kartları, barkod, kategori ve fiyat bilgileri."
      />
      <ModulePlaceholder
        title="Ürün Listesi"
        description="Ürün kartları burada listelenecek. Fiyat, KDV oranı, barkod ve stok takibi yapılabilir."
      />
    </div>
  );
}