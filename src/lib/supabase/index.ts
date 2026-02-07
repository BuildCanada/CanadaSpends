// Supabase REST API client for First Nations data

const BASE_URL = "https://api.buildcanada.com/rest/v1";
const API_KEY = "sb_publishable_nDRd3MFmMdzRsDfAkDPc3g_xWbSiV19";

export interface FetchOptions {
  revalidate?: number;
  cache?: RequestCache;
  maxRetries?: number;
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function supabaseFetch<T>(
  endpoint: string,
  options: FetchOptions = {},
): Promise<T> {
  const { revalidate = 3600, maxRetries = 3 } = options;

  const url = `${BASE_URL}/${endpoint}`;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const response = await fetch(url, {
      headers: {
        apikey: API_KEY,
        "Content-Type": "application/json",
      },
      next: {
        revalidate,
      },
    });

    if (response.ok) {
      return response.json();
    }

    // Retry on 5xx server errors
    if (response.status >= 500 && attempt < maxRetries) {
      const delayMs = Math.min(1000 * Math.pow(2, attempt), 10000);
      await sleep(delayMs);
      lastError = new Error(
        `Supabase API error: ${response.status} ${response.statusText}`,
      );
      continue;
    }

    throw new Error(
      `Supabase API error: ${response.status} ${response.statusText}`,
    );
  }

  throw lastError || new Error("Supabase API error: max retries exceeded");
}

export * from "./types";
export * from "./first-nations";
export * from "./claims";
export * from "./remuneration";
export * from "./sankey-transform";
export * from "./statscan";
