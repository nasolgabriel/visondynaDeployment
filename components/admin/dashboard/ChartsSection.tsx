// app/admin/components/ChartsSection.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Briefcase, TrendingUp } from "lucide-react";

type UsagePoint = { label: string; users: number; jobs: number };
type TopJobPoint = { name: string; value: number };

type Props = {
  usageTrend: UsagePoint[];
  topJobs: TopJobPoint[];
};

const chartColors = [
  "#22c55e",
  "#3b82f6",
  "#a855f7",
  "#f97316",
  "#facc15",
  "#e11d48",
  "#06b6d4",
  "#84cc16",
];

export default function ChartsSection({ usageTrend, topJobs }: Props) {
  const hasTrend = usageTrend && usageTrend.length > 0;
  const hasTopJobs = topJobs && topJobs.length > 0;

  return (
    <section className="grid gap-8 lg:grid-cols-2">
      {/* Usage Trend */}
      <Card className="border border-border bg-card/60">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <TrendingUp className="h-5 w-5 text-lime-500" /> Usage Trend
          </CardTitle>
        </CardHeader>
        <CardContent className="h-72">
          {hasTrend ? (
            <ResponsiveContainer>
              <LineChart data={usageTrend}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(var(--border))"
                />
                <XAxis
                  dataKey="label"
                  tick={{ fill: "hsl(var(--muted-foreground))" }}
                />
                <YAxis tick={{ fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="users"
                  stroke="#84cc16"
                  strokeWidth={2.5}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="jobs"
                  stroke="#22d3ee"
                  strokeWidth={2.5}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              Not enough data yet.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Top Applied Jobs */}
      <Card className="border border-border bg-card/60">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <Briefcase className="h-5 w-5 text-lime-500" /> Top Applied Jobs
          </CardTitle>
        </CardHeader>
        <CardContent className="flex h-72 items-center justify-center">
          {hasTopJobs ? (
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={topJobs}
                  dataKey="value"
                  nameKey="name"
                  outerRadius={100}
                  innerRadius={60}
                  paddingAngle={4}
                  labelLine={false}
                  label={({ name, value }) => `${name} (${value})`}
                  stroke="hsl(var(--background))"
                  strokeWidth={2}
                >
                  {topJobs.map((_, i) => (
                    <Cell key={i} fill={chartColors[i % chartColors.length]} />
                  ))}
                </Pie>

                <Tooltip
                  formatter={(value, name) => [
                    `${value} Applicants`,
                    `${name}`,
                  ]}
                  contentStyle={{
                    backgroundColor:
                      document.documentElement.classList.contains("dark")
                        ? "hsl(222, 47%, 10%)"
                        : "hsl(0, 0%, 100%)",
                    color: document.documentElement.classList.contains("dark")
                      ? "hsl(0, 0%, 98%)"
                      : "hsl(222, 47%, 11%)",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    padding: "8px 12px",
                  }}
                  labelStyle={{
                    color: document.documentElement.classList.contains("dark")
                      ? "hsl(0, 0%, 98%)"
                      : "hsl(222, 47%, 11%)",
                    fontWeight: 500,
                  }}
                  itemStyle={{
                    color: document.documentElement.classList.contains("dark")
                      ? "hsl(0, 0%, 98%)"
                      : "hsl(222, 47%, 11%)",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              No application data yet.
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
