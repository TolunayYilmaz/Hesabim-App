"use client";

import * as React from "react";
import { Controller, useFormContext } from "react-hook-form";

import { getNestedError, hasError } from "@/lib/form-utils";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface SelectOption {
  label: string;
  value: string;
}

export interface FormSelectProps {
  name: string;
  label?: string;
  hint?: string;
  required?: boolean;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  containerClassName?: string;
  onValueChange?: (value: string) => void;
}

/**
 * React-Hook-Form + Zod ile calisan, Radix Select tabanli dropdown.
 * `useFormContext` + `Controller` erken turevim.
 */
const FormSelect = React.forwardRef<HTMLButtonElement, FormSelectProps>(
  (
    {
      name,
      label,
      hint,
      required,
      options,
      placeholder = "Seçiniz...",
      disabled,
      containerClassName,
      onValueChange,
    },
    ref,
  ) => {
    const { control, formState } = useFormContext();
    const error = getNestedError(formState.errors, name);
    const invalid = hasError(formState.errors, name);

    const emptyState = placeholder;

    return (
      <Controller
        control={control}
        name={name}
        render={({ field }) => {
          const isEmpty = field.value === "" || field.value == null;
          return (
            <div className={cn("space-y-2", containerClassName)}>
              {label && (
                <Label htmlFor={name}>
                  {label}
                  {required && (
                    <span className="ml-0.5 text-destructive">*</span>
                  )}
                </Label>
              )}
              <Select
                disabled={disabled}
                value={field.value?.toString() ?? ""}
                onValueChange={(value) => {
                  field.onChange(value);
                  onValueChange?.(value);
                }}
              >
                <SelectTrigger
                  ref={ref}
                  id={name}
                  aria-invalid={invalid}
                  data-error={invalid || undefined}
                  className={cn(
                    invalid &&
                      "border-destructive focus-visible:ring-destructive/40",
                  )}
                >
                  {isEmpty ? (
                    <span className="text-muted-foreground">{emptyState}</span>
                  ) : (
                    <SelectValue />
                  )}
                </SelectTrigger>
                <SelectContent>
                  {!options.length && (
                    <div className="px-2 py-1.5 text-sm text-muted-foreground">
                      Seçenek bulunamadı
                    </div>
                  )}
                  {options.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
FormSelect.displayName = "FormSelect";

export { FormSelect };