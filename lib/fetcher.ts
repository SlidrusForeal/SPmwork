// lib/fetcher.ts
/**
 * Утилита для выполнения fetch-запросов.
 * Перенаправляет на /login при 401 и бросает ошибку.
 */
export async function fetcher<T = any>(
  url: string,
  opts: RequestInit = {}
): Promise<T> {
  const res = await fetch(url, opts);
  if (res.status === 401) {
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
    throw new Error("Unauthorized");
  }
  let data: any;
  try {
    data = await res.json();
  } catch {
    if (!res.ok) throw new Error(res.statusText);
    return {} as T;
  }
  if (!res.ok) {
    throw new Error(data.error || res.statusText);
  }
  return data as T;
}
