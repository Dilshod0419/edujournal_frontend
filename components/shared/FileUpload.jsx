"use client";

import { useRef, useState } from "react";
import { Download, FileText, Loader2, Paperclip, UploadCloud, X } from "lucide-react";
import api from "@/lib/api";
import { useDownload } from "@/lib/hooks";
import { useI18n } from "@/lib/i18n";
import { MAX_FILE_MB, cn, formatSize, getErrorMessage } from "@/lib/utils";
import { useToast } from "@/components/ui/Toast";

// Backend bilan bir xil ro'yxat
export const ALLOWED_EXT = [
  "txt", "md", "csv", "pdf", "doc", "docx", "odt", "rtf", "ppt", "pptx", "odp", "xls", "xlsx", "ods",
  "zip", "rar", "7z", "tar", "gz", "png", "jpg", "jpeg", "gif", "webp", "bmp", "mp3", "wav", "mp4",
  "mov", "avi", "mkv", "py", "ipynb", "java", "c", "cpp", "cs", "sql", "json", "xml",
];
const ACCEPT = ALLOWED_EXT.map((e) => `.${e}`).join(",");

/** Yuklangan faylni ko'rsatish; bosilsa yuklab olinadi. */
export function FileChip({ file, onRemove, className }) {
  const { download, busy } = useDownload();
  if (!file) return null;
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-800/60",
        className
      )}
    >
      <FileText size={20} className="shrink-0 text-blue-600 dark:text-blue-400" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">{file.name}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400">{formatSize(file.size)}</p>
      </div>
      <button
        type="button"
        onClick={() => download(`/files/${file.id}/download`, undefined, file.name)}
        disabled={busy}
        className="rounded-lg p-2 text-slate-500 hover:bg-white hover:text-blue-600 dark:hover:bg-slate-700"
        aria-label="download"
      >
        {busy ? <Loader2 size={17} className="animate-spin" /> : <Download size={17} />}
      </button>
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="rounded-lg p-2 text-slate-500 hover:bg-white hover:text-red-600 dark:hover:bg-slate-700"
          aria-label="remove"
        >
          <X size={17} />
        </button>
      )}
    </div>
  );
}

/** Fayl yuklash: tanlash yoki sudrab tashlash. Maksimum 20 MB. onChange(fileInfo | null) */
export default function FileUpload({ value, onChange, disabled }) {
  const { t, lang } = useI18n();
  const toast = useToast();
  const inputRef = useRef(null);
  const [progress, setProgress] = useState(null);
  const [dragging, setDragging] = useState(false);

  const upload = async (file) => {
    if (!file) return;
    const ext = file.name.split(".").pop().toLowerCase();
    if (!ALLOWED_EXT.includes(ext)) {
      toast.error(t("file.bad_type", { ext }));
      return;
    }
    if (file.size > MAX_FILE_MB * 1024 * 1024) {
      toast.error(t("file.too_large", { mb: MAX_FILE_MB }));
      return;
    }
    const form = new FormData();
    form.append("file", file);
    setProgress(0);
    try {
      const res = await api.post("/files/upload", form, {
        onUploadProgress: (e) => e.total && setProgress(Math.round((e.loaded / e.total) * 100)),
      });
      onChange(res.data);
    } catch (err) {
      toast.error(getErrorMessage(err, lang, t));
    } finally {
      setProgress(null);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  if (value) return <FileChip file={value} onRemove={disabled ? undefined : () => onChange(null)} />;

  const uploading = progress !== null;
  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        if (!disabled && !uploading) upload(e.dataTransfer.files?.[0]);
      }}
      className={cn(
        "rounded-xl border-2 border-dashed px-4 py-5 text-center transition",
        dragging ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" : "border-slate-300 dark:border-slate-700"
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="hidden"
        disabled={disabled || uploading}
        onChange={(e) => upload(e.target.files?.[0])}
      />
      {uploading ? (
        <div className="space-y-2">
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            {t("file.uploading")} {progress}%
          </p>
          <div className="mx-auto h-2 max-w-xs overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <div className="h-full rounded-full bg-blue-600 transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>
      ) : (
        <button
          type="button"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
          className="flex w-full flex-col items-center gap-1.5 text-slate-500 dark:text-slate-400"
        >
          <UploadCloud size={26} />
          <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
            <Paperclip size={14} className="mr-1 inline" />
            {t("file.choose")}
          </span>
          <span className="text-xs">{t("file.hint", { mb: MAX_FILE_MB })}</span>
        </button>
      )}
    </div>
  );
}
