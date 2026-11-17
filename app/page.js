"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import useAuthStore from "@/store/authStore";
import { ROLE_HOME } from "@/components/shared/nav";
import { Spinner } from "@/components/ui/Feedback";

// Asosiy manzil: kirgan bo'lsa o'z paneliga, aks holda login sahifasiga yo'naltiradi
export default function Home() {
  const router = useRouter();
  const { hydrated, token, role } = useAuthStore();

  useEffect(() => {
    if (!hydrated) return;
    router.replace(token && ROLE_HOME[role] ? ROLE_HOME[role] : "/auth/login");
  }, [hydrated, token, role, router]);

  return (
    <div className="flex h-dvh items-center justify-center">
      <Spinner className="h-8 w-8" />
    </div>
  );
}
