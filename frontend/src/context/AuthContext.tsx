"use client";
import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import Cookies from "js-cookie";
import { User, AuthResponse } from "@/types";

interface AuthContextType {
  user: User | null;
  login: (credentials: { username: string; password: string }) => Promise<void>;
  register: (data: {
    email: string;
    username: string;
    password: string;
  }) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const initAuth = async () => {
      const token = Cookies.get("access_token");
      if (token) {
        try {
          const res = await api.get<User>("/users/me/");
          setUser(res.data);
        } catch {
          Cookies.remove("access_token");
          Cookies.remove("refresh_token");
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const login = async (credentials: { username: string; password: string }) => {
    const res = await api.post<AuthResponse>("/auth/token/", credentials);
    Cookies.set("access_token", res.data.access, { expires: 1 }); // 1 day
    Cookies.set("refresh_token", res.data.refresh, { expires: 7 }); // 7 days

    const userRes = await api.get<User>("/auth/me/");
    setUser(userRes.data);
    router.push("/dashboard");
  };

  const register = async (data: {
    email: string;
    username: string;
    password: string;
  }) => {
    await api.post("/auth/register/", data);
    await login({ username: data.username, password: data.password });
  };

  const logout = () => {
    Cookies.remove("access_token");
    Cookies.remove("refresh_token");
    setUser(null);
    router.push("/login");
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
