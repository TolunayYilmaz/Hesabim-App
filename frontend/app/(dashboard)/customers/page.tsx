import { Plus } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/dashboard/page-header";
import { ModulePlaceholder } from "@/components/dashboard/module-placeholder";

export default function CustomersPage() {
  return (
    <div>
      <PageHeader
        title="Müşteriler"
        description="Müşteri kartları, bakiyeler ve satış geçmişi."
        action={
          <Button asChild>
            <Link href="/identities/new?type=Customer">
              <Plus className="h-4 w-4" />
              Yeni Müşteri
            </Link>
          </Button>
        }
      />
      <ModulePlaceholder
        title="Müşteri Listesi"
        description="Müşteri kartları burada listelenecek. Yeni müşteri, vade günü, sabit iskonto ve bakiye takibi yapılabilir."
      />
    </div>
  );
}