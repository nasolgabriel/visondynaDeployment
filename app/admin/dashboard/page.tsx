// app/admin/page.tsx (or wherever your AdminHome lives in app router)
import prisma from "@/lib/prisma";
import StatsSection from "@/components/admin/dashboard/StatsSection";
import ChartsSection from "@/components/admin/dashboard/ChartsSection";
import ActivitySection from "@/components/admin/dashboard/ActivitySection";

const MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function addMonths(d: Date, diff: number) {
  return new Date(d.getFullYear(), d.getMonth() + diff, 1);
}

export const dynamic = "force-dynamic"; // always fresh; remove if you want caching

export default async function AdminHome() {
  const now = new Date();
  const thisMonthStart = startOfMonth(now);
  const lastMonthStart = addMonths(thisMonthStart, -1);
  const lastMonthsRangeStart = addMonths(thisMonthStart, -7); // last 8 months
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // --- Core parallel queries ---
  const [
    totalUsers,
    totalJobs,
    totalApplicants,
    applicantsThisMonth,
    applicantsLastMonth,
    openJobs,
    closedJobs,
    filledJobs,
    newApplicants30d,
    recentUserRows,
    recentJobRows,
    trendUserRows,
    trendJobRows,
    topJobsRaw,
  ] = await Promise.all([
    prisma.user.count({
      where: { deletedAt: null },
    }),
    prisma.job.count({
      where: { deletedAt: null },
    }),
    prisma.user.count({
      where: { deletedAt: null, role: "APPLICANT" },
    }),
    prisma.user.count({
      where: {
        deletedAt: null,
        role: "APPLICANT",
        createdAt: { gte: thisMonthStart },
      },
    }),
    prisma.user.count({
      where: {
        deletedAt: null,
        role: "APPLICANT",
        createdAt: { gte: lastMonthStart, lt: thisMonthStart },
      },
    }),
    prisma.job.count({
      where: { deletedAt: null, status: "OPEN" },
    }),
    prisma.job.count({
      where: { deletedAt: null, status: "CLOSED" },
    }),
    prisma.job.count({
      where: { deletedAt: null, status: "FILLED" },
    }),
    prisma.user.count({
      where: {
        deletedAt: null,
        role: "APPLICANT",
        createdAt: { gte: thirtyDaysAgo },
      },
    }),
    // recent applicants
    prisma.user.findMany({
      where: { deletedAt: null, role: "APPLICANT" },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { firstname: true, lastname: true, createdAt: true },
    }),
    // recent jobs
    prisma.job.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { title: true, company: true, createdAt: true },
    }),
    // trend – applicants
    prisma.user.findMany({
      where: {
        deletedAt: null,
        role: "APPLICANT",
        createdAt: { gte: lastMonthsRangeStart },
      },
      select: { createdAt: true },
    }),
    // trend – jobs
    prisma.job.findMany({
      where: {
        deletedAt: null,
        createdAt: { gte: lastMonthsRangeStart },
      },
      select: { createdAt: true },
    }),
    // top applied jobs
    prisma.job.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        title: true,
        _count: { select: { applications: true } },
      },
      orderBy: {
        applications: { _count: "desc" },
      },
      take: 8,
    }),
  ]);

  // --- Growth Rate (Applicants) ---
  let growthRate: number | null = null;
  if (applicantsLastMonth > 0) {
    growthRate =
      ((applicantsThisMonth - applicantsLastMonth) / applicantsLastMonth) * 100;
  }

  // --- Usage Trend (last 8 months) ---
  const userMonthMap = new Map<string, number>();
  const jobMonthMap = new Map<string, number>();

  for (const row of trendUserRows) {
    const d = row.createdAt as Date;
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    userMonthMap.set(key, (userMonthMap.get(key) ?? 0) + 1);
  }

  for (const row of trendJobRows) {
    const d = row.createdAt as Date;
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    jobMonthMap.set(key, (jobMonthMap.get(key) ?? 0) + 1);
  }

  const usageTrend = [];
  for (let i = 7; i >= 0; i--) {
    const monthDate = addMonths(thisMonthStart, -i);
    const key = `${monthDate.getFullYear()}-${monthDate.getMonth()}`;
    usageTrend.push({
      label: MONTH_LABELS[monthDate.getMonth()],
      users: userMonthMap.get(key) ?? 0,
      jobs: jobMonthMap.get(key) ?? 0,
    });
  }

  // --- Top Applied Jobs ---
  const topJobs = topJobsRaw
    .filter((j) => j._count.applications > 0)
    .map((j) => ({
      name: j.title,
      value: j._count.applications,
    }));

  // --- Recent Activity (mixed jobs + applicants) ---
  const activities = [
    ...recentJobRows.map((j) => ({
      date: j.createdAt as Date,
      description: `New job posted: ${j.title} at ${j.company}`,
    })),
    ...recentUserRows.map((u) => ({
      date: u.createdAt as Date,
      description: `New applicant registered: ${u.firstname} ${u.lastname}`,
    })),
  ]
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, 8)
    .map((x) => x.description);

  const systemSummary = [
    { label: "Open Jobs", value: openJobs },
    { label: "Closed Jobs", value: closedJobs },
    { label: "Filled Jobs", value: filledJobs },
    { label: "New Applicants (30 days)", value: newApplicants30d },
  ];

  return (
    <div className="space-y-8 duration-500 animate-in fade-in slide-in-from-bottom-2">
      <StatsSection
        totalUsers={totalUsers}
        totalJobs={totalJobs}
        totalApplicants={totalApplicants}
        growthRate={growthRate}
      />
      <ChartsSection usageTrend={usageTrend} topJobs={topJobs} />
      <ActivitySection activities={activities} summary={systemSummary} />
    </div>
  );
}
