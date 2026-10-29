"use client";

import { useEffect } from "react";
import type { CardText } from "./textures";

/** Elegant CSS-only envelope, used when WebGL is unavailable. */
export default function Envelope2D({
  opened,
  revealed,
  reducedMotion,
  text,
  onRevealed,
  onOpen,
}: {
  opened: boolean;
  revealed: boolean;
  reducedMotion: boolean;
  text: CardText;
  onRevealed: () => void;
  onOpen: () => void;
}) {
  useEffect(() => {
    if (!opened || revealed) return;
    const id = window.setTimeout(onRevealed, reducedMotion ? 0 : 2000);
    return () => window.clearTimeout(id);
  }, [opened, revealed, reducedMotion, onRevealed]);

  const ease = "cubic-bezier(.22,1,.36,1)";

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 flex items-center justify-center transition-transform duration-[1200ms] ${
        revealed ? "max-[1099px]:-translate-y-[24svh] max-[1099px]:scale-[.72] min-[1100px]:translate-x-[23vw]" : ""
      }`}
      style={{ transitionTimingFunction: ease }}
    >
      <div
        className={`relative aspect-[3.2/2.1] w-[min(84vw,520px)] animate-float [perspective:1400px] ${opened ? "" : "pointer-events-auto cursor-pointer"}`}
        style={{ ["--dur" as string]: "6s" }}
        onClick={opened ? undefined : onOpen}
      >
        {/* lace trim */}
        <div
          aria-hidden="true"
          className="absolute -inset-3 rounded-[14px] transition-opacity duration-700"
          style={{
            opacity: revealed ? 0 : 1,
            background:
              "radial-gradient(circle at 50% 50%, transparent 0 3px, var(--color-wine) 3.5px 6px, transparent 6.5px) 0 0 / 14px 14px, radial-gradient(circle at 50% 50%, var(--color-wine) 0 4px, transparent 4.5px) 7px 7px / 14px 14px",
          }}
        />
        {/* back + liner */}
        <div
          className="absolute inset-0 rounded-md bg-deep shadow-[0_40px_80px_-30px_rgba(0,0,0,.7)] transition-all duration-700"
          style={{ opacity: revealed ? 0 : 1, transform: revealed ? "translateY(40%)" : "none" }}
        >
          <div className="absolute inset-[3%] rounded-sm bg-[repeating-linear-gradient(45deg,rgba(139,38,63,.25)_0_2px,transparent_2px_14px),repeating-linear-gradient(-45deg,rgba(139,38,63,.25)_0_2px,transparent_2px_14px)] bg-ivory" />
        </div>

        {/* card */}
        <div
          className="absolute inset-x-[4%] inset-y-[5%] flex flex-col items-center justify-center overflow-hidden rounded-sm bg-white px-[6%] text-center text-deep shadow-[0_30px_60px_-25px_rgba(0,0,0,.6)]"
          style={{
            zIndex: revealed ? 40 : 10,
            transform: revealed ? "translateY(-4%) scale(1.18)" : opened ? "translateY(-58%)" : "none",
            transition: `transform 1s ${ease} ${opened && !revealed ? ".75s" : "0s"}`,
          }}
        >
          {text.photo && (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={text.photo} alt="" className="absolute inset-0 h-full w-full rounded-sm object-cover" style={{ objectPosition: "50% 0%" }} />
              <div className="absolute inset-0 rounded-sm bg-[linear-gradient(to_bottom,rgba(91,16,37,.15),rgba(91,16,37,.4)_45%,rgba(91,16,37,.85)_75%,rgba(42,6,16,.95))]" />
            </>
          )}
          <div className={`pointer-events-none absolute inset-[3%] border ${text.photo ? "border-white/80" : "border-deep/80"}`} />
          <div className={`pointer-events-none absolute inset-[4.5%] border ${text.photo ? "border-silver/50" : "border-silver"}`} />
          <div className={`relative ${text.photo ? "mt-auto pb-[7%] text-white" : ""}`}>
            <p className="display text-[clamp(1.2rem,5vw,2.4rem)] italic">{text.greeting}</p>
            <p className={`mt-2 font-serif text-[clamp(0.75rem,2.6vw,1.2rem)] ${text.photo ? "" : "text-wine"}`}>{text.message}</p>
            <p className={`eyebrow mt-3 text-[0.42rem] sm:text-[0.52rem] ${text.photo ? "text-silver" : "text-rich"}`}>{text.signOff}</p>
          </div>
        </div>

        {/* pocket */}
        <div
          className="absolute inset-0 z-20 rounded-md bg-gradient-to-b from-wine to-deep transition-all duration-700"
          style={{ clipPath: "polygon(0 0, 50% 50%, 100% 0, 100% 100%, 0 100%)", opacity: revealed ? 0 : 1, transform: revealed ? "translateY(40%)" : "none" }}
        >
          <p className="absolute inset-x-0 bottom-[18%] text-center font-serif text-[clamp(1.1rem,4vw,2rem)] italic text-white">
            You&rsquo;re invited
          </p>
        </div>

        {/* flap */}
        <div
          className="absolute inset-x-0 top-0 h-[58%] origin-top"
          style={{
            zIndex: opened ? 5 : 30,
            transform: opened ? "rotateX(180deg)" : "none",
            transition: `transform .9s ${ease}, z-index 0s .45s, opacity .7s`,
            opacity: revealed ? 0 : 1,
          }}
        >
          <div className="h-full w-full bg-gradient-to-b from-deep to-wine" style={{ clipPath: "polygon(0 0, 100% 0, 50% 100%)" }} />
          <div className="absolute left-1/2 top-[70%] flex h-14 w-14 -translate-x-1/2 items-center justify-center rounded-full bg-rich font-serif text-xl italic text-white ring-2 ring-silver/70 shadow-lg sm:h-16 sm:w-16">
            {text.age}
          </div>
        </div>
      </div>
    </div>
  );
}
