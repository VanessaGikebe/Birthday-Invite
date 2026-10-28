import { z } from "zod";
import { rsvpConfig } from "@/config/event";

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Please keep this under ${max} characters.`)
    .optional()
    .transform((v) => (v ? v : undefined));

export const rsvpSchema = z
  .object({
    fullName: z
      .string()
      .transform((v) => v.replace(/\s+/g, " ").trim())
      .pipe(z.string().min(2, "Please enter your full name.")
      .max(80, "That name is a little long — 80 characters max.")),
    attending: z.enum(["yes", "no"], { message: "Let us know if you can make it." }),
    attendees: z.coerce
      .number()
      .int()
      .min(0)
      .max(rsvpConfig.maxAttendees, `Up to ${rsvpConfig.maxAttendees} people per RSVP.`),
    phone: optionalText(24).refine((v) => !v || /^\+?[0-9 ()-]{7,20}$/.test(v), {
      message: "That phone number doesn't look right.",
    }),
    dietary: optionalText(200),
    message: optionalText(600),
    /** Honeypot — must stay empty. */
    website: z.string().max(0).optional(),
  })
  .superRefine((val, ctx) => {
    if (val.attending === "yes" && val.attendees < 1) {
      ctx.addIssue({ code: "custom", path: ["attendees"], message: "At least one person, please." });
    }
  })
  .transform((val) => ({ ...val, attendees: val.attending === "no" ? 0 : val.attendees }));

export type RsvpInput = z.input<typeof rsvpSchema>;
export type RsvpData = z.output<typeof rsvpSchema>;

export type Rsvp = {
  id: string;
  createdAt: string;
  fullName: string;
  attending: boolean;
  attendees: number;
  phone: string | null;
  dietary: string | null;
  message: string | null;
};

/** Normalised key used to detect duplicate submissions for the same person. */
export const nameKey = (name: string) =>
  name
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

export type FieldErrors = Partial<Record<keyof RsvpInput, string>>;

export function flattenErrors(error: z.ZodError): FieldErrors {
  const out: FieldErrors = {};
  for (const issue of error.issues) {
    const key = issue.path[0] as keyof RsvpInput | undefined;
    if (key && !out[key]) out[key] = issue.message;
  }
  return out;
}
