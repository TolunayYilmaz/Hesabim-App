import { Plus } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/dashboard/page-header";
import { ModulePlaceholder } from "@/components/dashboard/module-placeholder";

export default function ProductionPage() {
  return (
    <div>
      <PageHeader
        title="Üretim"
        description="Yarı mamul ve üretim fişleri."
        action={
          <Button asChild className="bg-[#6ee7b7] font-semibold text-gray-800 shadow-sm hover:bg-[#34d399]">
            <Link href="/production/new">
              <Plus className="h-4 w-4" />
              Yeni Üretim Yap
            </Link>
          </Button>
        }
      />
      <ModulePlaceholder
        title="Üretim Fişleri"
        description="Üretim tarihi, ürün ve miktar bilgileriyle kayıtlı üretimler burada listelenecek."
      />
    </div>
  );
}