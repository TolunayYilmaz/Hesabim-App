import { Plus } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/dashboard/page-header";
import { ModulePlaceholder } from "@/components/dashboard/module-placeholder";

export default function WarehousesPage() {
  return (
    <div>
      <PageHeader
        title="Depolar"
        description="Stok depolarını yönetin."
        action={
          <Button asChild className="bg-[#6ee7b7] font-semibold text-gray-800 shadow-sm hover:bg-[#34d399]">
            <Link href="/warehouses/new">
              <Plus className="h-4 w-4" />
              Yeni Depo
            </Link>
          </Button>
        }
      />
      <ModulePlaceholder
        title="Depo Listesi"
        description="Kayıtlı depolar burada listelenecek."
      />
    </div>
  );
}