"use client";

import { useMemo, useState } from "react";
import { CalendarClock, CheckCircle2, FileText, Send } from "lucide-react";
import api from "@/lib/api";
import { useAction, useApi, usePaged } from "@/lib/hooks";
import { useI18n } from "@/lib/i18n";
import { formatDateTime, sn } from "@/lib/utils";
import FileUpload, { FileChip } from "@/components/shared/FileUpload";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { FormField, Textarea } from "@/components/ui/Field";
import { DataState } from "@/components/ui/Feedback";
import Modal from "@/components/ui/Modal";
import { PageHeader, Pagination, ScoreBadge, Tabs } from "@/components/ui/Misc";

function timeLeft(deadline, now, t) {
  const diff = new Date(deadline).getTime() - now;
  if (diff <= 0) return null;
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return t("hw.minutes_left", { n: Math.max(1, Math.floor(diff / 60000)) });
  if (hours < 48) return t("hw.hours_left", { n: hours });
  return t("hw.days_left", { n: Math.floor(hours / 24) });
}

export default function PupilHomeworks() {
  const { t, lang } = useI18n();
  const { run, busy } = useAction();

  const homeworks = useApi("/pupil/homeworks/");
  const submissions = useApi("/pupil/my-submissions/");
  const [filter, setFilter] = useState("all");
  const [form, setForm] = useState(null); // {homework, answer_text, file}
  const [now] = useState(() => Date.now());

  const subByHw = useMemo(() => Object.fromEntries((submissions.data || []).map((s) => [s.homework_id, s])), [submissions.data]);

  const items = useMemo(() => {
    return (homeworks.data || [])
      .filter((h) => new Date(h.start_date).getTime() <= now)
      .map((h) => {
        const sub = subByHw[h.id];
        const expired = new Date(h.deadline).getTime() < now;
        let state = "pending";
        if (sub?.score != null) state = "graded";
        else if (sub) state = "submitted";
        else if (expired) state = "overdue";
        return { h, sub, expired, state };
      });
  }, [homeworks.data, subByHw, now]);

  const counts = items.reduce((acc, i) => ({ ...acc, [i.state]: (acc[i.state] || 0) + 1 }), {});
  const visible = items.filter((i) => filter === "all" || i.state === filter);
  const paged = usePaged(visible, filter);

  const openForm = (item) => setForm({ homework: item.h, answer_text: item.sub?.answer_text || "", file: item.sub?.file || null });

  const submit = async (e) => {
    e.preventDefault();
    if (!form) return;
    const res = await run(
      () => api.post(`/pupil/homeworks/${form.homework.id}/submit`, { answer_text: form.answer_text.trim() || null, file_id: form.file?.id ?? null }),
      "pupil.homeworks.sent"
    );
    if (res.ok) {
      setForm(null);
      submissions.reload();
    }
  };

  const STATE_BADGE = {
    pending: { tone: "amber", key: "pupil.homeworks.state_pending" },
    submitted: { tone: "blue", key: "pupil.homeworks.state_submitted" },
    graded: { tone: "green", key: "pupil.homeworks.state_graded" },
    overdue: { tone: "red", key: "pupil.homeworks.state_overdue" },
  };

  return (
    <>
      <PageHeader title={t("pupil.homeworks.title")} subtitle={t("pupil.homeworks.subtitle")} />

      <Tabs
        className="mb-4"
        value={filter}
        onChange={setFilter}
        tabs={[
          { value: "all", label: t("common.all"), count: items.length },
          { value: "pending", label: t("pupil.homeworks.state_pending"), count: counts.pending || 0 },
          { value: "submitted", label: t("pupil.homeworks.state_submitted"), count: counts.submitted || 0 },
          { value: "graded", label: t("pupil.homeworks.state_graded"), count: counts.graded || 0 },
          { value: "overdue", label: t("pupil.homeworks.state_overdue"), count: counts.overdue || 0 },
        ]}
      />

      <DataState
        loading={homeworks.loading || submissions.loading}
        error={homeworks.error || submissions.error}
        empty={visible.length === 0}
        onRetry={() => {
          homeworks.reload();
          submissions.reload();
        }}
        emptyProps={{ icon: FileText, title: t("pupil.homeworks.empty"), text: t("pupil.homeworks.empty_text") }}
      >
        <div className="grid gap-4 lg:grid-cols-2">
          {paged.slice.map(({ h, sub, expired, state }) => {
            const badge = STATE_BADGE[state];
            const left = timeLeft(h.deadline, now, t);
            const canSubmit = !expired && state !== "graded";
            return (
              <Card key={h.id} className="flex flex-col p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">{h.title}</h3>
                    <Badge tone="violet" className="mt-1">
                      {sn(h, lang)}
                    </Badge>
                  </div>
                  <Badge tone={badge.tone}>{t(badge.key)}</Badge>
                </div>
                {h.description && <p className="mt-3 text-sm whitespace-pre-wrap text-slate-600 dark:text-slate-300">{h.description}</p>}
                <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarClock size={15} />
                    {t("pupil.homeworks.deadline")}: <b>{formatDateTime(h.deadline, lang)}</b>
                  </span>
                  {left && state === "pending" && <Badge tone="amber">{left}</Badge>}
                </div>
                {h.file && (
                  <div className="mt-3">
                    <p className="mb-1 text-xs font-bold text-slate-500 uppercase dark:text-slate-400">{t("pupil.homeworks.teacher_file")}</p>
                    <FileChip file={h.file} />
                  </div>
                )}

                {sub && (
                  <div className="mt-3 rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60">
                    <div className="flex items-center justify-between gap-2">
                      <p className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-700 dark:text-slate-200">
                        <CheckCircle2 size={16} className="text-emerald-600" />
                        {t("pupil.homeworks.my_answer")}
                      </p>
                      {sub.score != null && <ScoreBadge score={sub.score} />}
                    </div>
                    <p className="mt-0.5 text-xs text-slate-500">{formatDateTime(sub.submitted_at, lang)}</p>
                    {sub.answer_text && <p className="mt-2 text-sm whitespace-pre-wrap text-slate-700 dark:text-slate-300">{sub.answer_text}</p>}
                    {sub.file && <FileChip file={sub.file} className="mt-2" />}
                    {sub.feedback && (
                      <p className="mt-2 rounded-lg bg-blue-50 p-2.5 text-sm text-blue-800 dark:bg-blue-900/20 dark:text-blue-200">
                        <b>{t("pupil.homeworks.feedback")}:</b> {sub.feedback}
                      </p>
                    )}
                  </div>
                )}

                {canSubmit && (
                  <div className="mt-4">
                    <Button icon={Send} onClick={() => openForm({ h, sub })}>
                      {sub ? t("pupil.homeworks.resubmit") : t("pupil.homeworks.submit")}
                    </Button>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
        <Pagination page={paged.page} pageSize={paged.pageSize} total={paged.total} onChange={paged.setPage} />
      </DataState>

      <Modal
        open={!!form}
        onClose={() => setForm(null)}
        title={form ? form.homework.title : ""}
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setForm(null)}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" form="submit-form" icon={Send} loading={busy} disabled={!form?.file && !form?.answer_text.trim()}>
              {t("pupil.homeworks.send")}
            </Button>
          </>
        }
      >
        {form && (
          <form id="submit-form" onSubmit={submit} className="space-y-4">
            <FormField label={t("pupil.homeworks.answer_text")}>
              <Textarea rows={5} value={form.answer_text} onChange={(e) => setForm({ ...form, answer_text: e.target.value })} />
            </FormField>
            <FormField label={t("pupil.homeworks.attach_file")} hint={t("pupil.homeworks.need_one")}>
              <FileUpload value={form.file} onChange={(file) => setForm({ ...form, file })} />
            </FormField>
          </form>
        )}
      </Modal>
    </>
  );
}
