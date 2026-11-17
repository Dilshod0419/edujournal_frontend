"use client";

import { useMemo, useState } from "react";
import { CalendarCheck, Download, GraduationCap, School, Star, Users } from "lucide-react";
import { useApi, useDownload, usePaged } from "@/lib/hooks";
import { useI18n } from "@/lib/i18n";
import { fmtNum, formatDate, todayISO } from "@/lib/utils";
import PeriodPicker from "@/components/shared/PeriodPicker";
import { BarsChart, COLORS, DonutChart, TrendChart } from "@/components/charts/Charts";
import Button from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { DataState } from "@/components/ui/Feedback";
import { PageHeader, Pagination, ProgressBar, ScoreBadge, StatCard } from "@/components/ui/Misc";
import { Table, TableWrap, Td, Th, Tr } from "@/components/ui/Table";

export default function AdminDashboard() {
  const { t, lang } = useI18n();
  const [period, setPeriod] = useState("month");
  const [refDate, setRefDate] = useState(todayISO());
  const { download, busy } = useDownload();

  const overview = useApi("/stats/admin/overview");
  const groups = useApi("/stats/admin/groups", { period, ref: refDate });
  const trend = useApi("/stats/admin/trend", { days: 30 });

  const rows = useMemo(() => {
    const list = groups.data?.groups || [];
    return [...list].sort((a, b) => (b.activity ?? -1) - (a.activity ?? -1));
  }, [groups.data]);

  const paged = usePaged(rows, `${period}|${refDate}`);

  const totals = useMemo(() => {
    const sum = { present: 0, late: 0, absent: 0, excused: 0 };
    rows.forEach((g) => Object.keys(sum).forEach((k) => (sum[k] += g.attendance[k])));
    return sum;
  }, [rows]);

  const chartData = rows.map((g) => ({
    name: g.group_name,
    attendance: g.attendance_rate ?? 0,
    submission: g.submission_rate ?? 0,
    activity: g.activity ?? 0,
    avg: g.avg_grade ?? 0,
  }));

  const ov = overview.data;

  return (
    <>
      <PageHeader
        title={t("admin.dashboard.title")}
        subtitle={t("admin.dashboard.subtitle")}
        actions={
          <Button
            icon={Download}
            loading={busy}
            onClick={() =>
              download("/stats/admin/groups/export", { period, ref: refDate, lang }, "sinflar_statistikasi.xlsx")
            }
          >
            {t("common.download_excel")}
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
        <StatCard icon={GraduationCap} tone="blue" label={t("admin.dashboard.pupils")} value={ov ? ov.pupils : "…"} />
        <StatCard icon={Users} tone="violet" label={t("admin.dashboard.teachers")} value={ov ? ov.teachers : "…"} />
        <StatCard icon={School} tone="amber" label={t("admin.dashboard.groups")} value={ov ? ov.groups : "…"} />
        <StatCard
          icon={CalendarCheck}
          tone="green"
          label={t("admin.dashboard.today_attendance")}
          value={ov ? (ov.today_attendance.rate == null ? "—" : `${fmtNum(ov.today_attendance.rate)}%`) : "…"}
          hint={ov ? t("admin.dashboard.records", { n: ov.today_attendance.total }) : undefined}
        />
        <StatCard
          icon={Star}
          tone="rose"
          label={t("admin.dashboard.month_avg")}
          value={ov ? fmtNum(ov.month_avg_grade, 2) : "…"}
          className="col-span-2 lg:col-span-1"
        />
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">{t("admin.dashboard.class_activity")}</h2>
        <PeriodPicker period={period} onPeriod={setPeriod} refDate={refDate} onRefDate={setRefDate} />
      </div>
      {groups.data?.date_from && (
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {formatDate(groups.data.date_from, lang)} — {formatDate(groups.data.date_to, lang)}
        </p>
      )}

      <DataState
        loading={groups.loading}
        error={groups.error}
        empty={!groups.data || rows.length === 0}
        onRetry={groups.reload}
        emptyProps={{ title: t("admin.dashboard.no_groups"), text: t("admin.dashboard.no_groups_text") }}
      >
        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader title={t("admin.dashboard.chart_activity")} subtitle={t("admin.dashboard.chart_activity_hint")} />
            <CardBody>
              <BarsChart
                data={chartData}
                xKey="name"
                domain={[0, 100]}
                bars={[
                  { key: "attendance", name: t("stats.attendance"), color: COLORS.green },
                  { key: "submission", name: t("stats.submission"), color: COLORS.violet },
                  { key: "activity", name: t("stats.activity"), color: COLORS.blue },
                ]}
              />
            </CardBody>
          </Card>
          <Card>
            <CardHeader title={t("admin.dashboard.chart_status")} />
            <CardBody>
              <DonutChart
                data={[
                  { name: t("att.present"), value: totals.present, color: COLORS.green },
                  { name: t("att.late"), value: totals.late, color: COLORS.amber },
                  { name: t("att.absent"), value: totals.absent, color: COLORS.red },
                  { name: t("att.excused"), value: totals.excused, color: COLORS.violet },
                ]}
              />
            </CardBody>
          </Card>
          <Card className="lg:col-span-2">
            <CardHeader title={t("admin.dashboard.chart_trend")} subtitle={t("admin.dashboard.chart_trend_hint")} />
            <CardBody>
              <DataState
                loading={trend.loading}
                error={trend.error}
                empty={!trend.data || trend.data.length === 0}
                onRetry={trend.reload}
              >
                <TrendChart
                  data={(trend.data || []).map((d) => ({ date: d.date.slice(5), rate: d.rate }))}
                  xKey="date"
                  domain={[0, 100]}
                  lines={[{ key: "rate", name: t("stats.attendance"), color: COLORS.green }]}
                />
              </DataState>
            </CardBody>
          </Card>
          <Card>
            <CardHeader title={t("admin.dashboard.chart_avg")} />
            <CardBody>
              <BarsChart
                data={chartData}
                xKey="name"
                domain={[0, 5]}
                bars={[{ key: "avg", name: t("stats.avg_grade"), color: COLORS.amber }]}
              />
            </CardBody>
          </Card>
        </div>

        <Card className="mt-4 overflow-hidden">
          <CardHeader title={t("admin.dashboard.table_title")} className="pb-4" />
          <TableWrap>
            <Table className="min-w-[860px]">
              <thead>
                <tr>
                  <Th>#</Th>
                  <Th>{t("common.group")}</Th>
                  <Th>{t("common.pupils")}</Th>
                  <Th className="min-w-[160px]">{t("stats.attendance")}</Th>
                  <Th>{t("stats.avg_grade")}</Th>
                  <Th className="min-w-[160px]">{t("stats.submission")}</Th>
                  <Th className="min-w-[160px]">{t("stats.activity")}</Th>
                </tr>
              </thead>
              <tbody>
                {paged.slice.map((g, i) => (
                  <Tr key={g.group_id}>
                    <Td className="text-slate-400">{(paged.page - 1) * paged.pageSize + i + 1}</Td>
                    <Td className="font-bold text-slate-900 dark:text-white">{g.group_name}</Td>
                    <Td>{g.pupils}</Td>
                    <Td>
                      <ProgressBar value={g.attendance_rate} />
                    </Td>
                    <Td>
                      <ScoreBadge score={g.avg_grade} />
                    </Td>
                    <Td>
                      <ProgressBar value={g.submission_rate} />
                    </Td>
                    <Td>
                      <ProgressBar value={g.activity} />
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          </TableWrap>
          <Pagination page={paged.page} pageSize={paged.pageSize} total={paged.total} onChange={paged.setPage} />
        </Card>
      </DataState>
    </>
  );
}
