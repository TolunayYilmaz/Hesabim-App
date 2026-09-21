"use client";

import * as React from "react";
import { useFormContext } from "react-hook-form";

import { getNestedError, hasError } from "@/lib/form-utils";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface FormInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "name"> {
  /** react-hook-form alan yolu, orn: "tax_number" veya "address.city" */
  name: string;
  label?: string;
  hint?: string;
  /** Alanin zorunlu oldugunu gosteren yildiz */
  required?: boolean;
  containerClassName?: string;
}

/**
 * React-Hook-Form + Zod ile calisan metin / sayi / email alani.
 * `useFormContext` sayesinde `name` disinda ekstra kod gerekmez.
 */
const FormInput = React.forwardRef<HTMLInputElement, FormInputProps>(
  (
    {
      name,
      label,
      hint,
      required,
      className,
      containerClassName,
      disabled,
      ...props
    },
    ref,
  ) => {
    const {
      register,
      formState: { errors },
    } = useFormContext();
    const error = getNestedError(errors, name);
    const invalid = hasError(errors, name);

    return (
      <div className={cn("space-y-2", containerClassName)}>
        {label && (
          <Label htmlFor={name}>
            {label}
            {required && <span className="ml-0.5 text-destructive">*</span>}
          </Label>
        )}
        <Input
          id={name}
          aria-invalid={invalid}
          data-error={invalid || undefined}
          className={cn(
            invalid &&
              "border-destructive focus-visible:ring-destructive/40",
            className,
          )}
          disabled={disabled}
          {...register(name)}
          {...props}
        />
        {!error && hint && (
          <p className="text-xs text-muted-foreground">{hint}</p>
        )}
        {error?.message && (
          <p
            role="alert"
            className="text-xs font-medium text-destructive"
          >
            {String(error.message)}
          </p>
        )}
      </div>
    );
  },
);
FormInput.displayName = "FormInput";

export { FormInput };