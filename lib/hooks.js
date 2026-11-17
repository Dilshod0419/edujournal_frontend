"use client";

import { useCallback, useEffect, useState } from "react";
import { PAGE_SIZE } from "@/lib/utils";
import api from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { getErrorMessage, saveBlob } from "@/lib/utils";
import { useToast } from "@/components/ui/Toast";

/**
 * GET so'rov. Parametrlar o'zgarsa avtomatik qayta yuklanadi.
 * data - oxirgi muvaffaqiyatli natija (yuklanish vaqtida ham ko'rinib turadi).
 */
export function useApi(url, params, { enabled = true } = {}) {
  const [reloadKey, setReloadKey] = useState(0);
  const [result, setResult] = useState({ key: null, data: null, error: null, headers: null });
  const paramsKey = JSON.stringify(params ?? {});
  const key = enabled && url ? `${url}|${paramsKey}|${reloadKey}` : null;

  useEffect(() => {
    if (!key) return undefined;
    let cancelled = false;
    api
      .get(url, { params: JSON.parse(paramsKey) })
      .then((res) => {
        if (!cancelled) setResult({ key, data: res.data, error: null, headers: res.headers });
      })
      .catch((error) => {
        if (!cancelled) setResult({ key, data: null, error, headers: null });
      });
    return () => {
      cancelled = true;
    };
  }, [key, url, paramsKey]);

  const reload = useCallback(() => setReloadKey((k) => k + 1), []);
  return {
    data: result.data,
    headers: result.headers,
    error: result.key === key ? result.error : null,
    loading: key !== null && result.key !== key,
    reload,
  };
}

/** Yozuvchi amallar (POST/PUT/DELETE): band holati, xato va muvaffaqiyat xabarlari. */
export function useAction() {
  const { t, lang } = useI18n();
  const toast = useToast();
  const [busy, setBusy] = useState(false);

  const run = useCallback(
    async (fn, successKey) => {
      setBusy(true);
      try {
        const data = await fn();
        if (successKey) toast.success(t(successKey));
        return { ok: true, data };
      } catch (err) {
        toast.error(getErrorMessage(err, lang, t));
        return { ok: false, error: err };
      } finally {
        setBusy(false);
      }
    },
    [t, lang, toast]
  );

  return { run, busy };
}

/** Faylni (hisobot yoki yuklangan fayl) token bilan yuklab olish. */
export function useDownload() {
  const { t, lang } = useI18n();
  const toast = useToast();
  const [busy, setBusy] = useState(false);

  const download = useCallback(
    async (url, params, filename) => {
      setBusy(true);
      try {
        const res = await api.get(url, { params, responseType: "blob" });
        saveBlob(res.data, filename);
      } catch (err) {
        // blob javobdagi xato matnini o'qiymiz
        let message = getErrorMessage(err, lang, t);
        try {
          const text = await err.response?.data?.text?.();
          if (text) {
            const detail = JSON.parse(text).detail;
            if (typeof detail === "string") message = getErrorMessage({ response: { status: 0, data: { detail } } }, lang, t);
          }
        } catch {
          /* ignore */
        }
        toast.error(message);
      } finally {
        setBusy(false);
      }
    },
    [t, lang, toast]
  );

  return { download, busy };
}

/**
 * Ro'yxatni sahifalarga bo'ladi (standart: 20 ta). resetKey o'zgarsa (filtr, qidiruv) 1-sahifaga qaytadi.
 */
export function usePaged(items, resetKey = "", pageSize = PAGE_SIZE) {
  const [state, setState] = useState({ key: resetKey, page: 1 });
  const total = items.length;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(state.key === resetKey ? state.page : 1, pages);
  return {
    slice: items.slice((page - 1) * pageSize, page * pageSize),
    page,
    pageSize,
    total,
    setPage: (p) => setState({ key: resetKey, page: p }),
  };
}
