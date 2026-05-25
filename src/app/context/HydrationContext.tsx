import { createContext, useContext, useState, useEffect, ReactNode, useRef, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from './AuthContext';

export type EventType = { id: string; time: string; event: string; delta: string; positive: boolean; alert: boolean };
export type AlertType = { id: number; time: string; date: string; type: string; message: string; severity: string; resolved: boolean };
export type ToastType = { id: number; message: string; type: 'success' | 'error' | 'info' };
export type UserSettings = {
  device_name: string;
  led_enabled: boolean;
  alerts_enabled: boolean;
  reminder_interval_min: number;
};

interface HydrationContextType {
  consumed: number;
  dailyGoal: number;
  setDailyGoal: (g: number) => void;
  events: EventType[];
  alerts: AlertType[];
  addEvent: (eventName: string, mlAmount?: number, isAlert?: boolean, customDeltaText?: string) => void;
  addAlert: (type: string, message: string, severity: string) => void;
  resolveAlert: (id: number) => void;
  clearHistory: () => Promise<void>;
  toasts: ToastType[];
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  dismissToast: (id: number) => void;
  settings: UserSettings;
  saveSettings: (s: UserSettings) => Promise<void>;

  // Web Serial API (USB)
  isConnected: boolean;
  connectESP: () => Promise<void>;
  disconnectESP: () => Promise<void>;
  portError: string | null;

  // Hybrid Wi-Fi API
  linkedDeviceMac: string | null;
  linkDevice: (mac: string) => Promise<void>;
  unlinkDevice: () => Promise<void>;
}

const DEFAULT_SETTINGS: UserSettings = {
  device_name: 'Mi Posavasos DrinkWise',
  led_enabled: true,
  alerts_enabled: true,
  reminder_interval_min: 60,
};

const HydrationContext = createContext<HydrationContextType | undefined>(undefined);

export function HydrationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [consumed, setConsumed] = useState(0);
  const [dailyGoal, setDailyGoal] = useState(2000);
  const [events, setEvents] = useState<EventType[]>([]);
  const [alerts, setAlerts] = useState<AlertType[]>([]);
  const [toasts, setToasts] = useState<ToastType[]>([]);
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);

  // Serial State
  const [isConnected, setIsConnected] = useState(false);
  const [portError, setPortError] = useState<string | null>(null);

  // Wi-Fi / Hybrid State
  const [linkedDeviceMac, setLinkedDeviceMac] = useState<string | null>(null);

  const portRef = useRef<any>(null);
  const readerRef = useRef<any>(null);
  const writerRef = useRef<any>(null);
  const consumedRef = useRef(consumed);
  const lastDrinkTimeRef = useRef<Date | null>(null);

  useEffect(() => { consumedRef.current = consumed; }, [consumed]);

  // ─── Toast helpers ───────────────────────────────────────────────────────────
  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  }, []);

  const dismissToast = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // ─── Inactivity alert checker ────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(() => {
      if (!settings.alerts_enabled) return;
      const thresholdMs = (settings.reminder_interval_min || 60) * 60 * 1000;
      if (lastDrinkTimeRef.current) {
        const elapsed = Date.now() - lastDrinkTimeRef.current.getTime();
        if (elapsed >= thresholdMs) {
          const now = new Date();
          const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
          const mins = Math.round(elapsed / 60000);
          setAlerts(prev => {
            // Avoid duplicate inactivity alerts
            if (prev.some(a => !a.resolved && a.type === 'Inactividad prolongada')) return prev;
            return [{
              id: Date.now(),
              time: timeStr,
              date: now.toLocaleDateString('es-ES'),
              type: 'Inactividad prolongada',
              message: `Llevas ${mins} minutos sin beber agua. ¡Hidratate!`,
              severity: mins > 120 ? 'high' : 'medium',
              resolved: false,
            }, ...prev];
          });
        }
      }
    }, 60_000); // check every minute
    return () => clearInterval(interval);
  }, [user, settings.alerts_enabled, settings.reminder_interval_min]);

  // ─── Load data on login ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!user) {
      setConsumed(0);
      setEvents([]);
      setAlerts([]);
      setLinkedDeviceMac(null);
      setSettings(DEFAULT_SETTINGS);
      return;
    }

    const loadData = async () => {
      const today = new Date().toISOString().split('T')[0];

      // 1. Hydration
      const { data: hydrationData } = await supabase
        .from('daily_hydration')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', today)
        .single();

      if (hydrationData) {
        setConsumed(hydrationData.consumed_ml);
        setDailyGoal(hydrationData.goal_ml);
      } else {
        await supabase.from('daily_hydration').insert({
          user_id: user.id, date: today, consumed_ml: 0, goal_ml: 2000
        });
        setConsumed(0);
      }

      // 2. Events (today only)
      const { data: eventsData } = await supabase
        .from('hydration_events')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', `${today}T00:00:00.000Z`)
        .order('created_at', { ascending: false })
        .limit(50);

      if (eventsData && eventsData.length > 0) {
        const mapped = eventsData.map((e: any) => {
          const d = new Date(e.created_at);
          return {
            id: e.id,
            time: `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`,
            event: e.event_name,
            delta: e.amount_ml > 0 ? `+${e.amount_ml}ml` : '0',
            positive: e.amount_ml > 0,
            alert: false,
          };
        });
        setEvents(mapped);
        // seed the last drink time ref from latest positive event
        const firstPositive = eventsData.find((e: any) => e.amount_ml > 0);
        if (firstPositive) lastDrinkTimeRef.current = new Date(firstPositive.created_at);
      }

      // 3. Linked Device
      const { data: deviceData } = await supabase
        .from('user_devices')
        .select('mac_address')
        .eq('user_id', user.id)
        .single();
      if (deviceData) setLinkedDeviceMac(deviceData.mac_address);

      // 4. User Settings
      const { data: settingsData } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();
      if (settingsData) {
        setSettings({
          device_name: settingsData.device_name ?? DEFAULT_SETTINGS.device_name,
          led_enabled: settingsData.led_enabled ?? true,
          alerts_enabled: settingsData.alerts_enabled ?? true,
          reminder_interval_min: settingsData.reminder_interval_min ?? 60,
        });
        setDailyGoal(settingsData.daily_goal ?? 2000);
      }
    };

    loadData();

    // 5. Supabase Realtime
    const channel = supabase.channel('realtime_events')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'hydration_events',
        filter: `user_id=eq.${user.id}`,
      }, payload => {
        const newEvt = payload.new as any;
        const d = new Date(newEvt.created_at);
        const localTime = `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
        const uiEvent: EventType = {
          id: newEvt.id,
          time: localTime,
          event: newEvt.event_name,
          delta: `+${newEvt.amount_ml}ml`,
          positive: true,
          alert: false,
        };
        setEvents(prev => [uiEvent, ...prev]);
        if (newEvt.amount_ml > 0) {
          setConsumed(prev => prev + newEvt.amount_ml);
          lastDrinkTimeRef.current = new Date();
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  // Sync progress % to ESP32 via Serial whenever consumed/dailyGoal changes
  useEffect(() => {
    if (isConnected && writerRef.current) {
      const percent = Math.min(100, Math.round((consumed / dailyGoal) * 100));
      sendSerialCommand(`PROGRESS:${settings.led_enabled ? percent : 0}\n`);
    }
  }, [consumed, dailyGoal, isConnected, settings.led_enabled]);

  // ─── Settings ────────────────────────────────────────────────────────────────
  const saveSettings = async (newSettings: UserSettings) => {
    if (!user) return;
    setSettings(newSettings);
    setDailyGoal(dailyGoal); // keep in sync

    const { error } = await supabase.from('user_settings').upsert({
      user_id: user.id,
      device_name: newSettings.device_name,
      led_enabled: newSettings.led_enabled,
      alerts_enabled: newSettings.alerts_enabled,
      reminder_interval_min: newSettings.reminder_interval_min,
      daily_goal: dailyGoal,
    });

    if (error) {
      showToast('Error al guardar la configuración.', 'error');
    } else {
      showToast('¡Configuración guardada correctamente!', 'success');
    }
  };

  // ─── Device Linking ───────────────────────────────────────────────────────────
  const linkDevice = async (mac: string) => {
    if (!user) return;
    await supabase.from('user_devices').upsert({ mac_address: mac, user_id: user.id });
    setLinkedDeviceMac(mac);
    showToast(`Dispositivo ${mac} vinculado.`, 'success');
  };

  const unlinkDevice = async () => {
    if (!user || !linkedDeviceMac) return;
    await supabase.from('user_devices').delete().eq('mac_address', linkedDeviceMac);
    setLinkedDeviceMac(null);
    showToast('Dispositivo desvinculado.', 'info');
  };

  // ─── Events & Alerts ─────────────────────────────────────────────────────────
  const addEvent = async (eventName: string, mlAmount: number = 0, isAlert = false, customDeltaText?: string) => {
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    let newConsumed = consumed;
    if (mlAmount > 0) {
      newConsumed += mlAmount;
      setConsumed(newConsumed);
      lastDrinkTimeRef.current = new Date();
    }

    let finalDelta = mlAmount > 0 ? `+${mlAmount}ml` : (isAlert ? '--' : '0');
    if (customDeltaText) finalDelta = customDeltaText;

    const newEvent: EventType = {
      id: Math.random().toString(36).substr(2, 9),
      time: timeStr,
      event: eventName,
      delta: finalDelta,
      positive: mlAmount > 0,
      alert: isAlert,
    };
    setEvents(prev => [newEvent, ...prev]);

    if (user) {
      const today = new Date().toISOString().split('T')[0];
      if (mlAmount > 0) {
        await supabase.from('daily_hydration')
          .update({ consumed_ml: newConsumed })
          .eq('user_id', user.id)
          .eq('date', today);
      }
      await supabase.from('hydration_events').insert({
        user_id: user.id, time_str: timeStr, event_name: eventName, amount_ml: mlAmount,
      });
    }
  };

  const addAlert = (type: string, message: string, severity: string) => {
    const now = new Date();
    setAlerts(prev => [{
      id: Date.now(),
      time: `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`,
      date: now.toLocaleDateString('es-ES'),
      type, message, severity, resolved: false,
    }, ...prev]);
  };

  const resolveAlert = (id: number) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, resolved: true } : a));
  };

  const clearHistory = async () => {
    if (!user) return;
    const today = new Date().toISOString().split('T')[0];
    await supabase.from('hydration_events').delete().eq('user_id', user.id);
    await supabase.from('daily_hydration').update({ consumed_ml: 0 }).eq('user_id', user.id).eq('date', today);
    setEvents([]);
    setConsumed(0);
    lastDrinkTimeRef.current = null;
    showToast('Historial borrado.', 'info');
  };

  // ─── Web Serial API ──────────────────────────────────────────────────────────
  const connectESP = async () => {
    if (!('serial' in navigator)) {
      setPortError('Tu navegador no soporta Web Serial (Usa Chrome/Edge en PC).');
      return;
    }
    try {
      setPortError(null);
      const port = await (navigator as any).serial.requestPort();
      await port.open({ baudRate: 115200 });
      portRef.current = port;

      const textEncoder = new TextEncoderStream();
      textEncoder.readable.pipeTo(port.writable);
      writerRef.current = textEncoder.writable.getWriter();

      setIsConnected(true);
      readLoop(port);

      setTimeout(() => {
        const percent = Math.min(100, Math.round((consumedRef.current / dailyGoal) * 100));
        sendSerialCommand(`PROGRESS:${settings.led_enabled ? percent : 0}\n`);
      }, 1500);
    } catch (err: any) {
      setPortError('Error de conexión: ' + err.message);
    }
  };

  const disconnectESP = async () => {
    setIsConnected(false);
    try {
      if (readerRef.current) await readerRef.current.cancel();
      if (writerRef.current) await writerRef.current.close();
      if (portRef.current) await portRef.current.close();
    } catch (err) { console.error(err); }
    finally {
      portRef.current = null; readerRef.current = null; writerRef.current = null;
    }
  };

  const sendSerialCommand = async (cmd: string) => {
    if (writerRef.current) {
      try { await writerRef.current.write(cmd); } catch { }
    }
  };

  const readLoop = async (port: any) => {
    const textDecoder = new TextDecoderStream();
    port.readable.pipeTo(textDecoder.writable);
    const reader = textDecoder.readable.getReader();
    readerRef.current = reader;
    let buffer = '';
    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        if (value) {
          buffer += value;
          let idx;
          while ((idx = buffer.indexOf('\n')) >= 0) {
            const line = buffer.slice(0, idx).trim();
            buffer = buffer.slice(idx + 1);
            if (line.startsWith('DRINK:')) {
              const amount = parseInt(line.substring(6), 10);
              if (!isNaN(amount) && amount > 0) handleDrinkEventLocal(amount);
            }
          }
        }
      }
    } catch { setIsConnected(false); }
    finally { reader.releaseLock(); }
  };

  const handleDrinkEventLocal = (amount: number) => {
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const newConsumed = consumedRef.current + amount;
    setConsumed(newConsumed);
    lastDrinkTimeRef.current = new Date();

    const newEvent: EventType = {
      id: Math.random().toString(36).substr(2, 9),
      time: timeStr, event: 'Sorbos detectados (USB Serial)',
      delta: `+${amount}ml`, positive: true, alert: false,
    };
    setEvents(prev => [newEvent, ...prev]);

    if (user) {
      const today = new Date().toISOString().split('T')[0];
      supabase.from('daily_hydration').update({ consumed_ml: newConsumed }).eq('user_id', user.id).eq('date', today).then();
      supabase.from('hydration_events').insert({
        user_id: user.id, time_str: timeStr, event_name: 'Sorbos detectados (USB Serial)', amount_ml: amount,
      }).then();
    }
  };

  return (
    <HydrationContext.Provider value={{
      consumed, dailyGoal, setDailyGoal, events, alerts, addEvent, addAlert, resolveAlert, clearHistory,
      toasts, showToast, dismissToast,
      settings, saveSettings,
      isConnected, connectESP, disconnectESP, portError,
      linkedDeviceMac, linkDevice, unlinkDevice,
    }}>
      {children}
    </HydrationContext.Provider>
  );
}

export function useHydration() {
  const context = useContext(HydrationContext);
  if (!context) throw new Error('useHydration must be used within a HydrationProvider');
  return context;
}
