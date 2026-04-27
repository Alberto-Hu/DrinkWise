import { Settings, Save, Bell, Droplets, Wifi } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Switch } from '../components/ui/switch';
import { useHydration } from '../context/HydrationContext';

export function SettingsPage() {
  const { dailyGoal, setDailyGoal, clearHistory } = useHydration();
  
  return (
    <div className="flex-1 bg-gray-50 p-8 overflow-auto">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl">Configuración</h1>
          <Button className="bg-gray-900 hover:bg-gray-800">
            <Save className="w-4 h-4 mr-2" />
            Guardar Cambios
          </Button>
        </div>

        <div className="space-y-6">
          {/* Hydration Goals */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-6">
              <Droplets className="w-5 h-5" />
              <h2 className="text-xl font-semibold">Metas de Hidratación</h2>
            </div>
            <div className="space-y-4">
              <div>
                <Label htmlFor="daily-goal">Meta diaria (ml)</Label>
                <Input
                  id="daily-goal"
                  type="number"
                  value={dailyGoal}
                  onChange={(e) => setDailyGoal(Number(e.target.value))}
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="reminder-interval">
                  Intervalo de recordatorios (minutos)
                </Label>
                <Input
                  id="reminder-interval"
                  type="number"
                  defaultValue="60"
                  className="mt-2"
                />
              </div>
            </div>
          </div>

          {/* Notifications */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-6">
              <Bell className="w-5 h-5" />
              <h2 className="text-xl font-semibold">Notificaciones</h2>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Alertas de inactividad</div>
                  <div className="text-sm text-gray-600">
                    Recibir alertas cuando no bebes agua por mucho tiempo
                  </div>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Recordatorios programados</div>
                  <div className="text-sm text-gray-600">
                    Recordatorios automáticos cada hora
                  </div>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Resumen diario</div>
                  <div className="text-sm text-gray-600">
                    Recibir un resumen de tu consumo al final del día
                  </div>
                </div>
                <Switch />
              </div>
            </div>
          </div>

          {/* Device Configuration */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-6">
              <Wifi className="w-5 h-5" />
              <h2 className="text-xl font-semibold">Dispositivo</h2>
            </div>
            <div className="space-y-4">
              <div>
                <Label htmlFor="device-name">Nombre del dispositivo</Label>
                <Input
                  id="device-name"
                  type="text"
                  defaultValue="Aro LED WS2812B"
                  className="mt-2"
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Indicador LED físico</div>
                  <div className="text-sm text-gray-600">
                    Mostrar progreso en el aro LED
                  </div>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="pt-4 border-t border-gray-200">
                <div className="text-sm text-gray-600 space-y-1">
                  <div>Estado: ESP32 conectado vía USB</div>
                  <div>Firmware: v0.1.0 beta</div>
                  <div>Última sincronización: Hace 2 minutos</div>
                </div>
              </div>
            </div>
          </div>

          {/* Data Management */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-6">
              <Settings className="w-5 h-5" />
              <h2 className="text-xl font-semibold">Datos</h2>
            </div>
            <div className="space-y-3">
              <Button variant="outline" className="w-full justify-start">
                Exportar todos los datos
              </Button>
              <Button variant="outline" className="w-full justify-start">
                Importar configuración
              </Button>
              <Button
                variant="outline"
                onClick={clearHistory}
                className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                Borrar historial
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
