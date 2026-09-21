import { Plus } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/dashboard/page-header";
import { ModulePlaceholder } from "@/components/dashboard/module-placeholder";

export default function CreditsPage() {
  return (
    <div>
      <PageHeader
        title="Krediler"
        description="Kalan borçlar ve ödeme takvimi takibi."
        action={
          <Button asChild>
            <Link href="/credits/new">
              <Plus className="h-4 w-4" />
              Yeni Kredi
            </Link>
          </Button>
        }
      />
      <ModulePlaceholder
        title="Kredi Listesi"
        description="Kredi adı, kalan borç ve taksit bilgileri burada listelenecek."
      />
    </div>
  );
}