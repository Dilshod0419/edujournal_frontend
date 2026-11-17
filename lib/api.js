import axios from "axios";

// Backend manzili. Boshqa manzil kerak bo'lsa NEXT_PUBLIC_API_URL o'zgaruvchisi bilan almashtiriladi.
export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

const api = axios.create({ baseURL: API_URL, timeout: 60000 });

// Har bir so'rovga tokenni qo'shamiz
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Token eskirgan yoki profil faolsizlantirilgan bo'lsa, login sahifasiga qaytaramiz
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url || "";
    const detail = String(error.response?.data?.detail || "");
    const inactive = status === 403 && detail.toLowerCase().includes("faolsizlantirilgan");
    if ((status === 401 || inactive) && !url.includes("/auth/login") && typeof window !== "undefined") {
      ["token", "role", "user"].forEach((k) => localStorage.removeItem(k));
      if (!window.location.pathname.startsWith("/auth/login")) {
        window.location.replace("/auth/login");
      }
    }
    return Promise.reject(error);
  }
);

export default api;
