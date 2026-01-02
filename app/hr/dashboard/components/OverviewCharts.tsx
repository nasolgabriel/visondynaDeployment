"use client"

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  LabelList,
} from "recharts"
import type { PieLabelRenderProps } from "recharts"
import { chartColors } from "@/data/mock"
import { useTheme } from "next-themes"

export default function HROverviewCharts() {
  const { theme } = useTheme()

  const hiringData = [
    { month: "Jan", hires: 4, applicants: 30, interviews: 12 },
    { month: "Feb", hires: 6, applicants: 40, interviews: 18 },
    { month: "Mar", hires: 9, applicants: 55, interviews: 22 },
    { month: "Apr", hires: 5, applicants: 35, interviews: 14 },
    { month: "May", hires: 8, applicants: 60, interviews: 27 },
    { month: "Jun", hires: 7, applicants: 48, interviews: 21 },
  ]

  const applicantData = [
    { name: "Pending Review", value: 24 },
    { name: "Interview Scheduled", value: 15 },
    { name: "Shortlisted", value: 8 },
    { name: "Rejected", value: 12 },
    { name: "Hired", value: 7 },
  ]

  const renderPieLabel = (props: PieLabelRenderProps): string => {
    const name = (props.payload as { name?: string })?.name ?? ""
    const percentValue =
      typeof props.percent === "number" ? props.percent * 100 : 0
    return `${name} ${percentValue.toFixed(0)}%`
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="border border-border bg-card/90 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Hiring Overview (Last 6 Months)
          </CardTitle>
        </CardHeader>
        <CardContent className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={hiringData}
              margin={{ top: 10, right: 20, left: 0, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="month" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor:
                    theme === "dark"
                      ? "rgba(30,30,30,0.95)"
                      : "rgba(255,255,255,0.95)",
                  borderRadius: "8px",
                  border: "none",
                  color: theme === "dark" ? "#fff" : "#000",
                }}
                labelStyle={{ color: "#84cc16" }}
              />
              <Legend verticalAlign="top" height={30} />
              <Bar
                dataKey="applicants"
                fill={chartColors[5]}
                radius={[4, 4, 0, 0]}
                name="Applicants"
              >
                <LabelList
                  dataKey="applicants"
                  position="top"
                  fill="#9CA3AF"
                  fontSize={11}
                />
              </Bar>
              <Bar
                dataKey="interviews"
                fill={chartColors[1]}
                radius={[4, 4, 0, 0]}
                name="Interviews"
              >
                <LabelList
                  dataKey="interviews"
                  position="top"
                  fill="#9CA3AF"
                  fontSize={11}
                />
              </Bar>
              <Bar
                dataKey="hires"
                fill={chartColors[0]}
                radius={[4, 4, 0, 0]}
                name="Hires"
              >
                <LabelList
                  dataKey="hires"
                  position="top"
                  fill="#9CA3AF"
                  fontSize={11}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="border border-border bg-card/90 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Applicant Status Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent className="h-80 flex flex-col items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={applicantData}
                dataKey="value"
                nameKey="name"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={3}
                labelLine={false}
                label={renderPieLabel}
              >
                {applicantData.map((_, i) => (
                  <Cell
                    key={i}
                    fill={chartColors[i % chartColors.length]}
                    stroke="none"
                  />
                ))}
              </Pie>
              <Tooltip
                content={({ payload }) => {
                  if (!payload || payload.length === 0) return null
                  const item = payload[0]
                  const color = item.payload.fill || chartColors[0]
                  return (
                    <div
                      style={{
                        backgroundColor:
                          theme === "dark"
                            ? "rgba(30,30,30,0.95)"
                            : "rgba(255,255,255,0.95)",
                        borderRadius: "8px",
                        border: "none",
                        padding: "6px 10px",
                        color: color,
                        fontSize: "13px",
                        fontWeight: 500,
                      }}
                    >
                      <div>{item.name}</div>
                      <div>{item.value} applicants</div>
                    </div>
                  )
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-4 text-xs text-muted-foreground text-center">
            Displays distribution of applicants across all active job postings.
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
