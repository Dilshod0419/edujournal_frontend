import { translateDetail } from "@/lib/errors";

export const MAX_FILE_MB = 20;
export const PAGE_SIZE = 20; // ro'yxatlarda bir sahifadagi elementlar soni

export const cn = (...parts) => parts.filter(Boolean).join(" ");

// ---------- Xatolar ----------
export function getErrorMessage(err, lang = "uz", t) {
  if (!err?.response) {
    return t ? t("err.network") : "Server bilan aloqa yo'q";
  }
  const { status, data } = err.response;
  const detail = data?.detail;
  if (Array.isArray(detail) && detail.length) {
    const first = detail[0];
    const field = Array.isArray(first.loc) ? first.loc.filter((p) => p !== "body").join(".") : "";
    const msg = translateDetail(String(first.msg || ""), lang);
    return field ? `${field}: ${msg}` : msg;
  }
  if (typeof detail === "string") return translateDetail(detail, lang);
  if (status === 413 && t) return t("err.too_large");
  if (status >= 500 && t) return t("err.server");
  return t ? t("err.generic") : "Xatolik yuz berdi";
}

// ---------- Sana va vaqt (doim Toshkent vaqti, backend bilan bir xil) ----------
export const APP_TZ = process.env.NEXT_PUBLIC_TIMEZONE || "Asia/Tashkent";

const pad = (n) => String(n).padStart(2, "0");

function tzParts(date) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: APP_TZ, year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).formatToParts(date);
  const get = (type) => Number(parts.find((p) => p.type === type).value);
  return { y: get("year"), m: get("month"), d: get("day"), h: get("hour"), min: get("minute") };
}

// Date -> 'YYYY-MM-DD' (brauzer vaqti emas, Toshkent vaqti bo'yicha)
export function tzISODate(date = new Date()) {
  const { y, m, d } = tzParts(date);
  return `${y}-${pad(m)}-${pad(d)}`;
}

// Mahalliy (brauzer) Date -> 'YYYY-MM-DD'. Faqat kalendar hisob-kitoblari uchun.
export function toISODate(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export const todayISO = () => tzISODate(new Date());

// 'YYYY-MM-DD' -> mahalliy Date (vaqt zonasi siljishisiz)
export function parseISODate(value) {
  const [y, m, d] = String(value).split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

// Bugundan n kun oldingi sana
export function daysAgoISO(n) {
  const d = parseISODate(todayISO());
  d.setDate(d.getDate() - n);
  return toISODate(d);
}

export const daysAheadISO = (n) => daysAgoISO(-n);
 
export function formatDate(value, lang = "uz") {
  if (!value) return "—";
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [y, m, d] = value.split("-");
    return `${d}.${m}.${y}`;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  const { y, m, d } = tzParts(date);
  return `${pad(d)}.${pad(m)}.${y}`;
}

// KK.OO.YYYY SS:DD (Toshkent vaqti)
export function formatDateTime(value, lang = "uz") {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  const { y, m, d, h, min } = tzParts(date);
  return `${pad(d)}.${pad(m)}.${y} ${pad(h)}:${pad(min)}`;
}


// '09:00:00' -> '09:00'
export const formatTime = (value) => (value ? String(value).slice(0, 5) : "");

// ISO vaqt -> datetime-local qiymati (Toshkent vaqti)
export function toLocalInput(value) {
  const { y, m, d, h, min } = tzParts(value ? new Date(value) : new Date());
  return `${y}-${pad(m)}-${pad(d)}T${pad(h)}:${pad(min)}`;
}

// datetime-local qiymati (Toshkent vaqti) -> ISO (UTC)
export function fromLocalInput(value) {
  const [datePart, timePart = "00:00"] = value.split("T");
  const [y, m, d] = datePart.split("-").map(Number);
  const [h, min] = timePart.split(":").map(Number);
  let guess = Date.UTC(y, m - 1, d, h, min);
  for (let i = 0; i < 2; i += 1) {
    const p = tzParts(new Date(guess));
    const shown = Date.UTC(p.y, p.m - 1, p.d, p.h, p.min);
    guess += Date.UTC(y, m - 1, d, h, min) - shown;
  }
  return new Date(guess).toISOString();
}

// 1 = dushanba ... 7 = yakshanba
export function isoWeekday(dateStr) {
  const d = parseISODate(dateStr).getDay();
  return d === 0 ? 7 : d;
}

export const todayWeekday = () => isoWeekday(todayISO());

// Berilgan hafta kuniga to'g'ri keladigan eng yaqin o'tgan (yoki bugungi) sana
export function lastDateOfWeekday(weekday) {
  return daysAgoISO((todayWeekday() - weekday + 7) % 7);
}

export function addMinutes(time, minutes) {
  const [h, m] = String(time).split(":").map(Number);
  const total = h * 60 + m + minutes;
  if (total < 0 || total >= 24 * 60) return "";
  return `${pad(Math.floor(total / 60))}:${pad(total % 60)}`;
}

export function minutesBetween(start, end) {
  const [h1, m1] = String(start).split(":").map(Number);
  const [h2, m2] = String(end).split(":").map(Number);
  return h2 * 60 + m2 - (h1 * 60 + m1);
}

// ---------- Davrlar (statistika) ----------
export const PERIODS = ["day", "month", "year", "all"];

export function periodRange(period, ref) {
  const d = parseISODate(ref || todayISO());
  if (period === "day") return [toISODate(d), toISODate(d)];
  if (period === "month") {
    return [toISODate(new Date(d.getFullYear(), d.getMonth(), 1)), toISODate(new Date(d.getFullYear(), d.getMonth() + 1, 0))];
  }
  if (period === "year") return [`${d.getFullYear()}-01-01`, `${d.getFullYear()}-12-31`];
  return [null, null];
}

// ---------- Fayl ----------
export function formatSize(bytes) {
  if (bytes == null) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function saveBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// ---------- Baho / foiz ranglari ----------
export function scoreColor(score) {
  if (score == null) return "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400";
  if (score >= 4.5) return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300";
  if (score >= 3.5) return "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300";
  if (score >= 2.5) return "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300";
  return "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300";
}

export function rateColor(rate) {
  if (rate == null) return "bg-slate-300 dark:bg-slate-600";
  if (rate >= 85) return "bg-emerald-500";
  if (rate >= 65) return "bg-blue-500";
  if (rate >= 45) return "bg-amber-500";
  return "bg-red-500";
}

export const fmtNum = (v, digits = 1) =>
  v == null ? "—" : Number(v).toLocaleString("en-US", { maximumFractionDigits: digits });

// ---------- Ko'p tilli nomlar ----------
// Backend fan nomini uch tilda qaytaradi: subject_names = {uz, ru, en}
export const sn = (item, lang) => item?.subject_names?.[lang] || item?.subject_name || "";

// Fanning o'zi (admin ro'yxati): names = {uz, ru, en}
export const subjectLabel = (subject, lang) => subject?.names?.[lang] || subject?.name || "";

// Material: title / title_ru / title_en, content / content_ru / content_en
export function localized(item, field, lang) {
  if (!item) return "";
  const value = lang === "uz" ? item[field] : item[`${field}_${lang}`];
  return value || item[field] || "";
}
