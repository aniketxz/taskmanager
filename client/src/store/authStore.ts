import { create } from "zustand";

interface User {
  id: string;
  name: string;
  email: string;
}

interface AuthStore {
  user: User | null;
  token: string | null;
  setAuth: (user: User, token: string, remember: boolean) => void;
  logout: () => void;
  hydrate: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  token: null,

  setAuth: (user, token, remember) => {
    if (remember) {
      localStorage.setItem("token", token);
    } else {
      sessionStorage.setItem("token", token);
    }
    set({ user, token });
  },

  logout: () => {
    localStorage.removeItem("token");
    sessionStorage.removeItem("token");
    set({ user: null, token: null });
  },

  // call this once on app mount to rehydrate from storage
  hydrate: () => {
    const token =
      localStorage.getItem("token") || sessionStorage.getItem("token");
    if (!token) return;
    set({ token });
  },
}));
