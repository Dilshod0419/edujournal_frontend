"use client";

import { useMemo, useState } from "react";
import { Download, Star } from "lucide-react";
import { useApi, useDownload, usePaged } from "@/lib/hooks";
import { useI18n } from "@/lib/i18n";
import { fmtNum, formatDate, periodRange, sn, todayISO } from "@/lib/utils";
import PeriodPicker from "@/components/shared/PeriodPicker";
import { BarsChart, COLORS, TrendChart } from "@/components/charts/Charts";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Select } from "@/components/ui/Field";
import { DataState } from "@/components/ui/Feedback";
import { PageHeader, Pagination, ScoreBadge, StatCard } from "@/components/ui/Misc";
import { Table, TableWrap, Td, Th, Tr } from "@/components/ui/Table";

export default function PupilGrades() {
  const { t, lang } = useI18n();
  const { download, busy } = useDownload();

  const [period, setPeriod] = useState("month");
  const [refDate, setRefDate] = useState(todayISO());
  const [subject, setSubject] = useState("");

  const [from, to] = periodRange(period, refDate);
  const grades = useApi("/pupil/my-grades/", { ...(from ? { date_from: from, date_to: to } : {}) });
  const stats = useApi("/stats/pupil", { period, ref: refDate });

  const all = useMemo(() => grades.data || [], [grades.data]);
  // Fanlar ro'yxati (tanlangan tilda), filtr fan id bo'yicha
  const subjects = useMemo(() => {
    const map = new Map();
    all.forEach((g) => map.set(String(g.subject_id), sn(g, lang)));
    return [...map.entries()].sort((a, b) => a[1].localeCompare(b[1]));
  }, [all, lang]);
  const rows = subject ? all.filter((g) => String(g.subject_id) === subject) : all;
  const paged = usePaged(rows, `${period}|${refDate}|${subject}`);

  // Tanlangan fan bo'yicha kunlik o'rtacha (diagramma uchun)
  const chartData = useMemo(() => {
    const byDay = {};
    rows.forEach((g) => {
      (byDay[g.date] ||= []).push(g.score);
    });
    return Object.keys(byDay)
      .sort()
      .map((d) => ({ label: d.slice(5), grade: Number((byDay[d].reduce((a, b) => a + b, 0) / byDay[d].length).toFixed(2)) }));
  }, [rows]);

  const s = stats.data;
  const avg = rows.length ? rows.reduce((a, g) => a + g.score, 0) / rows.length : null;

  return (
    <>
      <PageHeader
        title={t("pupil.grades.title")}
        subtitle={t("pupil.grades.subtitle")}
        actions={
          <Button icon={Download} loading={busy} onClick={() => download("/stats/pupil/export", { period, ref: refDate, lang }, "mening_natijalarim.xlsx")}>
            {t("common.download_excel")}
          </Button>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <PeriodPicker period={period} onPeriod={setPeriod} refDate={refDate} onRefDate={setRefDate} />
        <Select value={subject} onChange={(e) => setSubject(e.target.value)} className="w-auto min-w-44">
          <option value="">{t("common.all_subjects")}</option>
          {subjects.map(([id, name]) => (
            <option key={id} value={id}>
              {name}
            </option>
          ))}
        </Select>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        <StatCard icon={Star} tone="amber" label={t("stats.avg_grade")} value={fmtNum(avg, 2)} />
        <StatCard tone="blue" label={t("pupil.grades.total")} value={rows.length} />
        <StatCard tone="green" label={t("pupil.grades.best")} value={rows.length ? Math.max(...rows.map((g) => g.score)) : "—"} />
        <StatCard tone="rose" label={t("pupil.grades.lowest")} value={rows.length ? Math.min(...rows.map((g) => g.score)) : "—"} />
      </div>

      <DataState loading={grades.loading} error={grades.error} empty={rows.length === 0} onRetry={grades.reload} emptyProps={{ icon: Star, title: t("pupil.grades.empty"), text: t("pupil.grades.empty_text") }}>
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader title={t("pupil.grades.dynamics")} />
            <CardBody>
              <TrendChart data={chartData} xKey="label" domain={[0, 5]} lines={[{ key: "grade", name: t("stats.avg_grade"), color: COLORS.amber }]} />
            </CardBody>
          </Card>
          <Card>
            <CardHeader title={t("pupil.dashboard.by_subject")} />
            <CardBody>
              <BarsChart
                data={(s?.grades.by_subject || []).map((x) => ({ name: x.names?.[lang] || x.subject, avg: x.avg }))}
                xKey="name"
                domain={[0, 5]}
                bars={[{ key: "avg", name: t("stats.avg_grade"), color: COLORS.blue }]}
              />
            </CardBody>
          </Card>
        </div>

        <Card className="mt-4 overflow-hidden">
          <CardHeader title={t("pupil.grades.list")} className="pb-4" />
          <TableWrap>
            <Table>
              <thead>
                <tr>
                  <Th>{t("common.date")}</Th>
                  <Th>{t("common.subject")}</Th>
                  <Th>{t("common.grade")}</Th>
                  <Th className="hidden sm:table-cell">{t("teacher.grades.type")}</Th>
                  <Th className="hidden md:table-cell">{t("common.comment")}</Th>
                </tr>
              </thead>
              <tbody>
                {paged.slice.map((g) => (
                  <Tr key={g.id}>
                    <Td className="whitespace-nowrap">{formatDate(g.date, lang)}</Td>
                    <Td className="font-semibold text-slate-900 dark:text-white">{sn(g, lang)}</Td>
                    <Td>
                      <ScoreBadge score={g.score} />
                    </Td>
                    <Td className="hidden sm:table-cell">
                      <Badge>{t(`grade_type.${g.grade_type}`)}</Badge>
                    </Td>
                    <Td className="hidden max-w-xs truncate md:table-cell">{g.comment || "—"}</Td>
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
