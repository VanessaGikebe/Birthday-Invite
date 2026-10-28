import { NextResponse } from "next/server";
import { flattenErrors, rsvpSchema } from "@/lib/rsvp-schema";
import { DuplicateRsvpError, StorageNotConfiguredError, getStore } from "@/lib/store";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (!rateLimit(`rsvp:${clientIp(req.headers)}`, 8, 10 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many attempts. Please wait a few minutes and try again." }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const parsed = rsvpSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Please check the highlighted fields.", fields: flattenErrors(parsed.error) }, { status: 400 });
  }

  try {
    const rsvp = await getStore().insert(parsed.data);
    return NextResponse.json({ ok: true, attending: rsvp.attending, name: rsvp.fullName }, { status: 201 });
  } catch (e) {
    if (e instanceof DuplicateRsvpError) {
      return NextResponse.json(
        { error: "We already have an RSVP under this name. If you need to change it, message the hosts directly." },
        { status: 409 },
      );
    }
    if (e instanceof StorageNotConfiguredError) {
      console.error(e.message);
      return NextResponse.json({ error: "RSVPs aren't open just yet. Please message the hosts directly." }, { status: 503 });
    }
    console.error("RSVP save failed", e);
    return NextResponse.json({ error: "Something went wrong and your RSVP was not saved. Please try again." }, { status: 500 });
  }
}
