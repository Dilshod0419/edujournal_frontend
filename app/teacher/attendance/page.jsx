"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AlertTriangle, BarChart3, CheckCheck, ClipboardCheck, Lock, Save } from "lucide-react";
import api from "@/lib/api";
import { useAction, useApi } from "@/lib/hooks";
import { useI18n } from "@/lib/i18n";
import { cn, formatTime, isoWeekday, lastDateOfWeekday, sn, todayISO } from "@/lib/utils";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { FormField, Input, Select } from "@/components/ui/Field";
import { DataState, PageLoader } from "@/components/ui/Feedback";
import { PageHeader } from "@/components/ui/Misc";

const STATUSES = [
  { value: "present", cls: "bg-emerald-600 text-white", idle: "hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-900/30" },
  { value: "late", cls: "bg-amber-500 text-white", idle: "hover:bg-amber-50 hover:text-amber-700 dark:hover:bg-amber-900/30" },
  { value: "absent", cls: "bg-red-600 text-white", idle: "hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-900/30" },
  { value: "excused", cls: "bg-violet-600 text-white", idle: "hover:bg-violet-50 hover:text-violet-700 dark:hover:bg-violet-900/30" },
];

function AttendanceInner() {
  const { t, lang } = useI18n();
  const { run, busy } = useAction();
  const params = useSearchParams();

  const schedules = useApi("/teacher/my-schedules/");
  const current = useApi("/teacher/current-lesson/");

  const [picked, setPicked] = useState(params.get("schedule") || "");
  const [date, setDate] = useState(todayISO());
  const [marksState, setMarksState] = useState({ key: "", marks: {} });

  const list = useMemo(() => schedules.data || [], [schedules.data]);

  // Tanlanmagan bo'lsa: hozirgi dars -> bugungi birinchi dars -> birinchi dars
  const scheduleId = useMemo(() => {
    if (picked) return picked;
    if (current.data?.current) return String(current.data.current.id);
    const today = isoWeekday(todayISO());
    const first = list.find((s) => s.day_of_week === today) || list[0];
    return first ? String(first.id) : "";
  }, [picked, current.data, list]);

  const schedule = list.find((s) => String(s.id) === scheduleId);
  const weekdayMismatch = schedule && isoWeekday(date) !== schedule.day_of_week;

  const pupils = useApi(`/teacher/schedules/${scheduleId}/pupils`, {}, { enabled: !!scheduleId });
  const existing = useApi("/teacher/attendance/", { schedule_id: scheduleId, date }, { enabled: !!scheduleId && !weekdayMismatch });

  const dataKey = `${scheduleId}|${date}`;
  const marks = marksState.key === dataKey ? marksState.marks : {};
  const saved = useMemo(() => Object.fromEntries((existing.data || []).map((r) => [r.student_id, r.status])), [existing.data]);
  // Davomat bir marta saqlanadi: saqlangach faqat ko'rish mumkin
  const locked = (existing.data || []).length > 0;
  const statusOf = (id) => (locked ? saved[id] ?? null : marks[id] ?? "present");
  const setMark = (id, status) => setMarksState({ key: dataKey, marks: { ...marks, [id]: status } });
  const markAll = (status) => setMarksState({ key: dataKey, marks: Object.fromEntries((pupils.data || []).map((p) => [p.id, status])) });

  const counts = { present: 0, late: 0, absent: 0, excused: 0 };
  (pupils.data || []).forEach((p) => {
    const st = statusOf(p.id);
    if (st) counts[st] += 1;
  });

  const choose = (value) => {
    setPicked(value);
    const s = list.find((x) => String(x.id) === value);
    if (s) setDate(isoWeekday(todayISO()) === s.day_of_week ? todayISO() : lastDateOfWeekday(s.day_of_week));
  };

  const save = async () => {
    const res = await run(
      () =>
        api.post("/teacher/attendance/", {
          schedule_id: Number(scheduleId),
          date,
          records: (pupils.data || []).map((p) => ({ student_id: p.id, status: statusOf(p.id) })),
        }),
      "teacher.attendance.saved"
    );
    if (res.ok) setMarksState({ key: "", marks: {} });
    existing.reload(); // xato bo'lsa ham (masalan, boshqa qurilmada saqlangan) holatni yangilaymiz
  };

  return (
    <>
      <PageHeader
        title={t("teacher.attendance.title")}
        subtitle={t("teacher.attendance.subtitle")}
        actions={
          <Link href="/teacher/statistics">
            <Button variant="secondary" icon={BarChart3}>
              {t("teacher.attendance.statistics")}
            </Button>
          </Link>
        }
      />

      <DataState
        loading={schedules.loading}
        error={schedules.error}
        empty={list.length === 0}
        onRetry={schedules.reload}
        emptyProps={{ icon: ClipboardCheck, title: t("teacher.attendance.no_schedule"), text: t("teacher.attendance.no_schedule_text") }}
      >
        <Card className="p-4 sm:p-5">
          <div className="grid gap-4 md:grid-cols-3">
            <FormField label={t("teacher.attendance.lesson")} className="md:col-span-2">
              <Select value={scheduleId} onChange={(e) => choose(e.target.value)}>
                {list.map((s) => (
                  <option key={s.id} value={s.id}>
                    {t(`day.${s.day_of_week}`)} {formatTime(s.start_time)} — {s.group_name} · {sn(s, lang)}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField label={t("common.date")}>
              <Input type="date" value={date} max={todayISO()} onChange={(e) => e.target.value && setDate(e.target.value)} />
            </FormField>
          </div>

          {weekdayMismatch && (
            <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-900/20 dark:text-amber-200">
              <AlertTriangle size={18} className="shrink-0" />
              <span className="flex-1">{t("teacher.attendance.weekday_mismatch", { day: t(`day.${schedule.day_of_week}`) })}</span>
              <Button size="sm" variant="secondary" onClick={() => setDate(lastDateOfWeekday(schedule.day_of_week))}>
                {t("teacher.attendance.go_last", { day: t(`day.${schedule.day_of_week}`) })}
              </Button>
            </div>
          )}
        </Card>

        {!weekdayMismatch && (
          <DataState
            loading={pupils.loading || existing.loading}
            error={pupils.error || existing.error}
            empty={(pupils.data || []).length === 0}
            onRetry={() => {
              pupils.reload();
              existing.reload();
            }}
            emptyProps={{ title: t("teacher.attendance.no_pupils") }}
          >
            <Card className="mt-4 overflow-hidden">
              <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 p-4 dark:border-slate-800">
                <div className="flex flex-wrap gap-2">
                  <Badge tone="green">
                    {t("att.present")}: {counts.present}
                  </Badge>
                  <Badge tone="amber">
                    {t("att.late")}: {counts.late}
                  </Badge>
                  <Badge tone="red">
                    {t("att.absent")}: {counts.absent}
                  </Badge>
                  <Badge tone="violet">
                    {t("att.excused")}: {counts.excused}
                  </Badge>
                </div>
                <div className="ml-auto flex items-center gap-2">
                  {locked ? (
                    <Badge tone="blue">
                      <Lock size={12} />
                      {t("teacher.attendance.already_saved")}
                    </Badge>
                  ) : (
                    <Button size="sm" variant="secondary" icon={CheckCheck} onClick={() => markAll("present")}>
                      {t("teacher.attendance.all_present")}
                    </Button>
                  )}
                </div>
              </div>
              <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                {(pupils.data || []).map((p, i) => (
                  <li key={p.id} className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center">
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <span className="w-6 text-sm text-slate-400">{i + 1}</span>
                      <span className="truncate font-semibold text-slate-900 dark:text-white">{p.full_name}</span>
                    </div>
                    {locked ? (
                      <div className="sm:w-[420px]">
                        {statusOf(p.id) ? (
                          <span className={cn("inline-flex rounded-lg px-4 py-2 text-xs font-bold", STATUSES.find((s) => s.value === statusOf(p.id)).cls)}>
                            {t(`att.${statusOf(p.id)}`)}
                          </span>
                        ) : (
                          <span className="text-sm text-slate-400">—</span>
                        )}
                      </div>
                    ) : (
                      <div className="grid grid-cols-4 gap-1 rounded-xl bg-slate-100 p-1 sm:w-[420px] dark:bg-slate-800">
                        {STATUSES.map((s) => (
                          <button
                            key={s.value}
                            onClick={() => setMark(p.id, s.value)}
                            className={cn(
                              "rounded-lg px-1 py-2 text-[11px] font-bold transition sm:text-xs",
                              statusOf(p.id) === s.value ? s.cls : `text-slate-500 dark:text-slate-400 ${s.idle}`
                            )}
                          >
                            {t(`att.${s.value}`)}
                          </button>
                        ))}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
              {locked ? (
                <div className="flex items-center gap-2 border-t border-slate-100 bg-blue-50 p-4 text-sm font-semibold text-blue-800 dark:border-slate-800 dark:bg-blue-900/20 dark:text-blue-200">
                  <Lock size={16} className="shrink-0" />
                  {t("teacher.attendance.locked_msg")}
                </div>
              ) : (
                <div className="sticky bottom-0 flex justify-end gap-3 border-t border-slate-100 bg-white/90 p-4 backdrop-blur dark:border-slate-800 dark:bg-slate-900/90">
                  <Button icon={Save} loading={busy} onClick={save} size="lg" className="w-full sm:w-auto">
                    {t("teacher.attendance.save")}
                  </Button>
                  <p className="hidden items-center text-xs text-slate-500 sm:flex dark:text-slate-400">{t("teacher.attendance.once_hint")}</p>
                </div>
              )}
            </Card>
          </DataState>
        )}
      </DataState>
    </>
  );
}

export default function AttendancePage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <AttendanceInner />
    </Suspense>
  );
}
