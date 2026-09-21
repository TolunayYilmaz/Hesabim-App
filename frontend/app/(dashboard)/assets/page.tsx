import { Plus } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/dashboard/page-header";
import { ModulePlaceholder } from "@/components/dashboard/module-placeholder";

export default function AssetsPage() {
  return (
    <div>
      <PageHeader
        title="Demirbaşlar"
        description="Firma demirbaşları ve sabit varlıkları."
        action={
          <Button asChild>
            <Link href="/assets/new">
              <Plus className="h-4 w-4" />
              Yeni Demirbaş
            </Link>
          </Button>
        }
      />
      <ModulePlaceholder
        title="Demirbaş Listesi"
        description="Seri no, alış tarihi ve fiyat bilgileriyle kayıtlı demirbaşlar burada listelenecek."
      />
    </div>
  );
}