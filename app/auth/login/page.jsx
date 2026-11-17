"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Eye, EyeOff, GraduationCap, Lock } from "lucide-react";
import api from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { getErrorMessage } from "@/lib/utils";
import { setPrefs } from "@/lib/prefs";
import useAuthStore from "@/store/authStore";
import LangThemeSwitcher from "@/components/shared/LangThemeSwitcher";
import { ROLE_HOME } from "@/components/shared/nav";

export default function LoginPage() {
  const { t, lang } = useI18n();
  const router = useRouter();
  const { hydrated, token, role: savedRole } = useAuthStore();
  const login = useAuthStore((state) => state.login);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Allaqachon kirgan bo'lsa, o'z paneliga o'tkazamiz
  useEffect(() => {
    if (hydrated && token && ROLE_HOME[savedRole]) router.replace(ROLE_HOME[savedRole]);
  }, [hydrated, token, savedRole, router]);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (loading) return;
    setError("");
    setLoading(true);

    try {
      const cleanUsername = username.trim();
      const formData = new URLSearchParams();
      formData.append("username", cleanUsername);
      formData.append("password", password);

      const response = await api.post("/auth/login", formData, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });

      const { access_token, role, full_name, language, theme } = response.data;
      // Shu qurilmada tanlangan til/tema ustun. Tanlanmagan bo'lsa, profildagi til
      // va (faqat "dark" bo'lsa) tema qo'llanadi
      const patch = {};
      if (!localStorage.getItem("lang")) patch.lang = language;
      if (!localStorage.getItem("theme") && theme === "dark") patch.theme = theme;
      setPrefs(patch);
      login({ username: cleanUsername.toLowerCase(), full_name, role, language, theme }, access_token);
      router.push(ROLE_HOME[role] || "/");
    } catch (err) {
      setError(getErrorMessage(err, lang, t));
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen h-dvh w-full overflow-hidden bg-white font-sans text-gray-900 transition-colors dark:bg-gray-950 dark:text-gray-100">
      {/* CHAP TOMON - MA'LUMOT PANEL (lg va katta ekranlarda) */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-[#0f172a] p-8 text-white lg:flex xl:p-12">
        <div className="pointer-events-none absolute -right-1/4 -bottom-1/4 h-[800px] w-[800px] rounded-full border-[60px] border-white/5"></div>
        <div className="pointer-events-none absolute -right-1/2 -bottom-1/2 h-[1000px] w-[1000px] rounded-full border-[60px] border-white/5"></div>

        <div className="relative z-10 flex items-center gap-3">
          <div className="rounded-xl bg-blue-500 p-2 text-white">
            <GraduationCap size={32} strokeWidth={2.5} />
          </div>
          <span className="text-2xl font-bold tracking-wide">EduJournal</span>
        </div>

        <div className="relative z-10 max-w-lg">
          <p className="mb-4 text-sm font-semibold tracking-widest text-blue-500 uppercase xl:mb-6">{t("login.tagline")}</p>
          <h1 className="mb-4 text-5xl leading-tight font-bold xl:text-6xl">
            {t("login.hero1")}
            <br />
            {t("login.hero2")}
            <br />
            <span className="text-blue-400">{t("login.hero3")}</span>
          </h1>
          <p className="mb-6 pr-8 text-base leading-relaxed text-slate-400 xl:mb-10 xl:text-lg">{t("login.hero_text")}</p>
          <div className="flex items-center gap-3 text-slate-300">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400"></span>
            {t("login.community")}
          </div>
        </div>

        <div className="relative z-10 text-sm text-slate-500">© 2026 EduJournal Platform</div>
      </div>

      {/* O'NG TOMON - FORM PANEL */}
      <div className="relative flex w-full flex-col justify-center bg-white px-6 py-4 sm:px-12 lg:w-1/2 xl:px-24 dark:bg-gray-950">
        <LangThemeSwitcher className="absolute top-4 right-4 sm:right-6" />

        <div className="mx-auto w-full max-w-md">
          {/* Telefon va planshetda logotip */}
          <div className="mb-5 flex items-center justify-center gap-2.5 sm:justify-start lg:hidden">
            <div className="rounded-xl bg-blue-600 p-2 text-white">
              <GraduationCap size={24} strokeWidth={2.5} />
            </div>
            <span className="text-xl font-bold tracking-wide">EduJournal</span>
          </div>

          <div className="mb-6 text-center sm:mb-8 sm:text-left xl:mb-10">
            <p className="mb-4 text-sm text-gray-400 sm:mb-6 dark:text-gray-500 [@media(max-height:700px)]:hidden">{t("login.subtitle")}</p>
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 sm:mx-0 sm:mb-6 sm:h-14 sm:w-14 dark:bg-blue-900/30 dark:text-blue-400 [@media(max-height:700px)]:hidden">
              <Lock size={28} />
            </div>
            <p className="mb-2 text-xs font-bold tracking-widest text-slate-500 uppercase dark:text-slate-400">{t("login.welcome")}</p>
            <h2 className="mb-2 text-3xl font-extrabold text-slate-900 sm:mb-3 sm:text-4xl dark:text-white">{t("login.title")}</h2>
            <p className="text-base text-slate-500 sm:text-lg dark:text-slate-400">{t("login.description")}</p>
          </div>

          {error && (
            <div
              role="alert"
              className="mb-4 rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-600 sm:mb-6 sm:p-4 dark:border-red-800 dark:bg-red-900/30 dark:text-red-400"
            >
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4 sm:space-y-6">
            <div>
              <label htmlFor="username" className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                {t("login.username")}
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                className="w-full rounded-xl border border-slate-200 bg-transparent px-4 py-3 text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 sm:px-5 sm:py-3.5 dark:border-slate-700 dark:text-white"
                placeholder={t("login.username_ph")}
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                {t("login.password")}
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  className="w-full rounded-xl border border-slate-200 bg-transparent px-4 py-3 pr-12 text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 sm:px-5 sm:py-3.5 dark:border-slate-700 dark:text-white"
                  placeholder={t("login.password_ph")}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? t("login.hide_password") : t("login.show_password")}
                  className=" cursor-pointer absolute top-1/2 right-4 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`flex w-full items-center justify-between rounded-xl px-6 py-3.5 font-semibold text-white transition-all sm:py-4 ${
                loading
                  ? "cursor-not-allowed bg-blue-400"
                  : "bg-blue-600 hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-600/20 active:scale-[0.98]"
              }`}
            >
              <span>{loading ? t("login.checking") : t("login.submit")}</span>
              {!loading && <ArrowRight size={20} />}
            </button>
          </form>

          <div className="mt-6 space-y-2 text-center text-sm text-slate-500 sm:mt-10 dark:text-slate-400">
            <p>
              {t("login.forgot")}{" "}
              <span className="font-semibold text-slate-800 dark:text-slate-200">{t("login.contact_admin")}</span>
            </p>
            <p className="space-x-2 text-xs [@media(max-height:700px)]:hidden">
              <span>{t("login.secure")}</span>
              <span>•</span>
              <span>{t("login.private")}</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
