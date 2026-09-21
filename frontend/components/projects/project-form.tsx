"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { z } from "zod";

import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FormInput } from "@/components/form/form-input";
import { FormTextarea } from "@/components/form/form-textarea";

const projectSchema = z.object({
  name: z.string().min(1, "Proje adı zorunludur.").max(255),
  description: z.string().max(1000),
});

type ProjectFormValues = z.infer<typeof projectSchema>;

export function ProjectForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const methods = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  async function onSubmit(data: ProjectFormValues) {
    setError(null);
    setSaving(true);
    try {
      await api("/projects/", {
        method: "POST",
        body: {
          name: data.name.trim(),
          description: data.description.trim() || null,
        },
      });
      router.push("/projects");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Proje oluşturulamadı.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Proje Bilgileri</CardTitle>
            <CardDescription>Projeyi kaydedin.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <FormInput
              name="name"
              label="Proje Adı"
              placeholder="Proje adını girin"
              required
            />
            <FormTextarea
              name="description"
              label="Proje Açıklama"
              rows={5}
            />
          </CardContent>
        </Card>

        {error && (
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            Proje oluşturulamadı: {error}
          </div>
        )}

        <div className="flex justify-end">
          <Button type="submit" disabled={saving}>
            <Save className="h-4 w-4" />
            {saving ? "Kaydediliyor..." : "Kaydet"}
          </Button>
        </div>
      </form>
    </FormProvider>
  );
}