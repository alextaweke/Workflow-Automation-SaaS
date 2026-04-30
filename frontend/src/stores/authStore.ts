// stores/authStore.ts
import { RegisterData } from "@/types";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface User {
  id: number;
  uuid: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  phone_number: string;
  bio: string;
  avatar: string | null;
  role: string;
  theme: string;
  language: string;
  timezone: string;
  is_active: boolean;
  is_verified: boolean;
}

interface AuthStore {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  updateProfile: (data: any) => Promise<void>;
  changePassword: (oldPassword: string, newPassword: string) => Promise<void>;
  fetchUser: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isLoading: false,

      login: async (username: string, password: string) => {
        set({ isLoading: true });
        try {
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/auth/login/`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ username, password }),
            },
          );

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || "Login failed");
          }

          const data = await response.json();
          set({
            user: data.user,
            accessToken: data.access,
            refreshToken: data.refresh,
          });
        } catch (error) {
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      register: async (userData) => {
        set({ isLoading: true });
        try {
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/auth/register/`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(userData),
            },
          );

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || "Registration failed");
          }

          const data = await response.json();
          set({
            user: data.user,
            accessToken: data.access,
            refreshToken: data.refresh,
          });
        } catch (error) {
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      logout: async () => {
        set({ isLoading: true });
        try {
          const { refreshToken } = get();
          if (refreshToken) {
            await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/logout/`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${get().accessToken}`,
              },
              body: JSON.stringify({ refresh: refreshToken }),
            });
          }
        } catch (error) {
          console.error("Logout error:", error);
        } finally {
          set({
            user: null,
            accessToken: null,
            refreshToken: null,
            isLoading: false,
          });
        }
      },

      updateProfile: async (data) => {
        set({ isLoading: true });
        try {
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/auth/users/update_profile/`,
            {
              method: "PATCH",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${get().accessToken}`,
              },
              body: JSON.stringify(data),
            },
          );

          if (!response.ok) {
            throw new Error("Failed to update profile");
          }

          const updatedUser = await response.json();
          set({ user: updatedUser });
        } catch (error) {
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      changePassword: async (oldPassword: string, newPassword: string) => {
        set({ isLoading: true });
        try {
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/auth/users/change_password/`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${get().accessToken}`,
              },
              body: JSON.stringify({
                old_password: oldPassword,
                new_password: newPassword,
                confirm_password: newPassword,
              }),
            },
          );

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.old_password || "Failed to change password");
          }
        } catch (error) {
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      fetchUser: async () => {
        try {
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/auth/users/me/`,
            {
              headers: {
                Authorization: `Bearer ${get().accessToken}`,
              },
            },
          );

          if (response.ok) {
            const user = await response.json();
            set({ user });
          }
        } catch (error) {
          console.error("Failed to fetch user:", error);
        }
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        user: state.user,
      }),
    },
  ),
);
