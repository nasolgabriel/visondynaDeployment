"use client"

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

export default function RecentApplicants() {
  const applicants = [
    { name: "John Dela Cruz", position: "Frontend Developer", date: "Oct 20, 2025", status: "Pending" },
    { name: "Maria Santos", position: "Data Analyst", date: "Oct 18, 2025", status: "Interviewed" },
    { name: "Paul Ramirez", position: "UI/UX Designer", date: "Oct 17, 2025", status: "Hired" },
  ]

  return (
    <Card className="border border-border bg-card/90 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Recent Applicants
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {applicants.map((applicant, i) => (
            <div
              key={i}
              className="flex items-center justify-between rounded-md border border-border/50 bg-muted/20 p-3 transition hover:bg-lime-500/5"
            >
              <div>
                <p className="text-sm font-semibold text-foreground">{applicant.name}</p>
                <p className="text-xs text-muted-foreground">
                  {applicant.position} • {applicant.date}
                </p>
              </div>
              <span
                className={`text-xs font-medium px-3 py-1 rounded-full ${
                  applicant.status === "Hired"
                    ? "bg-lime-500/20 text-lime-500"
                    : applicant.status === "Interviewed"
                    ? "bg-sky-500/20 text-sky-500"
                    : "bg-yellow-500/20 text-yellow-500"
                }`}
              >
                {applicant.status}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
