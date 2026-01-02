// app/admin/components/StatsSection.tsx
import { Users, Briefcase, FileText, TrendingUp } from "lucide-react";
import StatCard from "./StatCard";

type Props = {
  totalUsers: number;
  totalJobs: number;
  totalApplicants: number;
  growthRate: number | null;
};

export default function StatsSection({
  totalUsers,
  totalJobs,
  totalApplicants,
  growthRate,
}: Props) {
  return (
    <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Users"
        value={totalUsers}
        icon={<Users className="h-5 w-5 text-lime-500" />}
      />
      <StatCard
        title="Jobs Posted"
        value={totalJobs}
        icon={<Briefcase className="h-5 w-5 text-lime-500" />}
      />
      <StatCard
        title="Applicants"
        value={totalApplicants}
        icon={<FileText className="h-5 w-5 text-lime-500" />}
      />
      <StatCard
        title="Growth Rate"
        value={growthRate === null ? "—" : `${growthRate.toFixed(1)}%`}
        subtitle={growthRate === null ? undefined : "vs last month"}
        icon={<TrendingUp className="h-5 w-5 text-lime-500" />}
      />
    </section>
  );
}
