import { Plus } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/dashboard/page-header";
import { ModulePlaceholder } from "@/components/dashboard/module-placeholder";

export default function SalesPage() {
  return (
    <div>
      <PageHeader
        title="Satışlar"
        description="Satış faturaları, teklifler ve irsaliyeler."
        action={
          <Button asChild className="bg-[#6ee7b7] font-semibold text-gray-800 shadow-sm hover:bg-[#34d399]">
            <Link href="/sales/new">
              <Plus className="h-4 w-4" />
              Yeni Satış
            </Link>
          </Button>
        }
      />
      <ModulePlaceholder
        title="Satış Belgeleri"
        description="Satış faturası, teklif ve irsaliye oluşturma ile liste burada yer alacak."
      />
    </div>
  );
}