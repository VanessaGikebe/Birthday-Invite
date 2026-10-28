"use server";

import { cookies, headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { HOST_COOKIE, checkPassword, createSessionToken, hostConfigured, isHost, sessionCookieOptions } from "@/lib/auth";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { getStore } from "@/lib/store";

export type LoginState = { error?: string };

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  if (!hostConfigured()) return { error: "HOST_PASSWORD is not set on the server." };
  const ip = clientIp(await headers());
  if (!rateLimit(`login:${ip}`, 6, 15 * 60 * 1000)) return { error: "Too many attempts. Try again in 15 minutes." };

  const password = String(formData.get("password") ?? "");
  if (!checkPassword(password)) return { error: "That password isn't right." };

  (await cookies()).set(HOST_COOKIE, createSessionToken(), sessionCookieOptions);
  redirect("/host");
}

export async function logout() {
  (await cookies()).delete(HOST_COOKIE);
  redirect("/host");
}

export async function deleteRsvp(id: string) {
  if (!(await isHost())) throw new Error("Not authorised");
  if (typeof id !== "string" || !/^[0-9a-f-]{36}$/i.test(id)) throw new Error("Invalid id");
  await getStore().remove(id);
  revalidatePath("/host");
}
