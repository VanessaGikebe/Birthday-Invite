import "server-only";
import { existsSync } from "node:fs";
import path from "node:path";
import type { Photo } from "@/config/event";

/** Returns the photo if its file exists in /public, otherwise null (→ placeholder). */
export function available<T extends Photo>(photo: T | null | undefined): T | null {
  if (!photo) return null;
  return existsSync(path.join(process.cwd(), "public", photo.src)) ? photo : null;
}
