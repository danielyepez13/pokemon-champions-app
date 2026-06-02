import { PIKALYTICS_CDN_BASE } from '../config/constants';

/** Manual CDN filename overrides for cases rules cannot infer. */
const CDN_SPRITE_ALIASES: Record<string, string[]> = {};

export interface PikalyticsSpriteResult {
  sprite: string | null;
  usedFallback: boolean;
}

/**
 * Transforms a Pikalytics display name into the primary CDN filename.
 *
 * Examples:
 *   "Incineroar"      → "incineroar"
 *   "Rotom-Wash"      → "rotom_wash"
 *   "Floette-Eternal" → "floette_eternal"
 *   "Ninetales-Alola" → "ninetales_alola"
 */
export function buildPikalyticsCdnUrl(pikalyticsName: string): string {
  const filename = pikalyticsName
    .toLowerCase()
    .replace(/-/g, '_');
  return `${PIKALYTICS_CDN_BASE}/${filename}.png`;
}

/**
 * Builds an ordered list of CDN filename candidates for a Pikalytics display name.
 * Earlier entries are preferred; later entries are fallbacks for known CDN quirks.
 */
export function buildCdnFilenameCandidates(pikalyticsName: string): string[] {
  const primary = pikalyticsName.toLowerCase().replace(/-/g, '_');
  const candidates: string[] = [primary];

  if (primary.includes('_mega_x')) {
    candidates.push(primary.replace('_mega_x', '_megax'));
  }
  if (primary.includes('_mega_y')) {
    candidates.push(primary.replace('_mega_y', '_megay'));
  }
  if (primary.includes('_eternal_mega')) {
    candidates.push(`${primary.split('_')[0]}_mega`);
  }

  const parts = pikalyticsName.toLowerCase().split('-');
  if (parts.some((p) => p === 'mega')) {
    const genericMega = `${parts[0]}_mega`;
    if (genericMega !== primary) {
      candidates.push(genericMega);
    }
  }

  const aliasKey = pikalyticsName.toLowerCase();
  if (CDN_SPRITE_ALIASES[aliasKey]) {
    candidates.push(...CDN_SPRITE_ALIASES[aliasKey]);
  }

  return [...new Set(candidates)];
}

/**
 * Downloads an image from a URL and returns it as a Base64 data URI.
 *
 * Uses fetch + btoa — both are available natively in React Native.
 * No Node.js Buffer or expo-file-system needed.
 *
 * Returns null on any failure so the caller can show a placeholder.
 */
export async function downloadImageAsBase64(
  url: string,
  options?: { quiet404?: boolean }
): Promise<string | null> {
  try {
    const response = await fetch(url, {
      headers: { Accept: 'image/png, image/*' },
    });

    if (!response.ok) {
      if (!(options?.quiet404 && response.status === 404)) {
        console.warn(`[ImageDownloader] HTTP ${response.status} for ${url}`);
      }
      return null;
    }

    const arrayBuffer = await response.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);

    // Convert bytes → binary string → base64
    // Process in 8 KB chunks to avoid call-stack overflow on large images
    let binary = '';
    const chunkSize = 8192;
    for (let i = 0; i < bytes.length; i += chunkSize) {
      binary += String.fromCharCode(...(bytes.subarray(i, i + chunkSize) as unknown as number[]));
    }

    const base64 = btoa(binary);
    return `data:image/png;base64,${base64}`;
  } catch (error: any) {
    console.warn(`[ImageDownloader] Failed to download ${url}:`, error.message);
    return null;
  }
}

/**
 * Builds CDN URL candidates and downloads the first available sprite as Base64.
 */
export async function downloadPikalyticsSpriteAsBase64(
  pikalyticsName: string
): Promise<PikalyticsSpriteResult> {
  const candidates = buildCdnFilenameCandidates(pikalyticsName);

  for (let i = 0; i < candidates.length; i++) {
    const filename = candidates[i];
    const url = `${PIKALYTICS_CDN_BASE}/${filename}.png`;
    const isLast = i === candidates.length - 1;
    const sprite = await downloadImageAsBase64(url, { quiet404: !isLast });

    if (sprite) {
      if (i > 0) {
        console.log(
          `[ImageDownloader] ${pikalyticsName}: sprite resolved via ${filename}.png (attempt ${i + 1}/${candidates.length})`
        );
      }
      return { sprite, usedFallback: i > 0 };
    }

    if (!isLast) {
      console.log(
        `[ImageDownloader] ${pikalyticsName}: 404 for ${filename}.png — trying next candidate`
      );
    }
  }

  console.warn(
    `[ImageDownloader] ${pikalyticsName}: all candidates failed: ${candidates.join(', ')}`
  );
  return { sprite: null, usedFallback: false };
}
