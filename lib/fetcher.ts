// lib/fetcher.ts
/**
 * Утилита для выполнения fetch-запросов.
 * Перенаправляет на /login при 401 и бросает ошибку.
 */
export class FetchError extends Error {
  constructor(message: string, public status: number, public data?: any) {
    super(message);
    this.name = "FetchError";
  }
}

export async function fetcher<T = any>(
  url: string,
  opts: RequestInit = {}
): Promise<T> {
  const res = await fetch(url, opts);

  if (res.status === 401) {
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
    throw new FetchError("Unauthorized", res.status);
  }

  let data: any;
  try {
    data = await res.json();
  } catch (error) {
    throw new FetchError(
      res.ok ? "Invalid JSON response" : res.statusText,
      res.status
    );
  }

  if (!res.ok) {
    throw new FetchError(data?.error || res.statusText, res.status, data);
  }

  return data as T;
}
