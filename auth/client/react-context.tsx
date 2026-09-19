import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { PublicUser } from "../schemas/auth-schemas.js";
import { AuthClient, ClientLoginResponse } from "./auth-client.js";

export interface AuthContextType {
  user: PublicUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  client: AuthClient;
  login: (params: Parameters<AuthClient["login"]>[0]) => Promise<ClientLoginResponse>;
  signup: (params: Parameters<AuthClient["signup"]>[0]) => Promise<void>;
  logout: () => Promise<void>;
  logoutAll: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export interface AuthProviderProps {
  children: React.ReactNode;
  authClient?: AuthClient;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({
  children,
  authClient = new AuthClient(),
}) => {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshUser = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await authClient.getProfile();
      if (res.success && res.data?.user) {
        setUser(res.data.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, [authClient]);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = useCallback(
    async (params: Parameters<AuthClient["login"]>[0]): Promise<ClientLoginResponse> => {
      const res = await authClient.login(params);
      if (!res.success || !res.data) {
        throw new Error(res.error?.message || "Login failed");
      }
      if (!res.data.requiresMFA && res.data.user) {
        setUser(res.data.user);
      }
      return res.data;
    },
    [authClient]
  );

  const signup = useCallback(
    async (params: Parameters<AuthClient["signup"]>[0]): Promise<void> => {
      const res = await authClient.signup(params);
      if (!res.success) {
        throw new Error(res.error?.message || "Signup failed");
      }
    },
    [authClient]
  );

  const logout = useCallback(async (): Promise<void> => {
    await authClient.logout();
    setUser(null);
  }, [authClient]);

  const logoutAll = useCallback(async (): Promise<void> => {
    await authClient.logoutAll();
    setUser(null);
  }, [authClient]);

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: Boolean(user),
    client: authClient,
    login,
    signup,
    logout,
    logoutAll,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an <AuthProvider />");
  }
  return ctx;
}
