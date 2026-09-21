import type { FieldErrors } from "react-hook-form";

/** "adres.il" gibi noktali yollardan form hatasini okur. */
export function getNestedError(
  errors: FieldErrors,
  path: string,
): { message?: string; type?: string } | undefined {
  const value = path.split(".").reduce<unknown>((acc, key) => {
    if (acc && typeof acc === "object") {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, errors);
  return value as { message?: string; type?: string } | undefined;
}

/** Bileşen icin `aria-invalid` ve `data-error` bayragi. */
export function hasError(errors: FieldErrors, path: string): boolean {
  return Boolean(getNestedError(errors, path));
}