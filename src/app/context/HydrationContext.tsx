import { createContext, useContext, useState, ReactNode } from 'react';

export type EventType = { id: string; time: string; event: string; delta: string; positive: boolean; alert: boolean };
export type AlertType = { id: number; time: string; date: string; type: string; message: string; severity: string; resolved: boolean };

interface HydrationContextType {
  consumed: number;
  dailyGoal: number;
  setDailyGoal: (g: number) => void;
  events: EventType[];
  alerts: AlertType[];
  addEvent: (eventName: string, mlAmount?: number, isAlert?: boolean) => void;
  addAlert: (type: string, message: string, severity: string) => void;
  resolveAlert: (id: number) => void;
  clearHistory: () => void;
  
  // Hardware simulator
  currentWeight: number;
  setCurrentWeight: (w: number) => void;
  isGlassLifted: boolean;
  emptyGlassWeight: number;
  setEmptyGlassWeight: (w: number) => void;
  
  // Interactive Simulator
  simulateLift: () => void;
  simulateDrink: (ml: number) => void;
  simulateRefill: (ml: number) => void;
  simulatePlace: () => void;
  virtualAirWeight: number;
}

const HydrationContext = createContext<HydrationContextType | undefined>(undefined);

export function HydrationProvider({ children }: { children: ReactNode }) {
  const [consumed, setConsumed] = useState(1300);
  const [dailyGoal, setDailyGoal] = useState(2000);
  
  // Simulator State
  const [currentWeight, setCurrentWeightState] = useState(450); // Default weight with water
  const [emptyGlassWeight, setEmptyGlassWeight] = useState(200); // Tare (weight of empty glass)
  const [lastStableWeight, setLastStableWeight] = useState(450);
  const [isGlassLifted, setIsGlassLifted] = useState(false);
  
  const [events, setEvents] = useState<EventType[]>([
    { id: '1', time: '09:45', event: 'Inicio de jornada', delta: '0', positive: false, alert: false },
    { id: '2', time: '10:42', event: 'Sorbos detectados', delta: '+250ml', positive: true, alert: false },
  ]);
  
  const [alerts, setAlerts] = useState<AlertType[]>([
    { id: 1, time: '12:56', date: new Date().toLocaleDateString('es-ES'), type: 'Inactividad prolongada', message: '60 minutos sin detectar consumo', severity: 'high', resolved: false },
  ]);

  const addEvent = (eventName: string, mlAmount: number = 0, isAlert = false, customDeltaText?: string) => {
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    if (mlAmount > 0) setConsumed(prev => prev + mlAmount);
    
    let finalDelta = mlAmount > 0 ? `+${mlAmount}ml` : (isAlert ? '--' : '0');
    if (customDeltaText) finalDelta = customDeltaText;

    const newEvent = {
      id: Math.random().toString(36).substr(2, 9),
      time: timeStr,
      event: eventName,
      delta: finalDelta,
      positive: mlAmount > 0,
      alert: isAlert
    };
    setEvents(prev => [newEvent, ...prev]);
  };

  const addAlert = (type: string, message: string, severity: string) => {
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const dateStr = now.toLocaleDateString('es-ES');
    
    setAlerts(prev => [{
      id: Date.now(),
      time: timeStr,
      date: dateStr,
      type,
      message,
      severity,
      resolved: false
    }, ...prev]);
  };

  const resolveAlert = (id: number) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, resolved: true } : a));
  };
  
  const clearHistory = () => {
    setEvents([]);
    setConsumed(0);
  };

  // State Machine based Simulator
  const liftGlass = () => {
    if (!isGlassLifted) {
      setIsGlassLifted(true);
      setCurrentWeightState(0);
      addEvent('Vaso levantado (0g)');
    }
  };

  const drinkWater = (ml: number) => {
    if (isGlassLifted) {
       // Reduce weight but don't log yet (we only log when it returns to the coaster)
       setLastStableWeight(prev => Math.max(emptyGlassWeight, prev - ml));
    }
  };

  const refillGlass = (ml: number) => {
    if (isGlassLifted) {
       // Increase weight
       setLastStableWeight(prev => prev + ml);
    }
  };

  const placeGlass = () => {
    if (isGlassLifted) {
      setIsGlassLifted(false);
      setCurrentWeightState(lastStableWeight);
      
      const previousWeight = currentWeight === 0 ? emptyGlassWeight : currentWeight; // if it was the first time, use default. Actually we need a real previous state.
      // Wait, the logic is: currentWeightState was 0. lastStableWeight holds the NEW virtual weight. We need the original weight.
    }
  };

  // Let's rewrite the logic correctly.
  const handleWeightChange = (newWeight: number) => {}; // legacy

  // We will keep lastStableWeight as the ACTUAL weight on the coaster when idle.
  // We will use a temporary variable for the weight while in the air.
  const [virtualAirWeight, setVirtualAirWeight] = useState(450);

  const simulateLift = () => {
    if (!isGlassLifted) {
      setIsGlassLifted(true);
      setVirtualAirWeight(lastStableWeight);
      setCurrentWeightState(0);
      addEvent('Vaso levantado (Celda: 0g)');
    }
  };

  const simulateDrink = (ml: number) => {
    if (isGlassLifted) {
      setVirtualAirWeight(prev => Math.max(emptyGlassWeight, prev - ml));
    }
  };

  const simulateRefill = (ml: number) => {
    if (isGlassLifted) {
      setVirtualAirWeight(prev => prev + ml);
    }
  };

  const simulatePlace = () => {
    if (isGlassLifted) {
      setIsGlassLifted(false);
      setCurrentWeightState(virtualAirWeight);
      
      const diff = lastStableWeight - virtualAirWeight;
      
      if (diff > 10) {
        // User drank
        addEvent('Sorbos detectados (hx711)', diff);
      } else if (diff < -10) {
        // User refilled
        const added = Math.abs(diff);
        addEvent('Vaso rellenado (Aumento de peso)', 0, false, `+${added}g (No bebido)`);
      } else {
         // Put back exactly the same
         addEvent('Vaso devuelto sin cambios', 0, false, '0');
      }
      
      setLastStableWeight(virtualAirWeight);
    }
  };

  return (
    <HydrationContext.Provider value={{
      consumed, dailyGoal, setDailyGoal, events, alerts, addEvent, addAlert, resolveAlert, clearHistory,
      currentWeight, isGlassLifted, emptyGlassWeight, setEmptyGlassWeight,
      simulateLift, simulateDrink, simulateRefill, simulatePlace, virtualAirWeight
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
