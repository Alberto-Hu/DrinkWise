import { useEffect, useRef } from 'react';
import { supabase } from './supabase';

interface GeoInfo {
  ip: string;
  country: string;
  country_code: string;
  city: string;
  region: string;
}

export interface GpsLogResult {
  success: boolean;
  city?: string;
  temperature?: number | null;
  environment?: 'rural' | 'urbano' | 'indeterminado';
  error?: string;
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
 * Determina si unas coordenadas corresponden a un entorno rural o urbano
 * utilizando OpenStreetMap (Nominatim).
 */
async function classifyCoordinates(lat: number, lon: number): Promise<{
  environment: 'rural' | 'urbano';
  settlementType: string;
  city: string;
  region: string;
  country: string;
}> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&zoom=18&addressdetails=1`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'DrinkWise-App/1.0', 'Accept-Language': 'es' },
      signal: AbortSignal.timeout(6000),
    });

    if (!res.ok) throw new Error('Error al consultar Nominatim');
    const data = await res.json();
    const addr = data.address || {};

    const isRural =
      Boolean(addr.village || addr.hamlet || addr.isolated_dwelling || addr.farm || addr.farmland || addr.allotments) &&
      !addr.city &&
      !addr.suburb;

    const settlementType =
      addr.city ? 'city' :
      addr.suburb ? 'suburb' :
      addr.town ? 'town' :
      addr.village ? 'village' :
      addr.hamlet ? 'hamlet' :
      addr.isolated_dwelling ? 'isolated_dwelling' :
      addr.farm ? 'farm' : 'otro';

    const environment: 'rural' | 'urbano' = isRural ? 'rural' : (addr.city || addr.suburb || addr.town ? 'urbano' : 'rural');

    return {
      environment,
      settlementType,
      city: addr.city || addr.town || addr.village || addr.hamlet || addr.municipality || '',
      region: addr.state || '',
      country: addr.country || '',
    };
  } catch (err) {
    console.warn('[VisitorLog] Fallback en clasificación Nominatim:', err);
    return {
      environment: 'urbano',
      settlementType: 'desconocido',
      city: '',
      region: '',
      country: '',
    };
  }
}

/**
 * Consulta la temperatura real de la zona con Open-Meteo (gratuita, sin API key).
 */
async function fetchWeatherTemp(lat: number, lon: number): Promise<number | null> {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m`;
    const res = await fetch(url, { signal: AbortSignal.timeout(4000) });
    if (res.ok) {
      const data = await res.json();
      return typeof data.current?.temperature_2m === 'number' ? Math.round(data.current.temperature_2m) : null;
    }
  } catch {
    // Si falla el clima, no interrumpe el flujo
  }
  return null;
}

/**
 * Solicita el GPS del navegador con enableHighAccuracy y registra la ubicación
 * exacta en Supabase con su clasificación rural o urbana.
 */
export async function requestExactLocationAndLog(userId: string | null): Promise<GpsLogResult> {
  if (typeof window === 'undefined' || !navigator.geolocation) {
    return { success: false, error: 'Geolocalización no soportada en este navegador' };
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const lat = pos.coords.latitude;
          const lon = pos.coords.longitude;
          const accuracy = pos.coords.accuracy;

          // 1. Clasificar con OpenStreetMap
          const classification = await classifyCoordinates(lat, lon);

          // 2. Obtener temperatura local real
          const temp = await fetchWeatherTemp(lat, lon);

          // 3. Datos IP de respaldo/complementarios
          const geo = await fetchGeoInfo();

          // 4. Guardar en Supabase (con columnas extendidas si existen)
          const payloadFull: any = {
            ip: geo?.ip ?? null,
            country: classification.country || geo?.country || null,
            country_code: geo?.country_code || null,
            city: classification.city || geo?.city || null,
            region: classification.region || geo?.region || null,
            page: window.location.pathname,
            user_id: userId ?? null,
            event_type: 'gps_clima_check',
            latitude: lat,
            longitude: lon,
            accuracy_meters: accuracy,
            environment: classification.environment,
            settlement_type: classification.settlementType,
            location_source: 'gps',
          };

          const { error: fullError } = await supabase.from('visitor_logs').insert(payloadFull);

          // Si las columnas aún no han sido añadidas a Supabase mediante SQL,
          // se guarda en los campos estándar existentes sin perder el dato:
          if (fullError) {
            console.warn('[VisitorLog] Guardando en campos estándar:', fullError.message);
            await supabase.from('visitor_logs').insert({
              ip: geo?.ip ?? null,
              country: classification.country || geo?.country || null,
              country_code: geo?.country_code || null,
              city: `${classification.city || 'Ubicación'} [${classification.environment.toUpperCase()}]`,
              region: `${classification.region || ''} (GPS: ${lat.toFixed(4)}, ${lon.toFixed(4)} ±${Math.round(accuracy)}m)`,
              page: window.location.pathname,
              user_id: userId ?? null,
              event_type: 'gps_clima_check',
            });
          }

          resolve({
            success: true,
            city: classification.city,
            temperature: temp,
            environment: classification.environment,
          });
        } catch (err: any) {
          console.error('[VisitorLog] Error procesando GPS:', err);
          resolve({ success: false, error: err?.message || 'Error al procesar ubicación' });
        }
      },
      (err) => {
        console.warn('[VisitorLog] Permiso GPS no otorgado:', err.message);
        resolve({ success: false, error: 'Permiso denegado' });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  });
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
  const logged = useRef(false);

  useEffect(() => {
    if (logged.current) return;
    logged.current = true;

    const page = window.location.pathname;
    logVisit(page, userId, 'page_view');
  }, []);
}

export { logVisit };
