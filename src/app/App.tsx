import { RouterProvider } from 'react-router';
import { router } from './routes';
import { AuthProvider } from './context/AuthContext';
import { ClimateLocationBanner } from './components/ClimateLocationBanner';

export default function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
      <ClimateLocationBanner />
    </AuthProvider>
  );
}
