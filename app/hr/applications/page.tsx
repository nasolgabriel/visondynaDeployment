// app/hr/applications/page.tsx
import prisma from "@/lib/prisma";
import ApplicationsTable from "@/components/applications/table/applications-table";
import type { ApplicationsMetaCursor } from "@/lib/types";

const DEFAULT_LIMIT = 10;

async function fetchInitialData() {
  // latest applications, exclude soft-deleted
  const raw = await prisma.application.findMany({
    where: { deletedAt: null },
    take: DEFAULT_LIMIT + 1,
    orderBy: [{ submittedAt: "desc" }, { id: "desc" }],
    select: {
      id: true,
      status: true,
      submittedAt: true,
      job: {
        select: { id: true, title: true, company: true, location: true },
      },
      applicant: {
        select: {
          id: true,
          firstname: true,
          lastname: true,
          email: true,
        },
      },
    },
  });

  const items = raw.map((a) => ({
    id: a.id,
    status: a.status,
    submittedAt: a.submittedAt.toISOString(),
    job: a.job,
    applicant: {
      id: a.applicant.id,
      name: `${a.applicant.firstname} ${a.applicant.lastname}`,
      email: a.applicant.email,
    },
  }));

  let nextCursor: string | null = null;
  if (items.length > DEFAULT_LIMIT) {
    nextCursor = items[DEFAULT_LIMIT - 1].id;
    items.splice(DEFAULT_LIMIT);
  }

  const meta: ApplicationsMetaCursor = {
    limit: DEFAULT_LIMIT,
    sortBy: "submittedAt",
    sortDir: "desc",
    paging: { mode: "cursor", nextCursor },
  };

  return { items, meta };
}

export default async function HrApplicationsPage() {
  const { items, meta } = await fetchInitialData();

  return (
    <div className="space-y-8">
      <h1 className="text-lg font-semibold">Applications</h1>
      <ApplicationsTable
        initialRows={items}
        initialMeta={meta}
        initialLimit={10}
      />
    </div>
  );
}
