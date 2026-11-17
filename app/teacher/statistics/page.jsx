"use client";

import { useMemo, useState } from "react";
import { BarChart3, CalendarCheck, Download, FileText, GraduationCap, Star } from "lucide-react";
import { useApi, useDownload, usePaged } from "@/lib/hooks";
import { useI18n } from "@/lib/i18n";
import { fmtNum, formatDate, sn, todayISO } from "@/lib/utils";
import PeriodPicker from "@/components/shared/PeriodPicker";
import { BarsChart, COLORS, DonutChart, TrendChart } from "@/components/charts/Charts";
import Button from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { FormField, Select } from "@/components/ui/Field";
import { DataState } from "@/components/ui/Feedback";
import { PageHeader, Pagination, ProgressBar, ScoreBadge, StatCard } from "@/components/ui/Misc";
import { Table, TableWrap, Td, Th, Tr } from "@/components/ui/Table";

export default function TeacherStatistics() {
  const { t, lang } = useI18n();
  const { download, busy } = useDownload();

  const classes = useApi("/teacher/my-classes/");
  const [groupId, setGroupId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [period, setPeriod] = useState("month");
  const [refDate, setRefDate] = useState(todayISO());

  const groupOptions = useMemo(() => {
    const map = new Map();
    (classes.data || []).forEach((c) => map.set(c.group_id, c.group_name));
    return [...map.entries()];
  }, [classes.data]);
  const subjectOptions = useMemo(() => {
    const map = new Map();
    (classes.data || []).filter((c) => !groupId || String(c.group_id) === groupId).forEach((c) => map.set(c.subject_id, sn(c, lang)));
    return [...map.entries()];
  }, [classes.data, groupId, lang]);

  const query = { period, ref: refDate, ...(groupId ? { group_id: groupId } : {}), ...(subjectId ? { subject_id: subjectId } : {}) };
  const stats = useApi("/stats/teacher", query);
  const s = stats.data;
  const pupils = s?.pupils || [];
  const paged = usePaged(pupils, `${groupId}|${subjectId}|${period}|${refDate}`);

  return (
    <>
      <PageHeader
        title={t("teacher.stats.title")}
        subtitle={t("teacher.stats.subtitle")}
        actions={
          <Button icon={Download} loading={busy} onClick={() => download("/stats/teacher/export", { ...query, lang }, "oqituvchi_statistikasi.xlsx")}>
            {t("common.download_excel")}
          </Button>
        }
      />

      <Card className="p-4 sm:p-5">
        <div className="grid gap-4 md:grid-cols-3">
          <FormField label={t("common.group")}>
            <Select
              value={groupId}
              onChange={(e) => {
                setGroupId(e.target.value);
                setSubjectId("");
              }}
            >
              <option value="">{t("common.all_groups")}</option>
              {groupOptions.map(([id, name]) => (
                <option key={id} value={id}>
                  {name}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label={t("common.subject")}>
            <Select value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
              <option value="">{t("common.all_subjects")}</option>
              {subjectOptions.map(([id, name]) => (
                <option key={id} value={id}>
                  {name}
                </option>
              ))}
            </Select>
          </FormField>
          <div>
            <span className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-300">{t("common.period")}</span>
            <PeriodPicker period={period} onPeriod={setPeriod} refDate={refDate} onRefDate={setRefDate} />
          </div>
        </div>
      </Card>

      <DataState
        loading={stats.loading || classes.loading}
        error={stats.error}
        empty={!s || pupils.length === 0}
        onRetry={stats.reload}
        emptyProps={{ icon: BarChart3, title: t("teacher.stats.empty"), text: t("teacher.stats.empty_text") }}
      >
        {s && (
          <>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
              <StatCard icon={GraduationCap} tone="blue" label={t("common.pupils")} value={s.summary.pupils} />
              <StatCard icon={CalendarCheck} tone="green" label={t("stats.attendance")} value={s.summary.attendance.rate == null ? "—" : `${fmtNum(s.summary.attendance.rate)}%`} hint={t("admin.dashboard.records", { n: s.summary.attendance.total })} />
              <StatCard icon={Star} tone="amber" label={t("stats.avg_grade")} value={fmtNum(s.summary.avg_grade, 2)} hint={t("stats.grades_count", { n: s.summary.grades_count })} />
              <StatCard icon={FileText} tone="violet" label={t("stats.submission")} value={s.summary.submission_rate == null ? "—" : `${fmtNum(s.summary.submission_rate)}%`} />
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-3">
              <Card className="lg:col-span-2">
                <CardHeader title={t("teacher.stats.trend")} subtitle={t("teacher.stats.trend_hint")} />
                <CardBody>
                  {s.trend.length === 0 ? (
                    <p className="py-10 text-center text-sm text-slate-400">{t("common.no_data")}</p>
                  ) : (
                    <TrendChart
                      data={s.trend.map((d) => ({ date: d.date.slice(5), attendance: d.attendance_rate, grade: d.avg_grade != null ? Number((d.avg_grade * 20).toFixed(1)) : null }))}
                      xKey="date"
                      domain={[0, 100]}
                      lines={[
                        { key: "attendance", name: t("stats.attendance"), color: COLORS.green },
                        { key: "grade", name: `${t("stats.avg_grade")} (×20)`, color: COLORS.amber },
                      ]}
                    />
                  )}
                </CardBody>
              </Card>
              <Card>
                <CardHeader title={t("admin.dashboard.chart_status")} />
                <CardBody>
                  <DonutChart
                    data={[
                      { name: t("att.present"), value: s.summary.attendance.present, color: COLORS.green },
                      { name: t("att.late"), value: s.summary.attendance.late, color: COLORS.amber },
                      { name: t("att.absent"), value: s.summary.attendance.absent, color: COLORS.red },
                      { name: t("att.excused"), value: s.summary.attendance.excused, color: COLORS.violet },
                    ]}
                  />
                </CardBody>
              </Card>
              <Card className="lg:col-span-3">
                <CardHeader title={t("teacher.stats.by_pupil")} />
                <CardBody>
                  <BarsChart
                    data={pupils.map((p) => ({ name: p.student_name.split(" ")[0], attendance: p.attendance_rate ?? 0, grade: p.avg_grade != null ? Number((p.avg_grade * 20).toFixed(1)) : 0 }))}
                    xKey="name"
                    domain={[0, 100]}
                    bars={[
                      { key: "attendance", name: t("stats.attendance"), color: COLORS.green },
                      { key: "grade", name: `${t("stats.avg_grade")} (×20)`, color: COLORS.amber },
                    ]}
                  />
                </CardBody>
              </Card>
            </div>

            <Card className="mt-4 overflow-hidden">
              <CardHeader title={t("teacher.stats.table")} className="pb-4" />
              <TableWrap>
                <Table className="min-w-[900px]">
                  <thead>
                    <tr>
                      <Th>{t("common.pupil")}</Th>
                      <Th>{t("common.group")}</Th>
                      <Th className="min-w-[150px]">{t("stats.attendance")}</Th>
                      <Th>{t("att.present")}/{t("att.late")}/{t("att.absent")}/{t("att.excused")}</Th>
                      <Th>{t("stats.avg_grade")}</Th>
                      <Th>{t("stats.homework")}</Th>
                      <Th>{t("stats.hw_avg")}</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {paged.slice.map((p) => (
                      <Tr key={p.student_id}>
                        <Td className="font-bold text-slate-900 dark:text-white">{p.student_name}</Td>
                        <Td>{p.group_name}</Td>
                        <Td>
                          <ProgressBar value={p.attendance_rate} />
                        </Td>
                        <Td className="font-mono text-xs">
                          {p.attendance.present}/{p.attendance.late}/{p.attendance.absent}/{p.attendance.excused}
                        </Td>
                        <Td>
                          <ScoreBadge score={p.avg_grade} />
                          <span className="ml-1.5 text-xs text-slate-400">({p.grades_count})</span>
                        </Td>
                        <Td>
                          {p.submitted}/{p.homeworks}
                        </Td>
                        <Td>
                          <ScoreBadge score={p.homework_avg} />
                        </Td>
                      </Tr>
                    ))}
                  </tbody>
                </Table>
              </TableWrap>
              <Pagination page={paged.page} pageSize={paged.pageSize} total={paged.total} onChange={paged.setPage} />
              {s && period !== "all" && <p className="px-5 py-3 text-xs text-slate-400">{formatDate(refDate, lang)}</p>}
            </Card>
          </>
        )}
      </DataState>
    </>
  );
}
