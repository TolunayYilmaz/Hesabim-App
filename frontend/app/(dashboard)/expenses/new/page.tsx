import { PageHeader } from "@/components/dashboard/page-header";
import { ExpenseForm } from "@/components/expenses/expense-form";

export default function NewExpensePage() {
  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="Masraf Girişi"
        description="Masraf bilgilerini doldurun ve kaydedin."
      />
      <ExpenseForm />
    </div>
  );
}