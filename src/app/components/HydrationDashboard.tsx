import { useState } from 'react';
import { Share2, Bell, AlertCircle, Coffee, History, Activity, Wifi, Plug, Unplug, Link as LinkIcon, Unlink } from 'lucide-react';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { useHydration } from '../context/HydrationContext';

export function HydrationDashboard() {
  const {
    consumed, dailyGoal, events, alerts,
    isConnected, connectESP, disconnectESP, portError,
    linkedDeviceMac, linkDevice, unlinkDevice
  } = useHydration();

  const [macInput, setMacInput] = useState('');

  const percentage = Math.min(100, Math.round((consumed / dailyGoal) * 100));
  const activeAlerts = alerts.filter(a => !a.resolved);

  return (
    <div className="flex-1 bg-gray-50 p-8 overflow-auto">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <h1 className="text-3xl">Panel de Hidratación</h1>

          {/* Connection Panels Container */}
          <div className="flex gap-4">
            {/* Wi-Fi / Hybrid Hardware Connection Panel */}
            <div className="flex flex-col bg-white p-4 rounded-lg border border-purple-200 shadow-sm w-[300px]">
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs text-purple-600 font-semibold uppercase tracking-wider">Modo Wi-Fi (Nube)</span>
                {linkedDeviceMac && (
                  <span className="flex h-3 w-3 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-purple-500"></span>
                  </span>
                )}
              </div>

              {!linkedDeviceMac ? (
                <div className="flex flex-col gap-2">
                  <p className="text-xs text-gray-500 mb-1">Ingresa la MAC de la pantalla OLED.</p>
                  <input 
                    type="text" 
                    placeholder="Ej: 1A:2B:3C:4D:5E:6F"
                    className="w-full text-sm border border-gray-300 rounded px-2 py-1.5 focus:ring-purple-500 focus:border-purple-500 outline-none"
                    value={macInput}
                    onChange={(e) => setMacInput(e.target.value.toUpperCase())}
                  />
                  <Button 
                    onClick={() => { if(macInput.length >= 10) linkDevice(macInput); }} 
                    disabled={macInput.length < 10}
                    className="bg-purple-600 hover:bg-purple-700 text-white border-0 h-8 mt-1 w-full"
                  >
                    <LinkIcon className="w-3 h-3 mr-2" /> Vincular Dispositivo
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <div className="bg-purple-50 p-2 rounded border border-purple-100 flex flex-col items-center h-[54px] justify-center">
                    <div className="flex items-center gap-2">
                      <Wifi className="w-4 h-4 text-purple-600" />
                      <span className="text-sm text-purple-800 font-mono font-medium">{linkedDeviceMac}</span>
                    </div>
                  </div>
                  <Button variant="outline" onClick={unlinkDevice} className="text-red-600 border-red-200 hover:bg-red-50 h-8 text-xs w-full">
                    <Unlink className="w-3 h-3 mr-2" /> Desvincular
                  </Button>
                </div>
              )}
            </div>

            {/* USB Local Hardware Connection Panel */}
            <div className="flex flex-col bg-white p-4 rounded-lg border border-blue-200 shadow-sm w-[300px]">
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs text-blue-600 font-semibold uppercase tracking-wider">Modo Local (USB)</span>
                <span className={`text-xs font-mono px-2 py-1 rounded font-medium ${isConnected ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                  {isConnected ? 'Conectado' : 'Desconectado'}
                </span>
              </div>

              {portError && (
                <div className="mb-2 text-xs text-red-600 bg-red-50 p-2 rounded">
                  {portError}
                </div>
              )}

              {!isConnected ? (
                <div className="flex flex-col gap-2 h-full justify-end">
                  <p className="text-xs text-gray-500 mb-1">Conecta el ESP32 para sincronizar vía cable.</p>
                  <Button onClick={connectESP} className="bg-blue-600 hover:bg-blue-700 text-white border-0 h-8 w-full mt-1">
                    <Plug className="w-3 h-3 mr-2" /> Conectar ESP32
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col gap-3 h-full justify-end">
                  <div className="flex items-center justify-center bg-green-50 p-2 rounded border border-green-100 h-[54px]">
                    <span className="text-sm text-green-700 font-medium text-center flex items-center"><Plug className="w-4 h-4 mr-2" /> Sync USB Activo</span>
                  </div>
                  <Button variant="outline" onClick={disconnectESP} className="text-red-600 border-red-200 hover:bg-red-50 h-8 text-xs w-full">
                    <Unplug className="w-3 h-3 mr-2" /> Desconectar
                  </Button>
                </div>
              )}
            </div>
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
              <div className="text-sm text-gray-600">(Sincronizado con progreso web)</div>
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
                  Barra de progreso
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
              Ver: historial completo
            </button>
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-8 pt-6 border-t border-gray-300 text-center text-xs text-gray-600 space-y-2">
          <div className="flex justify-center gap-8">
            <div className="flex flex-col items-center">
              <Coffee className="w-5 h-5 mb-1 text-blue-500" />
              <div>USB: {isConnected ? 'Online' : 'Offline'}</div>
            </div>
            <div className="flex flex-col items-center">
              <Wifi className="w-5 h-5 mb-1 text-purple-500" />
              <div>Wi-Fi: {linkedDeviceMac ? 'Vinculado' : 'No vinculado'}</div>
            </div>
            <div className="flex flex-col items-center">
              <AlertCircle className="w-5 h-5 mb-1 text-green-500" />
              <div>Supabase Realtime OK</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}