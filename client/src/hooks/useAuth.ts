import { useState, useEffect } from 'react';
import { trpc } from '../lib/trpc';
import { dashboardPathForRole } from '@shared/roles';

export interface User {
  id: number;
  email: string;
  name: string;
  role: string;
  jobTitle: string | null;
  dashboardPath: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
}

export function useAuth() {
  const [timedOut, setTimedOut] = useState(false);
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    isLoading: true,
  });

  // Get current session
  const { data: sessionData, isLoading, isError, refetch } = trpc.magicLink.getCurrentSession.useQuery(
    undefined,
    {
      retry: false,
      refetchOnWindowFocus: false,
    }
  );

  useEffect(() => {
    if (!isLoading) { setTimedOut(false); return; }
    const timer = window.setTimeout(() => setTimedOut(true), 10000);
    return () => window.clearTimeout(timer);
  }, [isLoading]);

  useEffect(() => {
    if (!isLoading && sessionData) {
      setAuthState({
        isAuthenticated: sessionData.authenticated,
        user: sessionData.user ? {
          id: sessionData.user.id,
          email: sessionData.user.email || '',
          name: sessionData.user.name || '',
          role: sessionData.user.role,
          jobTitle: sessionData.user.jobTitle ?? null,
          dashboardPath:
            sessionData.user.dashboardPath ||
            dashboardPathForRole(sessionData.user.role),
        } : null,
        isLoading: false,
      });
    } else if (!isLoading || isError || timedOut) {
      setAuthState({
        isAuthenticated: false,
        user: null,
        isLoading: false,
      });
    }
  }, [sessionData, isLoading, isError, timedOut]);

  const refreshSession = async () => {
    await refetch();
  };

  return {
    ...authState,
    authUnavailable: isError || timedOut,
    refreshSession,
  };
}
