import { Stack, useRouter, useSegments } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ApiError, api } from '../lib/api';
import { AuthContext, type AuthState } from '../lib/auth';
import { clearTokens, loadTokens } from '../lib/tokens';
import type { User } from '../lib/types';

export default function RootLayout() {
  const [status, setStatus] = useState<AuthState['status']>('loading');
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();
  const segments = useSegments();

  const refresh = useCallback(async (): Promise<void> => {
    const tokens = await loadTokens();
    if (!tokens) {
      setUser(null);
      setStatus('signed-out');
      return;
    }
    try {
      const me = await api.me();
      setUser(me);
      setStatus('signed-in');
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        await clearTokens();
        setUser(null);
        setStatus('signed-out');
        return;
      }
      // Network or server error — keep whatever session we had; surface via screens.
      setStatus((s) => (s === 'loading' ? 'signed-out' : s));
    }
  }, []);

  const signOut = useCallback(async (): Promise<void> => {
    await api.logout();
    setUser(null);
    setStatus('signed-out');
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  // Redirect based on auth state + which group the user is currently in.
  useEffect(() => {
    if (status === 'loading') return;
    const inAuthGroup = segments[0] === '(auth)';
    if (status === 'signed-out' && !inAuthGroup) router.replace('/(auth)/login');
    if (status === 'signed-in' && inAuthGroup) router.replace('/(tabs)');
  }, [status, segments, router]);

  const value = useMemo<AuthState>(
    () => ({ status, user, refresh, signOut }),
    [status, user, refresh, signOut],
  );

  return (
    <AuthContext.Provider value={value}>
      <Stack screenOptions={{ headerShown: false }} />
    </AuthContext.Provider>
  );
}
