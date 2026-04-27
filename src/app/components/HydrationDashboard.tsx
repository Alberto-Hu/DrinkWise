import { Share2, Bell, AlertCircle, Coffee, History, Activity, Droplets } from 'lucide-react';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { useHydration } from '../context/HydrationContext';

export function HydrationDashboard() {
  const {
    consumed, dailyGoal, events, addAlert, currentWeight, isGlassLifted, alerts,
    simulateLift, simulateDrink, simulateRefill, simulatePlace, virtualAirWeight
  } = useHydration();

  const percentage = Math.min(100, Math.round((consumed / dailyGoal) * 100));
  const activeAlerts = alerts.filter(a => !a.resolved);

  return (
    <div className="flex-1 bg-gray-50 p-8 overflow-auto">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl">Panel de Hidratación</h1>

          {/* Interactive Hardware Simulator */}
          <div className="flex flex-col bg-white p-4 rounded-lg border border-blue-200 shadow-sm w-full max-w-lg">
            <div className="flex justify-between items-center mb-4">
              <span className="text-xs text-blue-600 font-semibold uppercase tracking-wider">Simulador Interactivo (Celda de Carga)</span>
              <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded font-medium">
                Lectura sensor: {currentWeight}g
              </span>
            </div>

            {!isGlassLifted ? (
              <div className="flex items-center justify-between gap-4 bg-gray-50 p-3 rounded border border-gray-100">
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <Coffee className="w-4 h-4 text-gray-500" />
                  Vaso en el posavasos
                </div>
                <Button onClick={simulateLift} className="bg-blue-600 hover:bg-blue-700 text-white border-0 h-9">
                  <Activity className="w-4 h-4 mr-2" /> Levantar Vaso
                </Button>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <div className="flex justify-between items-center bg-blue-50 text-blue-800 px-3 py-2 rounded border border-blue-100">
                  <span className="text-sm font-medium flex items-center gap-2">
                    <Activity className="w-4 h-4" /> ¡Vaso en el aire! (0g en base)
                  </span>
                  <span className="text-xs font-mono">Peso del vaso: {virtualAirWeight}g</span>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => simulateDrink(50)} className="flex-1 text-xs h-9 hover:bg-blue-50">
                    Tomar 50ml (-50g)
                  </Button>
                  <Button variant="outline" onClick={() => simulateRefill(250)} className="flex-1 text-xs h-9 hover:bg-blue-50">
                    <Droplets className="w-4 h-4 mr-1" /> Rellenar (+250g)
                  </Button>
                  <Button onClick={simulatePlace} className="flex-1 bg-green-600 hover:bg-green-700 text-white text-xs h-9 border-0">
                    Volver a asentar
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          {/* Left Column - Progress Circle */}
          <div className="flex flex-col items-center justify-center bg-white rounded-lg border border-gray-200 p-8">
            <div className="relative w-64 h-64 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="128"
                  cy="128"
                  r="100"
                  stroke="#e5e7eb"
                  strokeWidth="8"
                  fill="none"
                />
                <circle
                  cx="128"
                  cy="128"
                  r="100"
                  stroke="#1f2937"
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 100 * (percentage / 100)} ${2 * Math.PI * 100 * (1 - (percentage / 100))
                    }`}
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-out"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="text-5xl font-light">{percentage}%</div>
                <div className="text-sm text-gray-600 mt-2">Meta Diaria Lograda</div>
              </div>
            </div>

            <div className="mt-8 text-center">
              <div className="font-semibold">Aro LED WS2812B</div>
              <div className="text-sm text-gray-600">(Visualización de progreso físico)</div>
            </div>
          </div>

          {/* Right Column - Status & Alerts */}
          <div className="space-y-6">
            {/* Consumption Status */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Coffee className="w-5 h-5" />
                <h2 className="text-lg font-semibold">Estado de Consumo</h2>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>Agua hoy: {consumed}ml / {dailyGoal}ml</span>
                  <span className="text-gray-500">Faltan {Math.max(0, dailyGoal - consumed)}ml</span>
                </div>
                <Progress value={percentage} className="h-2 transition-all duration-1000" />
                <div className="text-xs text-gray-500">
                  Barra de progreso semanal
                </div>
              </div>
            </div>

            {/* Inactivity Alerts */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-4 text-red-600">
                <AlertCircle className="w-5 h-5" />
                <h2 className="text-lg font-semibold">Alertas Activas</h2>
              </div>
              {activeAlerts.length === 0 ? (
                <div className="text-sm text-gray-500 italic">No hay alertas pendientes.</div>
              ) : (
                <div className="space-y-3">
                  {activeAlerts.map(alert => (
                    <div key={alert.id} className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <Bell className="w-5 h-5 mt-0.5 text-red-600" />
                        <div className="flex-1">
                          <div className="font-medium text-red-900">
                            {alert.type}
                          </div>
                          <div className="text-sm text-red-700 mt-1">
                            {alert.message} ({alert.time})
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Events History */}
        <div className="mt-6 bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <History className="w-5 h-5" />
            <h2 className="text-lg font-semibold">Historial de Eventos</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-200">
                <tr>
                  <th className="text-left py-3 px-4 font-medium text-sm">Hora</th>
                  <th className="text-left py-3 px-4 font-medium text-sm">Evento</th>
                  <th className="text-right py-3 px-4 font-medium text-sm">Delta ml</th>
                </tr>
              </thead>
              <tbody>
                {events.map((event, index) => (
                  <tr
                    key={index}
                    className={`border-b border-gray-100 ${event.alert ? 'bg-red-50' : ''
                      }`}
                  >
                    <td className="py-3 px-4 text-sm">{event.time}</td>
                    <td className="py-3 px-4 text-sm">
                      {event.alert && (
                        <span className="mr-2">⚠️</span>
                      )}
                      {event.event}
                    </td>
                    <td
                      className={`py-3 px-4 text-sm text-right ${event.positive
                          ? 'text-green-600 font-medium'
                          : event.alert
                            ? 'text-gray-400'
                            : ''
                        }`}
                    >
                      {event.delta}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 text-center">
            <button className="text-sm text-gray-600 hover:text-gray-900 underline">
              Ver: historial completo (.JSON / .CSV)
            </button>
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-8 pt-6 border-t border-gray-300 text-center text-xs text-gray-600 space-y-2">
          <div className="flex justify-center gap-8">
            <div className="flex flex-col items-center">
              <Coffee className="w-5 h-5 mb-1" />
              <div>ESP32 conectado vía USB</div>
            </div>
            <div className="flex flex-col items-center">
              <AlertCircle className="w-5 h-5 mb-1" />
              <div>Local RF Sync OK</div>
            </div>
            <div className="flex flex-col items-center">
              <Share2 className="w-5 h-5 mb-1" />
              <div>MQTT Offline</div>
            </div>
          </div>
          <div className="italic mt-4">
            Esta es un prototipo de App. Realidad fue 257 peticiones en los últimos del usuario, y centro del sistema 173MB Model: PytPY3
          </div>
        </div>
      </div>
    </div>
  );
}