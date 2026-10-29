import { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabase';
import { logVisit } from '../../lib/useVisitorLog';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  signOut: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  signOut: async () => {},
  loading: true,
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Track whether we've already logged the initial page view
  const pageViewLogged = useRef(false);
  // Track the previous auth event to detect login vs. session restore
  const prevEvent = useRef<string | null>(null);

  useEffect(() => {
    // Check active session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      // Log anonymous page view once on first load
      if (!pageViewLogged.current) {
        pageViewLogged.current = true;
        const page = window.location.pathname;
        logVisit(page, session?.user?.id ?? null, 'page_view');
      }
    });

    // Listen for auth state changes (login, register, logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      // Log login and registration events (skip INITIAL_SESSION — ya se logueó arriba)
      if (event === 'SIGNED_IN' && prevEvent.current !== 'SIGNED_IN') {
        const page = window.location.pathname;
        // Supabase doesn't tell us explicitly if it's a "register" vs "login",
        // but we can infer: if the user was just created (no previous session), it's register.
        // A reliable heuristic: check created_at vs last_sign_in_at.
        const u = session?.user;
        if (u) {
          const createdAt = new Date(u.created_at).getTime();
          const lastSignIn = new Date(u.last_sign_in_at ?? u.created_at).getTime();
          const isNewUser = Math.abs(createdAt - lastSignIn) < 5000; // within 5 seconds → new registration
          logVisit(page, u.id, isNewUser ? 'register' : 'login');
        }
      }

      prevEvent.current = event;
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ session, user, signOut, loading }}>
      {children}
    </AuthContext.Provider>
  );
}
