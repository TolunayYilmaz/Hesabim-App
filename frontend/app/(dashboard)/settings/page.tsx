"use client";

import { Check, Copy, KeyRound, Save } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";

import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api";

interface FirmSettings {
  title?: string;
  phone?: string;
  email?: string | null;
  address?: string | null;
  bank_info?: string | null;
  logo_url?: string | null;
  has_api_key?: boolean;
}

export default function SettingsPage() {
  const [title, setTitle] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [bankInfo, setBankInfo] = useState("");
  const [logoName, setLogoName] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    api<FirmSettings>("/settings")
      .then((s) => {
        setTitle(s.title ?? "");
        setPhone(s.phone ?? "");
        setAddress(s.address ?? "");
        setBankInfo(s.bank_info ?? "");
        setLogoName(s.logo_url ?? "");
      })
      .catch((e) => setError(e.message ?? "Ayarlar yüklenemedi."))
      .finally(() => setLoading(false));
  }, []);

  async function handleUpdate(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");
    try {
      await api<FirmSettings>("/settings", {
        method: "PUT",
        body: {
          title,
          phone,
          address,
          bank_info: bankInfo,
          logo_url: logoName || null,
        },
      });
      setMessage("Firma ayarları güncellendi.");
    } catch (err) {
      setError((err as Error).message ?? "Güncelleme başarısız.");
    } finally {
      setSaving(false);
    }
  }

  async function handleApiKey() {
    setGenerating(true);
    setMessage("");
    setError("");
    try {
      const res = await api<{ api_key: string }>("/settings/api-key", {
        method: "POST",
      });
      setApiKey(res.api_key);
      setMessage("Yeni Api Key üretildi. Bir kere gösterilir!");
    } catch (err) {
      setError((err as Error).message ?? "Api Key üretilemedi.");
    } finally {
      setGenerating(false);
    }
  }

  async function copyApiKey() {
    if (!apiKey) return;
    await navigator.clipboard.writeText(apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="Firma Ayarları"
        description="Firmanıza ait bilgileri ve apikey yapılandırmanızı yönetin."
      />

      <Card>
        <CardHeader>
          <CardTitle>Firma Bilgileri</CardTitle>
          <CardDescription>
            Firma ayarlarınızı görüntüleyin ve güncelleyin.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleUpdate}>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="title">Ticari Unvanınız</Label>
              <Input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Firma ünvanınızı yazın"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Telefonunuz</Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0 (XXX) XXX XX XX"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="logo">Firma Logosu (Resim Ekle)</Label>
              <Input
                id="logo"
                type="file"
                accept="image/*"
                onChange={(e) => setLogoName(e.target.files?.[0]?.name ?? "")}
              />
              {logoName && (
                <p className="text-xs text-muted-foreground">
                  Seçilen dosya: {logoName}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Adresiniz</Label>
              <Textarea
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Adresinizi yazın"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bank">Banka Hesap Bilgileriniz</Label>
              <Textarea
                id="bank"
                value={bankInfo}
                onChange={(e) => setBankInfo(e.target.value)}
                placeholder="IBAN ve banka hesap bilgilerinizi yazın"
              />
            </div>

            {message && (
              <p className="text-sm font-medium text-emerald-600">{message}</p>
            )}
            {error && <p className="text-sm font-medium text-destructive">{error}</p>}

            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleApiKey}
                disabled={generating}
              >
                <KeyRound className="h-4 w-4" />
                Api Key Üret
              </Button>
              <Button type="submit" disabled={saving || loading}>
                <Save className="h-4 w-4" />
                {saving ? "Kaydediliyor..." : "Güncelle"}
              </Button>
            </div>

            {apiKey && (
              <div className="flex items-center gap-2 rounded-md border bg-muted p-3">
                <code className="flex-1 truncate font-mono text-xs">
                  {apiKey}
                </code>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={copyApiKey}
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-emerald-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                  {copied ? "Kopyalandı" : "Kopyala"}
                </Button>
              </div>
            )}
          </CardContent>
        </form>
      </Card>
    </div>
  );
}