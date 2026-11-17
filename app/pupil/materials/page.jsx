"use client";

import { useMemo, useState } from "react";
import { BookOpen, Search } from "lucide-react";
import { useApi, usePaged } from "@/lib/hooks";
import { useI18n } from "@/lib/i18n";
import { localized, sn } from "@/lib/utils";
import MaterialCard, { TYPE_META } from "@/components/shared/MaterialCard";
import { Input, Select } from "@/components/ui/Field";
import { DataState } from "@/components/ui/Feedback";
import { PageHeader, Pagination } from "@/components/ui/Misc";

export default function PupilMaterials() {
  const { t, lang } = useI18n();
  const materials = useApi("/pupil/materials/");
  const [subject, setSubject] = useState("");
  const [type, setType] = useState("");
  const [query, setQuery] = useState("");

  const all = useMemo(() => materials.data || [], [materials.data]);
  const subjects = useMemo(() => {
    const map = new Map();
    all.forEach((m) => map.set(String(m.subject_id), sn(m, lang)));
    return [...map.entries()].sort((a, b) => a[1].localeCompare(b[1]));
  }, [all, lang]);
  const q = query.trim().toLowerCase();
  const list = all.filter(
    (m) =>
      (!subject || String(m.subject_id) === subject) &&
      (!type || m.material_type === type) &&
      (!q || localized(m, "title", lang).toLowerCase().includes(q) || localized(m, "content", lang).toLowerCase().includes(q))
  );
  const paged = usePaged(list, `${subject}|${type}|${q}`);

  return (
    <>
      <PageHeader title={t("pupil.materials.title")} subtitle={t("pupil.materials.subtitle")} />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative sm:w-72">
          <Search size={16} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-slate-400" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t("common.search")} className="pl-9" />
        </div>
        <Select value={subject} onChange={(e) => setSubject(e.target.value)} className="sm:w-52">
          <option value="">{t("common.all_subjects")}</option>
          {subjects.map(([id, name]) => (
            <option key={id} value={id}>
              {name}
            </option>
          ))}
        </Select>
        <Select value={type} onChange={(e) => setType(e.target.value)} className="sm:w-44">
          <option value="">{t("pupil.materials.all_types")}</option>
          {Object.keys(TYPE_META).map((k) => (
            <option key={k} value={k}>
              {t(`material_type.${k}`)}
            </option>
          ))}
        </Select>
      </div>

      <DataState loading={materials.loading} error={materials.error} empty={list.length === 0} onRetry={materials.reload} emptyProps={{ icon: BookOpen, title: t("pupil.materials.empty"), text: t("pupil.materials.empty_text") }}>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {paged.slice.map((m) => (
            <MaterialCard key={m.id} m={m} />
          ))}
        </div>
        <Pagination page={paged.page} pageSize={paged.pageSize} total={paged.total} onChange={paged.setPage} />
      </DataState>
    </>
  );
}
