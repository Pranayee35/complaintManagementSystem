export const dynamic = "force-dynamic";

import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";

export default async function HomePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/login");
  }
  const role = session.user.role;
  if (role === "STUDENT") redirect("/student/dashboard");
  if (role === "ADMIN") redirect("/admin/dashboard");
  if (role === "SUPER_ADMIN") redirect("/super-admin/dashboard");
  redirect("/login");
}
