"use client";

import dynamic from "next/dynamic";
import gsap from "gsap";
import { Component, useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { eventDetails } from "@/config/event";
import { hasWebGL, useInView, useReducedMotion } from "@/lib/hooks";
import Envelope2D from "./Envelope2D";
import type { CardText } from "./textures";

const EnvelopeScene = dynamic(() => import("./EnvelopeScene"), { ssr: false });

class SceneBoundary extends Component<{ onError: () => void; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    this.props.onError();
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}



export default function Hero({ cardPhoto = null }: { cardPhoto?: string | null }) {
  const cardText: CardText = {
    greeting: eventDetails.letter.greeting,
    message: eventDetails.letter.message,
    signOff: eventDetails.letter.signOff,
    age: eventDetails.age,
    photo: cardPhoto,
    photoFocusY: 0.15,
  };
  const heroRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const reduced = useReducedMotion();
  const inView = useInView(heroRef);
  const [mode, setMode] = useState<"detect" | "3d" | "2d">("detect");
  const [ready, setReady] = useState(false);
  const [opened, setOpened] = useState(false);
  const [revealed, setRevealed] = useState(false);

  // `?flat` previews the 2D fallback that browsers without WebGL see.
  useEffect(() => {
    setMode(hasWebGL() && !new URLSearchParams(location.search).has("flat") ? "3d" : "2d");
  }, []);

  const fallback = useCallback(() => setMode("2d"), []);
  const onRevealed = useCallback(() => setRevealed(true), []);
  const open = useCallback(() => setOpened(true), []);

  useEffect(() => {
    if (!revealed || !contentRef.current) return;
    const items = contentRef.current.querySelectorAll("[data-hero-item]");
    if (reduced) {
      gsap.set(items, { opacity: 1, y: 0 });
    } else {
      gsap.fromTo(items, { opacity: 0, y: 34 }, { opacity: 1, y: 0, duration: 1.1, ease: "power3.out", stagger: 0.09 });
    }
    headingRef.current?.focus({ preventScroll: true });
  }, [revealed, reduced]);

  const showLoader = mode === "detect" || (mode === "3d" && !ready);

  return (
    <section
      ref={heroRef}
      id="top"
      aria-label="Your invitation"
      className="relative isolate flex min-h-[100svh] flex-col overflow-hidden bg-deep text-white"
    >
      {/* Backdrop */}
      <div aria-hidden="true" className="absolute inset-0 -z-20 bg-[radial-gradient(90%_70%_at_50%_45%,var(--color-wine)_0%,var(--color-deep)_55%,var(--color-ink)_100%)]" />
      <div
        aria-hidden="true"
        className={`display pointer-events-none absolute -z-10 select-none italic leading-none text-white/[0.05] transition-all duration-[1600ms] ease-[var(--ease-luxe)] ${
          revealed ? "-left-[4vw] bottom-[-8vw] text-[48vw]" : "left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-[62vw] md:text-[44vw]"
        }`}
      >
        {eventDetails.age}
      </div>

      {/* 3D / 2D invitation */}
      <div className={`absolute inset-0 transition-opacity duration-1000 ${showLoader ? "opacity-0" : "opacity-100"}`}>
        {mode === "3d" && (
          <SceneBoundary onError={fallback}>
            <EnvelopeScene
              opened={opened}
              reducedMotion={reduced}
              active={inView}
              text={cardText}
              eventSource={heroRef}
              onReady={() => setReady(true)}
              onOpen={open}
              onRevealed={onRevealed}
              onContextLost={fallback}
            />
          </SceneBoundary>
        )}
        {mode === "2d" && <Envelope2D opened={opened} revealed={revealed} reducedMotion={reduced} text={cardText} onRevealed={onRevealed} onOpen={open} />}
      </div>

      {showLoader && (
        <div role="status" className="absolute inset-0 flex flex-col items-center justify-center gap-5">
          <span className="h-12 w-12 rounded-full border border-white/15 border-t-white" style={{ animation: "spin 1.1s linear infinite" }} />
          <span className="eyebrow text-silver/80">Preparing your invitation</span>
        </div>
      )}

      {/* Top bar */}
      <header className="relative z-20 flex items-center justify-between px-5 pt-5 sm:px-10 sm:pt-8">
        <a href="#top" className="flex items-center gap-3" aria-label="Back to top">
          <span className="flex h-10 w-10 items-center justify-center rounded-full border border-white/40 font-serif text-sm italic">{eventDetails.age}</span>
          <span className="eyebrow hidden text-[0.62rem] text-silver sm:inline">Private invitation</span>
        </a>
        <a href="#rsvp" className="btn btn-ghost-light min-h-10 px-5 text-[0.65rem]">
          RSVP
        </a>
      </header>

      {/* Before opening */}
      <div
        className={`absolute inset-x-0 bottom-0 z-20 flex flex-col items-center gap-5 px-5 pb-[max(2.5rem,env(safe-area-inset-bottom))] text-center transition-all duration-700 ${
          opened ? "pointer-events-none translate-y-6 opacity-0" : "opacity-100"
        }`}
        aria-hidden={opened}
      >
        <p className="eyebrow text-silver/90">Tap the envelope to open</p>
        <button type="button" className="btn btn-light" onClick={open} disabled={opened} tabIndex={opened ? -1 : 0}>
          <span aria-hidden="true" className="h-1.5 w-1.5 rotate-45 bg-rich" />
          Open your invitation
        </button>
      </div>

      {/* After opening */}
      <div
        ref={contentRef}
        className={`z-10 flex flex-1 flex-col justify-end px-5 pb-10 pt-[42svh] sm:px-10 min-[1100px]:justify-center min-[1100px]:pb-16 min-[1100px]:pt-8 ${
          revealed ? "relative" : "pointer-events-none absolute inset-0"
        }`}
      >
        <div className="max-w-[40rem] min-[1100px]:w-[46%]">
          <h1 ref={headingRef} tabIndex={-1} data-hero-item className="display text-[clamp(2.2rem,4.2vw,4rem)] opacity-0 outline-none">
            <span className="block">{eventDetails.headline[0]}</span>
            <span className="block italic text-silver">{eventDetails.headline[1]}</span>
          </h1>
          <dl data-hero-item className="mt-6 grid grid-cols-3 gap-3 border-t border-white/20 pt-5 opacity-0 sm:mt-8 sm:gap-6">
            {[
              ["Date", eventDetails.date],
              ["Time", eventDetails.time],
              ["Venue", eventDetails.venue.name],
            ].map(([k, v]) => (
              <div key={k}>
                <dt className="eyebrow text-[0.58rem] text-silver/75">{k}</dt>
                <dd className="mt-1.5 font-serif text-sm leading-snug sm:text-lg">{v}</dd>
              </div>
            ))}
          </dl>
          <div data-hero-item className="mt-7 flex flex-wrap gap-3 opacity-0 sm:mt-8">
            <a href="#rsvp" className="btn btn-light" tabIndex={revealed ? 0 : -1}>
              RSVP now
            </a>
            <a href="#celebrants" className="btn btn-ghost-light" tabIndex={revealed ? 0 : -1}>
              Explore the night
            </a>
          </div>
        </div>
      </div>

      {revealed && (
        <div aria-hidden="true" className="absolute bottom-6 right-6 z-10 hidden flex-col items-center gap-3 sm:flex">
          <span className="eyebrow text-[0.55rem] text-silver/70 [writing-mode:vertical-rl]">Scroll</span>
          <span className="h-14 w-px bg-white/60" style={{ animation: "scroll-cue 2.2s ease-in-out infinite" }} />
        </div>
      )}
    </section>
  );
}
