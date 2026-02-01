"use client";

import { useState, useEffect, useCallback } from "react";
import { signOut } from "next-auth/react";
import { getUnclaimedComplaints, getMyClaimedComplaint, claimComplaint, updateComplaintStatus } from "@/app/actions/complaints";
import { StatusBadge, PriorityBadge } from "@/components/StatusBadge";
import { Toast } from "@/components/Toast";

const POLL_INTERVAL_MS = 6000;
const NEXT_STATUS = {
  CLAIMED: "IN_PROGRESS",
  IN_PROGRESS: "RESOLVED",
  RESOLVED: "CLOSED",
};

export function AdminDashboardClient({ initialUnclaimed, initialClaimed, userName }) {
  const [unclaimed, setUnclaimed] = useState(initialUnclaimed);
  const [claimed, setClaimed] = useState(initialClaimed);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [remarks, setRemarks] = useState("");

  const refresh = useCallback(async () => {
    const [u, c] = await Promise.all([getUnclaimedComplaints(), getMyClaimedComplaint()]);
    setUnclaimed(u);
    setClaimed(c);
  }, []);

  useEffect(() => {
    const t = setInterval(refresh, POLL_INTERVAL_MS);
    return () => clearInterval(t);
  }, [refresh]);

  async function handleLogout() {
    await signOut({ redirect: false, callbackUrl: "/login" });
    window.location.href = "/login";
  }

  async function handleClaim(id) {
    setLoading(true);
    const result = await claimComplaint(id);
    setLoading(false);
    if (result.ok) {
      setToast({ message: "Complaint claimed.", type: "success" });
      refresh();
    } else {
      setToast({ message: result.error, type: "error" });
    }
  }

  async function handleUpdateStatus() {
    if (!claimed) return;
    const next = NEXT_STATUS[claimed.status];
    if (!next) return;
    setLoading(true);
    const result = await updateComplaintStatus(claimed.id, next, remarks);
    setLoading(false);
    if (result.ok) {
      setToast({ message: `Status updated to ${next}.`, type: "success" });
      setRemarks("");
      refresh();
    } else {
      setToast({ message: result.error, type: "error" });
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-800">Admin Dashboard</h1>
          <p className="text-sm text-slate-500">Hello, {userName}</p>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="text-sm text-slate-600 hover:text-slate-900"
        >
          Sign out
        </button>
      </header>

      <main className="max-w-4xl mx-auto p-4 space-y-8">
        {claimed && (
          <section>
            <h2 className="text-base font-semibold text-slate-800 mb-3">My claimed complaint</h2>
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="font-medium text-slate-800">{claimed.title}</span>
                <StatusBadge status={claimed.status} />
                <PriorityBadge priority={claimed.priority} />
              </div>
              <p className="text-sm text-slate-600 mb-2">{claimed.description}</p>
              <p className="text-xs text-slate-400 mb-4" suppressHydrationWarning>
                Raised by {claimed.raisedBy.name} ({claimed.raisedBy.email}) · {new Date(claimed.createdAt).toLocaleString()}
              </p>
              {["CLAIMED", "IN_PROGRESS", "RESOLVED"].includes(claimed.status) && (
                <div className="flex flex-wrap items-end gap-2">
                  <input
                    type="text"
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="Remarks (optional)"
                    className="flex-1 min-w-[200px] px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                  <button
                    type="button"
                    onClick={handleUpdateStatus}
                    disabled={loading}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm disabled:opacity-50"
                  >
                    {loading ? "Updating…" : `Move to ${NEXT_STATUS[claimed.status] ?? "next"}`}
                  </button>
                </div>
              )}
            </div>
          </section>
        )}

        <section>
          <h2 className="text-base font-semibold text-slate-800 mb-3">Unclaimed complaints</h2>
          {unclaimed.length === 0 ? (
            <p className="text-slate-500 text-sm">No unclaimed complaints.</p>
          ) : (
            <ul className="space-y-3">
              {unclaimed.map((c) => (
                <li
                  key={c.id}
                  className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-2"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="font-medium text-slate-800">{c.title}</span>
                      <StatusBadge status={c.status} />
                      <PriorityBadge priority={c.priority} />
                      <span className="text-xs text-slate-400">{c.category.replace("_", " / ")}</span>
                    </div>
                    <p className="text-sm text-slate-600">{c.description}</p>
                    <p className="text-xs text-slate-400 mt-1" suppressHydrationWarning>
                      {c.raisedBy.name} · {new Date(c.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleClaim(c.id)}
                    disabled={loading || !!claimed}
                    className="px-3 py-1.5 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Claim
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>

      {toast && (
        <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />
      )}
    </div>
  );
}
