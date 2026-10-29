"use client";

import { useEffect, useRef, useState } from "react";
import { useInView, useReducedMotion } from "@/lib/hooks";

type Slide = { kicker: string; title: string; body: React.ReactNode };

const SLIDES: Slide[] = [
  {
    kicker: "Tonight's theme",
    title: "Hot Takes",
    body: <p className="italic opacity-80">Presented by: everyone, unfortunately.</p>,
  },
  {
    kicker: "Entry requirements",
    title: "Everyone presents",
    body: (
      <ol className="space-y-1 text-left">
        <li>01 &nbsp;One PowerPoint (yes, you)</li>
        <li>02 &nbsp;One hot take, defended to the death</li>
        <li>03 &nbsp;Zero apologies</li>
      </ol>
    ),
  },
  {
    kicker: "Hot take #1",
    title: "Cereal is a soup",
    body: (
      <div className="mx-auto grid w-[80%] gap-2 text-left text-[0.65em]">
        {[
          ["Confidence", 100],
          ["Evidence", 4],
          ["Volume", 92],
        ].map(([k, v]) => (
          <div key={k as string} className="flex items-center gap-3">
            <span className="w-24 shrink-0">{k}</span>
            <span className="h-3 flex-1 bg-white/15">
              <span className="block h-full bg-white" style={{ width: `${v}%` }} />
            </span>
            <span className="w-10 text-right">{v}%</span>
          </div>
        ))}
      </div>
    ),
  },
  {
    kicker: "Hot take #2 · Peer-reviewed*",
    title: "Ugali > rice",
    body: <p className="italic opacity-80">*Peer: my cousin. Review: “valid.”</p>,
  },
  {
    kicker: "Q & A",
    title: "Any questions?",
    body: <p className="italic opacity-80">Disagreements taken in the order I like them.</p>,
  },
];

const TOPICS = [
  "November babies are simply built different",
  "Ranking every chapati I've ever eaten",
  "Nairobi traffic: a love story in three acts",
  "The group chat needs a constitution",
  "Cereal is a soup and I can prove it",
  "Pineapple on pizza: a legal defence",
  "My villain origin story, with clip art",
  "Why I should be allowed to DJ",
  "Ugali vs rice: the definitive ruling",
  "Everything I'd do as President for one day",
  "Which of the birthday girls would survive a horror film",
  "Being late is a love language",
  "Group photos should require a signed agreement",
  "My five-year plan (year one: nap)",
  "Matatu names, ranked by spiritual energy",
  "Why I'm always right: a 47-slide rebuttal",
];

/** Heckles that pop up around the laptop, like a very opinionated audience. */
const HECKLES = ["Objection!", "Source??", "Iconic.", "Next slide!", "Says who?", "Standing ovation", "Ugali > rice?!", "Facts.", "Respectfully, no.", "Encore!"];
const HECKLE_SPOTS = [
  "left-0 top-6",
  "right-2 top-2",
  "-left-2 top-1/2",
  "right-0 top-[45%]",
  "left-8 bottom-24",
  "right-10 bottom-28",
];

export default function PowerPointNight({ intro }: { intro: React.ReactNode }) {
  const [i, setI] = useState(0);
  const [auto, setAuto] = useState(true);
  const [topic, setTopic] = useState<string | null>(null);
  const [spinning, setSpinning] = useState(false);
  const [heckle, setHeckle] = useState<{ text: string; spot: string; key: number } | null>(null);
  const [stamped, setStamped] = useState(false);
  const spinTimers = useRef<number[]>([]);
  const reduced = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, "-120px");

  // The "everyone presents" stamp slams down the first time the laptop is properly on screen.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setStamped(true);
          io.disconnect();
        }
      },
      { threshold: 0.45 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // The audience heckles every couple of seconds.
  useEffect(() => {
    if (reduced || !inView) return;
    let n = 0;
    const id = window.setInterval(() => {
      n += 1;
      setHeckle({
        text: HECKLES[Math.floor(Math.random() * HECKLES.length)],
        spot: HECKLE_SPOTS[n % HECKLE_SPOTS.length],
        key: n,
      });
    }, 2300);
    return () => window.clearInterval(id);
  }, [reduced, inView]);

  useEffect(() => () => spinTimers.current.forEach((t) => window.clearTimeout(t)), []);

  useEffect(() => {
    if (!auto || reduced || !inView) return;
    const id = window.setInterval(() => setI((n) => (n + 1) % SLIDES.length), 4200);
    return () => window.clearInterval(id);
  }, [auto, reduced, inView]);

  const go = (d: number) => {
    setAuto(false);
    setI((n) => (n + d + SLIDES.length) % SLIDES.length);
  };

  // Slot-machine spin: flick through topics, slowing down, then land on one.
  const spin = () => {
    if (spinning) return;
    const pick = () => TOPICS[Math.floor(Math.random() * TOPICS.length)];
    let final = pick();
    while (final === topic) final = pick();
    if (reduced) {
      setTopic(final);
      return;
    }
    setSpinning(true);
    spinTimers.current.forEach((t) => window.clearTimeout(t));
    spinTimers.current = [];
    let delay = 0;
    for (let k = 0; k < 14; k++) {
      delay += 45 + k * k * 2.2;
      spinTimers.current.push(window.setTimeout(() => setTopic(pick()), delay));
    }
    spinTimers.current.push(
      window.setTimeout(() => {
        setTopic(final);
        setSpinning(false);
      }, delay + 160),
    );
  };

  return (
    <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
      {/* Intro + hot-take generator */}
      <div>
        {intro}
        <div className="mt-8" data-reveal>
          <p className="eyebrow text-[0.62rem] text-rich">No idea what to present? Spin for one.</p>
          <div className="mt-3 flex min-h-[5.5rem] items-center overflow-hidden border-y border-deep/20 py-4">
            <p
              key={spinning ? "spinning" : topic ?? "none"}
              className={`display text-[clamp(1.4rem,2.4vw,2rem)] italic ${spinning ? "text-deep/45 blur-[0.5px]" : ""}`}
              style={{ animation: topic && !spinning ? "pop-in .6s var(--ease-luxe) both" : undefined }}
            >
              {topic ? `\u201c${topic}\u201d` : "Your hottest take is one spin away."}
            </p>
            <p className="sr-only" aria-live="polite">
              {!spinning && topic ? `Your topic: ${topic}` : ""}
            </p>
          </div>
          <button type="button" onClick={spin} disabled={spinning} className="btn btn-dark mt-5">
            <span aria-hidden="true" className={`inline-block ${spinning ? "animate-spin" : ""}`}>
              ✦
            </span>
            {spinning ? "Spinning…" : topic ? "Spin again" : "Spin for my hot take"}
          </button>
        </div>
      </div>

      {/* Laptop + heckles */}
      <div ref={ref} className="relative px-6 py-6" data-reveal>
        {/* Audience heckles */}
        {heckle && (
          <div key={heckle.key} aria-hidden="true" className={`pointer-events-none absolute z-30 ${heckle.spot}`} style={{ animation: "bubble 2.2s ease-out both" }}>
            <div className="relative rounded-2xl bg-white px-3.5 py-1.5 font-serif text-sm italic text-rich shadow-[0_12px_30px_-10px_rgba(42,6,16,.45)] ring-1 ring-deep/10">
              {heckle.text}
              <span className="absolute -bottom-1.5 left-5 h-3 w-3 rotate-45 bg-white ring-1 ring-deep/10 [clip-path:polygon(100%_0,100%_100%,0_100%)]" />
            </div>
          </div>
        )}

        <div className="relative z-10 mx-auto w-full max-w-[min(92vw,34rem,calc(70svh*1.45))] [perspective:2200px]">
          <div className="[transform-style:preserve-3d] [transform:rotateX(8deg)]">
            {/* screen */}
            <div className="relative rounded-t-[1.2rem] bg-[linear-gradient(160deg,#f4f2f2,#D9D5D6_45%,#a9a3a5)] p-[2.2%] pb-[3%] shadow-[0_60px_90px_-40px_rgba(0,0,0,.8)]">
              <div
                className="relative aspect-[16/10] overflow-hidden rounded-md bg-[radial-gradient(120%_100%_at_30%_20%,#8B263F,#5B1025_70%)] text-white"
                role="region"
                aria-roledescription="carousel"
                aria-label="Sample presentation"
              >
                {SLIDES.map((s, k) => (
                  <div
                    key={k}
                    aria-hidden={k !== i}
                    className="absolute inset-0 flex flex-col items-center justify-center px-[8%] text-center transition-all duration-700 ease-[var(--ease-luxe)]"
                    style={{
                      opacity: k === i ? 1 : 0,
                      transform: k === i ? "none" : k < i ? "translateX(-8%) rotateY(18deg)" : "translateX(8%) rotateY(-18deg)",
                    }}
                  >
                    <p className="eyebrow text-[0.5rem] text-silver sm:text-[0.6rem]">{s.kicker}</p>
                    <p className="display mt-2 text-[clamp(1.4rem,3.4vw,2.6rem)]">{s.title}</p>
                    <div className="mt-3 w-full text-[clamp(0.7rem,1.3vw,0.95rem)]">{s.body}</div>
                  </div>
                ))}
                <div className="absolute inset-x-4 bottom-2.5 flex items-center justify-start text-[0.55rem] text-white/60">
                  <span>Slide {i + 1} of 147</span>
                </div>
                <p className="sr-only" aria-live="polite">
                  {`Slide ${i + 1}: ${SLIDES[i].title}`}
                </p>
              </div>
              <span aria-hidden="true" className="absolute left-1/2 top-[1%] h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-ink/60" />
            </div>
            {/* base */}
            <div aria-hidden="true" className="relative -mx-[7%] h-4 origin-top rounded-b-[1rem] bg-[linear-gradient(#e9e6e6,#a9a3a5)] shadow-[0_40px_60px_-20px_rgba(0,0,0,.7)]">
              <span className="absolute left-1/2 top-0 h-1 w-[16%] -translate-x-1/2 rounded-b-md bg-[#b9b3b5]" />
            </div>
          </div>
          <div className="mt-6 flex items-center justify-center gap-3">
            <button type="button" onClick={() => go(-1)} className="btn btn-ghost-dark min-h-10 px-5" aria-label="Previous slide">
              ←
            </button>
            <button type="button" onClick={() => setAuto((a) => !a)} className="btn btn-ghost-dark min-h-10 px-5 text-[0.6rem]" aria-pressed={!auto}>
              {auto ? "Pause" : "Play"}
            </button>
            <button type="button" onClick={() => go(1)} className="btn btn-ghost-dark min-h-10 px-5" aria-label="Next slide">
              →
            </button>
          </div>
          {/* Rubber stamp: sits low on the laptop's bottom-right corner, clear of the slide content */}
          {stamped && (
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-3 bottom-[7rem] z-30 rounded-md border-[3px] border-double border-rich bg-ivory/90 px-4 py-1.5 text-center text-rich shadow-lg sm:-right-6"
              style={{ animation: reduced ? undefined : "stamp-in .55s cubic-bezier(.2,.9,.3,1.2) .3s both", transform: "rotate(-10deg)" }}
            >
              <p className="display text-xl uppercase leading-none tracking-wide sm:text-2xl">Mandatory</p>
              <p className="eyebrow mt-1 text-[0.48rem]">Everyone presents</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
