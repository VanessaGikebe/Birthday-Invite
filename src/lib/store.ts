import "server-only";
import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { nameKey, type Rsvp, type RsvpData } from "./rsvp-schema";

export class DuplicateRsvpError extends Error {}
export class StorageNotConfiguredError extends Error {}

interface RsvpStore {
  kind: "supabase" | "file";
  insert(data: RsvpData): Promise<Rsvp>;
  list(): Promise<Rsvp[]>;
  remove(id: string): Promise<void>;
}

/* ── Supabase ─────────────────────────────────────────────────────────── */

type Row = {
  id: string;
  created_at: string;
  full_name: string;
  attending: boolean;
  attendees: number;
  phone: string | null;
  dietary: string | null;
  message: string | null;
};

const fromRow = (r: Row): Rsvp => ({
  id: r.id,
  createdAt: r.created_at,
  fullName: r.full_name,
  attending: r.attending,
  attendees: r.attendees,
  phone: r.phone,
  dietary: r.dietary,
  message: r.message,
});

function supabaseStore(client: SupabaseClient): RsvpStore {
  return {
    kind: "supabase",
    async insert(data) {
      const { data: row, error } = await client
        .from("rsvps")
        .insert({
          full_name: data.fullName,
          name_key: nameKey(data.fullName),
          attending: data.attending === "yes",
          attendees: data.attendees,
          phone: data.phone ?? null,
          dietary: data.dietary ?? null,
          message: data.message ?? null,
        })
        .select()
        .single();
      if (error) {
        if (error.code === "23505") throw new DuplicateRsvpError();
        throw new Error(`Supabase insert failed: ${error.message}`);
      }
      return fromRow(row as Row);
    },
    async list() {
      const { data, error } = await client
        .from("rsvps")
        .select("id, created_at, full_name, attending, attendees, phone, dietary, message")
        .order("created_at", { ascending: false });
      if (error) throw new Error(`Supabase select failed: ${error.message}`);
      return (data as Row[]).map(fromRow);
    },
    async remove(id) {
      const { error } = await client.from("rsvps").delete().eq("id", id);
      if (error) throw new Error(`Supabase delete failed: ${error.message}`);
    },
  };
}

/* ── Local JSON file (development / self-hosted with a persistent disk) ── */

const FILE = path.join(process.cwd(), ".data", "rsvps.json");
let queue: Promise<unknown> = Promise.resolve();
/** Serialise file access so concurrent requests can't clobber each other. */
const locked = <T>(fn: () => Promise<T>): Promise<T> => {
  const run = queue.then(fn, fn);
  queue = run.catch(() => undefined);
  return run;
};

async function readFile(): Promise<(Rsvp & { nameKey: string })[]> {
  try {
    return JSON.parse(await fs.readFile(FILE, "utf8"));
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw e;
  }
}

async function writeFile(rows: (Rsvp & { nameKey: string })[]) {
  await fs.mkdir(path.dirname(FILE), { recursive: true });
  const tmp = `${FILE}.${process.pid}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(rows, null, 2));
  await fs.rename(tmp, FILE);
}

const fileStore: RsvpStore = {
  kind: "file",
  insert: (data) =>
    locked(async () => {
      const rows = await readFile();
      const key = nameKey(data.fullName);
      if (rows.some((r) => r.nameKey === key)) throw new DuplicateRsvpError();
      const rsvp: Rsvp = {
        id: randomUUID(),
        createdAt: new Date().toISOString(),
        fullName: data.fullName,
        attending: data.attending === "yes",
        attendees: data.attendees,
        phone: data.phone ?? null,
        dietary: data.dietary ?? null,
        message: data.message ?? null,
      };
      rows.push({ ...rsvp, nameKey: key });
      await writeFile(rows);
      return rsvp;
    }),
  list: () =>
    locked(async () =>
      (await readFile())
        .map(({ nameKey: _k, ...r }) => r)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    ),
  remove: (id) =>
    locked(async () => {
      const rows = await readFile();
      await writeFile(rows.filter((r) => r.id !== id));
    }),
};

/* ── Resolution ───────────────────────────────────────────────────────── */

let cached: RsvpStore | null = null;

export function getStore(): RsvpStore {
  if (cached) return cached;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (url && key) {
    cached = supabaseStore(createClient(url, key, { auth: { persistSession: false } }));
  } else if (process.env.RSVP_STORAGE === "file" || process.env.NODE_ENV === "development") {
    cached = fileStore;
  } else {
    throw new StorageNotConfiguredError(
      "RSVP storage is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
    );
  }
  return cached;
}
