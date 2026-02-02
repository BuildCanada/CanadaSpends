// Supabase REST API client for First Nations band data

const BASE_URL = "https://api.buildcanada.com/rest/v1";
const API_KEY = "sb_publishable_nDRd3MFmMdzRsDfAkDPc3g_xWbSiV19";

export interface FetchOptions {
  revalidate?: number;
  cache?: RequestCache;
}

export async function supabaseFetch<T>(
  endpoint: string,
  options: FetchOptions = {},
): Promise<T> {
  const { revalidate = 3600 } = options;

  const url = `${BASE_URL}/${endpoint}`;

  const response = await fetch(url, {
    headers: {
      apikey: API_KEY,
      "Content-Type": "application/json",
    },
    next: {
      revalidate,
    },
  });

  if (!response.ok) {
    throw new Error(
      `Supabase API error: ${response.status} ${response.statusText}`,
    );
  }

  return response.json();
}

export * from "./types";
export * from "./bands";
export * from "./sankey-transform";
