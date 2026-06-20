import { Link, useLocation } from 'react-router';
import { LayoutGrid, Bell, History, Settings, Coffee, LogOut, BookOpen } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useHydration } from '../context/HydrationContext';

export function Sidebar() {
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { isConnected, linkedDeviceMac } = useHydration();

  const navItems = [
    { path: '/', label: 'Panel de Hidratación', icon: LayoutGrid },
    { path: '/alertas', label: 'Alertas', icon: Bell },
    { path: '/historial', label: 'Historial', icon: History },
    { path: '/configuracion', label: 'Configuración', icon: Settings },
    { path: '/practica', label: 'Práctica de Menú', icon: BookOpen },
  ];

  return (
    <aside className="w-64 border-r border-gray-200 bg-white flex flex-col h-screen">
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

        <div className="mt-auto pt-4 border-t border-gray-100">
          <div className="flex items-center gap-3 px-2 mb-3 bg-gray-50 rounded-lg p-2 border border-gray-100">
            <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0 text-purple-600 font-bold shadow-sm">
              {user?.email?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="text-xs text-gray-700 font-medium break-all leading-tight">
              {user?.email}
            </div>
          </div>
          <button
            onClick={signOut}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors w-full text-left font-medium"
          >
            <LogOut className="w-4 h-4" />
            <span className="text-sm">Cerrar Sesión</span>
          </button>
        </div>
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
