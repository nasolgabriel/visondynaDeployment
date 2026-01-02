import JobsTable from "@/components/jobs/table/jobs-table";
import prisma from "@/lib/prisma";
import { JobsMetaCursor } from "@/lib/types";
import ArchivedJobsTable from "@/components/jobs/table/archived-jobs-table";

const DEFAULT_LIMIT = 10;

async function fetchInitialData() {
  const jobsRaw = await prisma.job.findMany({
    where: {
      deletedAt: null, // 🔹 exclude archived jobs
    },
    take: DEFAULT_LIMIT + 1,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    select: {
      id: true,
      title: true,
      description: true,
      manpower: true,
      salary: true,
      company: true,
      location: true,
      status: true,
      createdAt: true,
      categoryId: true,
      category: { select: { id: true, name: true } },
    },
  });

  const jobs = jobsRaw.map((j) => ({
    ...j,
    createdAt: j.createdAt.toISOString(),
  }));

  let nextCursor: string | null = null;
  if (jobs.length > DEFAULT_LIMIT) {
    nextCursor = jobs[DEFAULT_LIMIT - 1].id;
    jobs.splice(DEFAULT_LIMIT);
  }

  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  const meta: JobsMetaCursor = {
    limit: DEFAULT_LIMIT,
    nextCursor,
    sortBy: "createdAt",
    sortDir: "desc",
    paging: { mode: "cursor", nextCursor },
  };

  return { jobs, meta, categories };
}

export default async function HrJobsPage() {
  const { jobs, meta, categories } = await fetchInitialData();

  return (
    <div className="space-y-10">
      <JobsTable
        initialJobs={jobs}
        initialMeta={meta}
        initialCategories={categories}
        initialLimit={DEFAULT_LIMIT}
      />

      <ArchivedJobsTable />
    </div>
  );
}
