"use client";

import { useEffect, useState } from "react";
import { BookOpen, KeyRound, Pencil, Plus, Search, UserCheck, UserX } from "lucide-react";
import api from "@/lib/api";
import { useAction, useApi } from "@/lib/hooks";
import { useI18n } from "@/lib/i18n";
import { PAGE_SIZE, subjectLabel } from "@/lib/utils";
import CredentialsModal from "@/components/shared/CredentialsModal";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { FormField, Input, Select } from "@/components/ui/Field";
import { DataState } from "@/components/ui/Feedback";
import Modal from "@/components/ui/Modal";
import { PageHeader, Pagination, Tabs } from "@/components/ui/Misc";
import { Table, TableWrap, Td, Th, Tr } from "@/components/ui/Table";

function Avatar({ name }) {
  const initials = name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
  return (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
      {initials}
    </div>
  );
}

export default function UsersPage() {
  const { t, lang } = useI18n();
  const { run, busy } = useAction();

  const [role, setRole] = useState("teacher");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [groupFilter, setGroupFilter] = useState("");
  const [pageState, setPageState] = useState({ key: "", page: 1 });

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null); // tahrirlanayotgan foydalanuvchi
  const [form, setForm] = useState({ first_name: "", last_name: "", group_id: "" });
  const [confirm, setConfirm] = useState(null); // {type: 'reset'|'toggle', user}
  const [credentials, setCredentials] = useState(null);
  const [subjectsUser, setSubjectsUser] = useState(null);

  useEffect(() => {
    const id = setTimeout(() => setSearch(searchInput.trim()), 350);
    return () => clearTimeout(id);
  }, [searchInput]);

  const filterKey = `${role}|${search}|${status}|${groupFilter}`;
  const page = pageState.key === filterKey ? pageState.page : 1;

  // Sahifalash serverda: har safar faqat 20 ta foydalanuvchi olinadi
  const params = {
    role,
    skip: (page - 1) * PAGE_SIZE,
    limit: PAGE_SIZE,
    ...(search ? { search } : {}),
    ...(status !== "all" ? { is_active: status === "active" } : {}),
    ...(role === "pupil" && groupFilter ? { group_id: groupFilter } : {}),
  };
  const users = useApi("/admin/users/", params);
  const groups = useApi("/admin/groups/", { limit: 500 });
  const subjects = useApi("/admin/subjects/", { limit: 500 });

  const visible = users.data || [];
  const total = Number(users.headers?.["x-total-count"] ?? visible.length);

  const openCreate = () => {
    setEditing(null);
    setForm({ first_name: "", last_name: "", group_id: "" });
    setFormOpen(true);
  };

  const openEdit = (user) => {
    setEditing(user);
    setForm({ first_name: user.first_name, last_name: user.last_name, group_id: user.group_id ? String(user.group_id) : "" });
    setFormOpen(true);
  };

  const submitForm = async (e) => {
    e.preventDefault();
    if (editing) {
      const res = await run(async () => {
        await api.put(`/admin/users/${editing.id}`, { first_name: form.first_name, last_name: form.last_name });
        const newGroup = form.group_id ? Number(form.group_id) : null;
        if (editing.role === "pupil" && newGroup && newGroup !== editing.group_id) {
          await api.post(`/admin/groups/${newGroup}/pupils`, { pupil_id: editing.id });
        }
      }, "common.saved");
      if (res.ok) {
        setFormOpen(false);
        users.reload();
      }
      return;
    }
    const body = { first_name: form.first_name, last_name: form.last_name, role };
    if (role === "pupil" && form.group_id) body.group_id = Number(form.group_id);
    const res = await run(() => api.post("/admin/users/", body).then((r) => r.data));
    if (res.ok) {
      setFormOpen(false);
      users.reload();
      setCredentials({
        title: t("admin.users.created_title"),
        name: res.data.full_name,
        username: res.data.username,
        password: res.data.generated_password,
      });
    }
  };

  const doConfirm = async () => {
    if (!confirm) return;
    const { type, user } = confirm;
    if (type === "reset") {
      const res = await run(() => api.put(`/admin/users/${user.id}/reset-password`).then((r) => r.data));
      if (res.ok) {
        setConfirm(null);
        users.reload();
        setCredentials({
          title: t("admin.users.reset_title"),
          name: res.data.full_name,
          username: res.data.username,
          password: res.data.generated_password,
        });
      }
    } else {
      const action = user.is_active ? "deactivate" : "activate";
      const res = await run(() => api.put(`/admin/users/${user.id}/${action}`), user.is_active ? "admin.users.deactivated" : "admin.users.activated");
      if (res.ok) {
        setConfirm(null);
        users.reload();
      }
    }
  };

  const toggleSubject = async (subjectId, has) => {
    if (!subjectsUser) return;
    const res = await run(() =>
      has
        ? api.delete(`/admin/teachers/${subjectsUser.id}/subjects/${subjectId}`)
        : api.post(`/admin/teachers/${subjectsUser.id}/subjects`, { subject_id: subjectId })
    );
    if (res.ok) users.reload();
  };

  // Ochiq modal uchun eng yangi ma'lumot
  const liveSubjectsUser = subjectsUser ? (users.data || []).find((u) => u.id === subjectsUser.id) || subjectsUser : null;

  return (
    <>
      <PageHeader
        title={t("admin.users.title")}
        subtitle={t("admin.users.subtitle")}
        actions={
          <Button icon={Plus} onClick={openCreate}>
            {role === "teacher" ? t("admin.users.add_teacher") : t("admin.users.add_pupil")}
          </Button>
        }
      />

      <Card className="overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 lg:flex-row lg:items-center lg:justify-between dark:border-slate-800">
          <Tabs
            value={role}
            onChange={(v) => {
              setRole(v);
              setGroupFilter("");
            }}
            tabs={[
              { value: "teacher", label: t("role.teacher_plural") },
              { value: "pupil", label: t("role.pupil_plural") }, 
            ]}
          />
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative">
              <Search size={16} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-slate-400" />
              <Input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder={t("common.search")}
                className="pl-9 sm:w-60"
              />
            </div>
            {role === "pupil" && (
              <Select value={groupFilter} onChange={(e) => setGroupFilter(e.target.value)} className="sm:w-40 cursor-pointer">
                <option value="" className="cursor-pointer">
                  {t("admin.users.all_groups")}
                </option>
                {(groups.data || []).map((g) => (
                  <option key={g.id} value={g.id} className="cursor-pointer">
                    {g.name}
                  </option>
                ))}
              </Select>
            )}
            <Select value={status} onChange={(e) => setStatus(e.target.value)} className="sm:w-40 cursor-pointer">
              <option value="all" className="cursor-pointer">
                {t("common.all_statuses")}
              </option>
              <option value="active" className="cursor-pointer">
                {t("common.active")}
              </option>
              <option value="inactive" className="cursor-pointer">
                {t("common.inactive")}
              </option>
            </Select>
          </div>
        </div>

        <DataState
          loading={users.loading}
          error={users.error}
          empty={visible.length === 0}
          onRetry={users.reload}
          emptyProps={{ title: t("admin.users.empty"), text: t("admin.users.empty_text") }}
        >
          <TableWrap>
            <Table>
              <thead>
                <tr>
                  <Th>{t("common.full_name")}</Th>
                  <Th className="hidden md:table-cell">{role === "pupil" ? t("common.group") : t("common.subjects")}</Th>
                  <Th>{t("common.status")}</Th>
                  <Th className="text-right">{t("common.actions")}</Th>
                </tr>
              </thead>
              <tbody>
                {visible.map((u) => (
                  <Tr key={u.id} className={u.is_active ? "" : "opacity-60"}>
                    <Td>
                      <div className="flex items-center gap-3">
                        <Avatar name={u.full_name} />
                        <div className="min-w-0">
                          <p className="truncate font-bold text-slate-900 dark:text-white">{u.full_name}</p>
                          <p className="truncate font-mono text-xs text-slate-500 dark:text-slate-400">{u.username}</p>
                        </div>
                      </div>
                    </Td>
                    <Td className="hidden md:table-cell">
                      {role === "pupil" ? (
                        u.group_name ? <Badge tone="blue">{u.group_name}</Badge> : <span className="text-slate-400">—</span>
                      ) : (u.subjects || []).length ? (
                        <div className="flex max-w-xs flex-wrap gap-1">
                          {u.subjects.map((s) => (
                            <Badge key={s.id} tone="violet">
                              {subjectLabel(s, lang)}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </Td>
                    <Td>
                      <Badge tone={u.is_active ? "green" : "red"}>{u.is_active ? t("common.active") : t("common.inactive")}</Badge>
                    </Td>
                    <Td>
                      <div className="flex justify-end gap-1">
                        {role === "teacher" && (
                          <Button size="icon" variant="ghost" title={t("admin.users.manage_subjects")} onClick={() => setSubjectsUser(u)}>
                            <BookOpen size={17} />
                          </Button>
                        )}
                        <Button size="icon" variant="ghost" title={t("common.edit")} onClick={() => openEdit(u)}>
                          <Pencil size={17} />
                        </Button>
                        <Button size="icon" variant="ghost" title={t("admin.users.reset_password")} onClick={() => setConfirm({ type: "reset", user: u })}>
                          <KeyRound size={17} />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          title={u.is_active ? t("admin.users.deactivate") : t("admin.users.activate")}
                          onClick={() => setConfirm({ type: "toggle", user: u })}
                          className={u.is_active ? "text-red-500 hover:text-red-600" : "text-emerald-600"}
                        >
                          {u.is_active ? <UserX size={17} /> : <UserCheck size={17} />}
                        </Button>
                      </div>
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          </TableWrap>
          <Pagination page={page} pageSize={PAGE_SIZE} total={total} onChange={(p) => setPageState({ key: filterKey, page: p })} />
        </DataState>
      </Card>

      {/* Yaratish / tahrirlash */}
      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? t("admin.users.edit_title") : role === "teacher" ? t("admin.users.add_teacher") : t("admin.users.add_pupil")}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setFormOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" form="user-form" loading={busy}>
              {editing ? t("common.save") : t("common.create")}
            </Button>
          </>
        }
      >
        <form id="user-form" onSubmit={submitForm} className="space-y-4">
          <FormField label={t("common.first_name")} required>
            <Input value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} required maxLength={100} autoFocus />
          </FormField>
          <FormField label={t("common.last_name")} required hint={t("admin.users.latin_hint")}>
            <Input value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} required maxLength={100} />
          </FormField>
          {(editing ? editing.role === "pupil" : role === "pupil") && (
            <FormField label={t("common.group")}>
              <Select value={form.group_id} onChange={(e) => setForm({ ...form, group_id: e.target.value })}>
                <option value="">{t("admin.users.no_group")}</option>
                {(groups.data || [])
                  .filter((g) => g.is_active || String(g.id) === form.group_id)
                  .map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
              </Select>
            </FormField>
          )}
          {!editing && <p className="rounded-xl bg-blue-50 p-3 text-xs text-blue-700 dark:bg-blue-900/20 dark:text-blue-300">{t("admin.users.auto_hint")}</p>}
        </form>
      </Modal>

      <ConfirmDialog
        open={!!confirm}
        loading={busy}
        onClose={() => setConfirm(null)}
        onConfirm={doConfirm}
        danger={confirm?.type === "reset" || confirm?.user?.is_active}
        title={
          confirm?.type === "reset"
            ? t("admin.users.reset_password")
            : confirm?.user?.is_active
              ? t("admin.users.deactivate")
              : t("admin.users.activate")
        }
        message={
          confirm?.type === "reset"
            ? t("admin.users.reset_confirm", { name: confirm.user.full_name })
            : confirm
              ? t(confirm.user.is_active ? "admin.users.deactivate_confirm" : "admin.users.activate_confirm", { name: confirm.user.full_name })
              : ""
        }
      />

      <CredentialsModal data={credentials} onClose={() => setCredentials(null)} />

      {/* O'qituvchiga fan biriktirish */}
      <Modal
        open={!!liveSubjectsUser}
        onClose={() => setSubjectsUser(null)}
        title={liveSubjectsUser ? `${t("admin.users.manage_subjects")}: ${liveSubjectsUser.full_name}` : ""}
        size="sm"
        footer={<Button onClick={() => setSubjectsUser(null)}>{t("common.done")}</Button>}
      >
        <p className="mb-3 text-sm text-slate-500 dark:text-slate-400">{t("admin.users.subjects_hint")}</p>
        {(subjects.data || []).length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-400">{t("admin.users.no_subjects")}</p>
        ) : (
          <div className="space-y-2">
            {(subjects.data || []).map((s) => {
              const has = (liveSubjectsUser?.subjects || []).some((x) => x.id === s.id);
              return (
                <label
                  key={s.id}
                  className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 px-3.5 py-2.5 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
                >
                  <input
                    type="checkbox"
                    checked={has}
                    disabled={busy}
                    onChange={() => toggleSubject(s.id, has)}
                    className="h-4 w-4 accent-blue-600"
                  />
                  <span className="font-semibold text-slate-800 dark:text-slate-100">{subjectLabel(s, lang)}</span>
                </label>
              );
            })}
          </div>
        )}
      </Modal>
    </>
  );
}
