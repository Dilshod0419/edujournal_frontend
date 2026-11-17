"use client";

import { useMemo } from "react";
import Link from "next/link";
import { BookOpen, CalendarCheck, ClipboardCheck, Clock, FileText, GraduationCap, Star } from "lucide-react";
import { useApi } from "@/lib/hooks";
import { useI18n } from "@/lib/i18n";
import useAuthStore from "@/store/authStore";
import { fmtNum, formatTime, sn, todayWeekday } from "@/lib/utils";
import { COLORS, TrendChart } from "@/components/charts/Charts";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { DataState, EmptyState } from "@/components/ui/Feedback";
import { PageHeader, StatCard } from "@/components/ui/Misc";

function LessonHero({ current, next }) {
  const { t, lang } = useI18n();
  const lesson = current || next;
  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-700 p-6 text-white shadow-xl shadow-blue-600/20 sm:p-8">
      <div className="pointer-events-none absolute -top-16 -right-16 h-56 w-56 rounded-full border-[36px] border-white/10" />
      <div className="relative">
        <Badge className="bg-white/20 text-white">
          <Clock size={12} />
          {current ? t("teacher.dashboard.now") : lesson ? t("teacher.dashboard.next") : t("teacher.dashboard.no_lesson_badge")}
        </Badge>
        {lesson ? (
          <>
            <h2 className="mt-4 text-3xl font-extrabold sm:text-4xl">{sn(lesson, lang)}</h2>
            <p className="mt-1 text-lg text-blue-100">
              {lesson.group_name} · {formatTime(lesson.start_time)} – {formatTime(lesson.end_time)} · {lesson.duration_minutes} {t("common.min")}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href={`/teacher/attendance?schedule=${lesson.id}`}>
                <Button variant="secondary" icon={ClipboardCheck} className="border-0">
                  {t("teacher.dashboard.take_attendance")}
                </Button>
              </Link>
              <Link href={`/teacher/grades?group=${lesson.group_id}&subject=${lesson.subject_id}`}>
                <Button className="bg-white/15 shadow-none hover:bg-white/25" icon={Star}>
                  {t("teacher.dashboard.grade_pupils")}
                </Button>
              </Link>
            </div>
          </>
        ) : (
          <>
            <h2 className="mt-4 text-3xl font-extrabold">{t("teacher.dashboard.no_lesson")}</h2>
            <p className="mt-1 text-blue-100">{t("teacher.dashboard.no_lesson_text")}</p>
          </>
        )}
      </div>
    </div>
  );
}

export default function TeacherDashboard() {
  const { t, lang } = useI18n();
  const user = useAuthStore((s) => s.user);
  const lesson = useApi("/teacher/current-lesson/");
  const schedules = useApi("/teacher/my-schedules/");
  const classes = useApi("/teacher/my-classes/");
  const stats = useApi("/stats/teacher", { period: "month" });

  const today = todayWeekday();
  const todays = useMemo(
    () => (schedules.data || []).filter((s) => s.day_of_week === today).sort((a, b) => String(a.start_time).localeCompare(String(b.start_time))),
    [schedules.data, today]
  );
  const summary = stats.data?.summary;

  return (
    <>
      <PageHeader title={t("teacher.dashboard.welcome", { name: user?.full_name?.split(" ")[0] || "" })} subtitle={t("teacher.dashboard.subtitle")} />

      <DataState loading={lesson.loading} error={lesson.error} empty={false} onRetry={lesson.reload}>
        <LessonHero current={lesson.data?.current} next={lesson.data?.next} />
      </DataState>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard icon={GraduationCap} tone="blue" label={t("common.pupils")} value={summary ? summary.pupils : "…"} />
        <StatCard icon={CalendarCheck} tone="green" label={t("stats.attendance")} value={summary ? (summary.attendance.rate == null ? "—" : `${fmtNum(summary.attendance.rate)}%`) : "…"} hint={t("teacher.dashboard.this_month")} />
        <StatCard icon={Star} tone="amber" label={t("stats.avg_grade")} value={summary ? fmtNum(summary.avg_grade, 2) : "…"} hint={t("teacher.dashboard.this_month")} />
        <StatCard icon={FileText} tone="violet" label={t("stats.submission")} value={summary ? (summary.submission_rate == null ? "—" : `${fmtNum(summary.submission_rate)}%`) : "…"} hint={t("teacher.dashboard.this_month")} />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader title={t("teacher.dashboard.trend")} subtitle={t("teacher.dashboard.trend_hint")} />
          <CardBody>
            <DataState loading={stats.loading} error={stats.error} empty={!stats.data || stats.data.trend.length === 0} onRetry={stats.reload} emptyProps={{ title: t("common.no_data") }}>
              <TrendChart
                data={(stats.data?.trend || []).map((d) => ({ date: d.date.slice(5), attendance: d.attendance_rate, grade: d.avg_grade != null ? Number((d.avg_grade * 20).toFixed(1)) : null }))}
                xKey="date"
                domain={[0, 100]}
                lines={[
                  { key: "attendance", name: t("stats.attendance"), color: COLORS.green },
                  { key: "grade", name: `${t("stats.avg_grade")} (×20)`, color: COLORS.amber },
                ]}
              />
            </DataState>
          </CardBody>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader title={t("teacher.dashboard.today")} />
          <CardBody>
            {todays.length === 0 ? (
              <EmptyState title={t("teacher.dashboard.no_today")} />
            ) : (
              <div className="space-y-2">
                {todays.map((s) => {
                  const isCurrent = lesson.data?.current?.id === s.id;
                  return (
                    <Link
                      key={s.id}
                      href={`/teacher/attendance?schedule=${s.id}`}
                      className={`flex items-center gap-3 rounded-xl border p-3 transition hover:border-blue-400 ${isCurrent ? "border-blue-400 bg-blue-50 dark:bg-blue-950/30" : "border-slate-200 dark:border-slate-700"}`}
                    >
                      <div className="text-center text-xs font-bold text-blue-600 dark:text-blue-400">
                        <p>{formatTime(s.start_time)}</p>
                        <p className="text-slate-400">{formatTime(s.end_time)}</p>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-bold text-slate-900 dark:text-white">{sn(s, lang)}</p>
                        <p className="text-xs text-slate-500">{s.group_name}</p>
                      </div>
                      {isCurrent && <Badge tone="blue">{t("teacher.dashboard.now")}</Badge>}
                    </Link>
                  );
                })}
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader title={t("teacher.dashboard.my_classes")} />
        <CardBody>
          <DataState loading={classes.loading} error={classes.error} empty={(classes.data || []).length === 0} onRetry={classes.reload} emptyProps={{ icon: BookOpen, title: t("teacher.dashboard.no_classes"), text: t("teacher.dashboard.no_classes_text") }}>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {(classes.data || []).map((c) => (
                <Link key={c.id} href={`/teacher/grades?group=${c.group_id}&subject=${c.subject_id}`} className="rounded-xl border border-slate-200 p-4 transition hover:border-blue-400 dark:border-slate-700">
                  <p className="text-lg font-extrabold text-slate-900 dark:text-white">{c.group_name}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{sn(c, lang)}</p>
                </Link>
              ))}
            </div>
          </DataState>
        </CardBody>
      </Card>
    </>
  );
}
