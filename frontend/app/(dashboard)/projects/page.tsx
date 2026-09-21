import { Plus } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/dashboard/page-header";
import { ModulePlaceholder } from "@/components/dashboard/module-placeholder";

export default function ProjectsPage() {
  return (
    <div>
      <PageHeader
        title="Projeler"
        description="Firma projeleri ve açıklamaları."
        action={
          <Button asChild className="bg-[#6ee7b7] font-semibold text-gray-800 shadow-sm hover:bg-[#34d399]">
            <Link href="/projects/new">
              <Plus className="h-4 w-4" />
              Yeni Proje
            </Link>
          </Button>
        }
      />
      <ModulePlaceholder
        title="Proje Listesi"
        description="Kayıtlı projeler ve açıklamaları burada listelenecek."
      />
    </div>
  );
}