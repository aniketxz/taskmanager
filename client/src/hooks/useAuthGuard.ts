"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { authApi } from "@/lib/api";

export function useAuthGuard() {
  const { token, user, setAuth, logout, hydrate } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    hydrate();
  }, []);

  useEffect(() => {
    if (!token) {
      router.replace("/login");
      return;
    }
    if (!user) {
      // token exists but user not loaded — fetch /me
      authApi
        .me()
        .then((res) => {
          const remember = !!localStorage.getItem("token");
          setAuth(res.data.user, token, remember);
        })
        .catch(() => {
          logout();
          router.replace("/login");
        });
    }
  }, [token]);
}
