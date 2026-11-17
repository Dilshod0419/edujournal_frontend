"use client";

import { useState } from "react";
import { Check, FileText, Pencil, Plus, Trash2 } from "lucide-react";
import api from "@/lib/api";
import { useAction, useApi, usePaged } from "@/lib/hooks";
import { useI18n } from "@/lib/i18n";
import { cn, sn } from "@/lib/utils";
import { useToast } from "@/components/ui/Toast";
import FileUpload from "@/components/shared/FileUpload";
import MaterialCard, { TYPE_META } from "@/components/shared/MaterialCard";
import Button from "@/components/ui/Button";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { FormField, Input, Select, Textarea } from "@/components/ui/Field";
import { DataState } from "@/components/ui/Feedback";
import Modal from "@/components/ui/Modal";
import { PageHeader, Pagination } from "@/components/ui/Misc";

const LANG_FIELDS = {
  uz: { title: "title", content: "content", label: "O'zbekcha" },
  ru: { title: "title_ru", content: "content_ru", label: "Русский" },
  en: { title: "title_en", content: "content_en", label: "English" },
};
const EMPTY_FORM = { subject_id: "", material_type: "article", title: "", title_ru: "", title_en: "", content: "", content_ru: "", content_en: "", file: null };

export default function MaterialsPage() {
  const { t, lang } = useI18n();
  const toast = useToast();
  const { run, busy } = useAction();

  const subjects = useApi("/teacher/my-subjects/");
  const [subjectId, setSubjectId] = useState("");
  const materials = useApi("/teacher/materials/", { limit: 500, ...(subjectId ? { subject_id: subjectId } : {}) });

  const [form, setForm] = useState(null);
  const [tab, setTab] = useState("uz");
  const [del, setDel] = useState(null);

  const subjectList = subjects.data || [];
  const list = materials.data || [];
  const paged = usePaged(list, subjectId);

  const openCreate = () => {
    setTab("uz");
    setForm({ ...EMPTY_FORM, subject_id: subjectId || (subjectList[0] ? String(subjectList[0].subject_id) : "") });
  };
  const openEdit = (m) => {
    setTab("uz");
    setForm({
      id: m.id,
      subject_id: String(m.subject_id),
      material_type: m.material_type,
      title: m.title || "",
      title_ru: m.title_ru || "",
      title_en: m.title_en || "",
      content: m.content || "",
      content_ru: m.content_ru || "",
      content_en: m.content_en || "",
      file: m.file,
    });
  };

  const isFile = form?.material_type === "file";
  const isLink = form?.material_type === "link";
  // Havola tilga bog'liq emas; fayl turida matn ixtiyoriy; termin/maqola matni uch tilda majburiy
  const needsContent = form && !isFile && !isLink;

  const langComplete = (l) => {
    if (!form) return false;
    const f = LANG_FIELDS[l];
    return form[f.title].trim() !== "" && (!needsContent || form[f.content].trim() !== "");
  };

  const save = async (e) => {
    e.preventDefault();
    if (!form) return;
    // Barcha tillar to'liq to'ldirilganini tekshiramiz (yashirin tabdagi maydonlar uchun brauzer tekshiruvi ishlamaydi)
    if (isLink && !form.content.trim()) {
      setTab("uz");
      toast.error(t("teacher.materials.url_required"));
      return;
    }
    const missing = Object.keys(LANG_FIELDS).find((l) => !langComplete(l));
    if (missing) {
      setTab(missing);
      toast.error(t("teacher.materials.fill_all_langs", { lang: LANG_FIELDS[missing].label }));
      return;
    }
    const body = {
      material_type: form.material_type,
      title: form.title.trim(),
      title_ru: form.title_ru.trim(),
      title_en: form.title_en.trim(),
      content: form.content.trim(),
      content_ru: isLink || isFile ? null : form.content_ru.trim(),
      content_en: isLink || isFile ? null : form.content_en.trim(),
      file_id: isFile ? form.file?.id ?? null : null,
    };
    if (isLink) body.content = form.content.trim();
    const res = await run(
      () => (form.id ? api.put(`/teacher/materials/${form.id}`, body) : api.post("/teacher/materials/", { subject_id: Number(form.subject_id), ...body })),
      "common.saved"
    );
    if (res.ok) {
      setForm(null);
      materials.reload();
    }
  };

  const remove = async () => {
    if (!del) return;
    const res = await run(() => api.delete(`/teacher/materials/${del.id}`), "common.deleted");
    if (res.ok) {
      setDel(null);
      materials.reload();
    }
  };

  const f = LANG_FIELDS[tab];

  return (
    <>
      <PageHeader
        title={t("teacher.materials.title")}
        subtitle={t("teacher.materials.subtitle")}
        actions={
          <Button icon={Plus} onClick={openCreate} disabled={subjectList.length === 0}>
            {t("teacher.materials.add")}
          </Button>
        }
      />

      <div className="mb-4">
        <Select value={subjectId} onChange={(e) => setSubjectId(e.target.value)} className="w-auto min-w-48">
          <option value="">{t("common.all_subjects")}</option>
          {subjectList.map((s) => (
            <option key={s.id} value={s.subject_id}>
              {sn(s, lang)}
            </option>
          ))}
        </Select>
      </div>

      <DataState
        loading={materials.loading || subjects.loading}
        error={materials.error || subjects.error}
        empty={list.length === 0}
        onRetry={() => {
          materials.reload();
          subjects.reload();
        }}
        emptyProps={{ icon: FileText, title: t("teacher.materials.empty"), text: subjectList.length ? t("teacher.materials.empty_text") : t("teacher.materials.no_subjects") }}
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {paged.slice.map((m) => (
            <MaterialCard
              key={m.id}
              m={m}
              actions={
                <>
                  <Button size="sm" variant="secondary" icon={Pencil} onClick={() => openEdit(m)}>
                    {t("common.edit")}
                  </Button>
                  <Button size="sm" variant="ghost" className="text-red-500" icon={Trash2} onClick={() => setDel(m)}>
                    {t("common.delete")}
                  </Button>
                </>
              }
            />
          ))}
        </div>
        <Pagination page={paged.page} pageSize={paged.pageSize} total={paged.total} onChange={paged.setPage} />
      </DataState>

      <Modal
        open={!!form}
        onClose={() => setForm(null)}
        title={form?.id ? t("teacher.materials.edit") : t("teacher.materials.add")}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setForm(null)}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" form="material-form" loading={busy} disabled={isFile && !form?.file}>
              {t("common.save")}
            </Button>
          </>
        }
      >
        {form && (
          <form id="material-form" onSubmit={save} noValidate className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label={t("common.subject")} required>
                <Select value={form.subject_id} disabled={!!form.id} onChange={(e) => setForm({ ...form, subject_id: e.target.value })}>
                  {subjectList.map((s) => (
                    <option key={s.id} value={s.subject_id}>
                      {sn(s, lang)}
                    </option>
                  ))}
                </Select>
              </FormField>
              <FormField label={t("teacher.materials.type")} required>
                <Select value={form.material_type} onChange={(e) => setForm({ ...form, material_type: e.target.value })}>
                  {Object.keys(TYPE_META).map((k) => (
                    <option key={k} value={k}>
                      {t(`material_type.${k}`)}
                    </option>
                  ))}
                </Select>
              </FormField>
            </div>

            <p className="rounded-xl bg-blue-50 p-3 text-xs text-blue-700 dark:bg-blue-900/20 dark:text-blue-300">{t("teacher.materials.langs_hint")}</p>

            {/* Til tablari: har birida sarlavha (va matn) kiritiladi */}
            <div className="flex gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
              {Object.entries(LANG_FIELDS).map(([l, info]) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => setTab(l)}
                  className={cn(
                    "flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-bold transition",
                    tab === l ? "bg-white text-blue-700 shadow-sm dark:bg-slate-900 dark:text-blue-300" : "text-slate-500 dark:text-slate-400"
                  )}
                >
                  {info.label}
                  {langComplete(l) && <Check size={14} className="text-emerald-600" />}
                </button>
              ))}
            </div>

            <FormField label={`${t("common.title")} (${f.label})`} required>
              <Input value={form[f.title]} onChange={(e) => setForm({ ...form, [f.title]: e.target.value })} maxLength={200} />
            </FormField>

            {isFile && (
              <FormField label={t("teacher.materials.file")} required>
                <FileUpload value={form.file} onChange={(file) => setForm({ ...form, file })} />
              </FormField>
            )}
            {isLink && tab === "uz" && (
              <FormField label={t("teacher.materials.url")} required hint={t("teacher.materials.url_hint")}>
                <Input type="url" placeholder="https://" value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} />
              </FormField>
            )}
            {needsContent && (
              <FormField label={`${t("teacher.materials.content")} (${f.label})`} required>
                <Textarea rows={7} value={form[f.content]} onChange={(e) => setForm({ ...form, [f.content]: e.target.value })} />
              </FormField>
            )}
          </form>
        )}
      </Modal>
      <ConfirmDialog open={!!del} loading={busy} onClose={() => setDel(null)} onConfirm={remove} title={t("common.delete")} message={t("teacher.materials.delete_confirm", { name: del?.title })} />
    </>
  );
}
