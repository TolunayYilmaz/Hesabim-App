// FastAPI backend ile haberlesme katmani.
// JWT ve aktif sirket ID'si localStorage'da tutulur.

// Local gelistiricide FastAPI (8000) kullanilir; uretimde vercel.json rewrite'i
// sayesinde ayni domain uzerinden '/api' ile yonlendirilir.
export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ??
  (process.env.NODE_ENV === "development"
    ? "http://localhost:8000/api"
    : "/api");

export interface AuthUser {
  id: string;
  email: string;
  full_name: string;
  role: string;
  is_active: boolean;
}

const TOKEN_KEY = "bh_token";
const COMPANY_KEY = "bh_company";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null): void {
  if (typeof window === "undefined") return;
  if (token) window.localStorage.setItem(TOKEN_KEY, token);
  else window.localStorage.removeItem(TOKEN_KEY);
}

export function getCompanyId(): string {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(COMPANY_KEY) ?? "";
}

export function setCompanyId(id: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(COMPANY_KEY, id);
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export async function api<T = unknown>(
  path: string,
  init?: {
    method?: string;
    body?: unknown;
    headers?: Record<string, string>;
  },
): Promise<T> {
  const method = init?.method ?? "GET";
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init?.headers ?? {}),
  };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const companyId = getCompanyId();
  if (companyId) headers["X-Company-Id"] = companyId;

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: init?.body !== undefined ? JSON.stringify(init.body) : undefined,
  });

  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = await res.json();
      detail = body.detail;
    } catch {
      /* yoksay */
    }
    throw new ApiError(res.status, detail ?? res.statusText);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}