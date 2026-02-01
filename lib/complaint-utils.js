import { prisma } from "./prisma";

const THIRTY_MIN_MS = 30 * 60 * 1000;
const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;
const STATUS_FLOW = ["SUBMITTED", "CLAIMED", "IN_PROGRESS", "RESOLVED", "CLOSED"];

export async function applyTimeBasedRules(complaintId) {
  const c = await prisma.complaint.findUnique({ where: { id: complaintId } });
  if (!c) return;
  const now = new Date();
  const updates = {};
  if (c.status === "SUBMITTED" && c.priority !== "HIGH") {
    const elapsed = now.getTime() - c.createdAt.getTime();
    if (elapsed >= THIRTY_MIN_MS) updates.priority = "HIGH";
  }
  const unresolved = ["SUBMITTED", "CLAIMED", "IN_PROGRESS"].includes(c.status);
  if (unresolved && !c.escalated) {
    const elapsed = now.getTime() - c.createdAt.getTime();
    if (elapsed >= TWENTY_FOUR_HOURS_MS) updates.escalated = true;
  }
  if (Object.keys(updates).length > 0) {
    await prisma.complaint.update({
      where: { id: complaintId },
      data: updates,
    });
  }
}

export async function applyTimeBasedRulesBulk(complaintIds) {
  await Promise.all(complaintIds.map((id) => applyTimeBasedRules(id)));
}

export function getNextStatus(current) {
  const i = STATUS_FLOW.indexOf(current);
  return i >= 0 && i < STATUS_FLOW.length - 1 ? STATUS_FLOW[i + 1] : null;
}
