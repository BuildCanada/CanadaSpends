// The social preview image for a scenario query. The page metadata (og:image)
// and the simulator both use this path, so they hit the same cache entry.
export function socialImagePath(query: string, lang: string = "en"): string {
  const suffix = lang === "fr" ? "&lang=fr" : "";
  return `/api/og/tax-simulator?${query}${suffix}`;
}

const warmed = new Set<string>();

/**
 * Request the social image so the CDN has it cached before a crawler (X,
 * Bluesky, LinkedIn, iMessage…) asks for it. Rendering on a cold request can
 * take long enough for some crawlers to give up and post a link without a
 * card. Same-origin, fire-and-forget, once per query.
 */
export function warmSocialImage(query: string, lang: string = "en"): void {
  const path = socialImagePath(query, lang);
  if (typeof window === "undefined" || warmed.has(path)) return;
  warmed.add(path);
  fetch(path).catch(() => {
    // Let a later attempt retry
    warmed.delete(path);
  });
}
