import { useEffect, useRef } from 'react';
import { supabase } from './supabase';

interface GeoInfo {
  ip: string;
  country: string;
  country_code: string;
  city: string;
  region: string;
}

/**
 * Fetches geo/IP info from a free public API (ipapi.co).
 * Falls back to ip-api.com if the first one fails.
 * No API key required for low-volume usage.
 */
async function fetchGeoInfo(): Promise<GeoInfo | null> {
  try {
    const res = await fetch('https://ipapi.co/json/', { signal: AbortSignal.timeout(5000) });
    if (res.ok) {
      const data = await res.json();
      if (data.ip) {
        return {
          ip: data.ip,
          country: data.country_name ?? 'Unknown',
          country_code: data.country_code ?? '',
          city: data.city ?? '',
          region: data.region ?? '',
        };
      }
    }
  } catch {
    // intentional fallthrough to backup
  }

  // Backup: ip-api.com (free, no key needed)
  try {
    const res = await fetch('http://ip-api.com/json/?fields=query,country,countryCode,city,regionName', {
      signal: AbortSignal.timeout(5000),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.query) {
        return {
          ip: data.query,
          country: data.country ?? 'Unknown',
          country_code: data.countryCode ?? '',
          city: data.city ?? '',
          region: data.regionName ?? '',
        };
      }
    }
  } catch {
    // both APIs failed
  }

  return null;
}

/**
 * Logs a visit to the `visitor_logs` table in Supabase.
 *
 * @param page      - current page/route being visited
 * @param userId    - Supabase user ID if logged in, null for anonymous
 * @param eventType - 'page_view' | 'login' | 'register'
 */
async function logVisit(
  page: string,
  userId: string | null,
  eventType: 'page_view' | 'login' | 'register' = 'page_view'
): Promise<void> {
  const geo = await fetchGeoInfo();

  const { error } = await supabase.from('visitor_logs').insert({
    ip: geo?.ip ?? null,
    country: geo?.country ?? null,
    country_code: geo?.country_code ?? null,
    city: geo?.city ?? null,
    region: geo?.region ?? null,
    page,
    user_id: userId ?? null,
    event_type: eventType,
  });

  if (error) {
    console.warn('[VisitorLog] No se pudo guardar el log:', error.message);
  }
}

/**
 * Hook that automatically logs one page_view per session on mount.
 * Call it once at the app root (e.g. inside AuthProvider or App.tsx).
 *
 * @param userId - pass the current user's ID (or null if anonymous)
 */
export function useVisitorLog(userId: string | null) {
  const logged = useRef(false); // avoid double-logging in StrictMode

  useEffect(() => {
    if (logged.current) return;
    logged.current = true;

    const page = window.location.pathname;
    logVisit(page, userId, 'page_view');
  }, []); // only on mount
}

/**
 * Call this manually after a successful login or register.
 *
 * @example
 *   await supabase.auth.signInWithPassword(...)
 *   await logAuthEvent('login', user.id);
 */
export { logVisit };
