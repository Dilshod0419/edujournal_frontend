"use client";

import { useEffect } from "react";
import { ToastProvider } from "@/components/ui/Toast";
import useAuthStore from "@/store/authStore";

function AuthInit() {
  const checkAuth = useAuthStore((s) => s.checkAuth);
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);
  return null;
}

export default function Providers({ children }) {
  return (
    <ToastProvider>
      <AuthInit />
      {children}
    </ToastProvider>
  );
}
