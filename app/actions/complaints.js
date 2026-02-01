"use server";

import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { applyTimeBasedRules, applyTimeBasedRulesBulk, getNextStatus } from "@/lib/complaint-utils";

const ACTIVE_STATUSES = ["SUBMITTED", "CLAIMED", "IN_PROGRESS"];

export async function createComplaint(title, description, category) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return { ok: false, error: "Unauthorized" };
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user || user.role !== "STUDENT") return { ok: false, error: "Students only can raise complaints." };

  const active = await prisma.complaint.findFirst({
    where: { raisedById: user.id, status: { in: ACTIVE_STATUSES } },
  });
  if (active) {
    return { ok: false, error: "You already have an active complaint. Only one at a time is allowed." };
  }

  const complaint = await prisma.complaint.create({
    data: {
      title: title.trim(),
      description: description.trim(),
      category,
      raisedById: user.id,
    },
  });
  await prisma.complaintHistory.create({
    data: {
      complaintId: complaint.id,
      userId: user.id,
      toStatus: "SUBMITTED",
      remarks: "Complaint submitted",
    },
  });
  revalidatePath("/student/dashboard");
  revalidatePath("/admin/dashboard");
  revalidatePath("/super-admin/dashboard");
  return { ok: true, data: complaint.id };
}

export async function claimComplaint(complaintId) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return { ok: false, error: "Unauthorized" };
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user || user.role !== "ADMIN") return { ok: false, error: "Admins only." };

  const complaint = await prisma.complaint.findUnique({ where: { id: complaintId } });
  if (!complaint) return { ok: false, error: "Complaint not found." };
  if (complaint.status !== "SUBMITTED") return { ok: false, error: "Complaint is not in SUBMITTED state." };
  if (complaint.claimedById) return { ok: false, error: "Already claimed by another admin." };

  const myClaimed = await prisma.complaint.findFirst({
    where: { claimedById: user.id, status: { in: ["SUBMITTED", "CLAIMED", "IN_PROGRESS"] } },
  });
  if (myClaimed) return { ok: false, error: "You can only have one claimed complaint at a time." };

  await prisma.complaint.update({
    where: { id: complaintId },
    data: { status: "CLAIMED", claimedById: user.id, claimedAt: new Date() },
  });
  await prisma.complaintHistory.create({
    data: {
      complaintId,
      userId: user.id,
      fromStatus: "SUBMITTED",
      toStatus: "CLAIMED",
      remarks: "Claimed by admin",
    },
  });
  revalidatePath("/admin/dashboard");
  revalidatePath("/super-admin/dashboard");
  return { ok: true };
}

export async function updateComplaintStatus(complaintId, newStatus, remarks) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return { ok: false, error: "Unauthorized" };
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user || user.role !== "ADMIN") return { ok: false, error: "Admins only." };

  const complaint = await prisma.complaint.findUnique({ where: { id: complaintId } });
  if (!complaint) return { ok: false, error: "Complaint not found." };
  if (complaint.claimedById !== user.id) return { ok: false, error: "You can only update complaints you claimed." };

  const next = getNextStatus(complaint.status);
  if (next !== newStatus) return { ok: false, error: `Invalid transition. Next allowed status is ${next}.` };

  const resolvedAt = newStatus === "RESOLVED" || newStatus === "CLOSED" ? new Date() : undefined;
  await prisma.complaint.update({
    where: { id: complaintId },
    data: { status: newStatus, ...(resolvedAt && { resolvedAt }) },
  });
  await prisma.complaintHistory.create({
    data: {
      complaintId,
      userId: user.id,
      fromStatus: complaint.status,
      toStatus: newStatus,
      remarks: remarks?.trim() ?? undefined,
    },
  });
  revalidatePath("/admin/dashboard");
  revalidatePath("/student/dashboard");
  revalidatePath("/super-admin/dashboard");
  return { ok: true };
}

export async function getMyComplaints() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return [];
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user || user.role !== "STUDENT") return [];
  const list = await prisma.complaint.findMany({
    where: { raisedById: user.id },
    orderBy: { createdAt: "desc" },
    include: { claimedBy: { select: { name: true } } },
  });
  await applyTimeBasedRulesBulk(list.map((c) => c.id));
  return prisma.complaint.findMany({
    where: { raisedById: user.id },
    orderBy: { createdAt: "desc" },
    include: { claimedBy: { select: { name: true } } },
  });
}

export async function getUnclaimedComplaints() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return [];
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user || user.role !== "ADMIN") return [];
  const list = await prisma.complaint.findMany({
    where: { status: "SUBMITTED", claimedById: null },
    orderBy: { createdAt: "desc" },
    include: { raisedBy: { select: { name: true, email: true } } },
  });
  await applyTimeBasedRulesBulk(list.map((c) => c.id));
  return prisma.complaint.findMany({
    where: { status: "SUBMITTED", claimedById: null },
    orderBy: { createdAt: "desc" },
    include: { raisedBy: { select: { name: true, email: true } } },
  });
}

export async function getMyClaimedComplaint() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return null;
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user || user.role !== "ADMIN") return null;
  const list = await prisma.complaint.findMany({
    where: { claimedById: user.id, status: { in: ["CLAIMED", "IN_PROGRESS"] } },
    orderBy: { updatedAt: "desc" },
    include: { raisedBy: { select: { name: true, email: true } } },
  });
  const c = list[0] ?? null;
  if (c) await applyTimeBasedRules(c.id);
  return c
    ? prisma.complaint.findUnique({
        where: { id: c.id },
        include: { raisedBy: { select: { name: true, email: true } } },
      })
    : null;
}

const emptyCounts = {
  total: 0,
  unresolved: 0,
  escalated: 0,
  byStatus: {},
};

export async function getAllComplaintsForSuperAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return { list: [], counts: emptyCounts };
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user || user.role !== "SUPER_ADMIN") return { list: [], counts: emptyCounts };
  const list = await prisma.complaint.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      raisedBy: { select: { name: true, email: true } },
      claimedBy: { select: { name: true } },
    },
  });
  await applyTimeBasedRulesBulk(list.map((c) => c.id));
  const list2 = await prisma.complaint.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      raisedBy: { select: { name: true, email: true } },
      claimedBy: { select: { name: true } },
    },
  });
  const counts = {
    total: list2.length,
    unresolved: list2.filter((c) => ["SUBMITTED", "CLAIMED", "IN_PROGRESS"].includes(c.status)).length,
    escalated: list2.filter((c) => c.escalated).length,
    byStatus: {},
  };
  for (const item of list2) {
    counts.byStatus[item.status] = (counts.byStatus[item.status] ?? 0) + 1;
  }
  return { list: list2, counts };
}

export async function getComplaintHistory(complaintId) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return [];
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return [];
  const complaint = await prisma.complaint.findUnique({
    where: { id: complaintId },
    select: { raisedById: true, claimedById: true },
  });
  if (!complaint) return [];
  const canView =
    user.role === "SUPER_ADMIN" ||
    complaint.raisedById === user.id ||
    complaint.claimedById === user.id;
  if (!canView) return [];
  return prisma.complaintHistory.findMany({
    where: { complaintId },
    orderBy: { createdAt: "asc" },
    include: { user: { select: { name: true } } },
  });
}
