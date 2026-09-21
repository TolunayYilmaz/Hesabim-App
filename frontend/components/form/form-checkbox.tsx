"use client";

import * as React from "react";
import { Controller, useFormContext } from "react-hook-form";

import { getNestedError, hasError } from "@/lib/form-utils";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

export interface FormCheckboxProps {
  name: string;
  label: string;
  description?: string;
  disabled?: boolean;
  containerClassName?: string;
  onChange?: (checked: boolean) => void;
}

/**
 * React-Hook-Form + Zod ile calisan onay kutusu (Controller tabanli).
 */
const FormCheckbox = React.forwardRef<HTMLButtonElement, FormCheckboxProps>(
  ({ name, label, description, disabled, containerClassName, onChange }, ref) => {
    const { control, formState } = useFormContext();
    const error = getNestedError(formState.errors, name);
    const invalid = hasError(formState.errors, name);

    return (
      <Controller
        control={control}
        name={name}
        render={({ field }) => (
          <div className={cn("space-y-2", containerClassName)}>
            <div className="flex items-start gap-3">
              <Checkbox
                ref={ref}
                id={name}
                checked={Boolean(field.value)}
                onCheckedChange={(checked) => {
                  field.onChange(Boolean(checked));
                  onChange?.(Boolean(checked));
                }}
                disabled={disabled}
                aria-invalid={invalid}
                className={cn("mt-0.5", invalid && "border-destructive")}
              />
              <div className="space-y-1">
                <Label
                  htmlFor={name}
                  className="cursor-pointer select-none font-medium"
                >
                  {label}
                </Label>
                {description && (
                  <p className="text-xs text-muted-foreground">{description}</p>
                )}
              </div>
            </div>
            {error?.message && (
              <p role="alert" className="text-xs font-medium text-destructive">
                {String(error.message)}
              </p>
            )}
          </div>
        )}
      />
    );
  },
);
FormCheckbox.displayName = "FormCheckbox";

export { FormCheckbox };