"use client";

import * as React from "react";
import { Loader2, Pencil, Plus, Search, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

export interface DataTableColumn<T> {
  header: string;
  /** Dogrudan satir alanindan deger alir (render yoksa) */
  accessorKey?: keyof T;
  /** Ozel hucre render etme */
  render?: (row: T) => React.ReactNode;
  className?: string;
  headerClassName?: string;
  align?: "left" | "center" | "right";
}

export interface DataTablePagination {
  /** Sayfa indeksi (0 tabanli) */
  page: number;
  pageSize: number;
  pageCount: number;
  total: number;
  onPageChange: (page: number) => void;
}

export interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  data: T[];
  /** React key icin satirdan benzersiz id ureten fonksiyon */
  getRowId: (row: T) => string;
  /** Arama kutusu gosterme (varsayilan true) */
  searchable?: boolean;
  searchPlaceholder?: string;
  /** Sunucu tarafi arama: debounce ile cagrilir */
  onSearchChange?: (query: string) => void;
  /** Sunucu tarafi sayfalama (verilirse `data` o sayfanin satiridir) */
  pagination?: DataTablePagination;
  /** Istemci tarafi sayfa basina kayit (varsayilan 10) */
  pageSize?: number;
  /** Satir basina metin hucrelerini ~kolon sayisina gore sinirla */
  onEdit?: (row: T) => void;
  onDelete?: (row: T) => void;
  onAdd?: () => void;
  addLabel?: string;
  isLoading?: boolean;
  emptyMessage?: string;
  className?: string;
  /** Arama + buton arasina ekstra toolbar ogesi */
  toolbar?: React.ReactNode;
}

/**
 * Arama, sayfalama ve Duzenle/Sil aksiyonlarina sahip genel tablo bileşeni.
 *
 * - `pagination` verilirse sunucu tarafi mod: `data` sadece aktif sayfayi icerir.
 * - `pagination` verilmezse istemci tarafi: tum `data` icinde arama + sayfalama.
 * - `onSearchChange` verilirse arama debounce (300ms) ile disari aktarilir.
 */
export function DataTable<T>({
  columns,
  data,
  getRowId,
  searchable = true,
  searchPlaceholder = "Ara...",
  onSearchChange,
  pagination,
  pageSize = 10,
  onEdit,
  onDelete,
  onAdd,
  addLabel = "Yeni Ekle",
  isLoading = false,
  emptyMessage = "Kayıt bulunamadı.",
  className,
  toolbar,
}: DataTableProps<T>) {
  const [search, setSearch] = React.useState("");
  const [clientPage, setClientPage] = React.useState(0);
  const searchTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sunucu tarafi arama -> debounce ile disari cagri
  React.useEffect(() => {
    if (!onSearchChange) return;
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      onSearchChange(search);
    }, 300);
    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
  }, [search, onSearchChange]);

  const filtered = React.useMemo(() => {
    const q = search.trim().toLocaleLowerCase("tr");
    if (!q) return data;
    return data.filter((row) =>
      JSON.stringify(row ?? {}).toLocaleLowerCase("tr").includes(q),
    );
  }, [data, search]);

  const hasActionColumn = Boolean(onEdit || onDelete);
  const colSpan = columns.length + (hasActionColumn ? 1 : 0);

  // Sayfalama: kontrollü (sunucu) veya istemci tarafi
  const isServerPaged = Boolean(pagination);
  const currentPage = isServerPaged ? pagination!.page : clientPage;
  const effectivePageSize = isServerPaged ? pagination!.pageSize : pageSize;
  const totalRows = isServerPaged ? pagination!.total : filtered.length;
  const pageCount = isServerPaged
    ? pagination!.pageCount
    : Math.max(1, Math.ceil(filtered.length / effectivePageSize));
  const rows = isServerPaged
    ? data
    : filtered.slice(
        currentPage * effectivePageSize,
        currentPage * effectivePageSize + effectivePageSize,
      );

  const goToPage = (page: number) => {
    const next = Math.min(Math.max(page, 0), pageCount - 1);
    if (isServerPaged) pagination!.onPageChange(next);
    else setClientPage(next);
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    if (!isServerPaged) setClientPage(0);
  };

  const alignClass = (align?: DataTableColumn<T>["align"]) =>
    align === "center"
      ? "text-center"
      : align === "right"
        ? "text-right"
        : "text-left";

  return (
    <div className={cn("rounded-lg border bg-card", className)}>
      {/* Toolbar */}
      <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
        {searchable ? (
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder={searchPlaceholder}
              className="pl-9"
            />
          </div>
        ) : (
          <div />
        )}
        <div className="flex flex-1 items-center gap-2">
          {toolbar}
          {onAdd && (
            <Button onClick={onAdd} className="ml-auto gap-1.5">
              <Plus className="h-4 w-4" />
              {addLabel}
            </Button>
          )}
        </div>
      </div>

      {/* Tablo */}
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            {columns.map((col, index) => (
              <TableHead
                key={String(col.accessorKey ?? index)}
                className={cn(alignClass(col.align), col.headerClassName)}
              >
                {col.header}
              </TableHead>
            ))}
            {hasActionColumn && (
              <TableHead className="w-[120px] text-right">İşlem</TableHead>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading && !rows.length ? (
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={colSpan} className="h-32 text-center">
                <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
              </TableCell>
            </TableRow>
          ) : rows.length ? (
            rows.map((row) => (
              <TableRow key={getRowId(row)}>
                {columns.map((col, index) => {
                  const key = String(col.accessorKey ?? index);
                  const raw =
                    col.accessorKey != null ? (row[col.accessorKey] as React.ReactNode) : null;
                  return (
                    <TableCell
                      key={key}
                      className={cn(alignClass(col.align), col.className)}
                    >
                      {col.render ? col.render(row) : raw}
                    </TableCell>
                  );
                })}
                {hasActionColumn && (
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      {onEdit && (
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Düzenle"
                          onClick={() => onEdit(row)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      )}
                      {onDelete && (
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Sil"
                          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => onDelete(row)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))
          ) : (
            <TableRow className="hover:bg-transparent">
              <TableCell
                colSpan={colSpan}
                className="h-32 text-center text-muted-foreground"
              >
                {isLoading ? (
                  "Yükleniyor..."
                ) : (
                  <span className="flex flex-col items-center gap-2">
                    <Search className="h-5 w-5 opacity-40" />
                    {emptyMessage}
                  </span>
                )}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* Sayfalama */}
      <div className="flex flex-col gap-3 border-t px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          Toplam <span className="font-medium text-foreground">{totalRows}</span> kayıt
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage <= 0 || isLoading}
            onClick={() => goToPage(currentPage - 1)}
          >
            Önceki
          </Button>
          <span className="px-2 text-sm text-muted-foreground">
            Sayfa {currentPage + 1} / {pageCount}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage >= pageCount - 1 || isLoading}
            onClick={() => goToPage(currentPage + 1)}
          >
            Sonraki
          </Button>
        </div>
      </div>
    </div>
  );
}