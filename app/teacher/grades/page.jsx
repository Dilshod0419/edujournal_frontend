"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Star } from "lucide-react";
import api from "@/lib/api";
import { useAction, useApi, usePaged } from "@/lib/hooks";
import { useI18n } from "@/lib/i18n";
import { daysAgoISO, formatDate, sn, todayISO } from "@/lib/utils";
import Badge from "@/components/ui/Badge";
import { Card, CardHeader } from "@/components/ui/Card";
import { FormField, Input, Select } from "@/components/ui/Field";
import { DataState, PageLoader } from "@/components/ui/Feedback";
import { PageHeader, Pagination, ScoreBadge } from "@/components/ui/Misc";
import { Table, TableWrap, Td, Th, Tr } from "@/components/ui/Table";

const SCORES = [2, 3, 4, 5];
const SCORE_STYLE = {
  2: "hover:bg-red-600 hover:text-white",
  3: "hover:bg-amber-500 hover:text-white",
  4: "hover:bg-blue-600 hover:text-white",
  5: "hover:bg-emerald-600 hover:text-white",
};

function GradesInner() {
  const { t, lang } = useI18n();
  const { run, busy } = useAction();
  const params = useSearchParams();

  const classes = useApi("/teacher/my-classes/");
  const list = useMemo(() => classes.data || [], [classes.data]);

  const [pickedKey, setPickedKey] = useState(params.get("group") && params.get("subject") ? `${params.get("group")}-${params.get("subject")}` : "");
  const [date, setDate] = useState(todayISO());
  const [type, setType] = useState("daily");
  const [historyDays, setHistoryDays] = useState("30");

  const classKey = pickedKey || (list[0] ? `${list[0].group_id}-${list[0].subject_id}` : "");
  const cls = list.find((c) => `${c.group_id}-${c.subject_id}` === classKey);

  const rangeStart = daysAgoISO(Number(historyDays)) < date ? daysAgoISO(Number(historyDays)) : date;
  const pupils = useApi(cls ? `/teacher/groups/${cls.group_id}/pupils` : "", {}, { enabled: !!cls });
  const grades = useApi("/teacher/grades/", { group_id: cls?.group_id, subject_id: cls?.subject_id, date_from: rangeStart }, { enabled: !!cls });

  const nameOf = useMemo(() => Object.fromEntries((pupils.data || []).map((p) => [p.id, p.full_name])), [pupils.data]);
  const all = useMemo(() => grades.data || [], [grades.data]);
  const todays = all.filter((g) => g.date === date);
  const paged = usePaged(all, `${classKey}|${historyDays}|${date}`);

  // Baho bir marta qo'yiladi: keyin o'zgartirib ham, o'chirib ham bo'lmaydi
  const addGrade = async (studentId, score) => {
    const res = await run(() => api.post("/teacher/grades/", { student_id: studentId, subject_id: cls.subject_id, date, score, grade_type: type }));
    grades.reload(); // xato bo'lsa ham (allaqachon baholangan) holatni yangilaymiz
    return res;
  };

  return (
    <>
      <PageHeader title={t("teacher.grades.title")} subtitle={t("teacher.grades.subtitle")} />

      <DataState
        loading={classes.loading}
        error={classes.error}
        empty={list.length === 0}
        onRetry={classes.reload}
        emptyProps={{ icon: Star, title: t("teacher.dashboard.no_classes"), text: t("teacher.dashboard.no_classes_text") }}
      >
        <Card className="p-4 sm:p-5">
          <div className="grid gap-4 md:grid-cols-3">
            <FormField label={t("teacher.grades.class")}>
              <Select value={classKey} onChange={(e) => setPickedKey(e.target.value)}>
                {list.map((c) => (
                  <option key={c.id} value={`${c.group_id}-${c.subject_id}`}>
                    {c.group_name} · {sn(c, lang)}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField label={t("common.date")}>
              <Input type="date" value={date} max={todayISO()} onChange={(e) => e.target.value && setDate(e.target.value)} />
            </FormField>
            <FormField label={t("teacher.grades.type")}>
              <Select value={type} onChange={(e) => setType(e.target.value)}>
                {["daily", "quiz", "exam"].map((k) => (
                  <option key={k} value={k}>
                    {t(`grade_type.${k}`)}
                  </option>
                ))}
              </Select>
            </FormField>
          </div>
        </Card>

        <Card className="mt-4 overflow-hidden">
          <CardHeader title={t("teacher.grades.journal")} subtitle={t("teacher.grades.journal_hint")} className="pb-4" />
          <DataState loading={pupils.loading} error={pupils.error} empty={(pupils.data || []).length === 0} onRetry={pupils.reload} emptyProps={{ title: t("teacher.attendance.no_pupils") }}>
            <ul className="divide-y divide-slate-100 border-t border-slate-100 dark:divide-slate-800 dark:border-slate-800">
              {(pupils.data || []).map((p, i) => {
                const mine = todays.filter((g) => g.student_id === p.id);
                const done = mine.find((g) => g.grade_type === type);
                return (
                  <li key={p.id} className="flex flex-col gap-3 px-4 py-3 md:flex-row md:items-center">
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <span className="w-6 text-sm text-slate-400">{i + 1}</span>
                      <span className="truncate font-semibold text-slate-900 dark:text-white">{p.full_name}</span>
                      <div className="flex flex-wrap gap-1">
                        {mine.map((g) => (
                          <span key={g.id} title={t(`grade_type.${g.grade_type}`)}>
                            <ScoreBadge score={g.score} />
                          </span>
                        ))}
                      </div>
                    </div>
                    {done ? (
                      <Badge tone="green" className="self-start md:self-auto">
                        <CheckCircle2 size={13} />
                        {t("teacher.grades.already_graded")}
                      </Badge>
                    ) : (
                      <div className="flex gap-1.5">
                        {SCORES.map((s) => (
                          <button
                            key={s}
                            disabled={busy}
                            onClick={() => addGrade(p.id, s)}
                            className={`h-10 w-12 rounded-xl border border-slate-200 text-base font-extrabold text-slate-600 transition active:scale-95 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 ${SCORE_STYLE[s]}`}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </DataState>
        </Card>

        <Card className="mt-4 overflow-hidden">
          <CardHeader
            title={t("teacher.grades.history")}
            className="pb-4"
            action={
              <Select value={historyDays} onChange={(e) => setHistoryDays(e.target.value)} className="w-auto">
                {[7, 30, 90, 365].map((d) => (
                  <option key={d} value={d}>
                    {t("teacher.grades.last_days", { n: d })}
                  </option>
                ))}
              </Select>
            }
          />
          <DataState loading={grades.loading} error={grades.error} empty={all.length === 0} onRetry={grades.reload} emptyProps={{ title: t("teacher.grades.no_grades") }}>
            <TableWrap>
              <Table>
                <thead>
                  <tr>
                    <Th>{t("common.date")}</Th>
                    <Th>{t("common.pupil")}</Th>
                    <Th>{t("common.grade")}</Th>
                    <Th className="hidden sm:table-cell">{t("teacher.grades.type")}</Th>
                    <Th className="hidden md:table-cell">{t("common.comment")}</Th>
                  </tr>
                </thead>
                <tbody>
                  {paged.slice.map((g) => (
                    <Tr key={g.id}>
                      <Td className="whitespace-nowrap">{formatDate(g.date, lang)}</Td>
                      <Td className="font-semibold text-slate-900 dark:text-white">{nameOf[g.student_id] || `#${g.student_id}`}</Td>
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
          </DataState>
        </Card>
      </DataState>
    </>
  );
}

export default function GradesPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <GradesInner />
    </Suspense>
  );
}
