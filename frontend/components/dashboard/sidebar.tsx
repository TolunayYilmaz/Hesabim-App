"use client";

import {
  BarChart3,
  Boxes,
  Building2,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Factory,
  FileCheck2,
  FileText,
  FolderKanban,
  HardDrive,
  Layers,
  LayoutDashboard,
  Package,
  Receipt,
  Settings,
  ShoppingBag,
  ShoppingCart,
  Truck,
  Users,
  Wallet,
  Warehouse,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

type NavGroup = {
  title: string;
  items: NavItem[];
};

const NAV_GROUPS: NavGroup[] = [
  {
    title: "Genel",
    items: [
      { label: "Genel Bakış", href: "/dashboard", icon: LayoutDashboard },
    ],
  },
  {
    title: "Müşteriler / Tedarikçiler",
    items: [
      { label: "Müşteriler", href: "/customers", icon: Users },
      { label: "Tedarikçiler", href: "/suppliers", icon: Truck },
    ],
  },
  {
    title: "Ürün / Stok",
    items: [
      { label: "Ürünler", href: "/products", icon: Package },
      { label: "Stok Hareketleri", href: "/stock", icon: Boxes },
      { label: "Depolar", href: "/warehouses", icon: Warehouse },
      { label: "Varyantlar", href: "/variants", icon: Layers },
    ],
  },
  {
    title: "Üretim",
    items: [{ label: "Üretim Fişleri", href: "/production", icon: Factory }],
  },
  {
    title: "Alış / Satış",
    items: [
      { label: "Satışlar", href: "/sales", icon: ShoppingCart },
      { label: "Teklifler", href: "/proposals", icon: FileText },
      { label: "Alışlar", href: "/purchases", icon: ShoppingBag },
    ],
  },
  {
    title: "Kasa / Banka",
    items: [
      { label: "Kasa & Banka", href: "/cash", icon: Wallet },
      { label: "Masraflar", href: "/expenses", icon: Receipt },
    ],
  },
  {
    title: "Finansal Takip",
    items: [
      { label: "Krediler", href: "/credits", icon: CreditCard },
      { label: "Çek / Senet", href: "/cheques-bonds", icon: FileCheck2 },
    ],
  },
  {
    title: "Demirbaşlar & Projeler",
    items: [
      { label: "Demirbaşlar", href: "/assets", icon: HardDrive },
      { label: "Projeler", href: "/projects", icon: FolderKanban },
    ],
  },
  {
    title: "Raporlar",
    items: [{ label: "Raporlar", href: "/reports", icon: BarChart3 }],
  },
  {
    title: "Ayarlar",
    items: [
      { label: "Firma & Ayarlar", href: "/settings", icon: Settings },
    ],
  },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "sticky top-0 z-30 flex h-screen shrink-0 flex-col border-r bg-sidebar text-sidebar-foreground transition-all duration-300",
        collapsed ? "w-[68px]" : "w-64",
      )}
    >
      {/* Logo */}
      <div
        className={cn(
          "flex h-16 items-center border-b border-sidebar-accent",
          collapsed ? "justify-center px-2" : "justify-between px-4",
        )}
      >
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Building2 className="h-4 w-4" />
            </div>
            <span className="text-sm font-bold tracking-tight">
              Hesabım
            </span>
          </div>
        )}
        {collapsed && (
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Building2 className="h-4 w-4" />
          </div>
        )}
      </div>

      {/* Navigation */}
      <TooltipProvider delayDuration={0}>
        <nav className="flex-1 overflow-y-auto py-4">
          {NAV_GROUPS.map((group) => (
            <div key={group.title} className="mb-4">
              {!collapsed && (
                <p className="mb-2 px-4 text-[11px] font-semibold uppercase tracking-wider text-sidebar-muted">
                  {group.title}
                </p>
              )}
              <ul className="space-y-1">
                {group.items.map((item) => {
                  const isActive =
                    pathname === item.href || pathname.startsWith(`${item.href}/`);
                  const Icon = item.icon;
                  const link = (
                    <Link
                      href={item.href}
                      className={cn(
                        "group flex items-center gap-3 rounded-md py-2 text-sm font-medium transition-colors",
                        collapsed ? "justify-center px-2" : "px-4",
                        isActive
                          ? "bg-sidebar-accent text-sidebar-foreground"
                          : "text-sidebar-muted hover:bg-sidebar-accent/70 hover:text-sidebar-foreground",
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      {!collapsed && <span>{item.label}</span>}
                    </Link>
                  );
                  return (
                    <li key={item.href}>
                      {collapsed ? (
                        <Tooltip>
                          <TooltipTrigger asChild>{link}</TooltipTrigger>
                          <TooltipContent side="right">{item.label}</TooltipContent>
                        </Tooltip>
                      ) : (
                        link
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
      </TooltipProvider>

      {/* Collapse toggle */}
      <div className="border-t border-sidebar-accent p-3">
        <Button
          variant="ghost"
          size={collapsed ? "icon" : "default"}
          onClick={onToggle}
          className={cn(
            "w-full text-sidebar-muted hover:bg-sidebar-accent hover:text-sidebar-foreground",
            !collapsed && "justify-between",
          )}
        >
          {!collapsed ? (
            <>
              <span className="text-xs font-medium">Menüyü Daralt</span>
              <ChevronLeft className="h-4 w-4" />
            </>
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </Button>
      </div>
    </aside>
  );
}