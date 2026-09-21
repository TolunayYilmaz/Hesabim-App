import { Plus } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/dashboard/page-header";
import { ModulePlaceholder } from "@/components/dashboard/module-placeholder";

export default function VariantsPage() {
  return (
    <div>
      <PageHeader
        title="Varyantlar"
        description="Ürün varyantlarını (renk, ebat, beden vb.) yönetin."
        action={
          <Button asChild className="bg-[#6ee7b7] font-semibold text-gray-800 shadow-sm hover:bg-[#34d399]">
            <Link href="/variants/new">
              <Plus className="h-4 w-4" />
              Varyant Ekle
            </Link>
          </Button>
        }
      />
      <ModulePlaceholder
        title="Varyant Listesi"
        description="Kayıtlı varyantlar ve değerleri burada listelenecek."
      />
    </div>
  );
}