"use client";

import { useI18n } from "@/lib/i18n";
import {
  Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer,
  Tooltip, XAxis, YAxis,
} from "recharts";

const tick = { fill: "var(--chart-text)", fontSize: 12 };
const tooltipStyle = {
  background: "var(--tooltip-bg)",
  border: "1px solid var(--tooltip-border)",
  color: "var(--tooltip-text)",
  borderRadius: 12,
  fontSize: 13,
};

export const COLORS = {
  blue: "#3b82f6", green: "#10b981", amber: "#f59e0b", red: "#ef4444", violet: "#8b5cf6", slate: "#94a3b8",
};

function Box({ height, children }) {
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        {children}
      </ResponsiveContainer>
    </div>
  );
}

export function TrendChart({ data, xKey, lines, height = 260, domain }) {
  return (
    <Box height={height}>
      <LineChart data={data} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
        <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey={xKey} tick={tick} tickLine={false} axisLine={{ stroke: "var(--chart-grid)" }} />
        <YAxis tick={tick} tickLine={false} axisLine={false} domain={domain} />
        <Tooltip contentStyle={tooltipStyle} />
        {lines.length > 1 && <Legend wrapperStyle={{ fontSize: 12 }} />}
        {lines.map((l) => (
          <Line
            key={l.key}
            type="monotone"
            dataKey={l.key}
            name={l.name}
            stroke={l.color}
            strokeWidth={2.5}
            dot={{ r: 3 }}
            connectNulls
          />
        ))}
      </LineChart>
    </Box>
  );
}

export function BarsChart({ data, xKey, bars, height = 260, domain, horizontal = false }) {
  return (
    <Box height={height}>
      <BarChart data={data} layout={horizontal ? "vertical" : "horizontal"} margin={{ top: 8, right: 12, left: horizontal ? 8 : -16, bottom: 0 }}>
        <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="3 3" vertical={horizontal} horizontal={!horizontal} />
        {horizontal ? (
          <>
            <XAxis type="number" tick={tick} tickLine={false} axisLine={false} domain={domain} />
            <YAxis type="category" dataKey={xKey} tick={tick} tickLine={false} axisLine={false} width={90} />
          </>
        ) : (
          <>
            <XAxis dataKey={xKey} tick={tick} tickLine={false} axisLine={{ stroke: "var(--chart-grid)" }} />
            <YAxis tick={tick} tickLine={false} axisLine={false} domain={domain} />
          </>
        )}
        <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(148,163,184,0.12)" }} />
        {bars.length > 1 && <Legend wrapperStyle={{ fontSize: 12 }} />}
        {bars.map((b) => (
          <Bar key={b.key} dataKey={b.key} name={b.name} fill={b.color} radius={[6, 6, 0, 0]} maxBarSize={36} />
        ))}
      </BarChart>
    </Box>
  );
}

export function DonutChart({ data, height = 240 }) {
  const { t } = useI18n();
  const visible = data.filter((d) => d.value > 0);
  if (visible.length === 0) {
    return (
      <div style={{ height }} className="flex w-full items-center justify-center text-sm text-slate-400">
        {t("common.no_data")}
      </div>
    );
  }
  return (
    <Box height={height}>
      <PieChart>
        <Pie data={visible} dataKey="value" nameKey="name" innerRadius="55%" outerRadius="85%" paddingAngle={3} stroke="none">
          {visible.map((d) => (
            <Cell key={d.name} fill={d.color} />
          ))}
        </Pie>
        <Tooltip contentStyle={tooltipStyle} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
      </PieChart>
    </Box>
  );
}
