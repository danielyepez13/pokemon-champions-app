/**
 * Lightweight network connectivity check.
 * Uses a simple fetch to a reliable public endpoint with a short timeout.
 * Does NOT require @react-native-community/netinfo.
 */
export async function isOnline(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const res = await fetch('https://www.pikalytics.com/robots.txt', {
      method: 'HEAD',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    return res.ok || res.status < 500;
  } catch {
    return false;
  }
}
