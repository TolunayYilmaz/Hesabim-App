import { Plus } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/dashboard/page-header";
import { ModulePlaceholder } from "@/components/dashboard/module-placeholder";

export default function ProposalsPage() {
  return (
    <div>
      <PageHeader
        title="Teklifler"
        description="Kayıtlı müşterilere hazırlanan teklifler."
        action={
          <Button asChild>
            <Link href="/proposals/new">
              <Plus className="h-4 w-4" />
              Yeni Teklif
            </Link>
          </Button>
        }
      />
      <ModulePlaceholder
        title="Teklif Listesi"
        description="Hazırlanan teklifler ve durumları burada listelenecek."
      />
    </div>
  );
}