import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { getAllComplaintsForSuperAdmin } from "@/app/actions/complaints";
import { SuperAdminDashboardClient } from "./SuperAdminDashboardClient";

export default async function SuperAdminDashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  const { list, counts } = await getAllComplaintsForSuperAdmin();
  return (
    <SuperAdminDashboardClient
      initialList={list}
      initialCounts={counts}
      userName={session.user.name ?? "Super Admin"}
    />
  );
}
