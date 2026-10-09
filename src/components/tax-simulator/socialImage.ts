// The social preview image for a scenario query. The page metadata (og:image)
// and the simulator both use this path, so they hit the same cache entry.
export function socialImagePath(query: string): string {
  return `/api/og/tax-simulator?${query}`;
}

const warmed = new Set<string>();

/**
 * Request the social image so the CDN has it cached before a crawler (X,
 * Bluesky, LinkedIn, iMessage…) asks for it. Rendering on a cold request can
 * take long enough for some crawlers to give up and post a link without a
 * card. Same-origin, fire-and-forget, once per query.
 */
export function warmSocialImage(query: string): void {
  if (typeof window === "undefined" || warmed.has(query)) return;
  warmed.add(query);
  fetch(socialImagePath(query)).catch(() => {
    // Let a later attempt retry
    warmed.delete(query);
  });
}
