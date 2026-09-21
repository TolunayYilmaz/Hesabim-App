import { PageHeader } from "@/components/dashboard/page-header";
import { WarehouseForm } from "@/components/warehouses/warehouse-form";

export default function NewWarehousePage() {
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="Yeni Depo Ekleme"
        description="Depo bilgilerini doldurun ve kaydedin."
      />
      <WarehouseForm />
    </div>
  );
}