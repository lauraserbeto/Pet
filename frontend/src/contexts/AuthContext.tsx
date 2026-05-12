import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { httpClient, setUnauthorizedHandler } from "../lib/httpClient";

export type AuthUser = {
  id: string;
  full_name: string;
  email: string;
  phone?: string | null;
  avatar_url?: string | null;
  role_id: number;
  onboarding_step?: string;
  provider_status?: string;
};

type LoginPayload = { email: string; password: string };
type LoginResponse = { token: string; user: AuthUser };

type AuthContextValue = {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginPayload) => Promise<AuthUser>;
  logout: (redirect?: boolean) => void;
  refetchMe: () => Promise<AuthUser | null>;
  setUser: (user: AuthUser | null) => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const TOKEN_KEY = "petplus_token";
const USER_KEY = "petplus_user";

function readStoredUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

function readStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => readStoredToken());
  const [user, setUserState] = useState<AuthUser | null>(() => readStoredUser());
  const [isLoading, setIsLoading] = useState<boolean>(Boolean(readStoredToken()));

  const persistUser = useCallback((next: AuthUser | null) => {
    setUserState(next);
    if (next) {
      localStorage.setItem(USER_KEY, JSON.stringify(next));
    } else {
      localStorage.removeItem(USER_KEY);
    }
  }, []);

  const logout = useCallback(
    (redirect = true) => {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      setToken(null);
      setUserState(null);
      if (redirect && typeof window !== "undefined") {
        window.location.href = "/login";
      }
    },
    []
  );

  const refetchMe = useCallback(async (): Promise<AuthUser | null> => {
    if (!readStoredToken()) {
      setIsLoading(false);
      return null;
    }
    try {
      const me = await httpClient.get<AuthUser>("/users/me");
      persistUser(me);
      return me;
    } catch {
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [persistUser]);

  const login = useCallback(
    async (credentials: LoginPayload): Promise<AuthUser> => {
      const data = await httpClient.post<LoginResponse>("/auth/login", credentials, {
        auth: false,
      });
      localStorage.setItem(TOKEN_KEY, data.token);
      setToken(data.token);
      persistUser(data.user);
      return data.user;
    },
    [persistUser]
  );

  useEffect(() => {
    setUnauthorizedHandler(() => logout(true));
    return () => setUnauthorizedHandler(null);
  }, [logout]);

  useEffect(() => {
    if (token) {
      refetchMe();
    } else {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(token && user),
      isLoading,
      login,
      logout,
      refetchMe,
      setUser: persistUser,
    }),
    [user, token, isLoading, login, logout, refetchMe, persistUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de <AuthProvider>");
  return ctx;
}
