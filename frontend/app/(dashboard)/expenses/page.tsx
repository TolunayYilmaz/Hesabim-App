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
          <Button asChild className="bg-[#6ee7b7] font-semibold text-gray-800 shadow-sm hover:bg-[#34d399]">
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