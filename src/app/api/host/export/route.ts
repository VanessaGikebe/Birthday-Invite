import { isHost } from "@/lib/auth";
import { getStore } from "@/lib/store";

export const dynamic = "force-dynamic";

const cell = (v: unknown) => {
  let s = v === null || v === undefined ? "" : String(v);
  // Neutralise spreadsheet formula injection (but leave phone numbers like +254… alone).
  if (/^[=@\t\r]/.test(s) || (/^[+-]/.test(s) && !/^[+-][\d ()-]+$/.test(s))) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
};

export async function GET() {
  if (!(await isHost())) return new Response("Unauthorised", { status: 401 });
  try {
    const rows = await getStore().list();
    const header = ["Name", "Attending", "Guests", "Phone", "Dietary", "Message", "Received"];
    const lines = rows.map((r) =>
      [r.fullName, r.attending ? "Yes" : "No", r.attendees, r.phone, r.dietary, r.message, r.createdAt].map(cell).join(","),
    );
    const csv = "﻿" + [header.map(cell).join(","), ...lines].join("\r\n");
    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="rsvps-${new Date().toISOString().slice(0, 10)}.csv"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    console.error(e);
    return new Response("Couldn't load RSVPs.", { status: 500 });
  }
}
