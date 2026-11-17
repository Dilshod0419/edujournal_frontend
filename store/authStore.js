import { create } from "zustand";

const KEYS = ["token", "role", "user"];

function readStorage() {
  try {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");
    const user = JSON.parse(localStorage.getItem("user") || "null");
    return token && role ? { token, role, user } : null;
  } catch {
    return null;
  }
}

const useAuthStore = create((set) => ({
  user: null,
  token: null,
  role: null,
  hydrated: false, // localStorage o'qib bo'lindimi

  // Tizimga kirganda ishlaydi
  login: (userData, token) => {
    localStorage.setItem("token", token);
    localStorage.setItem("role", userData.role);
    localStorage.setItem("user", JSON.stringify(userData));
    set({ user: userData, token, role: userData.role, hydrated: true });
  },

  // Profil ma'lumotini yangilash (ism, til, tema)
  updateUser: (patch) =>
    set((state) => {
      const user = { ...(state.user || {}), ...patch };
      try {
        localStorage.setItem("user", JSON.stringify(user));
      } catch {
        /* ignore */
      }
      return { user };
    }),

  // Tizimdan chiqqanda ishlaydi
  logout: () => {
    KEYS.forEach((k) => localStorage.removeItem(k));
    set({ user: null, token: null, role: null, hydrated: true });
  },

  // Sahifa yangilanganda localStorage'dagi ma'lumotni tiklash
  checkAuth: () => {
    const saved = readStorage();
    if (saved) set({ ...saved, hydrated: true });
    else set({ user: null, token: null, role: null, hydrated: true });
  },
}));

export default useAuthStore;
