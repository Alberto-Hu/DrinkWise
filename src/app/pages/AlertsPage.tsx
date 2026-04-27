import { Bell, AlertCircle, Clock, CheckCircle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { useHydration } from '../context/HydrationContext';

export function AlertsPage() {
  const { alerts, resolveAlert } = useHydration();

  return (
    <div className="flex-1 bg-gray-50 p-8 overflow-auto">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl">Alertas</h1>
          <Button variant="outline">
            <Bell className="w-4 h-4 mr-2" />
            Configurar Alertas
          </Button>
        </div>

        <div className="space-y-4">
          {alerts.length === 0 ? (
            <div className="text-center text-gray-500 py-10 bg-white rounded-lg border">
              No tienes alertas en este momento.
            </div>
          ) : (
            alerts.map((alert) => (
              <div
                key={alert.id}
                className={`bg-white rounded-lg border p-6 ${
                  !alert.resolved
                    ? 'border-red-300 bg-red-50'
                    : 'border-gray-200 opacity-60'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`p-3 rounded-full ${
                      alert.resolved
                        ? 'bg-gray-100 text-gray-500'
                        : alert.severity === 'high'
                        ? 'bg-red-100 text-red-600'
                        : alert.severity === 'medium'
                        ? 'bg-yellow-100 text-yellow-600'
                        : 'bg-blue-100 text-blue-600'
                    }`}
                  >
                    {alert.resolved ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className={`font-semibold text-lg ${alert.resolved ? 'line-through text-gray-500' : ''}`}>{alert.type}</h3>
                      {!alert.resolved && (
                        <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full font-medium">
                          Activa
                        </span>
                      )}
                    </div>
                    <p className="text-gray-700 mb-3">{alert.message}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {alert.time} - {alert.date}
                      </div>
                    </div>
                  </div>
                  {!alert.resolved && (
                    <Button variant="outline" size="sm" onClick={() => resolveAlert(alert.id)}>
                      Marcar como resuelta
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
