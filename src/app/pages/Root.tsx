import { Outlet } from 'react-router';
import { Sidebar } from '../components/Sidebar';
import { HydrationProvider } from '../context/HydrationContext';

export function Root() {
  return (
    <HydrationProvider>
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <Outlet />
      </div>
    </HydrationProvider>
  );
}
