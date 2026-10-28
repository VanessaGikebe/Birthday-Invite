"use client";

import { useActionState, useMemo, useState, useTransition } from "react";
import type { Rsvp } from "@/lib/rsvp-schema";
import { deleteRsvp, login, type LoginState } from "./actions";

export function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(login, {});
  return (
    <form action={action} className="mt-10 grid gap-5">
      <label htmlFor="password" className="eyebrow text-[0.62rem] text-silver">
        Host password
      </label>
      <input
        id="password"
        name="password"
        type="password"
        autoComplete="current-password"
        required
        autoFocus
        className="border-b border-white/40 bg-transparent py-3 font-serif text-2xl text-white focus:border-white focus:outline-none"
      />
      {state.error && (
        <p role="alert" className="text-sm text-silver">
          {state.error}
        </p>
      )}
      <button className="btn btn-light mt-2" disabled={pending}>
        {pending ? "Checking…" : "Enter"}
      </button>
    </form>
  );
}

export function RsvpTable({ rows }: { rows: Rsvp[] }) {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | "yes" | "no">("all");
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const shown = useMemo(
    () =>
      rows.filter(
        (r) =>
          (filter === "all" || (filter === "yes") === r.attending) &&
          (!q || `${r.fullName} ${r.phone ?? ""} ${r.message ?? ""} ${r.dietary ?? ""}`.toLowerCase().includes(q.toLowerCase())),
      ),
    [rows, q, filter],
  );

  const remove = (r: Rsvp) => {
    if (!confirm(`Delete the RSVP from ${r.fullName}? This can't be undone.`)) return;
    setError(null);
    start(async () => {
      try {
        await deleteRsvp(r.id);
      } catch {
        setError("Couldn't delete that RSVP. Please try again.");
      }
    });
  };

  return (
    <div className="mt-10">
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="search"
          placeholder="Search names and messages…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label="Search RSVPs"
          className="min-w-0 flex-1 rounded-full border border-deep/20 bg-white px-5 py-3 text-sm focus:border-deep focus:outline-none"
        />
        {(["all", "yes", "no"] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            aria-pressed={filter === f}
            className={`rounded-full px-4 py-2.5 text-xs font-bold uppercase tracking-widest ${filter === f ? "bg-deep text-white" : "border border-deep/20"}`}
          >
            {f === "all" ? "All" : f === "yes" ? "Coming" : "Not coming"}
          </button>
        ))}
        <a href="/api/host/export" className="btn btn-dark min-h-10 px-5 text-[0.62rem]">
          Export CSV
        </a>
      </div>
      {error && (
        <p role="alert" className="mt-4 text-sm text-rich">
          {error}
        </p>
      )}

      <div className="mt-6 overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-deep/10" aria-busy={pending}>
        <table className="w-full min-w-[56rem] text-left text-sm">
          <thead className="border-b border-deep/10 text-[0.65rem] uppercase tracking-[0.2em] text-deep/60">
            <tr>
              <th className="px-5 py-4 font-semibold">Name</th>
              <th className="px-5 py-4 font-semibold">Status</th>
              <th className="px-5 py-4 font-semibold">Guests</th>
              <th className="px-5 py-4 font-semibold">Dietary</th>
              <th className="px-5 py-4 font-semibold">Message</th>
              <th className="px-5 py-4 font-semibold">Received</th>
              <th className="px-5 py-4">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-deep/[0.07]">
            {shown.map((r) => (
              <tr key={r.id} className="align-top">
                <td className="px-5 py-4 font-serif text-base">{r.fullName}</td>
                <td className="px-5 py-4">
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${r.attending ? "bg-deep text-white" : "bg-silver/60 text-deep"}`}>
                    {r.attending ? "Coming" : "Not coming"}
                  </span>
                </td>
                <td className="px-5 py-4">{r.attendees}</td>
                <td className="px-5 py-4 max-w-[12rem]">{r.dietary ?? "—"}</td>
                <td className="px-5 py-4 max-w-[18rem] whitespace-pre-wrap">{r.message ?? "—"}</td>
                <td className="px-5 py-4 whitespace-nowrap text-deep/60">
                  {new Date(r.createdAt).toLocaleString("en-KE", { dateStyle: "medium", timeStyle: "short" })}
                </td>
                <td className="px-5 py-4 text-right">
                  <button type="button" onClick={() => remove(r)} disabled={pending} className="text-xs font-semibold uppercase tracking-widest text-rich hover:underline">
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {shown.length === 0 && (
              <tr>
                <td colSpan={7} className="px-5 py-12 text-center font-serif text-lg italic text-deep/50">
                  {rows.length === 0 ? "No RSVPs yet. Send that link!" : "Nothing matches that search."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
