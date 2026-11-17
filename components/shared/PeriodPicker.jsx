"use client";

import { useI18n } from "@/lib/i18n";
import { PERIODS, todayISO } from "@/lib/utils";
import { Input, Select } from "@/components/ui/Field";
import { SegmentedButtons } from "@/components/ui/Misc";

/** Kunlik / oylik / yillik / to'liq davr tanlash. ref - tanlangan sana (YYYY-MM-DD). */
export default function PeriodPicker({ period, onPeriod, refDate, onRefDate, periods = PERIODS }) {
  const { t } = useI18n();
  const year = Number((refDate || todayISO()).slice(0, 4));
  const thisYear = new Date().getFullYear();
  const years = Array.from({ length: 8 }, (_, i) => thisYear - 6 + i);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <SegmentedButtons
        value={period}
        onChange={onPeriod}
        options={periods.map((p) => ({ value: p, label: t(`period.${p}`) }))}
      />
      {period === "day" && (
        <Input type="date" value={refDate} onChange={(e) => e.target.value && onRefDate(e.target.value)} className="w-auto" />
      )}
      {period === "month" && (
        <Input
          type="month"
          value={refDate.slice(0, 7)}
          onChange={(e) => e.target.value && onRefDate(`${e.target.value}-01`)}
          className="w-auto"
        />
      )}
      {period === "year" && (
        <Select value={year} onChange={(e) => onRefDate(`${e.target.value}-01-01`)} className="w-auto">
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </Select>
      )}
    </div>
  );
}
