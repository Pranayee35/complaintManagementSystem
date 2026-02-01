"use client";

import { useEffect } from "react";

export function Toast({ message, type = "info", onDismiss, duration = 4000 }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, duration);
    return () => clearTimeout(t);
  }, [onDismiss, duration]);

  const bg =
    type === "success"
      ? "bg-green-600"
      : type === "error"
        ? "bg-red-600"
        : "bg-slate-700";

  return (
    <div
      className={`fixed bottom-4 right-4 ${bg} text-white px-4 py-2 rounded-lg shadow-lg z-50 text-sm`}
      role="alert"
    >
      {message}
    </div>
  );
}
