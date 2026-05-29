import { useState, useEffect } from 'react';
import { Settings, Save, Bell, Droplets, Wifi, Lightbulb, Trash2, AlertTriangle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Switch } from '../components/ui/switch';
import { useHydration } from '../context/HydrationContext';

export function SettingsPage() {
  const { dailyGoal, setDailyGoal, clearHistory, settings, saveSettings, showToast, isConnected, linkedDeviceMac } = useHydration();

  // Local copy of settings for editing
  const [localSettings, setLocalSettings] = useState(settings);
  const [localGoal, setLocalGoal] = useState(dailyGoal);
  const [confirmClear, setConfirmClear] = useState(false);
  const [saving, setSaving] = useState(false);

  // Keep local state synced when context loads
  useEffect(() => { setLocalSettings(settings); }, [settings]);
  useEffect(() => { setLocalGoal(dailyGoal); }, [dailyGoal]);

  const handleSave = async () => {
    setSaving(true);
    setDailyGoal(localGoal);
    await saveSettings(localSettings);
    setSaving(false);
  };

  const handleClearHistory = async () => {
    if (!confirmClear) {
      setConfirmClear(true);
      setTimeout(() => setConfirmClear(false), 4000);
      return;
    }
    await clearHistory();
    setConfirmClear(false);
  };

  return (
    <div className="flex-1 bg-gray-50 p-8 overflow-auto">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl">Configuración</h1>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-gray-900 hover:bg-gray-800 text-white"
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </div>

        <div className="space-y-6">
          {/* Metas de Hidratación */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-6">
              <Droplets className="w-5 h-5 text-blue-500" />
              <h2 className="text-xl font-semibold">Metas de Hidratación</h2>
            </div>
            <div className="space-y-4">
              <div>
                <Label htmlFor="daily-goal">Meta diaria (ml)</Label>
                <Input
                  id="daily-goal"
                  type="number"
                  value={localGoal}
                  min={500}
                  max={5000}
                  step={100}
                  onChange={e => setLocalGoal(Number(e.target.value))}
                  className="mt-2 max-w-xs"
                />
                <p className="text-xs text-gray-500 mt-1">Recomendado: entre 1500 y 3000 ml por día.</p>
              </div>
              <div>
                <Label htmlFor="reminder-interval">Intervalo de alerta de inactividad (minutos)</Label>
                <Input
                  id="reminder-interval"
                  type="number"
                  min={15}
                  max={480}
                  value={localSettings.reminder_interval_min}
                  onChange={e => setLocalSettings(s => ({ ...s, reminder_interval_min: Number(e.target.value) }))}
                  className="mt-2 max-w-xs"
                />
                <p className="text-xs text-gray-500 mt-1">Si pasan X minutos sin beber agua, recibirás una alerta.</p>
              </div>
            </div>
          </div>

          {/* Notificaciones */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-6">
              <Bell className="w-5 h-5 text-yellow-500" />
              <h2 className="text-xl font-semibold">Notificaciones</h2>
            </div>
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Alertas de inactividad</div>
                  <div className="text-sm text-gray-500">Recibir alertas cuando no bebes agua por mucho tiempo</div>
                </div>
                <Switch
                  checked={localSettings.alerts_enabled}
                  onCheckedChange={v => setLocalSettings(s => ({ ...s, alerts_enabled: v }))}
                />
              </div>
            </div>
          </div>

          {/* Dispositivo */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-6">
              <Wifi className="w-5 h-5 text-purple-500" />
              <h2 className="text-xl font-semibold">Dispositivo</h2>
            </div>
            <div className="space-y-5">
              <div>
                <Label htmlFor="device-name">Nombre del dispositivo</Label>
                <Input
                  id="device-name"
                  type="text"
                  value={localSettings.device_name}
                  onChange={e => setLocalSettings(s => ({ ...s, device_name: e.target.value }))}
                  className="mt-2"
                  placeholder="Mi Posavasos DrinkWise"
                />
                <p className="text-xs text-gray-500 mt-1">Este nombre se muestra en tu panel de control.</p>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-yellow-400" />
                    Indicador LED físico (Aro WS2812B)
                  </div>
                  <div className="text-sm text-gray-500">
                    {localSettings.led_enabled
                      ? 'El aro LED muestra tu progreso de hidratación en tiempo real'
                      : 'El aro LED está apagado — ahorra energía'}
                  </div>
                </div>
                <Switch
                  checked={localSettings.led_enabled}
                  onCheckedChange={v => setLocalSettings(s => ({ ...s, led_enabled: v }))}
                />
              </div>
              <div className="pt-4 border-t border-gray-200">
                <div className="text-sm text-gray-600 space-y-1">
                  <div>Estado: <span className="font-medium text-gray-900">{isConnected ? '🟢 Conectado vía USB' : linkedDeviceMac ? '🔵 Vinculado vía Wi-Fi' : '⚪ Desconectado'}</span></div>
                </div>
              </div>
            </div>
          </div>

          {/* Datos */}
          <div className="bg-white rounded-lg border border-red-100 p-6">
            <div className="flex items-center gap-2 mb-6">
              <Settings className="w-5 h-5 text-red-500" />
              <h2 className="text-xl font-semibold">Administrar datos</h2>
            </div>
            <div className="space-y-3">
              <p className="text-sm text-gray-500">Esta acción no puede deshacerse.</p>
              <Button
                variant="outline"
                onClick={handleClearHistory}
                className={`w-full justify-start transition-colors ${
                  confirmClear
                    ? 'bg-red-600 text-white border-red-600 hover:bg-red-700'
                    : 'text-red-600 hover:text-red-700 hover:bg-red-50'
                }`}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                {confirmClear ? '⚠️ Haz clic de nuevo para confirmar' : 'Borrar todo el historial'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
