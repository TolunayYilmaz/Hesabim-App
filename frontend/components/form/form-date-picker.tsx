"use client";

import * as React from "react";
import { CalendarIcon, X } from "lucide-react";
import { Controller, useFormContext } from "react-hook-form";

import { getNestedError, hasError } from "@/lib/form-utils";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

/** `Date` -> "yyyy-MM-dd" (yerel saat, UTC kayması yok) */
function toIsoString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** "yyyy-MM-dd" -> `Date` (yerel gece yarisi) */
function parseIsoDate(iso: string): Date | undefined {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return undefined;
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

function formatDisplay(iso: string | null | undefined): string {
  if (!iso) return "";
  const date =
    typeof iso === "string" ? parseIsoDate(iso) : undefined;
  if (!date) return iso;
  return date.toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export interface FormDatePickerProps {
  name: string;
  label?: string;
  hint?: string;
  required?: boolean;
  placeholder?: string;
  disabled?: boolean;
  /** Tarih secilemez (giris tarihinden sonrasi gibi) */
  disabledDates?: (date: Date) => boolean;
  onDateChange?: (value: string | null) => void;
  containerClassName?: string;
}

/**
 * React-Hook-Form + Zod ile calisan takvim tabanli tarih secici.
 * Deger "yyyy-MM-dd" formatinda (veya null) saklanir.
 */
const FormDatePicker = React.forwardRef<HTMLButtonElement, FormDatePickerProps>(
  (
    {
      name,
      label,
      hint,
      required,
      placeholder = "Tarih seçiniz",
      disabled,
      disabledDates,
      onDateChange,
      containerClassName,
    },
    ref,
  ) => {
    const { control, formState } = useFormContext();
    const error = getNestedError(formState.errors, name);
    const invalid = hasError(formState.errors, name);

    return (
      <Controller
        control={control}
        name={name}
        render={({ field }) => {
          const value: string | null | undefined = field.value ?? null;
          const selectedDate = value ? parseIsoDate(String(value)) : undefined;
          return (
            <div className={cn("space-y-2", containerClassName)}>
              {label && (
                <Label htmlFor={name}>
                  {label}
                  {required && <span className="ml-0.5 text-destructive">*</span>}
                </Label>
              )}
              <div className="relative">
                <Popover>
                  <PopoverTrigger asChild disabled={disabled}>
                    <button
                      ref={ref}
                      id={name}
                      type="button"
                      disabled={disabled}
                      aria-invalid={invalid}
                      data-error={invalid || undefined}
                      className={cn(
                        "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                        invalid && "border-destructive focus-visible:ring-destructive/40",
                        !value && "text-muted-foreground",
                      )}
                    >
                      <span>{value ? formatDisplay(String(value)) : placeholder}</span>
                      <CalendarIcon className="h-4 w-4 opacity-50" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(day) => {
                        field.onChange(day ? toIsoString(day) : null);
                        onDateChange?.(day ? toIsoString(day) : null);
                      }}
                      disabled={disabledDates}
                      initialFocus
                    />
                    {value && (
                      <div className="border-t p-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="w-full text-destructive hover:text-destructive"
                          onClick={() => {
                            field.onChange(null);
                            onDateChange?.(null);
                          }}
                        >
                          <X className="h-4 w-4" />
                          Temizle
                        </Button>
                      </div>
                    )}
                  </PopoverContent>
                </Popover>
              </div>
              {!error && hint && (
                <p className="text-xs text-muted-foreground">{hint}</p>
              )}
              {error?.message && (
                <p role="alert" className="text-xs font-medium text-destructive">
                  {String(error.message)}
                </p>
              )}
            </div>
          );
        }}
      />
    );
  },
);
FormDatePicker.displayName = "FormDatePicker";

export { FormDatePicker };