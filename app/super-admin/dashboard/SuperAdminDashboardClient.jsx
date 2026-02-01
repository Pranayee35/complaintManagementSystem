"use client";

import { useState, useEffect, useCallback } from "react";
import { signOut } from "next-auth/react";
import { getAllComplaintsForSuperAdmin } from "@/app/actions/complaints";
import { StatusBadge, PriorityBadge } from "@/components/StatusBadge";

const POLL_INTERVAL_MS = 8000;

export function SuperAdminDashboardClient({ initialList, initialCounts, userName }) {
  const [list, setList] = useState(initialList);
  const [counts, setCounts] = useState(initialCounts);
  const [filterEscalated, setFilterEscalated] = useState(false);

  const refresh = useCallback(async () => {
    const { list: l, counts: c } = await getAllComplaintsForSuperAdmin();
    setList(l);
    setCounts(c);
  }, []);

  useEffect(() => {
    const t = setInterval(refresh, POLL_INTERVAL_MS);
    return () => clearInterval(t);
  }, [refresh]);

  async function handleLogout() {
    await signOut({ redirect: false, callbackUrl: "/login" });
    window.location.href = "/login";
  }

  const displayed = filterEscalated ? list.filter((c) => c.escalated) : list;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-800">Super Admin Dashboard</h1>
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

      <main className="max-w-5xl mx-auto p-4 space-y-6">
        <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <p className="text-xs text-slate-500 uppercase tracking-wide">Total</p>
            <p className="text-2xl font-bold text-slate-800">{counts.total}</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <p className="text-xs text-slate-500 uppercase tracking-wide">Unresolved</p>
            <p className="text-2xl font-bold text-amber-600">{counts.unresolved}</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <p className="text-xs text-slate-500 uppercase tracking-wide">Escalated</p>
            <p className="text-2xl font-bold text-red-600">{counts.escalated}</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <p className="text-xs text-slate-500 uppercase tracking-wide">By status</p>
            <p className="text-sm text-slate-600 mt-1">
              {Object.entries(counts.byStatus)
                .map(([k, v]) => `${k}: ${v}`)
                .join(" · ")}
            </p>
          </div>
        </section>

        <section>
          <div className="flex items-center gap-4 mb-3">
            <h2 className="text-base font-semibold text-slate-800">All complaints</h2>
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={filterEscalated}
                onChange={(e) => setFilterEscalated(e.target.checked)}
                className="rounded border-slate-300"
              />
              Escalated only
            </label>
          </div>
          {displayed.length === 0 ? (
            <p className="text-slate-500 text-sm">No complaints.</p>
          ) : (
            <ul className="space-y-3">
              {displayed.map((c) => (
                <li
                  key={c.id}
                  className={`bg-white border rounded-xl p-4 shadow-sm ${c.escalated ? "border-red-200" : "border-slate-200"}`}
                >
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="font-medium text-slate-800">{c.title}</span>
                    <StatusBadge status={c.status} />
                    <PriorityBadge priority={c.priority} />
                    {c.escalated && (
                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                        Escalated
                      </span>
                    )}
                    <span className="text-xs text-slate-400">{c.category.replace("_", " / ")}</span>
                  </div>
                  <p className="text-sm text-slate-600 mb-2">{c.description}</p>
                  <p className="text-xs text-slate-400">
                    Raised by {c.raisedBy.name} ({c.raisedBy.email})
                    {c.claimedBy?.name && ` · Claimed by ${c.claimedBy.name}`}
                    {" · "}
                    {new Date(c.createdAt).toLocaleString()}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}
