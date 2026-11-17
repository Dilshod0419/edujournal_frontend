"use client";

import { AlertTriangle } from "lucide-react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { useI18n } from "@/lib/i18n";

export default function ConfirmDialog({ open, title, message, confirmText, danger = true, loading, onConfirm, onClose }) {
  const { t } = useI18n();
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            {t("common.cancel")}
          </Button>
          <Button variant={danger ? "danger" : "primary"} onClick={onConfirm} loading={loading}>
            {confirmText || t("common.confirm")}
          </Button>
        </>
      }
    >
      <div className="flex gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-300">
          <AlertTriangle size={20} />
        </div>
        <p className="pt-2 text-sm text-slate-600 dark:text-slate-300">{message}</p>
      </div>
    </Modal>
  );
}
