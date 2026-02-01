const statusColors = {
  SUBMITTED: "bg-amber-100 text-amber-800",
  CLAIMED: "bg-blue-100 text-blue-800",
  IN_PROGRESS: "bg-indigo-100 text-indigo-800",
  RESOLVED: "bg-green-100 text-green-800",
  CLOSED: "bg-slate-200 text-slate-700",
};

export function StatusBadge({ status }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[status] ?? "bg-slate-100 text-slate-700"}`}
    >
      {status.replace("_", " ")}
    </span>
  );
}

export function PriorityBadge({ priority }) {
  const isHigh = priority === "HIGH";
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${isHigh ? "bg-red-100 text-red-800" : "bg-slate-100 text-slate-600"}`}
    >
      {priority}
    </span>
  );
}
