export const dynamic = "force-dynamic";

import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { getUnclaimedComplaints, getMyClaimedComplaint } from "@/app/actions/complaints";
import { AdminDashboardClient } from "./AdminDashboardClient";

export default async function AdminDashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  const [unclaimed, claimed] = await Promise.all([
    getUnclaimedComplaints(),
    getMyClaimedComplaint(),
  ]);
  return (
    <AdminDashboardClient
      initialUnclaimed={unclaimed}
      initialClaimed={claimed}
      userName={session.user.name ?? "Admin"}
    />
  );
}
