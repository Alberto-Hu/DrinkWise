import { useState } from 'react';
import { Bell, AlertCircle, Clock, CheckCircle, Trash2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { useHydration } from '../context/HydrationContext';

export function AlertsPage() {
  const { alerts, resolveAlert, addAlert } = useHydration();
  const [showResolved, setShowResolved] = useState(false);

  const visible = showResolved ? alerts : alerts.filter(a => !a.resolved);
  const unresolvedCount = alerts.filter(a => !a.resolved).length;

  return (
    <div className="flex-1 bg-gray-50 p-8 overflow-auto">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl">Alertas</h1>
            {unresolvedCount > 0 && (
              <p className="text-sm text-red-600 mt-1 font-medium">
                {unresolvedCount} alerta{unresolvedCount > 1 ? 's' : ''} activa{unresolvedCount > 1 ? 's' : ''}
              </p>
            )}
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setShowResolved(p => !p)}
              className="text-sm"
            >
              {showResolved ? 'Ocultar resueltas' : 'Mostrar resueltas'}
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          {visible.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-lg border border-gray-200">
              <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">¡Sin alertas activas!</p>
              <p className="text-gray-400 text-sm mt-1">
                {showResolved ? 'No hay alertas registradas.' : 'Estás hidratado correctamente.'}
              </p>
            </div>
          ) : (
            visible.map((alert) => (
              <div
                key={alert.id}
                className={`bg-white rounded-lg border p-6 transition-all ${
                  !alert.resolved
                    ? alert.severity === 'high'
                      ? 'border-red-300 bg-red-50'
                      : alert.severity === 'medium'
                      ? 'border-yellow-300 bg-yellow-50'
                      : 'border-blue-200 bg-blue-50'
                    : 'border-gray-200 opacity-50'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`p-3 rounded-full flex-shrink-0 ${
                      alert.resolved
                        ? 'bg-gray-100 text-gray-400'
                        : alert.severity === 'high'
                        ? 'bg-red-100 text-red-600'
                        : alert.severity === 'medium'
                        ? 'bg-yellow-100 text-yellow-600'
                        : 'bg-blue-100 text-blue-600'
                    }`}
                  >
                    {alert.resolved ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1 flex-wrap">
                      <h3 className={`font-semibold text-lg ${alert.resolved ? 'line-through text-gray-400' : ''}`}>
                        {alert.type}
                      </h3>
                      {!alert.resolved && (
                        <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                          alert.severity === 'high' ? 'bg-red-100 text-red-700' :
                          alert.severity === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {alert.severity === 'high' ? 'Alta' : alert.severity === 'medium' ? 'Media' : 'Baja'}
                        </span>
                      )}
                    </div>
                    <p className={`mb-2 ${alert.resolved ? 'text-gray-400' : 'text-gray-700'}`}>{alert.message}</p>
                    <div className="flex items-center gap-1 text-sm text-gray-400">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{alert.time} · {alert.date}</span>
                    </div>
                  </div>
                  {!alert.resolved && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => resolveAlert(alert.id)}
                      className="flex-shrink-0"
                    >
                      <CheckCircle className="w-4 h-4 mr-1.5" />
                      Resolver
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
