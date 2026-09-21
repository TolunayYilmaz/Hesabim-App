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
          <Button asChild>
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