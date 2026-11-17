"use client";

import { CalendarDays } from "lucide-react";
import { useApi } from "@/lib/hooks";
import { useI18n } from "@/lib/i18n";
import WeekGrid from "@/components/shared/WeekGrid";
import { DataState } from "@/components/ui/Feedback";
import { PageHeader } from "@/components/ui/Misc";

export default function PupilSchedulePage() {
  const { t } = useI18n();
  const schedules = useApi("/pupil/my-schedules/");
  const items = schedules.data || [];
  return (
    <>
      <PageHeader title={t("pupil.schedule.title")} subtitle={t("pupil.schedule.subtitle")} />
      <DataState
        loading={schedules.loading}
        error={schedules.error}
        empty={items.length === 0}
        onRetry={schedules.reload}
        emptyProps={{ icon: CalendarDays, title: t("pupil.schedule.empty"), text: t("pupil.schedule.empty_text") }}
      >
        <WeekGrid items={items} secondary="teacher_name" />
      </DataState>
    </>
  );
}
