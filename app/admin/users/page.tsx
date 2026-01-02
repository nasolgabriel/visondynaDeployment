"use client";

import AdminUsersTable from "@/components/admin/admin-users-table";
import { SessionProvider } from "next-auth/react";

export default function AdminUsersPage() {
  return (
    <SessionProvider>
      <AdminUsersTable />
    </SessionProvider>
  );
}
