import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { api } from '@/services/api';
import { session } from '@/services/session';
import type { AuthUser } from '@/types/vitalpilot';

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};
const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        if (await session.get()) {
          const restored = await api.me();
          if (active) setUser(restored);
        }
      } catch {
        // Require sign-in if the stored session cannot be validated.
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  async function signIn(email: string, password: string) {
    const result = await api.signIn(email, password);
    if (!result.access_token) throw new Error('The server did not return a login token.');
    await session.set(result.access_token);
    setUser(result.user);
  }

  async function signOut() {
    // Logout must work even if the server is unreachable.
    try { await api.logout(); } catch { /* Clear the local session below. */ }
    await session.clear();
    setUser(null);
  }

  return <AuthContext.Provider value={{ user, loading, signIn, signOut }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider');
  return value;
}
