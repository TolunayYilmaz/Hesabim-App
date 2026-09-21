import { PageHeader } from "@/components/dashboard/page-header";
import { AssetForm } from "@/components/assets/asset-form";

export default function NewAssetPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="Yeni Demirbaş"
        description="Demirbaş bilgilerini doldurun ve kaydedin."
      />
      <AssetForm />
    </div>
  );
}