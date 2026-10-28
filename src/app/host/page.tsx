import type { Metadata } from "next";
import { eventDetails } from "@/config/event";
import { hostConfigured, isHost } from "@/lib/auth";
import { getStore, StorageNotConfiguredError } from "@/lib/store";
import type { Rsvp } from "@/lib/rsvp-schema";
import { logout } from "./actions";
import { LoginForm, RsvpTable } from "./HostClient";

export const metadata: Metadata = { title: "Host dashboard", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function HostPage() {
  if (!(await isHost())) {
    return (
      <main className="flex min-h-[100svh] items-center justify-center bg-deep px-5 text-white">
        <div className="w-full max-w-sm">
          <p className="eyebrow text-silver">Hosts only</p>
          <h1 className="display mt-4 text-6xl">
            The guest <span className="italic text-silver">list.</span>
          </h1>
          {hostConfigured() ? (
            <LoginForm />
          ) : (
            <p className="mt-10 text-sm leading-relaxed text-white/80">
              Set the <code className="rounded bg-white/10 px-1.5 py-0.5">HOST_PASSWORD</code> environment variable on the server to
              enable this dashboard.
            </p>
          )}
        </div>
      </main>
    );
  }

  let rows: Rsvp[] = [];
  let loadError: string | null = null;
  let storage = "";
  try {
    const store = getStore();
    storage = store.kind;
    rows = await store.list();
  } catch (e) {
    loadError =
      e instanceof StorageNotConfiguredError
        ? "RSVP storage isn't configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY."
        : "Couldn't load RSVPs from the database. Refresh to try again.";
    console.error(e);
  }

  const coming = rows.filter((r) => r.attending);
  const stats = [
    ["Guests coming", coming.reduce((n, r) => n + r.attendees, 0)],
    ["RSVPs: yes", coming.length],
    ["RSVPs: no", rows.length - coming.length],
    ["Dietary notes", rows.filter((r) => r.dietary).length],
  ] as const;

  return (
    <main className="min-h-[100svh] bg-ivory px-5 py-10 text-deep sm:px-10 sm:py-14">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="eyebrow text-rich">Host dashboard · {eventDetails.venue.name}</p>
            <h1 className="display mt-3 text-[clamp(3rem,7vw,5.5rem)]">
              The guest <span className="italic text-rich">list.</span>
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <a href="/" className="btn btn-ghost-dark min-h-10 px-5 text-[0.62rem]">
              View invitation
            </a>
            <form action={logout}>
              <button className="btn btn-dark min-h-10 px-5 text-[0.62rem]">Sign out</button>
            </form>
          </div>
        </header>

        {storage === "file" && (
          <p className="mt-6 rounded-xl bg-silver/40 px-4 py-3 text-sm">
            Development mode: RSVPs are stored in <code>.data/rsvps.json</code>. Configure Supabase before sharing the link.
          </p>
        )}
        {loadError && (
          <p role="alert" className="mt-6 rounded-xl border border-rich/30 bg-rich/5 px-4 py-3 text-sm text-rich">
            {loadError}
          </p>
        )}

        <dl className="mt-10 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {stats.map(([k, v], i) => (
            <div key={k} className={`rounded-2xl p-6 ${i === 0 ? "bg-deep text-white" : "bg-white ring-1 ring-deep/10"}`}>
              <dt className={`eyebrow text-[0.6rem] ${i === 0 ? "text-silver" : "text-deep/60"}`}>{k}</dt>
              <dd className="display mt-3 text-6xl">{v}</dd>
            </div>
          ))}
        </dl>

        {!loadError && <RsvpTable rows={rows} />}
      </div>
    </main>
  );
}
