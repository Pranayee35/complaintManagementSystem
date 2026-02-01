"use client";

import { useState, useEffect, useCallback } from "react";
import { signOut } from "next-auth/react";
import { getMyComplaints } from "@/app/actions/complaints";
import { createComplaint } from "@/app/actions/complaints";
import { StatusBadge, PriorityBadge } from "@/components/StatusBadge";
import { Toast } from "@/components/Toast";

const CATEGORIES = [
  { value: "Hostel", label: "Hostel" },
  { value: "Mess", label: "Mess" },
  { value: "Academic", label: "Academic" },
  { value: "Internet_Network", label: "Internet / Network" },
  { value: "Infrastructure", label: "Infrastructure" },
  { value: "Others", label: "Others" },
];

const POLL_INTERVAL_MS = 8000;

export function StudentDashboardClient({ initialComplaints, userName }) {
  const [complaints, setComplaints] = useState(initialComplaints);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Others");

  const refresh = useCallback(async () => {
    const data = await getMyComplaints();
    setComplaints(data);
  }, []);

  useEffect(() => {
    const t = setInterval(refresh, POLL_INTERVAL_MS);
    return () => clearInterval(t);
  }, [refresh]);

  const hasActive = complaints.some((c) =>
    ["SUBMITTED", "CLAIMED", "IN_PROGRESS"].includes(c.status)
  );

  async function handleLogout() {
    await signOut({ redirect: false, callbackUrl: "/login" });
    window.location.href = "/login";
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    const result = await createComplaint(title, description, category);
    setLoading(false);
    if (result.ok) {
      setToast({ message: "Complaint submitted successfully.", type: "success" });
      setTitle("");
      setDescription("");
      setCategory("Others");
      setShowForm(false);
      refresh();
    } else {
      setToast({ message: result.error, type: "error" });
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-800">Student Dashboard</h1>
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

      <main className="max-w-4xl mx-auto p-4">
        {!hasActive && (
          <div className="mb-6">
            <button
              type="button"
              onClick={() => setShowForm((s) => !s)}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm font-medium"
            >
              {showForm ? "Cancel" : "Raise a complaint"}
            </button>
            {showForm && (
              <form onSubmit={handleSubmit} className="mt-4 p-4 bg-white rounded-xl border border-slate-200 space-y-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    placeholder="Brief title"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                    rows={3}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    placeholder="Describe your complaint"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                >
                  {loading ? "Submitting…" : "Submit"}
                </button>
              </form>
            )}
          </div>
        )}
        {hasActive && (
          <p className="mb-4 text-sm text-amber-700 bg-amber-50 px-3 py-2 rounded-lg">
            You have an active complaint. You can raise another only after it is resolved or closed.
          </p>
        )}

        <h2 className="text-base font-semibold text-slate-800 mb-3">My complaints</h2>
        {complaints.length === 0 ? (
          <p className="text-slate-500 text-sm">No complaints yet.</p>
        ) : (
          <ul className="space-y-3">
            {complaints.map((c) => (
              <li
                key={c.id}
                className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm"
              >
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="font-medium text-slate-800">{c.title}</span>
                  <StatusBadge status={c.status} />
                  <PriorityBadge priority={c.priority} />
                  <span className="text-xs text-slate-400">{c.category.replace("_", " / ")}</span>
                </div>
                <p className="text-sm text-slate-600 mb-2">{c.description}</p>
                <p className="text-xs text-slate-400">
                  Created {new Date(c.createdAt).toLocaleString()}
                  {c.claimedBy?.name && ` · Claimed by ${c.claimedBy.name}`}
                </p>
              </li>
            ))}
          </ul>
        )}
      </main>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onDismiss={() => setToast(null)}
        />
      )}
    </div>
  );
}
