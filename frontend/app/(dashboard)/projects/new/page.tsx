import { PageHeader } from "@/components/dashboard/page-header";
import { ProjectForm } from "@/components/projects/project-form";

export default function NewProjectPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="Yeni Proje"
        description="Proje bilgilerini doldurun ve kaydedin."
      />
      <ProjectForm />
    </div>
  );
}