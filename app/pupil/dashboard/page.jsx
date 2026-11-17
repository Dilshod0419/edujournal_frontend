"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CalendarCheck, Clock, Download, FileText, Star, TrendingUp } from "lucide-react";
import { useApi, useDownload } from "@/lib/hooks";
import { useI18n } from "@/lib/i18n";
import useAuthStore from "@/store/authStore";
import { fmtNum, formatDate, formatDateTime, formatTime, sn, todayISO, todayWeekday } from "@/lib/utils";
import PeriodPicker from "@/components/shared/PeriodPicker";
import { BarsChart, COLORS, DonutChart, TrendChart } from "@/components/charts/Charts";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { DataState, EmptyState } from "@/components/ui/Feedback";
import { PageHeader, StatCard } from "@/components/ui/Misc";

export default function PupilDashboard() {
  const { t, lang } = useI18n();
  const user = useAuthStore((s) => s.user);
  const { download, busy } = useDownload();

  const [period, setPeriod] = useState("month");
  const [refDate, setRefDate] = useState(todayISO());
  const stats = useApi("/stats/pupil", { period, ref: refDate });
  const schedules = useApi("/pupil/my-schedules/");
  const homeworks = useApi("/pupil/homeworks/");
  const submissions = useApi("/pupil/my-submissions/");
  const [now] = useState(() => Date.now());

  const s = stats.data;
  const today = todayWeekday();
  const todays = useMemo(
    () => (schedules.data || []).filter((x) => x.day_of_week === today).sort((a, b) => String(a.start_time).localeCompare(String(b.start_time))),
    [schedules.data, today]
  );
  const upcoming = useMemo(() => {
    const done = new Set((submissions.data || []).map((x) => x.homework_id));
    return (homeworks.data || [])
      .filter((h) => !done.has(h.id) && new Date(h.deadline).getTime() > now && new Date(h.start_date).getTime() <= now)
      .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
      .slice(0, 5);
  }, [homeworks.data, submissions.data, now]);

  const label = (l) => (l.length > 7 ? l.slice(5) : l);
  const series = (s?.series || []).map((d) => ({ label: label(d.label), grade: d.avg_grade, attendance: d.attendance_rate }));
  const distribution = s ? Object.entries(s.grades.distribution).map(([k, v]) => ({ name: k, count: v })) : [];

  return (
    <>
      <PageHeader
        title={t("pupil.dashboard.welcome", { name: user?.full_name?.split(" ")[0] || "" })}
        subtitle={s?.group_name ? `${t("common.group")}: ${s.group_name}` : t("pupil.dashboard.subtitle")}
        actions={
          <Button icon={Download} loading={busy} onClick={() => download("/stats/pupil/export", { period, ref: refDate, lang }, "mening_natijalarim.xlsx")}>
            {t("common.download_excel")}
          </Button>
        }
      />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <PeriodPicker period={period} onPeriod={setPeriod} refDate={refDate} onRefDate={setRefDate} />
        {s?.date_from && (
          <span className="text-sm text-slate-500 dark:text-slate-400">
            {formatDate(s.date_from, lang)} — {formatDate(s.date_to, lang)}
          </span>
        )}
      </div>

      <DataState loading={stats.loading && !s} error={stats.error} empty={false} onRetry={stats.reload}>
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <StatCard icon={Star} tone="amber" label={t("stats.avg_grade")} value={fmtNum(s?.grades.avg, 2)} hint={s ? t("stats.grades_count", { n: s.grades.count }) : undefined} />
          <StatCard icon={CalendarCheck} tone="green" label={t("stats.attendance")} value={s?.attendance.rate == null ? "—" : `${fmtNum(s.attendance.rate)}%`} hint={s ? t("pupil.dashboard.lessons_count", { n: s.attendance.total }) : undefined} />
          <StatCard icon={FileText} tone="violet" label={t("stats.homework")} value={s ? `${s.homework.submitted}/${s.homework.total}` : "…"} hint={s?.homework.avg_score != null ? `${t("stats.hw_avg")}: ${fmtNum(s.homework.avg_score, 2)}` : undefined} />
          <StatCard icon={TrendingUp} tone="blue" label={t("stats.activity")} value={s?.activity == null ? "—" : `${fmtNum(s.activity)}%`} hint={t("pupil.dashboard.activity_hint")} />
        </div>

        {s && (
          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader title={t("pupil.dashboard.dynamics")} subtitle={t("pupil.dashboard.dynamics_hint")} />
              <CardBody>
                {series.length === 0 ? (
                  <EmptyState title={t("common.no_data")} />
                ) : (
                  <TrendChart
                    data={series}
                    xKey="label"
                    domain={[0, 5]}
                    lines={[{ key: "grade", name: t("stats.avg_grade"), color: COLORS.amber }]}
                  />
                )}
              </CardBody>
            </Card>
            <Card>
              <CardHeader title={t("pupil.dashboard.attendance_chart")} />
              <CardBody>
                {s.attendance.total === 0 ? (
                  <EmptyState title={t("common.no_data")} />
                ) : (
                  <DonutChart
                    data={[
                      { name: t("att.present"), value: s.attendance.present, color: COLORS.green },
                      { name: t("att.late"), value: s.attendance.late, color: COLORS.amber },
                      { name: t("att.absent"), value: s.attendance.absent, color: COLORS.red },
                      { name: t("att.excused"), value: s.attendance.excused, color: COLORS.violet },
                    ]}
                  />
                )}
              </CardBody>
            </Card>
            <Card className="lg:col-span-2">
              <CardHeader title={t("pupil.dashboard.by_subject")} />
              <CardBody>
                {s.grades.by_subject.length === 0 ? (
                  <EmptyState title={t("common.no_data")} />
                ) : (
                  <BarsChart data={s.grades.by_subject.map((x) => ({ name: x.names?.[lang] || x.subject, avg: x.avg }))} xKey="name" domain={[0, 5]} bars={[{ key: "avg", name: t("stats.avg_grade"), color: COLORS.blue }]} />
                )}
              </CardBody>
            </Card>
            <Card>
              <CardHeader title={t("pupil.dashboard.distribution")} />
              <CardBody>
                {s.grades.count === 0 ? (
                  <EmptyState title={t("common.no_data")} />
                ) : (
                  <BarsChart data={distribution} xKey="name" bars={[{ key: "count", name: t("pupil.dashboard.grades_n"), color: COLORS.violet }]} />
                )}
              </CardBody>
            </Card>
          </div>
        )}
      </DataState>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title={t("pupil.dashboard.today")} action={<Link href="/pupil/schedules" className="text-sm font-semibold text-blue-600 hover:underline dark:text-blue-400">{t("common.all")}</Link>} />
          <CardBody>
            {todays.length === 0 ? (
              <EmptyState icon={Clock} title={t("pupil.dashboard.no_today")} />
            ) : (
              <div className="space-y-2">
                {todays.map((x) => (
                  <div key={x.id} className="flex items-center gap-3 rounded-xl border border-slate-200 p-3 dark:border-slate-700">
                    <div className="text-center text-xs font-bold text-blue-600 dark:text-blue-400">
                      <p>{formatTime(x.start_time)}</p>
                      <p className="text-slate-400">{formatTime(x.end_time)}</p>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-bold text-slate-900 dark:text-white">{sn(x, lang)}</p>
                      <p className="truncate text-xs text-slate-500">{x.teacher_name}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
        <Card>
          <CardHeader title={t("pupil.dashboard.upcoming")} action={<Link href="/pupil/homeworks" className="text-sm font-semibold text-blue-600 hover:underline dark:text-blue-400">{t("common.all")}</Link>} />
          <CardBody>
            {upcoming.length === 0 ? (
              <EmptyState icon={FileText} title={t("pupil.dashboard.no_upcoming")} />
            ) : (
              <div className="space-y-2">
                {upcoming.map((h) => (
                  <Link key={h.id} href="/pupil/homeworks" className="block rounded-xl border border-slate-200 p-3 transition hover:border-blue-400 dark:border-slate-700">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate font-bold text-slate-900 dark:text-white">{h.title}</p>
                      <Badge tone="amber">{sn(h, lang)}</Badge>
                    </div>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      {t("pupil.homeworks.deadline")}: {formatDateTime(h.deadline, lang)}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </>
  );
}
