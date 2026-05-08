/* eslint-disable @typescript-eslint/no-explicit-any */
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
import { User, LoginCredentials, RegisterData, TokenResponse } from "@/types";
import { toast } from "react-hot-toast";

interface AuthContextType {
  user: User | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  updateUser: (data: Partial<User>) => Promise<void>;
  changePassword: (oldPassword: string, newPassword: string) => Promise<void>;
  loading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const router = useRouter();

  // MOVE fetchUser HERE
  const fetchUser = async () => {
    try {
      const token = Cookies.get("access_token");

      if (!token) {
        setUser(null);
        return;
      }

      const userData = await api.get<User>("/auth/users/me/");
      setUser(userData.data);
    } catch (err) {
      console.error("Failed to fetch user:", err);

      Cookies.remove("access_token");
      Cookies.remove("refresh_token");

      setUser(null);
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      await fetchUser();
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (credentials: LoginCredentials) => {
    try {
      const { data: tokens } = await api.post<TokenResponse>(
        "/auth/login/",
        credentials,
      );

      Cookies.set("access_token", tokens.access, {
        expires: 10 / 1440, // 10 minutes
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
      });

      Cookies.set("refresh_token", tokens.refresh, {
        expires: 7,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
      });

      await fetchUser();

      toast.success("Logged in successfully!");

      router.push("/dashboard");
    } catch (err: any) {
      console.log(err.response?.data);

      const message =
        err.response?.data?.detail ||
        err.response?.data?.non_field_errors?.[0] ||
        err.response?.data?.message ||
        "Invalid credentials";

      toast.error(message);

      throw err;
    }
  };

  const register = async (data: RegisterData) => {
    try {
      await api.post("/auth/register/", data);

      await login({
        username: data.username,
        password: data.password,
      });

      toast.success("Account created successfully!");
    } catch (err: any) {
      const message =
        err.response?.data?.email?.[0] ||
        err.response?.data?.username?.[0] ||
        err.response?.data?.detail ||
        "Registration failed";

      toast.error(message);

      throw err;
    }
  };

  const logout = () => {
    Cookies.remove("access_token");
    Cookies.remove("refresh_token");

    setUser(null);

    toast.success("Logged out successfully");

    router.push("/login");
  };

  const updateUser = async (data: Partial<User>) => {
    try {
      const updatedUser = await api.patch<User>(
        "/auth/users/update_profile/",
        data,
      );

      setUser(updatedUser.data);

      toast.success("Profile updated successfully");
    } catch (err: any) {
      toast.error("Failed to update profile");
      throw err;
    }
  };

  const changePassword = async (oldPassword: string, newPassword: string) => {
    try {
      await api.post("/auth/users/change_password/", {
        old_password: oldPassword,
        new_password: newPassword,
        confirm_password: newPassword,
      });

      toast.success("Password changed successfully");
    } catch (err: any) {
      toast.error("Failed to change password");
      throw err;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        register,
        logout,
        updateUser,
        changePassword,
        loading,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
};
