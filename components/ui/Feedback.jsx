"use client";

import { AlertCircle, Inbox, Loader2 } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { getErrorMessage } from "@/lib/utils";
import Button from "@/components/ui/Button";

export function Spinner({ className = "" }) {
  return <Loader2 className={`animate-spin text-blue-600 ${className}`} size={22} />;
}

export function PageLoader() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <Spinner className="h-8 w-8" />
    </div>
  );
}

export function EmptyState({ icon: Icon = Inbox, title, text, action }) {
  const { t } = useI18n();
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-4 py-12 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-slate-800">
        <Icon size={26} />
      </div>
      <p className="font-semibold text-slate-700 dark:text-slate-200">{title || t("common.empty")}</p>
      {text && <p className="max-w-sm text-sm text-slate-500 dark:text-slate-400">{text}</p>}
      {action}
    </div>
  );
}

export function ErrorState({ error, onRetry }) {
  const { t, lang } = useI18n();
  return (
    <div className="flex flex-col items-center gap-3 px-4 py-10 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-500 dark:bg-red-900/20">
        <AlertCircle size={26} />
      </div>
      <p className="text-sm text-slate-600 dark:text-slate-300">{getErrorMessage(error, lang, t)}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry}>
          {t("common.retry")}
        </Button>
      )}
    </div>
  );
}

/** Ma'lumot yuklanguncha / xato / bo'sh holatni ko'rsatadi. */
export function DataState({ loading, error, empty, onRetry, children, emptyProps }) {
  if (error) return <ErrorState error={error} onRetry={onRetry} />;
  if (loading && empty) return <PageLoader />;
  if (empty) return <EmptyState {...emptyProps} />;
  return children;
}
