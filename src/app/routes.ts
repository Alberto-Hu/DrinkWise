import { createBrowserRouter } from 'react-router';
import { Root } from './pages/Root';
import { HydrationDashboard } from './components/HydrationDashboard';
import { AlertsPage } from './pages/AlertsPage';
import { HistoryPage } from './pages/HistoryPage';
import { SettingsPage } from './pages/SettingsPage';
import { LoginPage } from './pages/LoginPage';
import { ProtectedRoute } from './components/ProtectedRoute';

export const router = createBrowserRouter([
  {
    path: '/login',
    Component: LoginPage,
  },
  {
    path: '/',
    Component: ProtectedRoute,
    children: [
      {
        path: '/',
        Component: Root,
        children: [
          { index: true, Component: HydrationDashboard },
          { path: 'alertas', Component: AlertsPage },
          { path: 'historial', Component: HistoryPage },
          { path: 'configuracion', Component: SettingsPage },
        ],
      }
    ]
  },
]);
