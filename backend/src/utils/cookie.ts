/**
 * Safely parses cookie strings from Request headers.
 */
export function parseCookies(cookieHeader: string | undefined): Record<string, string> {
  const cookies: Record<string, string> = {};
  if (!cookieHeader) return cookies;

  cookieHeader.split(';').forEach((cookie) => {
    const parts = cookie.split('=');
    const name = parts.shift()?.trim();
    const value = parts.join('=')?.trim();
    if (name && value) {
      cookies[name] = decodeURIComponent(value);
    }
  });

  return cookies;
}
