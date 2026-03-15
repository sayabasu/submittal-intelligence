"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface DisciplineRiskData {
  discipline: string;
  critical: number;
  high: number;
  medium: number;
  low: number;
}

interface DisciplineRiskChartProps {
  data: DisciplineRiskData[];
}

export function DisciplineRiskChart({ data }: DisciplineRiskChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-[300px] items-center justify-center text-sm text-slate-400">
        No data available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart
        data={data}
        margin={{ top: 8, right: 8, left: -12, bottom: 0 }}
        barCategoryGap="20%"
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis
          dataKey="discipline"
          tick={{ fontSize: 11, fill: "#64748b" }}
          axisLine={{ stroke: "#e2e8f0" }}
          tickLine={false}
        />
        <YAxis
          allowDecimals={false}
          tick={{ fontSize: 11, fill: "#64748b" }}
          axisLine={{ stroke: "#e2e8f0" }}
          tickLine={false}
        />
        <Tooltip
          contentStyle={{
            fontSize: 12,
            borderRadius: 8,
            border: "1px solid #e2e8f0",
            boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
          }}
        />
        <Legend
          iconSize={8}
          wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
        />
        <Bar
          dataKey="critical"
          name="Critical"
          stackId="risk"
          fill="#dc2626"
          radius={[0, 0, 0, 0]}
        />
        <Bar
          dataKey="high"
          name="High"
          stackId="risk"
          fill="#ea580c"
          radius={[0, 0, 0, 0]}
        />
        <Bar
          dataKey="medium"
          name="Medium"
          stackId="risk"
          fill="#ca8a04"
          radius={[0, 0, 0, 0]}
        />
        <Bar
          dataKey="low"
          name="Low"
          stackId="risk"
          fill="#16a34a"
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
