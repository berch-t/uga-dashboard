/**
 * Minimal, dependency-free HTTP/JSON client with retry and exponential backoff.
 *
 * Keeps every connector resilient to the transient 5xx / rate-limit responses
 * that public scholarly APIs occasionally return, without pulling in a library.
 */

import { config } from "../config";

export interface FetchJsonOptions {
  retries?: number;
  /** Base backoff in ms; doubles each attempt. */
  backoffMs?: number;
  timeoutMs?: number;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function fetchJson<T>(
  url: string,
  options: FetchJsonOptions = {},
): Promise<T> {
  const { retries = 4, backoffMs = 500, timeoutMs = 30_000 } = options;

  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, {
        headers: { Accept: "application/json", "User-Agent": "uga-research-dashboard/1.0 (mailto:" + config.openAlex.mailto + ")" },
        signal: controller.signal,
      });
      if (res.status === 429 || res.status >= 500) {
        throw new Error(`Transient HTTP ${res.status} for ${url}`);
      }
      if (!res.ok) {
        throw new Error(`HTTP ${res.status} for ${url}`);
      }
      return (await res.json()) as T;
    } catch (error) {
      lastError = error;
      if (attempt < retries) await sleep(backoffMs * 2 ** attempt);
    } finally {
      clearTimeout(timer);
    }
  }
  throw new Error(
    `fetchJson failed after ${retries + 1} attempts: ${String(lastError)}`,
  );
}

/** Build a query string from a record, skipping undefined values. */
export function qs(params: Record<string, string | number | undefined>): string {
  const parts: string[] = [];
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined) continue;
    parts.push(`${key}=${encodeURIComponent(String(value))}`);
  }
  return parts.join("&");
}

export const politeDelay = () => sleep(config.requestDelayMs);
