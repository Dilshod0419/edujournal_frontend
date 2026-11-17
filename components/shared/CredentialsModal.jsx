"use client";

import { useState } from "react";
import { AlertTriangle, Check, Copy } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // clipboard API mavjud bo'lmasa (http), eski usul
    const area = document.createElement("textarea");
    area.value = text;
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    let ok = false;
    try {
      ok = document.execCommand("copy");
    } catch {
      ok = false;
    }
    area.remove();
    return ok;
  }
}

function Row({ label, value }) {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);
  const handle = async () => {
    if (await copyText(value)) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };
  return (
    <div>
      <p className="mb-1 text-xs font-bold tracking-wide text-slate-500 uppercase dark:text-slate-400">{label}</p>
      <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 dark:border-slate-700 dark:bg-slate-800">
        <code className="min-w-0 flex-1 text-base font-bold break-all text-slate-900 select-all dark:text-white">{value}</code>
        <button
          onClick={handle}
          className="shrink-0 rounded-lg p-2 text-slate-500 hover:bg-white hover:text-blue-600 dark:hover:bg-slate-700"
          aria-label={t("common.copy")}
        >
          {copied ? <Check size={17} className="text-emerald-600" /> : <Copy size={17} />}
        </button>
      </div>
    </div>
  );
}

/** Yangi yaratilgan yoki yangilangan login va parolni (bir marta) ko'rsatadi. */
export default function CredentialsModal({ data, onClose }) {
  const { t } = useI18n();
  const [copiedAll, setCopiedAll] = useState(false);
  if (!data) return null;

  const copyAll = async () => {
    const text = `${data.name}\n${t("login.username")}: ${data.username}\n${t("login.password")}: ${data.password}`;
    if (await copyText(text)) {
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 1500);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={data.title}
      size="sm"
      footer={
        <>
          <Button variant="secondary" icon={copiedAll ? Check : Copy} onClick={copyAll}>
            {t("common.copy_all")}
          </Button>
          <Button onClick={onClose}>{t("common.done")}</Button>
        </>
      }
    >
      <div className="space-y-4">
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{data.name}</p>
        <Row label={t("login.username")} value={data.username} />
        <Row label={t("login.password")} value={data.password} />
        <div className="flex gap-2 rounded-xl bg-amber-50 p-3 text-xs text-amber-800 dark:bg-amber-900/20 dark:text-amber-200">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          <span>{t("admin.users.cred_warning")}</span>
        </div>
      </div>
    </Modal>
  );
}
