import { Plus } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/dashboard/page-header";
import { ModulePlaceholder } from "@/components/dashboard/module-placeholder";

export default function ChequesBondsPage() {
  return (
    <div>
      <PageHeader
        title="Çek / Senet Portföyü"
        description="Çek ve senet tahsilat işlemleri."
        action={
          <Button asChild>
            <Link href="/cheques-bonds/new">
              <Plus className="h-4 w-4" />
              Yeni Çek / Senet
            </Link>
          </Button>
        }
      />
      <ModulePlaceholder
        title="Çek / Senet Listesi"
        description="Tahsilat tarihi, ödeme tarihi ve banka bilgileriyle kayıtlı çekler burada listelenecek."
      />
    </div>
  );
}