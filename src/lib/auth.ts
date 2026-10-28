import "server-only";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const HOST_COOKIE = "trio_host";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7;

const secret = () => process.env.HOST_SESSION_SECRET || process.env.HOST_PASSWORD || "";

export const hostConfigured = () => Boolean(process.env.HOST_PASSWORD);

const sign = (payload: string) => createHmac("sha256", secret()).update(payload).digest("base64url");

const safeEqual = (a: string, b: string) => {
  // Hash first so inputs of different lengths still compare in constant time.
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
};

export function checkPassword(input: string) {
  const expected = process.env.HOST_PASSWORD;
  return Boolean(expected) && safeEqual(input, expected!);
}

export function createSessionToken() {
  const expires = String(Date.now() + SESSION_TTL_MS);
  return `${expires}.${sign(expires)}`;
}

export function verifySessionToken(token: string | undefined) {
  if (!token || !hostConfigured()) return false;
  const [expires, sig] = token.split(".");
  if (!expires || !sig || Number(expires) < Date.now()) return false;
  return safeEqual(sig, sign(expires));
}

export async function isHost() {
  const jar = await cookies();
  return verifySessionToken(jar.get(HOST_COOKIE)?.value);
}

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: "strict" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: SESSION_TTL_MS / 1000,
};
