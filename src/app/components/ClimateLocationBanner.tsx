import { useState, useEffect } from 'react';
import { CloudSun, X, Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from './ui/button';
import { useAuth } from '../context/AuthContext';
import { requestExactLocationAndLog } from '../../lib/useVisitorLog';

export function ClimateLocationBanner() {
  const { user } = useAuth();
  const [isVisible, setIsVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [successInfo, setSuccessInfo] = useState<{ city?: string; temp?: number | null } | null>(null);

  useEffect(() => {
    // Si ya tomó una decisión en este navegador, no volver a mostrar
    const alreadyPrompted = localStorage.getItem('drinkwise_climate_prompted');
    if (!alreadyPrompted) {
      // Retardo de 1.2 segundos para aparecer de forma sutil tras cargar
      const timer = setTimeout(() => setIsVisible(true), 1200);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = async () => {
    setLoading(true);
    localStorage.setItem('drinkwise_climate_prompted', 'true');

    const result = await requestExactLocationAndLog(user?.id ?? null);
    setLoading(false);

    if (result.success) {
      setSuccessInfo({
        city: result.city,
        temp: result.temperature,
      });
      // Cerrar tras 2.8 segundos de confirmación visual
      setTimeout(() => {
        setIsVisible(false);
      }, 2800);
    } else {
      // Si denegó o hubo error, cerramos de inmediato sin molestar
      setIsVisible(false);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem('drinkwise_climate_prompted', 'true');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 max-w-sm w-[calc(100%-2.5rem)] sm:w-96 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="bg-white rounded-2xl shadow-xl border border-blue-100 p-4 relative overflow-hidden backdrop-blur-md bg-white/95">
        
        {/* Botón discreto de cerrar */}
        {!loading && (
          <button
            onClick={handleDismiss}
            className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
            aria-label="Cerrar"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {successInfo ? (
          /* Estado de éxito verosímil y positivo */
          <div className="flex items-center gap-3 py-1 text-left">
            <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">
                {successInfo.city ? `Clima en ${successInfo.city}` : 'Clima local detectado'}
                {typeof successInfo.temp === 'number' ? ` (${successInfo.temp}°C)` : ''}
              </p>
              <p className="text-xs text-emerald-700">
                ¡Meta de hidratación ajustada con éxito!
              </p>
            </div>
          </div>
        ) : (
          /* Opción C: Casual y creíble */
          <div>
            <div className="flex items-start gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-500 to-sky-400 text-white flex items-center justify-center shrink-0 shadow-sm shadow-blue-200 mt-0.5">
                <CloudSun className="w-5 h-5" />
              </div>
              <div className="pr-6">
                <h4 className="text-sm font-semibold text-gray-900">Clima Local</h4>
                <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">
                  ¿Quieres que ajustemos tu meta diaria de agua según el clima donde estás?
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-1 border-t border-gray-100">
              <button
                type="button"
                onClick={handleDismiss}
                disabled={loading}
                className="text-xs text-gray-500 hover:text-gray-700 px-3 py-1.5 font-medium transition-colors"
              >
                Ahora no
              </button>

              <Button
                type="button"
                onClick={handleAccept}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-8 px-3.5 rounded-lg shadow-sm font-medium flex items-center gap-1.5"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Checando clima...
                  </>
                ) : (
                  <>
                    <CloudSun className="w-3.5 h-3.5" />
                    Sí, checar clima
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

