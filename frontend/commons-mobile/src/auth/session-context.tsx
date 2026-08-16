import { useQueryClient } from "@tanstack/react-query";
import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { AccessTokenResponse } from "../api/contracts";
import { createAuthApi, type AuthApi, type Credentials } from "../api/auth-api";
import { ApiError, createHttpClient, type HttpClient } from "../api/http-client";
import {
  availableCommonsQueryKey,
  participantProfileQueryKey,
  type AuthenticatedRequest,
} from "../api/participants-api";
import {
  secureRefreshTokenStore,
  type RefreshTokenStore,
} from "./secure-token-store";

type SessionStatus = "restoring" | "authenticated" | "unauthenticated";

export interface SessionContextValue {
  status: SessionStatus;
  registerAndSignIn(credentials: Credentials): Promise<void>;
  signIn(credentials: Credentials): Promise<void>;
  signOut(): Promise<void>;
  request: AuthenticatedRequest;
}

interface SessionProviderProps extends PropsWithChildren {
  authApi?: AuthApi;
  httpClient?: HttpClient;
  tokenStore?: RefreshTokenStore;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({
  children,
  authApi,
  httpClient,
  tokenStore = secureRefreshTokenStore,
}: SessionProviderProps) {
  const queryClient = useQueryClient();
  const [resolvedHttpClient] = useState(() => httpClient ?? createHttpClient());
  const [resolvedAuthApi] = useState(
    () => authApi ?? createAuthApi(resolvedHttpClient),
  );
  const [status, setStatus] = useState<SessionStatus>("restoring");
  const accessTokenRef = useRef<string | null>(null);
  const refreshPromiseRef = useRef<Promise<string> | null>(null);

  const clearParticipantState = useCallback(() => {
    queryClient.removeQueries({ queryKey: participantProfileQueryKey });
    queryClient.removeQueries({ queryKey: availableCommonsQueryKey });
  }, [queryClient]);

  const useTokens = useCallback(
    async (tokens: AccessTokenResponse): Promise<string> => {
      await tokenStore.set(tokens.refreshToken);
      accessTokenRef.current = tokens.accessToken;
      setStatus("authenticated");
      return tokens.accessToken;
    },
    [tokenStore],
  );

  const clearSession = useCallback(async () => {
    accessTokenRef.current = null;
    setStatus("unauthenticated");
    clearParticipantState();
    await tokenStore.delete();
  }, [clearParticipantState, tokenStore]);

  const refreshSession = useCallback(async (): Promise<string> => {
    if (refreshPromiseRef.current) {
      return refreshPromiseRef.current;
    }

    const refreshPromise = (async () => {
      const refreshToken = await tokenStore.get();

      if (!refreshToken) {
        throw new ApiError(401, "Your session has expired. Please sign in again.");
      }

      const tokens = await resolvedAuthApi.refresh(refreshToken);
      return useTokens(tokens);
    })();

    refreshPromiseRef.current = refreshPromise;

    try {
      return await refreshPromise;
    } finally {
      refreshPromiseRef.current = null;
    }
  }, [resolvedAuthApi, tokenStore, useTokens]);

  useEffect(() => {
    let cancelled = false;

    async function restoreSession() {
      try {
        await refreshSession();
      } catch {
        if (!cancelled) {
          try {
            await clearSession();
          } catch {
            accessTokenRef.current = null;
            setStatus("unauthenticated");
            clearParticipantState();
          }
        }
      }
    }

    void restoreSession();

    return () => {
      cancelled = true;
    };
  }, [clearParticipantState, clearSession, refreshSession]);

  const signIn = useCallback(
    async (credentials: Credentials) => {
      const tokens = await resolvedAuthApi.login(credentials);
      await useTokens(tokens);
    },
    [resolvedAuthApi, useTokens],
  );

  const registerAndSignIn = useCallback(
    async (credentials: Credentials) => {
      await resolvedAuthApi.register(credentials);
      await signIn(credentials);
    },
    [resolvedAuthApi, signIn],
  );

  const signOut = useCallback(async () => {
    await tokenStore.delete();
    accessTokenRef.current = null;
    setStatus("unauthenticated");
    clearParticipantState();
  }, [clearParticipantState, tokenStore]);

  const request = useCallback<AuthenticatedRequest>(
    async <T,>(path: string, options: RequestInit = {}) => {
      const accessToken = accessTokenRef.current;

      if (!accessToken) {
        throw new ApiError(401, "You must sign in to continue.");
      }

      try {
        return await resolvedHttpClient.request<T>(path, options, accessToken);
      } catch (error) {
        if (!(error instanceof ApiError) || error.status !== 401) {
          throw error;
        }

        try {
          const refreshedAccessToken = await refreshSession();
          return await resolvedHttpClient.request<T>(
            path,
            options,
            refreshedAccessToken,
          );
        } catch (refreshError) {
          try {
            await clearSession();
          } catch {
            accessTokenRef.current = null;
            setStatus("unauthenticated");
            clearParticipantState();
          }

          throw refreshError;
        }
      }
    },
    [clearParticipantState, clearSession, resolvedHttpClient, refreshSession],
  );

  const value = useMemo<SessionContextValue>(
    () => ({ status, registerAndSignIn, signIn, signOut, request }),
    [registerAndSignIn, request, signIn, signOut, status],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
  const session = useContext(SessionContext);

  if (!session) {
    throw new Error("useSession must be used within SessionProvider.");
  }

  return session;
}
