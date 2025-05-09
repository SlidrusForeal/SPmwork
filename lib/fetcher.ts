// lib/fetcher.ts

/**
 * Утилита для выполнения fetch-запросов.
 * Бросает ошибку, если статус ответа не в диапазоне 2xx.
 */
export async function fetcher<T = any>(
  url: string,
  opts: RequestInit = {}
): Promise<T> {
  const res = await fetch(url, opts);
  let data: any;
  try {
    data = await res.json();
  } catch {
    // если нет JSON в ответе
    if (!res.ok) {
      throw new Error(res.statusText);
    }
    return {} as T;
  }

  if (!res.ok) {
    // стандартная обработка ошибок
    throw new Error(data.error || res.statusText);
  }
  return data as T;
}
