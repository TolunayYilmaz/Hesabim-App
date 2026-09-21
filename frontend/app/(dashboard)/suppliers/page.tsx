import { Plus } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/dashboard/page-header";
import { ModulePlaceholder } from "@/components/dashboard/module-placeholder";

export default function SuppliersPage() {
  return (
    <div>
      <PageHeader
        title="Tedarikçiler"
        description="Tedarikçi kartları, borç takibi ve alış geçmişi."
        action={
          <Button asChild>
            <Link href="/identities/new?type=Supplier">
              <Plus className="h-4 w-4" />
              Yeni Tedarikçi
            </Link>
          </Button>
        }
      />
      <ModulePlaceholder
        title="Tedarikçi Listesi"
        description="Tedarikçi kartları burada listelenecek. Ödeme vadesi ve borç durumu takip edilebilir."
      />
    </div>
  );
}