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
          <Button asChild className="bg-[#6ee7b7] font-semibold text-gray-800 shadow-sm hover:bg-[#34d399]">
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