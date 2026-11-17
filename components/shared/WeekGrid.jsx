"use client";

import { useI18n } from "@/lib/i18n";
import { cn, formatTime, sn, todayWeekday } from "@/lib/utils";
import { Clock } from "lucide-react";

/** Haftalik dars jadvali: kompyuterda ustunlar, telefonda kunlar ro'yxati. */
export default function WeekGrid({ items, secondary = "group_name", actions, onItemClick }) {
  const { t, lang } = useI18n();
  const today = todayWeekday();
  const days = [1, 2, 3, 4, 5, 6, 7].filter((d) => d <= 6 || items.some((i) => i.day_of_week === d));

  return (
    <div className={cn("grid gap-3 sm:grid-cols-2", days.length > 6 ? "xl:grid-cols-7" : "xl:grid-cols-6")}>
      {days.map((day) => {
        const list = items
          .filter((i) => i.day_of_week === day)
          .sort((a, b) => String(a.start_time).localeCompare(String(b.start_time)));
        return (
          <div
            key={day}
            className={cn(
              "rounded-2xl border p-3",
              day === today
                ? "border-blue-300 bg-blue-50/60 dark:border-blue-700 dark:bg-blue-950/30"
                : "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
            )}
          >
            <p className={cn("mb-2 text-sm font-extrabold", day === today ? "text-blue-700 dark:text-blue-300" : "text-slate-700 dark:text-slate-200")}>
              {t(`day.${day}`)}
              {day === today && <span className="ml-2 text-[10px] font-bold uppercase opacity-70">{t("common.today")}</span>}
            </p>
            <div className="space-y-2">
              {list.length === 0 && <p className="py-3 text-center text-xs text-slate-400">—</p>}
              {list.map((item) => (
                <div
                  key={item.id}
                  onClick={onItemClick ? () => onItemClick(item) : undefined}
                  className={cn(
                    "rounded-xl border border-slate-200 bg-white p-2.5 shadow-sm dark:border-slate-700 dark:bg-slate-800",
                    onItemClick && "cursor-pointer hover:border-blue-400"
                  )}
                >
                  <div className="flex items-center gap-1 text-xs font-bold text-blue-600 dark:text-blue-400">
                    <Clock size={12} />
                    {formatTime(item.start_time)} – {formatTime(item.end_time)}
                    <span className="ml-auto font-medium text-slate-400">{item.duration_minutes} {t("common.min")}</span>
                  </div>
                  <p className="mt-1 truncate text-sm font-bold text-slate-900 dark:text-white">{sn(item, lang)}</p>
                  <p className="truncate text-xs text-slate-500 dark:text-slate-400">{item[secondary]}</p>
                  {actions && <div className="mt-2 flex gap-1.5">{actions(item)}</div>}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
