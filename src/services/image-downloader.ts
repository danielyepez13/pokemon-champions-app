import { PIKALYTICS_CDN_BASE } from '../config/constants';

/**
 * Transforms a Pikalytics display name into the CDN filename.
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
 * Downloads an image from a URL and returns it as a Base64 data URI.
 *
 * Uses fetch + btoa — both are available natively in React Native.
 * No Node.js Buffer or expo-file-system needed.
 *
 * Returns null on any failure so the caller can show a placeholder.
 */
export async function downloadImageAsBase64(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, {
      headers: { 'Accept': 'image/png, image/*' },
    });

    if (!response.ok) {
      console.warn(`[ImageDownloader] HTTP ${response.status} for ${url}`);
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
 * Convenience: builds the Pikalytics CDN URL and downloads it as Base64.
 */
export async function downloadPikalyticsSpriteAsBase64(
  pikalyticsName: string
): Promise<string | null> {
  const url = buildPikalyticsCdnUrl(pikalyticsName);
  return downloadImageAsBase64(url);
}
