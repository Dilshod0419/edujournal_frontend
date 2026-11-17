"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, Menu, X } from "lucide-react";
import api from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import useAuthStore from "@/store/authStore";
import LangThemeSwitcher from "@/components/shared/LangThemeSwitcher";
import { BRAND_ICON, NAV, ROLE_HOME } from "@/components/shared/nav";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { Spinner } from "@/components/ui/Feedback";

function Brand({ compact = false }) {
  const Icon = BRAND_ICON;
  return (
    <div className="flex items-center gap-2.5">
      <div className="rounded-xl bg-blue-600 p-2 text-white shadow-lg shadow-blue-600/30">
        <Icon size={22} strokeWidth={2.5} />
      </div>
      <span className={cn("text-lg font-extrabold tracking-wide text-slate-900 dark:text-white", compact && "hidden sm:inline")}>
        EduJournal
      </span>
    </div>
  );
}

function SidebarContent({ role, onNavigate, onLogout }) {
  const { t } = useI18n();
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);

  const initials = (user?.full_name || "?")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="flex h-full flex-col">
      <div className="px-5 py-5">
        <Brand />
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
        {NAV[role].map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition",
                active
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/25"
                  : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              )}
            >
              <Icon size={19} />
              {t(item.key)}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-slate-200 p-3 dark:border-slate-800">
        <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-slate-900 dark:text-white">{user?.full_name}</p>
            <p className="truncate text-xs text-slate-500 dark:text-slate-400">{t(`role.${role}`)}</p>
          </div>
          <button
            onClick={onLogout}
            className="rounded-lg p-2 text-slate-500 transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
            aria-label={t("nav.logout")}
            title={t("nav.logout")}
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}

/** Rol bo'yicha himoyalangan sahifalar uchun umumiy qobiq: yon panel, yuqori panel, kirish tekshiruvi. */
export default function AppShell({ role, children }) {
  const router = useRouter();
  const pathname = usePathname();
  const { hydrated, token, role: currentRole } = useAuthStore();
  const updateUser = useAuthStore((s) => s.updateUser);
  const [menuPath, setMenuPath] = useState(null);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const logout = useAuthStore((s) => s.logout);
  const { t } = useI18n();

  const confirmLogout = () => {
    setLogoutOpen(false);
    logout();
    router.replace("/auth/login");
  };

  // Menyu faqat ochilgan sahifada ko'rinadi; sahifa almashsa o'zi yopiladi
  const menuOpen = menuPath === pathname;

  const allowed = hydrated && token && currentRole === role;

  useEffect(() => {
    if (!hydrated) return;
    if (!token) router.replace("/auth/login");
    else if (currentRole !== role) router.replace(ROLE_HOME[currentRole] || "/auth/login");
  }, [hydrated, token, currentRole, role, router]);

  // Profilni serverdan yangilab turamiz (ism o'zgargan bo'lishi mumkin)
  useEffect(() => {
    if (!allowed) return;
    api
      .get("/auth/me")
      .then((res) => updateUser({ full_name: res.data.full_name, username: res.data.username }))
      .catch(() => {});
  }, [allowed, updateUser]);

  if (!allowed) {
    return (
      <div className="flex h-dvh items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  return (
    <div className="min-h-dvh">
      {/* Kompyuter: doimiy yon panel */}
      <aside className="no-print fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-slate-200 bg-white lg:block dark:border-slate-800 dark:bg-slate-900">
        <SidebarContent role={role} onLogout={() => setLogoutOpen(true)} />
      </aside>

      {/* Telefon / planshet: ochiladigan menyu */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="animate-fade-in absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setMenuPath(null)} />
          <aside className="animate-slide-in absolute inset-y-0 left-0 w-72 max-w-[85vw] bg-white shadow-2xl dark:bg-slate-900">
            <button
              onClick={() => setMenuPath(null)}
              className="absolute top-4 right-3 rounded-lg p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="close"
            >
              <X size={20} />
            </button>
            <SidebarContent
              role={role}
              onNavigate={() => setMenuPath(null)}
              onLogout={() => {
                setMenuPath(null);
                setLogoutOpen(true);
              }}
            />
          </aside>
        </div>
      )}

      <div className="lg:pl-64">
        <header className="no-print sticky top-0 z-20 flex items-center justify-between gap-2 border-b border-slate-200 bg-white/80 px-4 py-3 backdrop-blur-md sm:px-6 dark:border-slate-800 dark:bg-slate-900/80">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMenuPath(pathname)}
              className="rounded-xl p-2 text-slate-600 hover:bg-slate-100 lg:hidden dark:text-slate-300 dark:hover:bg-slate-800"
              aria-label="menu"
            >
              <Menu size={22} />
            </button>
            <div className="lg:hidden">
              <Brand compact />
            </div>
          </div>
          <LangThemeSwitcher />
        </header>
        <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:py-8">{children}</main>
      </div>

      <ConfirmDialog
        open={logoutOpen}
        onClose={() => setLogoutOpen(false)}
        onConfirm={confirmLogout}
        danger={false}
        title={t("nav.logout_title")}
        message={t("nav.logout_confirm")}
        confirmText={t("nav.logout")}
      />
    </div>
  );
}
