"use client";

import { ExternalLink, FileText, Lightbulb, Link2, Paperclip } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { localized, sn } from "@/lib/utils";
import { FileChip } from "@/components/shared/FileUpload";
import Badge from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";

export const TYPE_META = {
  term: { icon: Lightbulb, tone: "amber" },
  article: { icon: FileText, tone: "blue" },
  link: { icon: Link2, tone: "green" },
  file: { icon: Paperclip, tone: "violet" },
};

/** Material kartasi: sarlavha va matn tanlangan til bo'yicha ko'rsatiladi. */
export default function MaterialCard({ m, actions }) {
  const { t, lang } = useI18n();
  const meta = TYPE_META[m.material_type] || TYPE_META.article;
  const Icon = meta.icon;
  const isLink = m.material_type === "link";
  // Havola tilga bog'liq emas (asosiy maydonda), qolgan turlarda matn tilga qarab olinadi
  const content = isLink ? m.content : localized(m, "content", lang);
  const isUrl = isLink && /^https?:\/\//i.test(content);
  return (
    <Card className="flex flex-col p-5">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
          <Icon size={20} />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-extrabold text-slate-900 dark:text-white">{localized(m, "title", lang)}</h3>
          <div className="mt-1 flex flex-wrap gap-1.5">
            <Badge tone={meta.tone}>{t(`material_type.${m.material_type}`)}</Badge>
            <Badge tone="violet">{sn(m, lang)}</Badge>
          </div>
        </div>
      </div>
      {content && (
        <div className="mt-3 text-sm text-slate-600 dark:text-slate-300">
          {isUrl ? (
            <a href={content} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 font-semibold break-all text-blue-600 hover:underline dark:text-blue-400">
              <ExternalLink size={14} className="shrink-0" />
              {content}
            </a>
          ) : (
            <p className="whitespace-pre-wrap">{content}</p>
          )}
        </div>
      )}
      {m.file && <FileChip file={m.file} className="mt-3" />}
      {actions && <div className="mt-4 flex gap-2">{actions}</div>}
    </Card>
  );
}
