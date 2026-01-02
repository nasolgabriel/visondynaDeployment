"use client";

import  OverviewCharts  from "./components/OverviewCharts";
import RecentApplicants  from "./components/RecentApplicants";
import  StatsSection  from "./components/StatsSection";

export default function HRDashboardPage() {
  return (
    <div className="space-y-8 duration-500 animate-in fade-in slide-in-from-bottom-2">
      <StatsSection />
      <OverviewCharts />
      <RecentApplicants />
    </div>
  );
}
