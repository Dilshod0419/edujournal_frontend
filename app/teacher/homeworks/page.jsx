"use client";

import { useMemo, useState } from "react";
import { CalendarClock, CheckCircle2, FileText, Pencil, Plus, Save, Trash2, Users } from "lucide-react";
import api from "@/lib/api";
import { useAction, useApi, usePaged } from "@/lib/hooks";
import { useI18n } from "@/lib/i18n";
import { daysAheadISO, formatDateTime, fromLocalInput, sn, toLocalInput } from "@/lib/utils";
import FileUpload, { FileChip } from "@/components/shared/FileUpload";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { FormField, Input, Select, Textarea } from "@/components/ui/Field";
import { DataState } from "@/components/ui/Feedback";
import Modal from "@/components/ui/Modal";
import { PageHeader, Pagination, ScoreBadge } from "@/components/ui/Misc";

const SCORES = [2, 3, 4, 5];

function defaultForm(classKey) {
  return { classKey, title: "", description: "", start: toLocalInput(), deadline: `${daysAheadISO(2)}T23:59`, file: null };
}

/* ---------- Topshirilgan ishlar ---------- */
function SubmissionsModal({ homework, onClose }) {
  const { t, lang } = useI18n();
  const { run, busy } = useAction();
  const subs = useApi(`/teacher/homeworks/${homework.id}/submissions`);
  const pupils = useApi(`/teacher/groups/${homework.group_id}/pupils`);
  const [drafts, setDrafts] = useState({});

  const list = subs.data || [];
  const subsPaged = usePaged(list);
  const pending = (pupils.data || []).filter((p) => !list.some((s) => s.student_id === p.id));
  const draftOf = (s) => drafts[s.id] ?? { score: s.score ?? "", feedback: s.feedback ?? "" };
  const setDraft = (s, patch) => setDrafts({ ...drafts, [s.id]: { ...draftOf(s), ...patch } });

  const saveGrade = async (s) => {
    const d = draftOf(s);
    if (!d.score) return;
    const res = await run(() => api.put(`/teacher/submissions/${s.id}/grade`, { score: Number(d.score), feedback: d.feedback || null }), "common.saved");
    if (res.ok) subs.reload();
  };

  return (
    <Modal open onClose={onClose} size="xl" title={`${t("teacher.homeworks.submissions")}: ${homework.title}`} footer={<Button onClick={onClose}>{t("common.done")}</Button>}>
      <div className="mb-4 flex flex-wrap gap-2">
        <Badge tone="green">
          {t("teacher.homeworks.submitted")}: {list.length}
        </Badge>
        <Badge tone="amber">
          {t("teacher.homeworks.not_submitted")}: {pending.length}
        </Badge>
        <Badge tone="blue">
          {t("teacher.homeworks.graded")}: {list.filter((s) => s.score != null).length}
        </Badge>
      </div>
      <DataState loading={subs.loading} error={subs.error} empty={list.length === 0} onRetry={subs.reload} emptyProps={{ title: t("teacher.homeworks.no_submissions") }}>
        <div className="space-y-3">
          {subsPaged.slice.map((s) => {
            const d = draftOf(s);
            return (
              <div key={s.id} className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-bold text-slate-900 dark:text-white">{s.student_name}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">{formatDateTime(s.submitted_at, lang)}</span>
                    {s.score != null && <ScoreBadge score={s.score} />}
                  </div>
                </div>
                {s.answer_text && <p className="mt-2 rounded-lg bg-slate-50 p-3 text-sm whitespace-pre-wrap text-slate-700 dark:bg-slate-800 dark:text-slate-200">{s.answer_text}</p>}
                {s.file && <FileChip file={s.file} className="mt-2" />}
                {s.score != null ? (
                  <p className="mt-3 flex items-center gap-2 rounded-lg bg-emerald-50 p-2.5 text-sm text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-200">
                    <CheckCircle2 size={16} className="shrink-0" />
                    <span>
                      {t("teacher.homeworks.graded_locked")}
                      {s.feedback ? ` · ${s.feedback}` : ""}
                    </span>
                  </p>
                ) : (
                <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-end">
                  <div className="flex gap-1.5">
                    {SCORES.map((n) => (
                      <button
                        key={n}
                        onClick={() => setDraft(s, { score: n })}
                        className={`h-10 w-11 rounded-xl border text-base font-extrabold transition ${Number(d.score) === n ? "border-blue-600 bg-blue-600 text-white" : "border-slate-200 text-slate-600 dark:border-slate-700 dark:text-slate-300"}`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                  <Input className="flex-1" placeholder={t("teacher.homeworks.feedback")} value={d.feedback} onChange={(e) => setDraft(s, { feedback: e.target.value })} />
                  <Button icon={Save} loading={busy} disabled={!d.score} onClick={() => saveGrade(s)}>
                    {t("common.save")}
                  </Button>
                </div>
                )}
              </div>
            );
          })}
        </div>
        <Pagination page={subsPaged.page} pageSize={subsPaged.pageSize} total={subsPaged.total} onChange={subsPaged.setPage} />
      </DataState>
      {pending.length > 0 && (
        <div className="mt-5">
          <p className="mb-2 text-sm font-bold text-slate-700 dark:text-slate-200">{t("teacher.homeworks.not_submitted")}</p>
          <div className="flex flex-wrap gap-1.5">
            {pending.map((p) => (
              <Badge key={p.id} tone="amber">
                {p.full_name}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </Modal>
  );
}

/* ---------- Asosiy sahifa ---------- */
export default function HomeworksPage() {
  const { t, lang } = useI18n();
  const { run, busy } = useAction();

  const classes = useApi("/teacher/my-classes/");
  const [filterKey, setFilterKey] = useState("");
  const cls = (classes.data || []).find((c) => `${c.group_id}-${c.subject_id}` === filterKey);
  const homeworks = useApi("/teacher/homeworks/", { limit: 300, ...(cls ? { group_id: cls.group_id, subject_id: cls.subject_id } : {}) });

  const [form, setForm] = useState(null); // {id?, ...}
  const [del, setDel] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [now] = useState(() => Date.now());

  const classList = useMemo(() => classes.data || [], [classes.data]);
  const list = homeworks.data || [];
  const paged = usePaged(list, filterKey);

  const openCreate = () => setForm(defaultForm(classList[0] ? `${classList[0].group_id}-${classList[0].subject_id}` : ""));
  const openEdit = (h) =>
    setForm({
      id: h.id,
      classKey: `${h.group_id}-${h.subject_id}`,
      title: h.title,
      description: h.description || "",
      start: toLocalInput(h.start_date),
      deadline: toLocalInput(h.deadline),
      file: h.file,
    });

  const save = async (e) => {
    e.preventDefault();
    if (!form) return;
    const [group_id, subject_id] = form.classKey.split("-").map(Number);
    const common = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      start_date: fromLocalInput(form.start),
      deadline: fromLocalInput(form.deadline),
      file_id: form.file?.id ?? null,
    };
    const res = await run(() => (form.id ? api.put(`/teacher/homeworks/${form.id}`, common) : api.post("/teacher/homeworks/", { group_id, subject_id, ...common })), "common.saved");
    if (res.ok) {
      setForm(null);
      homeworks.reload();
    }
  };

  const remove = async () => {
    if (!del) return;
    const res = await run(() => api.delete(`/teacher/homeworks/${del.id}`), "common.deleted");
    if (res.ok) {
      setDel(null);
      homeworks.reload();
    }
  };

  const statusOf = (h) => {
    if (now < new Date(h.start_date).getTime()) return { tone: "slate", key: "hw.upcoming" };
    if (now > new Date(h.deadline).getTime()) return { tone: "red", key: "hw.closed" };
    return { tone: "green", key: "hw.open" };
  };

  return (
    <>
      <PageHeader
        title={t("teacher.homeworks.title")}
        subtitle={t("teacher.homeworks.subtitle")}
        actions={
          <Button icon={Plus} onClick={openCreate} disabled={classList.length === 0}>
            {t("teacher.homeworks.add")}
          </Button>
        }
      />

      <div className="mb-4">
        <Select value={filterKey} onChange={(e) => setFilterKey(e.target.value)} className="w-auto min-w-56">
          <option value="">{t("teacher.homeworks.all_classes")}</option>
          {classList.map((c) => (
            <option key={c.id} value={`${c.group_id}-${c.subject_id}`}>
              {c.group_name} · {sn(c, lang)}
            </option>
          ))}
        </Select>
      </div>

      <DataState
        loading={homeworks.loading || classes.loading}
        error={homeworks.error || classes.error}
        empty={list.length === 0}
        onRetry={() => {
          homeworks.reload();
          classes.reload();
        }}
        emptyProps={{ icon: FileText, title: t("teacher.homeworks.empty"), text: classList.length ? t("teacher.homeworks.empty_text") : t("teacher.dashboard.no_classes_text") }}
      >
        <div className="grid gap-4 lg:grid-cols-2">
          {paged.slice.map((h) => {
            const st = statusOf(h);
            return (
              <Card key={h.id} className="flex flex-col p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate text-lg font-extrabold text-slate-900 dark:text-white">{h.title}</h3>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      <Badge tone="blue">{h.group_name}</Badge>
                      <Badge tone="violet">{sn(h, lang)}</Badge>
                    </div>
                  </div>
                  <Badge tone={st.tone}>{t(st.key)}</Badge>
                </div>
                {h.description && <p className="mt-3 line-clamp-3 text-sm whitespace-pre-wrap text-slate-600 dark:text-slate-300">{h.description}</p>}
                <div className="mt-3 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <CalendarClock size={15} />
                  {formatDateTime(h.start_date, lang)} → <span className="font-bold">{formatDateTime(h.deadline, lang)}</span>
                </div>
                {h.file && <FileChip file={h.file} className="mt-3" />}
                <div className="mt-4 flex flex-wrap gap-2 pt-1">
                  <Button size="sm" icon={Users} onClick={() => setViewing(h)}>
                    {t("teacher.homeworks.submissions")}
                  </Button>
                  <Button size="sm" variant="secondary" icon={Pencil} onClick={() => openEdit(h)}>
                    {t("common.edit")}
                  </Button>
                  <Button size="sm" variant="ghost" className="text-red-500" icon={Trash2} onClick={() => setDel(h)}>
                    {t("common.delete")}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
        <Pagination page={paged.page} pageSize={paged.pageSize} total={paged.total} onChange={paged.setPage} />
      </DataState>

      <Modal
        open={!!form}
        onClose={() => setForm(null)}
        title={form?.id ? t("teacher.homeworks.edit") : t("teacher.homeworks.add")}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setForm(null)}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" form="hw-form" loading={busy}>
              {t("common.save")}
            </Button>
          </>
        }
      >
        {form && (
          <form id="hw-form" onSubmit={save} className="space-y-4">
            <FormField label={t("teacher.homeworks.class")} required>
              <Select value={form.classKey} disabled={!!form.id} onChange={(e) => setForm({ ...form, classKey: e.target.value })}>
                {classList.map((c) => (
                  <option key={c.id} value={`${c.group_id}-${c.subject_id}`}>
                    {c.group_name} · {sn(c, lang)}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField label={t("common.title")} required>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} maxLength={200} required />
            </FormField>
            <FormField label={t("common.description")}>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </FormField>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label={t("teacher.homeworks.start")} required>
                <Input type="datetime-local" value={form.start} onChange={(e) => setForm({ ...form, start: e.target.value })} required />
              </FormField>
              <FormField label={t("teacher.homeworks.deadline")} required>
                <Input type="datetime-local" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} required />
              </FormField>
            </div>
            <FormField label={t("teacher.homeworks.attachment")}>
              <FileUpload value={form.file} onChange={(file) => setForm({ ...form, file })} />
            </FormField>
          </form>
        )}
      </Modal>
      <ConfirmDialog open={!!del} loading={busy} onClose={() => setDel(null)} onConfirm={remove} title={t("common.delete")} message={t("teacher.homeworks.delete_confirm", { name: del?.title })} />
      {viewing && <SubmissionsModal homework={viewing} onClose={() => setViewing(null)} />}
    </>
  );
}
