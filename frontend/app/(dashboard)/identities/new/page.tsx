import { PageHeader } from "@/components/dashboard/page-header";
import { IdentityForm } from "@/components/identities/identity-form";

export default function NewIdentityPage({
  searchParams,
}: {
  searchParams: { type?: string };
}) {
  const initialType =
    searchParams.type === "Supplier" ? "Supplier" : "Customer";

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title={initialType === "Supplier" ? "Tedarikçi Ekle" : "Müşteri Ekle"}
        description="Cari kart bilgilerini doldurun ve kaydedin."
      />
      <IdentityForm initialType={initialType} />
    </div>
  );
}