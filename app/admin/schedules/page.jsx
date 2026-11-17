"use client";

import { useMemo, useState } from "react";
import { CalendarDays, Pencil, Plus, Trash2 } from "lucide-react";
import api from "@/lib/api";
import { useAction, useApi, usePaged } from "@/lib/hooks";
import { useI18n } from "@/lib/i18n";
import { addMinutes, formatTime, minutesBetween, sn } from "@/lib/utils";
import WeekGrid from "@/components/shared/WeekGrid";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { FormField, Input, Select } from "@/components/ui/Field";
import { DataState } from "@/components/ui/Feedback";
import Modal from "@/components/ui/Modal";
import { PageHeader, Pagination, Tabs } from "@/components/ui/Misc";
import { Table, TableWrap, Td, Th, Tr } from "@/components/ui/Table";

const DURATIONS = [45, 80, 90];
const EMPTY = { group_id: "", subject_id: "", day_of_week: "1", start_time: "09:00", end_time: "09:45" };

export default function SchedulesPage() {
  const { t, lang } = useI18n();
  const { run, busy } = useAction();

  const groups = useApi("/admin/groups/", { limit: 500 });
  const [pickedGroup, setPickedGroup] = useState("");
  const [view, setView] = useState("grid");

  // Tanlanmagan bo'lsa, birinchi faol sinf olinadi
  const groupList = useMemo(() => groups.data || [], [groups.data]);
  const groupId = pickedGroup || (groupList.length ? String(groupList.find((g) => g.is_active)?.id ?? groupList[0].id) : "");

  const schedules = useApi("/admin/schedules/", { group_id: groupId, limit: 500 }, { enabled: !!groupId });
  const gSubjects = useApi(groupId ? `/admin/groups/${groupId}/subjects` : "", {}, { enabled: !!groupId });
  const assignments = useApi("/admin/assignments/", { group_id: groupId }, { enabled: !!groupId });

  const [form, setForm] = useState(null); // {id?, ...}
  const [del, setDel] = useState(null);

  const openCreate = () => setForm({ ...EMPTY, group_id: groupId, subject_id: gSubjects.data?.[0] ? String(gSubjects.data[0].subject_id) : "" });
  const openEdit = (s) =>
    setForm({
      id: s.id,
      group_id: String(s.group_id),
      subject_id: String(s.subject_id),
      day_of_week: String(s.day_of_week),
      start_time: formatTime(s.start_time),
      end_time: formatTime(s.end_time),
    });

  const duration = form ? minutesBetween(form.start_time, form.end_time) : 0;
  const teacher = form ? (assignments.data || []).find((a) => String(a.subject_id) === form.subject_id) : null;

  const setStart = (value) => {
    // Davomiylik saqlanib qoladi: boshlanish vaqti o'zgarsa, tugash vaqti ham siljiydi
    const keep = duration > 0 ? duration : 45;
    setForm({ ...form, start_time: value, end_time: addMinutes(value, keep) || form.end_time });
  };

  const save = async (e) => {
    e.preventDefault();
    if (!form) return;
    const body = {
      group_id: Number(form.group_id),
      subject_id: Number(form.subject_id),
      day_of_week: Number(form.day_of_week),
      start_time: form.start_time,
      end_time: form.end_time,
    };
    const res = await run(() => (form.id ? api.put(`/admin/schedules/${form.id}`, body) : api.post("/admin/schedules/", body)), "common.saved");
    if (res.ok) {
      setForm(null);
      schedules.reload();
    }
  };

  const remove = async () => {
    if (!del) return;
    const res = await run(() => api.delete(`/admin/schedules/${del.id}`), "common.deleted");
    if (res.ok) {
      setDel(null);
      schedules.reload();
    }
  };

  const items = schedules.data || [];
  const paged = usePaged(items, groupId);
  const itemActions = (item) => (
    <>
      <Button size="sm" variant="secondary" icon={Pencil} onClick={() => openEdit(item)}>
        {t("common.edit")}
      </Button>
      <Button size="sm" variant="ghost" className="text-red-500" onClick={() => setDel(item)} aria-label={t("common.delete")}>
        <Trash2 size={14} />
      </Button>
    </>
  );

  return (
    <>
      <PageHeader
        title={t("admin.schedules.title")}
        subtitle={t("admin.schedules.subtitle")}
        actions={
          <Button icon={Plus} onClick={openCreate} disabled={!groupId}>
            {t("admin.schedules.add")}
          </Button>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Select value={groupId} onChange={(e) => setPickedGroup(e.target.value)} className="w-auto min-w-40">
          {groupList.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
              {g.is_active ? "" : ` (${t("common.inactive")})`}
            </option>
          ))}
        </Select>
        <Tabs
          value={view}
          onChange={setView}
          tabs={[
            { value: "grid", label: t("admin.schedules.view_week") },
            { value: "list", label: t("admin.schedules.view_list") },
          ]}
        />
      </div>

      {groupList.length === 0 && !groups.loading ? (
        <Card>
          <DataState empty emptyProps={{ icon: CalendarDays, title: t("admin.schedules.no_groups"), text: t("admin.schedules.no_groups_text") }} />
        </Card>
      ) : (
        <DataState loading={schedules.loading} error={schedules.error} empty={false} onRetry={schedules.reload}>
          {view === "grid" ? (
            <WeekGrid items={items} secondary="teacher_name" actions={itemActions} />
          ) : (
            <Card className="overflow-hidden">
              {items.length === 0 ? (
                <DataState empty emptyProps={{ icon: CalendarDays, title: t("admin.schedules.empty") }} />
              ) : (
                <TableWrap>
                  <Table>
                    <thead>
                      <tr>
                        <Th>{t("common.day")}</Th>
                        <Th>{t("common.time")}</Th>
                        <Th>{t("common.subject")}</Th>
                        <Th>{t("common.teacher")}</Th>
                        <Th className="text-right">{t("common.actions")}</Th>
                      </tr>
                    </thead>
                    <tbody>
                      {paged.slice.map((s) => (
                        <Tr key={s.id}>
                          <Td className="font-semibold">{t(`day.${s.day_of_week}`)}</Td>
                          <Td>
                            {formatTime(s.start_time)} – {formatTime(s.end_time)} <Badge tone="blue">{s.duration_minutes} {t("common.min")}</Badge>
                          </Td>
                          <Td className="font-bold text-slate-900 dark:text-white">{sn(s, lang)}</Td>
                          <Td>{s.teacher_name}</Td>
                          <Td>
                            <div className="flex justify-end gap-1">{itemActions(s)}</div>
                          </Td>
                        </Tr>
                      ))}
                    </tbody>
                  </Table>
                </TableWrap>
              )}
              {items.length > 0 && <Pagination page={paged.page} pageSize={paged.pageSize} total={paged.total} onChange={paged.setPage} />}
            </Card>
          )}
        </DataState>
      )}

      <Modal
        open={!!form}
        onClose={() => setForm(null)}
        title={form?.id ? t("admin.schedules.edit") : t("admin.schedules.add")}
        footer={
          <>
            <Button variant="secondary" onClick={() => setForm(null)}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" form="schedule-form" loading={busy} disabled={!form?.subject_id || duration <= 0}>
              {t("common.save")}
            </Button>
          </>
        }
      >
        {form && (
          <form id="schedule-form" onSubmit={save} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label={t("common.group")} required>
                <Select value={form.group_id} disabled>
                  {groupList.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </Select>
              </FormField>
              <FormField label={t("common.subject")} required>
                <Select value={form.subject_id} onChange={(e) => setForm({ ...form, subject_id: e.target.value })} required>
                  <option value="" disabled>
                    {t("admin.academic.choose_subject")}
                  </option>
                  {(gSubjects.data || []).map((s) => (
                    <option key={s.id} value={s.subject_id}>
                      {sn(s, lang)}
                    </option>
                  ))}
                </Select>
              </FormField>
            </div>
            {(gSubjects.data || []).length === 0 && <p className="rounded-xl bg-amber-50 p-3 text-xs text-amber-800 dark:bg-amber-900/20 dark:text-amber-200">{t("admin.schedules.no_subjects_hint")}</p>}
            <FormField label={t("common.day")} required>
              <Select value={form.day_of_week} onChange={(e) => setForm({ ...form, day_of_week: e.target.value })}>
                {[1, 2, 3, 4, 5, 6, 7].map((d) => (
                  <option key={d} value={d}>
                    {t(`day.${d}`)}
                  </option>
                ))}
              </Select>
            </FormField>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label={t("admin.schedules.start")} required>
                <Input type="time" value={form.start_time} onChange={(e) => setStart(e.target.value)} required />
              </FormField>
              <FormField label={t("admin.schedules.end")} required>
                <Input type="time" value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })} required />
              </FormField>
            </div>
            <div>
              <p className="mb-1.5 text-sm font-semibold text-slate-700 dark:text-slate-300">{t("admin.schedules.duration")}</p>
              <div className="flex flex-wrap items-center gap-2">
                {DURATIONS.map((m) => (
                  <Button key={m} size="sm" variant={duration === m ? "primary" : "secondary"} onClick={() => setForm({ ...form, end_time: addMinutes(form.start_time, m) || form.end_time })}>
                    {m} {t("common.min")}
                  </Button>
                ))}
                <span className={`text-sm font-bold ${duration > 0 ? "text-slate-700 dark:text-slate-200" : "text-red-500"}`}>
                  = {duration > 0 ? duration : "?"} {t("common.min")}
                </span>
              </div>
              {duration <= 0 && <p className="mt-1 text-xs text-red-500">{t("admin.schedules.bad_time")}</p>}
            </div>
            <div className="rounded-xl bg-slate-50 p-3 text-sm dark:bg-slate-800/60">
              <span className="text-slate-500 dark:text-slate-400">{t("common.teacher")}: </span>
              {teacher ? (
                <span className="font-bold text-slate-900 dark:text-white">{teacher.teacher_name}</span>
              ) : (
                <span className="font-semibold text-amber-600 dark:text-amber-400">{t("admin.schedules.no_teacher_hint")}</span>
              )}
            </div>
          </form>
        )}
      </Modal>
      <ConfirmDialog open={!!del} loading={busy} onClose={() => setDel(null)} onConfirm={remove} title={t("common.delete")} message={t("admin.schedules.delete_confirm")} />
    </>
  );
}
