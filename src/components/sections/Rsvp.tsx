"use client";

import { useEffect, useRef, useState } from "react";
import { contribution, eventDetails, rsvpConfig } from "@/config/event";
import { flattenErrors, rsvpSchema, type FieldErrors } from "@/lib/rsvp-schema";
import Chapter from "@/components/ui/Chapter";
import { useReducedMotion } from "@/lib/hooks";

type Values = {
  fullName: string;
  attending: "" | "yes" | "no";
  attendees: number;
  phone: string;
  dietary: string;
  message: string;
  website: string;
};

const EMPTY: Values = { fullName: "", attending: "", attendees: 1, phone: "", dietary: "", message: "", website: "" };
const STORAGE_KEY = "trio-rsvp-v1";

type Done = { name: string; attending: boolean };

export default function Rsvp() {
  const [values, setValues] = useState<Values>(EMPTY);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [status, setStatus] = useState<"idle" | "submitting" | "error">("idle");
  const [formError, setFormError] = useState<string | null>(null);
  const [done, setDone] = useState<Done | null>(null);
  const [step, setStep] = useState<"ask" | "form" | "declined">("ask");
  const [previous, setPrevious] = useState<Done | null>(null);
  const inFlight = useRef(false);
  const errorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setPrevious(JSON.parse(raw));
    } catch {
      /* storage unavailable */
    }
  }, []);

  const set = <K extends keyof Values>(k: K, v: Values[K]) => {
    setValues((s) => ({ ...s, [k]: v }));
    if (errors[k as keyof FieldErrors]) setErrors((e) => ({ ...e, [k]: undefined }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (inFlight.current) return;
    setFormError(null);

    const payload = { ...values, attendees: values.attending === "no" ? 0 : values.attendees };
    const parsed = rsvpSchema.safeParse(payload);
    if (!parsed.success) {
      const fe = flattenErrors(parsed.error);
      setErrors(fe);
      const first = Object.keys(fe)[0];
      document.getElementById(`rsvp-${first}`)?.focus();
      return;
    }

    inFlight.current = true;
    setStatus("submitting");
    try {
      const res = await fetch("/api/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (data.fields) setErrors(data.fields);
        throw new Error(data.error || "Something went wrong and your RSVP was not saved. Please try again.");
      }
      const result = { name: data.name as string, attending: Boolean(data.attending) };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(result));
      } catch {
        /* ignore */
      }
      setDone(result);
      setPrevious(result);
      setValues(EMPTY);
      setStatus("idle");
    } catch (err) {
      const msg =
        err instanceof TypeError
          ? "We couldn't reach the server, so your RSVP was not saved. Check your connection and try again."
          : (err as Error).message;
      setFormError(msg);
      setStatus("error");
      requestAnimationFrame(() => errorRef.current?.focus());
    } finally {
      inFlight.current = false;
    }
  };

  const attending = values.attending === "yes";
  const busy = status === "submitting";

  return (
    <section id="rsvp" aria-labelledby="rsvp-title" className="relative flex min-h-[100svh] flex-col justify-center overflow-hidden bg-deep py-14 text-white">
      <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(60%_60%_at_15%_20%,rgba(139,38,63,.8),transparent),radial-gradient(50%_50%_at_100%_100%,rgba(42,6,16,.9),transparent)]" />
      <div aria-hidden="true" className="display pointer-events-none absolute -bottom-[6vw] -right-[3vw] text-[38vw] italic leading-none text-white/[0.04]">
        RSVP
      </div>

      <div className="relative mx-auto grid w-full max-w-[90rem] items-center gap-10 px-5 sm:px-10 lg:grid-cols-12">
        <div className="lg:col-span-5" data-reveal>
          <Chapter n="03" className="text-silver">
            Répondez s&rsquo;il vous plaît
          </Chapter>
          <h2 id="rsvp-title" className="display mt-5 text-[clamp(2.8rem,5.6vw,5.2rem)]">
            Are you
            <span className="block italic text-silver">in?</span>
          </h2>
          <p className="mt-5 max-w-sm text-sm leading-relaxed text-white/80">
            Tell us you&rsquo;re coming so we can plan the food, the drinks and the number of chairs at the Jenga table.
          </p>
          {eventDetails.rsvpBy && <p className="eyebrow mt-5 text-[0.62rem] text-silver">{eventDetails.rsvpBy}</p>}
        </div>

        <div className="lg:col-span-6 lg:col-start-7">
          {done ? (
            <Confirmation
              done={done}
              onAnother={() => {
                setDone(null);
                setStep("ask");
              }}
            />
          ) : step === "ask" ? (
            <ShareAsk
              onYes={() => {
                setValues((v) => ({ ...v, attending: "yes" }));
                setStep("form");
              }}
              onNo={() => setStep("declined")}
            />
          ) : step === "declined" ? (
            <Declined
              onBack={() => setStep("ask")}
              onTellHosts={() => {
                setValues((v) => ({ ...v, attending: "no" }));
                setStep("form");
              }}
            />
          ) : (
            <form
              onSubmit={submit}
              noValidate
              aria-describedby={formError ? "rsvp-form-error" : undefined}
              className="relative flex flex-col gap-6 rounded-[1.6rem] bg-white p-6 text-deep shadow-[0_60px_90px_-40px_rgba(0,0,0,.8)] sm:p-8"
            >
              <button
                type="button"
                onClick={() => {
                  setErrors({});
                  setFormError(null);
                  setStep("ask");
                }}
                className="eyebrow inline-flex items-center gap-2 self-start text-[0.62rem] text-rich hover:underline"
              >
                <span aria-hidden="true">←</span> Back
              </button>
              {previous && (
                <p className="rounded-xl bg-ivory px-4 py-3 text-sm text-deep/80">
                  This device already sent an RSVP for <strong>{previous.name}</strong>. Use the form again only to RSVP for
                  someone else.
                </p>
              )}

              <Field id="fullName" label="Full name" error={errors.fullName}>
                <input
                  id="rsvp-fullName"
                  name="fullName"
                  autoComplete="name"
                  value={values.fullName}
                  onChange={(e) => set("fullName", e.target.value)}
                  aria-invalid={Boolean(errors.fullName)}
                  aria-describedby={errors.fullName ? "rsvp-fullName-error" : undefined}
                  className={inputCls(errors.fullName)}
                  maxLength={80}
                  required
                />
              </Field>

              {attending && (
                <Field id="attendees" label="Number of attendees (including you)" error={errors.attendees}>
                  <div className="mt-2 flex items-center gap-3">
                    <button
                      type="button"
                      className="flex h-12 w-12 items-center justify-center rounded-full border border-deep/25 text-xl transition hover:bg-ivory disabled:opacity-40"
                      onClick={() => set("attendees", Math.max(1, values.attendees - 1))}
                      disabled={values.attendees <= 1}
                      aria-label="Fewer attendees"
                    >
                      −
                    </button>
                    <input
                      id="rsvp-attendees"
                      type="number"
                      inputMode="numeric"
                      min={1}
                      max={rsvpConfig.maxAttendees}
                      value={values.attendees}
                      onChange={(e) => set("attendees", Math.max(0, Math.min(rsvpConfig.maxAttendees, Number(e.target.value) || 0)))}
                      aria-invalid={Boolean(errors.attendees)}
                      aria-describedby={errors.attendees ? "rsvp-attendees-error" : undefined}
                      className="h-12 w-20 rounded-full border border-deep/25 bg-transparent text-center font-serif text-xl [appearance:textfield] focus:border-deep focus:outline-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <button
                      type="button"
                      className="flex h-12 w-12 items-center justify-center rounded-full border border-deep/25 text-xl transition hover:bg-ivory disabled:opacity-40"
                      onClick={() => set("attendees", Math.min(rsvpConfig.maxAttendees, values.attendees + 1))}
                      disabled={values.attendees >= rsvpConfig.maxAttendees}
                      aria-label="More attendees"
                    >
                      +
                    </button>
                  </div>
                </Field>
              )}

              {attending && (
                <Field id="dietary" label="Dietary requirements" optional error={errors.dietary}>
                  <input
                    id="rsvp-dietary"
                    value={values.dietary}
                    onChange={(e) => set("dietary", e.target.value)}
                    placeholder="Vegetarian, allergies…"
                    aria-invalid={Boolean(errors.dietary)}
                    aria-describedby={errors.dietary ? "rsvp-dietary-error" : undefined}
                    className={inputCls(errors.dietary)}
                    maxLength={200}
                  />
                </Field>
              )}

              <Field id="message" label="A message for the hosts" optional error={errors.message}>
                <textarea
                  id="rsvp-message"
                  rows={1}
                  value={values.message}
                  onChange={(e) => set("message", e.target.value)}
                  placeholder="Birthday wishes, PowerPoint teasers, threats about Jenga…"
                  aria-invalid={Boolean(errors.message)}
                  aria-describedby={errors.message ? "rsvp-message-error" : undefined}
                  className={`${inputCls(errors.message)} max-h-40 resize-none [field-sizing:content]`}
                  maxLength={600}
                />
              </Field>

              {/* Honeypot — hidden from people, tempting to bots */}
              <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
                <label>
                  Website
                  <input tabIndex={-1} autoComplete="off" value={values.website} onChange={(e) => set("website", e.target.value)} />
                </label>
              </div>

              {formError && (
                <div
                  ref={errorRef}
                  id="rsvp-form-error"
                  role="alert"
                  tabIndex={-1}
                  className="rounded-xl border border-rich/40 bg-rich/[0.06] px-4 py-3 text-sm text-rich outline-none"
                >
                  {formError}
                </div>
              )}

              <button type="submit" className="btn btn-dark mt-2 w-full" disabled={busy} aria-busy={busy}>
                {busy ? (
                  <>
                    <span aria-hidden="true" className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white" style={{ animation: "spin .8s linear infinite" }} />
                    Sending your RSVP…
                  </>
                ) : (
                  "Send my RSVP"
                )}
              </button>
              <p className="-mt-3 text-center text-xs text-deep/55">Your details are only shared with the hosts.</p>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}

const inputCls = (err?: string) =>
  `mt-1 w-full border-b bg-transparent py-2 font-serif text-lg placeholder:font-sans placeholder:text-sm placeholder:text-deep/35 focus:outline-none transition-colors ${
    err ? "border-rich" : "border-deep/25 focus:border-deep"
  }`;

function Field({ id, label, optional, error, children }: { id: string; label: string; optional?: boolean; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={`rsvp-${id}`} className="eyebrow flex justify-between text-[0.62rem] text-deep/70">
        {label}
        {optional && <span className="font-normal normal-case tracking-normal text-deep/45">Optional</span>}
      </label>
      {children}
      {error && <ErrorText id={`rsvp-${id}-error`}>{error}</ErrorText>}
    </div>
  );
}

function ErrorText({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <p id={id} className="mt-2 text-sm text-rich">
      {children}
    </p>
  );
}

function Confirmation({ done, onAnother }: { done: Done; onAnother: () => void }) {
  const ref = useRef<HTMLHeadingElement>(null);
  const reduced = useReducedMotion();
  useEffect(() => ref.current?.focus(), []);
  const title = done.attending ? "You're on the list." : "We'll miss you.";

  return (
    <div className="relative overflow-hidden rounded-[1.6rem] bg-white p-8 text-center text-deep shadow-[0_60px_90px_-40px_rgba(0,0,0,.8)] sm:p-14" style={{ animation: "pop-in .8s var(--ease-luxe) both" }}>
      {done.attending && !reduced && (
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
          {Array.from({ length: 36 }).map((_, i) => (
            <span
              key={i}
              className="absolute top-0 block"
              style={{
                left: `${(i * 37) % 100}%`,
                width: i % 3 ? 6 : 10,
                height: i % 3 ? 12 : 6,
                background: ["#5B1025", "#8B263F", "#D9D5D6", "#741B35"][i % 4],
                ["--dx" as string]: `${((i * 53) % 120) - 60}px`,
                ["--rot" as string]: `${(i * 97) % 720}deg`,
                animation: `confetti-fall ${2.4 + (i % 5) * 0.4}s cubic-bezier(.2,.6,.4,1) ${(i % 9) * 0.08}s both`,
              }}
            />
          ))}
        </div>
      )}
      <div className="relative">
        <span className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-deep font-serif text-3xl italic text-white ring-4 ring-silver/60">
          {done.attending ? eventDetails.age : "♡"}
        </span>
        <h3 ref={ref} tabIndex={-1} className="display mt-8 text-[clamp(2.6rem,6vw,4.4rem)] uppercase outline-none">
          {title}
        </h3>
        <p className="mx-auto mt-5 max-w-sm font-serif text-xl italic text-wine">
          {done.attending
            ? `Thank you, ${done.name.split(" ")[0]}. Your RSVP is saved — see you at ${eventDetails.venue.name}.`
            : `Thank you for letting us know, ${done.name.split(" ")[0]}. Your response is saved.`}
        </p>
        {done.attending && (
          <p className="eyebrow mt-8 text-[0.62rem] text-deep/60">
            {eventDetails.date} · {eventDetails.time}
          </p>
        )}
        <button type="button" onClick={onAnother} className="btn btn-ghost-dark mt-10">
          RSVP for someone else
        </button>
      </div>
    </div>
  );
}


function ShareAsk({ onYes, onNo }: { onYes: () => void; onNo: () => void }) {
  const [copied, setCopied] = useState(false);
  const { payTo } = contribution;
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(payTo.number.replace(/\s/g, ""));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable — the number is still visible */
    }
  };

  return (
    <div className="relative overflow-hidden rounded-[1.6rem] bg-white p-6 text-deep shadow-[0_60px_90px_-40px_rgba(0,0,0,.8)] sm:p-8" style={{ animation: "pop-in .7s var(--ease-luxe) both" }}>
      <p className="font-serif text-lg leading-snug text-deep/85">
        Before you RSVP, we were hoping to cost-share the total cost, if that is okay with you! It comes out to 1,850 pp, and
        we will gladly take care of the rest. Can&rsquo;t wait to celebrate with you!
      </p>
      <div className="mt-6 text-center">
        <h3 className="font-serif text-xl">
          The {contribution.currency} {contribution.amount.toLocaleString("en-KE")} <span className="text-rich">will cater for</span>
        </h3>
        <ul className="mt-3 flex flex-wrap justify-center gap-2">
          {contribution.includes.map((item) => (
            <li key={item} className="rounded-full bg-ivory px-5 py-1.5 font-serif text-lg ring-1 ring-deep/15">
              {item}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-deep px-5 py-3 text-white">
        <div>
          <p className="eyebrow text-[0.58rem] text-silver">You can send to {payTo.method}</p>
          <p className="mt-1 font-serif text-2xl tracking-wide">{payTo.number}</p>
          {payTo.name && <p className="text-sm text-white/80">M-Pesa name: {payTo.name}</p>}
        </div>
        <button type="button" onClick={copy} className="btn btn-light min-h-10 px-5 text-[0.6rem]">
          {copied ? "Copied ✓" : "Copy number"}
        </button>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <button type="button" onClick={onYes} className="btn btn-dark">
          Yes, I&rsquo;m in
        </button>
        <button type="button" onClick={onNo} className="btn btn-ghost-dark">
          Not this time
        </button>
      </div>
    </div>
  );
}

function Declined({ onBack, onTellHosts }: { onBack: () => void; onTellHosts: () => void }) {
  const ref = useRef<HTMLHeadingElement>(null);
  useEffect(() => ref.current?.focus(), []);
  return (
    <div className="rounded-[1.6rem] bg-white p-8 text-center text-deep shadow-[0_60px_90px_-40px_rgba(0,0,0,.8)] sm:p-14" style={{ animation: "pop-in .7s var(--ease-luxe) both" }}>
      <span className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-deep font-serif text-3xl italic text-white ring-4 ring-silver/60">♡</span>
      <h3 ref={ref} tabIndex={-1} className="display mt-8 text-[clamp(2.6rem,6vw,4.2rem)] uppercase outline-none">
        We&rsquo;ll miss you.
      </h3>
      <p className="mx-auto mt-5 max-w-sm font-serif text-xl italic text-wine">That&rsquo;s okay — no pressure at all. Thank you for letting us know.</p>
      <div className="mt-10 flex flex-wrap justify-center gap-3">
        <button type="button" onClick={onBack} className="btn btn-dark">
          Changed my mind
        </button>
        <button type="button" onClick={onTellHosts} className="btn btn-ghost-dark">
          Let the hosts know
        </button>
      </div>
    </div>
  );
}
