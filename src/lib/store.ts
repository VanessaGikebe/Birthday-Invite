import "server-only";
import { randomUUID } from "node:crypto";
import { nameKey, type Rsvp, type RsvpData } from "./rsvp-schema";

export class DuplicateRsvpError extends Error {}
export class StorageNotConfiguredError extends Error {}

/**
 * RSVPs are written straight to the hosts' Google Sheet through the Apps Script
 * in google-apps-script/rsvp.gs (set RSVP_SHEET_URL and RSVP_SHEET_SECRET).
 */
export async function saveRsvp(data: RsvpData): Promise<Rsvp> {
  const url = process.env.RSVP_SHEET_URL;
  const secret = process.env.RSVP_SHEET_SECRET;
  if (!url || !secret) {
    throw new StorageNotConfiguredError("RSVP storage is not configured. Set RSVP_SHEET_URL and RSVP_SHEET_SECRET.");
  }

  const rsvp: Rsvp = {
    id: randomUUID(),
    createdAt: new Date().toISOString(),
    fullName: data.fullName,
    attending: data.attending === "yes",
    attendees: data.attendees,
    phone: null,
    dietary: data.dietary ?? null,
    message: data.message ?? null,
  };

  // Apps Script answers with a redirect to the result; fetch follows it.
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "insert", secret, rsvp: { ...rsvp, nameKey: nameKey(data.fullName) } }),
    redirect: "follow",
    cache: "no-store",
  });
  const text = await res.text();
  let result: { ok: boolean; error?: string };
  try {
    result = JSON.parse(text);
  } catch {
    throw new Error(`Google Sheet returned an unexpected response (HTTP ${res.status}). Check the Apps Script deployment.`);
  }
  if (!result.ok) {
    if (result.error === "duplicate") throw new DuplicateRsvpError();
    throw new Error(`Google Sheet error: ${result.error}`);
  }
  return rsvp;
}
