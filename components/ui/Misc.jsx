"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn, fmtNum, rateColor, scoreColor } from "@/lib/utils";
import { Card } from "@/components/ui/Card";
import { useI18n } from "@/lib/i18n";

export function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl dark:text-white">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

const TONES = {
  blue: "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300",
  green: "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-300",
  amber: "bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-300",
  violet: "bg-violet-50 text-violet-600 dark:bg-violet-900/30 dark:text-violet-300",
  rose: "bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-300",
};

export function StatCard({ icon: Icon, label, value, hint, tone = "blue", className }) {
  return (
    <Card className={cn("p-4 sm:p-5", className)}>
      <div className="flex items-center gap-3">
        {Icon && (
          <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-xl", TONES[tone])}>
            <Icon size={22} />
          </div>
        )}
        <div className="min-w-0">
          <p className="line-clamp-2 text-[11px] leading-tight font-semibold tracking-wide text-slate-500 uppercase sm:text-xs dark:text-slate-400">{label}</p>
          <p className="mt-0.5 truncate text-2xl font-extrabold text-slate-900 dark:text-white">{value}</p>
        </div>
      </div>
      {hint && <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{hint}</p>}
    </Card>
  );
}

export function ProgressBar({ value, className }) {
  const v = value == null ? 0 : Math.max(0, Math.min(100, value));
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="h-2 min-w-[60px] flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
        <div className={cn("h-full rounded-full transition-all", rateColor(value))} style={{ width: `${v}%` }} />
      </div>
      <span className="w-12 text-right text-xs font-bold tabular-nums text-slate-600 dark:text-slate-300">
        {value == null ? "—" : `${fmtNum(value)}%`}
      </span>
    </div>
  );
}

export function ScoreBadge({ score, className }) {
  return (
    <span
      className={cn(
        "inline-flex min-w-8 items-center justify-center rounded-lg px-2 py-0.5 text-sm font-bold tabular-nums",
        scoreColor(score),
        className
      )}
    >
      {score == null ? "—" : fmtNum(score, 2)}
    </span>
  );
}

export function Tabs({ tabs, value, onChange, className }) {
  return (
    <div className={cn("inline-flex max-w-full gap-1 overflow-x-auto rounded-xl bg-slate-100 p-1 dark:bg-slate-800", className)}>
      {tabs.map((tab) => (
        <button
          key={tab.value}
          onClick={() => onChange(tab.value)}
          className={cn(
            "whitespace-nowrap rounded-lg px-3.5 py-1.5 text-sm font-semibold transition",
            value === tab.value
              ? "bg-white text-blue-700 shadow-sm dark:bg-slate-900 dark:text-blue-300"
              : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
          )}
        >
          {tab.label}
          {tab.count != null && <span className="ml-1.5 text-xs opacity-60">{tab.count}</span>}
        </button>
      ))}
    </div>
  );
}

export function Pagination({ page, pageSize, total, onChange }) {
  const { t } = useI18n();
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (pages <= 1) return null;
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3 text-sm text-slate-500 dark:text-slate-400">
      <span>
        {t("common.page_of", { page, pages })} · {total}
      </span>
      <div className="flex gap-1">
        <button
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
          className="rounded-lg border border-slate-200 p-1.5 hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:hover:bg-slate-800"
          aria-label="prev"
        >
          <ChevronLeft size={16} />
        </button>
        <button
          disabled={page >= pages}
          onClick={() => onChange(page + 1)}
          className="rounded-lg border border-slate-200 p-1.5 hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:hover:bg-slate-800"
          aria-label="next"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}

export function SegmentedButtons({ options, value, onChange, className }) {
  return (
    <div className={cn("inline-flex gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800", className)}>
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          title={o.title}
          className={cn(
            "rounded-lg px-3 py-1.5 text-xs font-bold transition sm:text-sm",
            value === o.value ? o.active || "bg-blue-600 text-white shadow-sm" : "text-slate-500 hover:bg-white dark:text-slate-400 dark:hover:bg-slate-700"
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
