import { Plus } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/dashboard/page-header";
import { ModulePlaceholder } from "@/components/dashboard/module-placeholder";

export default function ExpensesPage() {
  return (
    <div>
      <PageHeader
        title="Masraflar"
        description="Giderler ve tekrarlayan masraflar."
        action={
          <Button asChild>
            <Link href="/expenses/new">
              <Plus className="h-4 w-4" />
              Yeni Masraf
            </Link>
          </Button>
        }
      />
      <ModulePlaceholder
        title="Masraf Listesi"
        description="Bakım, yakıt, kira, elektrik gibi kategori bazlı masraflar burada listelenecek."
      />
    </div>
  );
}