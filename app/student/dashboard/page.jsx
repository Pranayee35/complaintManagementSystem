import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { getMyComplaints } from "@/app/actions/complaints";
import { StudentDashboardClient } from "./StudentDashboardClient";

export default async function StudentDashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  const initial = await getMyComplaints();
  return (
    <StudentDashboardClient
      initialComplaints={initial}
      userName={session.user.name ?? "Student"}
    />
  );
}
