import { Link, useLocation } from 'react-router';
import { LayoutGrid, Bell, History, Settings, Coffee, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useHydration } from '../context/HydrationContext';

export function Sidebar() {
  const location = useLocation();
  const { signOut } = useAuth();
  const { isConnected, linkedDeviceMac } = useHydration();

  const navItems = [
    { path: '/', label: 'Panel de Hidratación', icon: LayoutGrid },
    { path: '/alertas', label: 'Alertas', icon: Bell },
    { path: '/historial', label: 'Historial', icon: History },
    { path: '/configuracion', label: 'Configuración', icon: Settings },
  ];

  return (
    <aside className="w-48 border-r border-gray-200 bg-white flex flex-col h-screen">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <Coffee className="w-6 h-6" />
          <span className="font-semibold text-lg">DrinkWise</span>
        </div>
      </div>

      <nav className="flex-1 p-4 flex flex-col justify-between">
        <ul className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-gray-900 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>

        <button
          onClick={signOut}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors w-full text-left mt-auto"
        >
          <LogOut className="w-4 h-4" />
          <span className="text-sm">Cerrar Sesión</span>
        </button>
      </nav>

      <div className="p-4 border-t border-gray-200 text-xs text-gray-600 space-y-1">
        <div>Versión: 0.1.0 beta</div>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : linkedDeviceMac ? 'bg-blue-500' : 'bg-gray-400'}`}></div>
          <span>{isConnected ? 'USB Conectado' : linkedDeviceMac ? 'Wi-Fi Vinculado' : 'Desconectado'}</span>
        </div>
      </div>
    </aside>
  );
}
