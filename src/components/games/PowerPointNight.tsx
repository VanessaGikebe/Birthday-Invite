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
    kicker: "Agenda",
    title: "Tonight's programme",
    body: (
      <ol className="space-y-1 text-left">
        <li>01 &nbsp;One hot take</li>
        <li>02 &nbsp;Zero evidence</li>
        <li>03 &nbsp;Standing ovation (mandatory)</li>
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

export default function PowerPointNight({ intro }: { intro: React.ReactNode }) {
  const [i, setI] = useState(0);
  const [auto, setAuto] = useState(true);
  const [topic, setTopic] = useState<string | null>(null);
  const reduced = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref);

  useEffect(() => {
    if (!auto || reduced || !inView) return;
    const id = window.setInterval(() => setI((n) => (n + 1) % SLIDES.length), 4200);
    return () => window.clearInterval(id);
  }, [auto, reduced, inView]);

  const go = (d: number) => {
    setAuto(false);
    setI((n) => (n + d + SLIDES.length) % SLIDES.length);
  };

  const newTopic = () => {
    let next = topic;
    while (next === topic) next = TOPICS[Math.floor(Math.random() * TOPICS.length)];
    setTopic(next);
  };

  return (
    <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
      {/* Intro + hot-take generator */}
      <div>
        {intro}
        <div className="mt-8" data-reveal>
          <p className="eyebrow text-[0.62rem] text-rich">Stuck for a hot take?</p>
          <div className="mt-3 flex min-h-[5.5rem] items-center border-y border-deep/20 py-4">
            <p aria-live="polite" key={topic ?? "none"} className="display text-[clamp(1.4rem,2.4vw,2rem)] italic" style={{ animation: topic ? "pop-in .6s var(--ease-luxe) both" : undefined }}>
              {topic ? `“${topic}”` : "Your hottest take is one click away."}
            </p>
          </div>
          <button type="button" onClick={newTopic} className="btn btn-dark mt-5">
            {topic ? "Another one" : "Give me a hot take"}
          </button>
        </div>
      </div>

      {/* Laptop + floating slides */}
      <div ref={ref} className="relative px-6 py-6" data-reveal>
        {[
          { t: "Hot takes", s: "Vol. 3", c: "-left-2 top-0 -rotate-12", p: 0.6 },
          { t: "Main character", s: "energy", c: "-right-2 -top-4 rotate-6", p: 0.9 },
          { t: "In conclusion:", s: "I'm right", c: "-left-4 bottom-16 rotate-[8deg]", p: 0.4 },
          { t: "Slide 47", s: "of 47", c: "-right-4 bottom-20 -rotate-[5deg]", p: 0.75 },
        ].map((f, k) => (
          <div key={k} aria-hidden="true" data-parallax={f.p} className={`absolute z-20 hidden md:block ${f.c}`}>
            <div className="animate-float aspect-[16/10] w-32 rounded-md bg-rich p-2.5 text-white shadow-[0_30px_50px_-20px_rgba(0,0,0,.7)] ring-1 ring-white/25" style={{ ["--delay" as string]: `${k * -1.7}s` }}>
              <p className="eyebrow text-[0.4rem] text-silver">{f.s}</p>
              <p className="display mt-1.5 text-base">{f.t}</p>
              <div className="mt-2 space-y-1">
                <span className="block h-0.5 w-4/5 bg-white/30" />
                <span className="block h-0.5 w-3/5 bg-white/30" />
              </div>
            </div>
          </div>
        ))}

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
                <div className="absolute inset-x-4 bottom-2.5 flex items-center justify-between text-[0.55rem] text-white/60">
                  <span className="eyebrow text-[0.45rem]">Three birthdays · Turning 21</span>
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
        </div>
      </div>
    </div>
  );
}
