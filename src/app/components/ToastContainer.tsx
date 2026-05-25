import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, Info, X } from 'lucide-react';
import { useHydration, ToastType } from '../context/HydrationContext';

function Toast({ toast, onDismiss }: { toast: ToastType; onDismiss: () => void }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Trigger enter animation
    requestAnimationFrame(() => setVisible(true));
  }, []);

  const icons = {
    success: <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />,
    error: <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />,
    info: <Info className="w-5 h-5 text-blue-500 flex-shrink-0" />,
  };

  const borders = {
    success: 'border-l-4 border-green-500',
    error: 'border-l-4 border-red-500',
    info: 'border-l-4 border-blue-500',
  };

  return (
    <div
      className={`flex items-center gap-3 bg-white rounded-lg shadow-lg px-4 py-3 min-w-[280px] max-w-[380px] ${borders[toast.type]} transition-all duration-300 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
    >
      {icons[toast.type]}
      <p className="text-sm font-medium text-gray-800 flex-1">{toast.message}</p>
      <button
        onClick={onDismiss}
        className="text-gray-400 hover:text-gray-600 flex-shrink-0 ml-1"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

export function ToastContainer() {
  const { toasts, dismissToast } = useHydration();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 items-end">
      {toasts.map(t => (
        <Toast key={t.id} toast={t} onDismiss={() => dismissToast(t.id)} />
      ))}
    </div>
  );
}
