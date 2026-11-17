"use client";

import { useState } from "react";
import { BookOpen, Pencil, Plus, Settings2, Trash2, UserMinus, UserPlus } from "lucide-react";
import api from "@/lib/api";
import { useAction, useApi, usePaged } from "@/lib/hooks";
import { useI18n } from "@/lib/i18n";
import { sn, subjectLabel } from "@/lib/utils";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { FormField, Input, Select } from "@/components/ui/Field";
import { DataState } from "@/components/ui/Feedback";
import Modal from "@/components/ui/Modal";
import { PageHeader, Pagination, Tabs } from "@/components/ui/Misc";
import { Table, TableWrap, Td, Th, Tr } from "@/components/ui/Table";

/* ===================== FANLAR ===================== */
function SubjectsTab() {
  const { t, lang } = useI18n();
  const { run, busy } = useAction();
  const subjects = useApi("/admin/subjects/", { limit: 500 });
  const [form, setForm] = useState(null); // {id?, name, name_ru, name_en}
  const [del, setDel] = useState(null);

  const save = async (e) => {
    e.preventDefault();
    if (!form) return;
    const body = { name: form.name.trim(), name_ru: form.name_ru.trim(), name_en: form.name_en.trim() };
    const res = await run(() => (form.id ? api.put(`/admin/subjects/${form.id}`, body) : api.post("/admin/subjects/", body)), "common.saved");
    if (res.ok) {
      setForm(null);
      subjects.reload();
    }
  };

  const remove = async () => {
    if (!del) return;
    const res = await run(() => api.delete(`/admin/subjects/${del.id}`), "common.deleted");
    if (res.ok) {
      setDel(null);
      subjects.reload();
    }
  };

  const list = subjects.data || [];
  const paged = usePaged(list);
  return (
    <Card>
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 p-4 dark:border-slate-800">
        <p className="text-sm text-slate-500 dark:text-slate-400">{t("admin.academic.subjects_hint")}</p>
        <Button icon={Plus} onClick={() => setForm({ name: "", name_ru: "", name_en: "" })}>
          {t("admin.academic.add_subject")}
        </Button>
      </div>
      <DataState loading={subjects.loading} error={subjects.error} empty={list.length === 0} onRetry={subjects.reload} emptyProps={{ icon: BookOpen, title: t("admin.academic.no_subjects") }}>
        <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3">
          {paged.slice.map((s) => (
            <div key={s.id} className="flex items-center gap-3 rounded-xl border border-slate-200 p-3.5 dark:border-slate-700">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-300">
                <BookOpen size={19} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-bold text-slate-900 dark:text-white">{subjectLabel(s, lang)}</p>
                <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                  {["uz", "ru", "en"].filter((l) => l !== lang).map((l) => s.names?.[l]).join(" · ")}
                </p>
              </div>
              <Button size="icon" variant="ghost" title={t("common.edit")} onClick={() => setForm({ id: s.id, name: s.name, name_ru: s.name_ru || "", name_en: s.name_en || "" })}>
                <Pencil size={16} />
              </Button>
              <Button size="icon" variant="ghost" className="text-red-500" title={t("common.delete")} onClick={() => setDel(s)}>
                <Trash2 size={16} />
              </Button>
            </div>
          ))}
        </div>
        <Pagination page={paged.page} pageSize={paged.pageSize} total={paged.total} onChange={paged.setPage} />
      </DataState>

      <Modal
        open={!!form}
        onClose={() => setForm(null)}
        title={form?.id ? t("admin.academic.edit_subject") : t("admin.academic.add_subject")}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setForm(null)}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" form="subject-form" loading={busy}>
              {t("common.save")}
            </Button>
          </>
        }
      >
        <form id="subject-form" onSubmit={save} className="space-y-4">
          <p className="rounded-xl bg-blue-50 p-3 text-xs text-blue-700 dark:bg-blue-900/20 dark:text-blue-300">{t("admin.academic.subject_langs_hint")}</p>
          <FormField label={`${t("common.name")} (O'zbekcha)`} required>
            <Input value={form?.name || ""} onChange={(e) => setForm({ ...form, name: e.target.value })} maxLength={100} required autoFocus />
          </FormField>
          <FormField label={`${t("common.name")} (Русский)`} required>
            <Input value={form?.name_ru || ""} onChange={(e) => setForm({ ...form, name_ru: e.target.value })} maxLength={100} required />
          </FormField>
          <FormField label={`${t("common.name")} (English)`} required>
            <Input value={form?.name_en || ""} onChange={(e) => setForm({ ...form, name_en: e.target.value })} maxLength={100} required />
          </FormField>
        </form>
      </Modal>
      <ConfirmDialog open={!!del} loading={busy} onClose={() => setDel(null)} onConfirm={remove} title={t("common.delete")} message={t("admin.academic.delete_subject_confirm", { name: subjectLabel(del, lang) })} />
    </Card>
  );
}

/* ===================== GURUH TAFSILOTI ===================== */
function GroupDetail({ group, onClose, onChanged }) {
  const { t, lang } = useI18n();
  const { run, busy } = useAction();
  const pupils = useApi(`/admin/groups/${group.id}/pupils`);
  const gSubjects = useApi(`/admin/groups/${group.id}/subjects`);
  const assignments = useApi("/admin/assignments/", { group_id: group.id });
  const allSubjects = useApi("/admin/subjects/", { limit: 500 });
  const allPupils = useApi("/admin/users/", { role: "pupil", is_active: true, limit: 1000 });
  const teachers = useApi("/admin/users/", { role: "teacher", is_active: true, limit: 1000 });

  const [pupilToAdd, setPupilToAdd] = useState("");
  const [subjectToAdd, setSubjectToAdd] = useState("");

  const reloadAll = () => {
    pupils.reload();
    gSubjects.reload();
    assignments.reload();
    allPupils.reload();
    onChanged();
  };

  const act = async (fn, ok = "common.saved") => {
    const res = await run(fn, ok);
    if (res.ok) reloadAll();
    return res;
  };

  const usedSubjectIds = (gSubjects.data || []).map((s) => s.subject_id);
  const freeSubjects = (allSubjects.data || []).filter((s) => !usedSubjectIds.includes(s.id));
  const pupilsPaged = usePaged(pupils.data || []);
  const freePupils = (allPupils.data || []).filter((p) => p.group_id !== group.id);
  const teacherOf = (subjectId) => (assignments.data || []).find((a) => a.subject_id === subjectId);
  const teachersFor = (subjectId) => (teachers.data || []).filter((tc) => (tc.subjects || []).some((s) => s.id === subjectId));

  const changeTeacher = async (subjectId, teacherId) => {
    const current = teacherOf(subjectId);
    if (!teacherId) {
      if (current) await act(() => api.delete(`/admin/assignments/${current.id}`));
      return;
    }
    await act(() => api.post("/admin/assignments/", { teacher_id: Number(teacherId), group_id: group.id, subject_id: subjectId }));
  };

  return (
    <Modal open onClose={onClose} title={`${t("common.group")}: ${group.name}`} size="xl" footer={<Button onClick={onClose}>{t("common.done")}</Button>}>
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Fanlar va o'qituvchilar */}
        <section>
          <h4 className="mb-1 font-bold text-slate-900 dark:text-white">{t("admin.academic.group_subjects")}</h4>
          <p className="mb-3 text-xs text-slate-500 dark:text-slate-400">{t("admin.academic.group_subjects_hint")}</p>
          <div className="mb-3 flex gap-2">
            <Select value={subjectToAdd} onChange={(e) => setSubjectToAdd(e.target.value)}>
              <option value="">{t("admin.academic.choose_subject")}</option>
              {freeSubjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {subjectLabel(s, lang)}
                </option>
              ))}
            </Select>
            <Button
              icon={Plus}
              disabled={!subjectToAdd}
              loading={busy}
              onClick={async () => {
                const res = await act(() => api.post(`/admin/groups/${group.id}/subjects`, { subject_id: Number(subjectToAdd) }));
                if (res.ok) setSubjectToAdd("");
              }}
            >
              {t("common.add")}
            </Button>
          </div>
          <div className="space-y-2">
            {(gSubjects.data || []).length === 0 && <p className="py-4 text-center text-sm text-slate-400">{t("admin.academic.no_group_subjects")}</p>}
            {(gSubjects.data || []).map((gs) => {
              const current = teacherOf(gs.subject_id);
              const options = teachersFor(gs.subject_id);
              return (
                <div key={gs.id} className="rounded-xl border border-slate-200 p-3 dark:border-slate-700">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-bold text-slate-900 dark:text-white">{sn(gs, lang)}</p>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-red-500"
                      title={t("common.remove")}
                      onClick={() => act(() => api.delete(`/admin/groups/${group.id}/subjects/${gs.subject_id}`), "common.removed")}
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                  <FormField label={t("common.teacher")} className="mt-2">
                    <Select value={current ? String(current.teacher_id) : ""} disabled={busy} onChange={(e) => changeTeacher(gs.subject_id, e.target.value)}>
                      <option value="">{t("admin.academic.no_teacher")}</option>
                      {options.map((tc) => (
                        <option key={tc.id} value={tc.id}>
                          {tc.full_name}
                        </option>
                      ))}
                    </Select>
                  </FormField>
                  {options.length === 0 && <p className="mt-1.5 text-xs text-amber-600 dark:text-amber-400">{t("admin.academic.no_teacher_for_subject")}</p>}
                </div>
              );
            })}
          </div>
        </section>

        {/* O'quvchilar */}
        <section>
          <h4 className="mb-1 font-bold text-slate-900 dark:text-white">
            {t("common.pupils")} <span className="text-slate-400">({(pupils.data || []).length})</span>
          </h4>
          <p className="mb-3 text-xs text-slate-500 dark:text-slate-400">{t("admin.academic.pupils_hint")}</p>
          <div className="mb-3 flex gap-2">
            <Select value={pupilToAdd} onChange={(e) => setPupilToAdd(e.target.value)}>
              <option value="">{t("admin.academic.choose_pupil")}</option>
              {freePupils.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.full_name}
                  {p.group_name ? ` (${p.group_name})` : ""}
                </option>
              ))}
            </Select>
            <Button
              icon={UserPlus}
              disabled={!pupilToAdd}
              loading={busy}
              onClick={async () => {
                const res = await act(() => api.post(`/admin/groups/${group.id}/pupils`, { pupil_id: Number(pupilToAdd) }));
                if (res.ok) setPupilToAdd("");
              }}
            >
              {t("common.add")}
            </Button>
          </div>
          <div className="max-h-[420px] space-y-1.5 overflow-y-auto pr-1">
            {(pupils.data || []).length === 0 && <p className="py-4 text-center text-sm text-slate-400">{t("admin.academic.no_pupils")}</p>}
            {pupilsPaged.slice.map((p, i) => (
              <div key={p.id} className="flex items-center gap-3 rounded-xl border border-slate-200 px-3 py-2 dark:border-slate-700">
                <span className="w-6 text-xs text-slate-400">{(pupilsPaged.page - 1) * pupilsPaged.pageSize + i + 1}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{p.full_name}</p>
                  <p className="truncate font-mono text-xs text-slate-500">{p.username}</p>
                </div>
                {!p.is_active && <Badge tone="red">{t("common.inactive")}</Badge>}
                <Button
                  size="icon"
                  variant="ghost"
                  className="text-red-500"
                  title={t("admin.academic.remove_pupil")}
                  onClick={() => act(() => api.delete(`/admin/groups/${group.id}/pupils/${p.id}`), "common.removed")}
                >
                  <UserMinus size={16} />
                </Button>
              </div>
            ))}
          </div>
          <Pagination page={pupilsPaged.page} pageSize={pupilsPaged.pageSize} total={pupilsPaged.total} onChange={pupilsPaged.setPage} />
        </section>
      </div>
    </Modal>
  );
}

/* ===================== GURUHLAR ===================== */
function GroupsTab() {
  const { t } = useI18n();
  const { run, busy } = useAction();
  const groups = useApi("/admin/groups/", { limit: 500 });
  const [form, setForm] = useState(null);
  const [del, setDel] = useState(null);
  const [detail, setDetail] = useState(null);

  const save = async (e) => {
    e.preventDefault();
    if (!form) return;
    const res = await run(
      () => (form.id ? api.put(`/admin/groups/${form.id}`, { name: form.name }) : api.post("/admin/groups/", { name: form.name })),
      "common.saved"
    );
    if (res.ok) {
      setForm(null);
      groups.reload();
    }
  };

  const toggle = async (g) => {
    const res = await run(() => api.put(`/admin/groups/${g.id}`, { is_active: !g.is_active }), "common.saved");
    if (res.ok) groups.reload();
  };

  const remove = async () => {
    if (!del) return;
    const res = await run(() => api.delete(`/admin/groups/${del.id}`), "common.deleted");
    if (res.ok) {
      setDel(null);
      groups.reload();
    }
  };

  const list = groups.data || [];
  const paged = usePaged(list);
  return (
    <Card>
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 p-4 dark:border-slate-800">
        <p className="text-sm text-slate-500 dark:text-slate-400">{t("admin.academic.groups_hint")}</p>
        <Button icon={Plus} onClick={() => setForm({ name: "" })}>
          {t("admin.academic.add_group")}
        </Button>
      </div>
      <DataState loading={groups.loading} error={groups.error} empty={list.length === 0} onRetry={groups.reload} emptyProps={{ title: t("admin.academic.no_groups") }}>
        <div className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-3">
          {paged.slice.map((g) => (
            <div key={g.id} className={`rounded-2xl border border-slate-200 p-4 dark:border-slate-700 ${g.is_active ? "" : "opacity-60"}`}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xl font-extrabold text-slate-900 dark:text-white">{g.name}</p>
                  <Badge tone={g.is_active ? "green" : "red"} className="mt-1.5">
                    {g.is_active ? t("common.active") : t("common.inactive")}
                  </Badge>
                </div>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" title={t("common.edit")} onClick={() => setForm({ id: g.id, name: g.name })}>
                    <Pencil size={16} />
                  </Button>
                  <Button size="icon" variant="ghost" className="text-red-500" title={t("common.delete")} onClick={() => setDel(g)}>
                    <Trash2 size={16} />
                  </Button>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <Button size="sm" variant="soft" icon={Settings2} className="flex-1" onClick={() => setDetail(g)}>
                  {t("admin.academic.manage")}
                </Button>
                <Button size="sm" variant="secondary" onClick={() => toggle(g)} disabled={busy}>
                  {g.is_active ? t("admin.users.deactivate") : t("admin.users.activate")}
                </Button>
              </div>
            </div>
          ))}
        </div>
        <Pagination page={paged.page} pageSize={paged.pageSize} total={paged.total} onChange={paged.setPage} />
      </DataState>

      <Modal
        open={!!form}
        onClose={() => setForm(null)}
        title={form?.id ? t("admin.academic.edit_group") : t("admin.academic.add_group")}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setForm(null)}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" form="group-form" loading={busy}>
              {t("common.save")}
            </Button>
          </>
        }
      >
        <form id="group-form" onSubmit={save}>
          <FormField label={t("common.name")} required hint={t("admin.academic.group_name_hint")}>
            <Input value={form?.name || ""} onChange={(e) => setForm({ ...form, name: e.target.value })} maxLength={50} required autoFocus />
          </FormField>
        </form>
      </Modal>
      <ConfirmDialog open={!!del} loading={busy} onClose={() => setDel(null)} onConfirm={remove} title={t("common.delete")} message={t("admin.academic.delete_group_confirm", { name: del?.name })} />
      {detail && <GroupDetail group={detail} onClose={() => setDetail(null)} onChanged={groups.reload} />}
    </Card>
  );
}

/* ===================== TAYINLASHLAR ===================== */
function AssignmentsTab() {
  const { t, lang } = useI18n();
  const { run, busy } = useAction();
  const assignments = useApi("/admin/assignments/");
  const [del, setDel] = useState(null);
  const list = assignments.data || [];
  const paged = usePaged(list);

  const remove = async () => {
    if (!del) return;
    const res = await run(() => api.delete(`/admin/assignments/${del.id}`), "common.removed");
    if (res.ok) {
      setDel(null);
      assignments.reload();
    }
  };

  return (
    <Card className="overflow-hidden">
      <div className="border-b border-slate-100 p-4 text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400">{t("admin.academic.assignments_hint")}</div>
      <DataState loading={assignments.loading} error={assignments.error} empty={list.length === 0} onRetry={assignments.reload} emptyProps={{ title: t("admin.academic.no_assignments"), text: t("admin.academic.no_assignments_text") }}>
        <TableWrap>
          <Table>
            <thead>
              <tr>
                <Th>{t("common.group")}</Th>
                <Th>{t("common.subject")}</Th>
                <Th>{t("common.teacher")}</Th>
                <Th className="text-right">{t("common.actions")}</Th>
              </tr>
            </thead>
            <tbody>
              {paged.slice.map((a) => (
                <Tr key={a.id}>
                  <Td className="font-bold text-slate-900 dark:text-white">{a.group_name}</Td>
                  <Td>
                    <Badge tone="violet">{sn(a, lang)}</Badge>
                  </Td>
                  <Td>{a.teacher_name}</Td>
                  <Td className="text-right">
                    <Button size="icon" variant="ghost" className="text-red-500" title={t("common.remove")} onClick={() => setDel(a)}>
                      <Trash2 size={16} />
                    </Button>
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        </TableWrap>
        <Pagination page={paged.page} pageSize={paged.pageSize} total={paged.total} onChange={paged.setPage} />
      </DataState>
      <ConfirmDialog open={!!del} loading={busy} onClose={() => setDel(null)} onConfirm={remove} title={t("common.remove")} message={t("admin.academic.remove_assignment_confirm", { teacher: del?.teacher_name, group: del?.group_name, subject: sn(del, lang) })} />
    </Card>
  );
}

export default function AcademicPage() {
  const { t } = useI18n();
  const [tab, setTab] = useState("groups");
  return (
    <>
      <PageHeader title={t("admin.academic.title")} subtitle={t("admin.academic.subtitle")} />
      <Tabs
        className="mb-4"
        value={tab}
        onChange={setTab}
        tabs={[
          { value: "groups", label: t("admin.academic.tab_groups") },
          { value: "subjects", label: t("admin.academic.tab_subjects") },
          { value: "assignments", label: t("admin.academic.tab_assignments") },
        ]}
      />
      {tab === "groups" && <GroupsTab />}
      {tab === "subjects" && <SubjectsTab />}
      {tab === "assignments" && <AssignmentsTab />}
    </>
  );
}
