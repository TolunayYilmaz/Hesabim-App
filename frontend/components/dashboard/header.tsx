"use client";

import { Bell, ChevronDown, LogOut, Settings, UserRound } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { setToken } from "@/lib/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Genel Bakış",
  "/customers": "Müşteriler",
  "/suppliers": "Tedarikçiler",
  "/products": "Ürünler",
  "/stock": "Stok Hareketleri",
  "/warehouses": "Depolar",
  "/warehouses/new": "Yeni Depo Ekleme",
  "/variants": "Varyantlar",
  "/variants/new": "Varyant Ekleme",
  "/production": "Üretim",
  "/production/new": "Üretim Fişi",
  "/sales": "Satışlar",
  "/sales/new": "Satış Faturası",
  "/proposals": "Teklifler",
  "/proposals/new": "Teklif",
  "/purchases": "Alışlar",
  "/cash": "Kasa & Banka",
  "/expenses": "Masraflar",
  "/cheques": "Çek / Senet",
  "/credits": "Krediler",
  "/credits/new": "Kredi Ekleme",
  "/cheques-bonds": "Çek / Senet Portföyü",
  "/cheques-bonds/new": "Yeni Çek / Senet İşlemi",
  "/assets": "Demirbaşlar",
  "/assets/new": "Yeni Demirbaş",
  "/projects": "Projeler",
  "/projects/new": "Yeni Proje",
  "/reports": "Raporlar",
  "/settings": "Firma & Ayarlar",
};

interface UserInfo {
  full_name?: string;
  email?: string;
}

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<UserInfo>({});
  const [companyName, setCompanyName] = useState("Firma Seçilmedi");

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem("bh_user");
      if (raw) setUser(JSON.parse(raw));
    } catch {
      /* yoksay */
    }
  }, []);

  const title = PAGE_TITLES[pathname] ?? "Hesabım";
  const initials = (user.full_name || user.email || "U")
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  function handleLogout() {
    setToken(null);
    window.localStorage.removeItem("bh_user");
    window.localStorage.removeItem("bh_company");
    router.push("/login");
  }

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b bg-background/95 px-6 backdrop-blur">
      <div>
        <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
        <p className="text-xs text-muted-foreground">{companyName}</p>
      </div>

      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" aria-label="Bildirimler">
          <Bell className="h-4 w-4" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-full outline-none focus:ring-2 focus:ring-ring">
              <Avatar>
                <AvatarImage src="" alt={user.full_name ?? "Kullanıcı"} />
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <div className="hidden text-left md:block">
                <p className="text-sm font-medium leading-tight">
                  {user.full_name || "Kullanıcı"}
                </p>
                <p className="text-xs text-muted-foreground leading-tight">
                  {user.email}
                </p>
              </div>
              <ChevronDown className="hidden h-4 w-4 text-muted-foreground md:block" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Hesabım</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => router.push("/settings")}>
              <UserRound className="h-4 w-4" />
              Profil
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => router.push("/settings")}>
              <Settings className="h-4 w-4" />
              Ayarlar
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={handleLogout} className="text-destructive">
              <LogOut className="h-4 w-4" />
              Çıkış Yap
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}