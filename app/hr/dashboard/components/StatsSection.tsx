"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function StatsSection() {
  const stats = [
    { label: "Total Employees", value: 128 },
    { label: "New Applicants", value: 42 },
    { label: "Active Job Posts", value: 6 },
    { label: "Recent Hires", value: 5 },
  ]

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card
          key={stat.label}
          className="border border-border bg-card/90 backdrop-blur-sm hover:bg-lime-500/5 transition-colors"
        >
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {stat.label}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-lime-500">{stat.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
