"use client";

import gsap from "gsap";
import { useEffect, useRef, useState } from "react";
import { useInView, useReducedMotion } from "@/lib/hooks";

export type CarouselItem = { key: string; label: string; node: React.ReactNode };

/**
 * A ring of panels that slowly spins in 3D. Drag/swipe to spin it, use the
 * arrows (or ←/→ keys) to step. Pauses on hover, off-screen and for visitors
 * who prefer reduced motion.
 */
export default function Carousel3D({
  items,
  label,
  minItems = 6,
  /** Panel width — relative to --stage (the stage height) so it scales with the screen. */
  itemClass = "w-[min(58vw,calc(var(--stage)*0.6))]",
  aspect = "aspect-[3/4]",
  speed = 9,
  tone = "light",
  stage = "clamp(16rem, 47svh, 27rem)",
}: {
  items: CarouselItem[];
  label: string;
  /** Repeat the list until the ring has at least this many panels. */
  minItems?: number;
  itemClass?: string;
  aspect?: string;
  /** Auto-rotation in degrees per second. */
  speed?: number;
  /** Colour of the controls: "light" on burgundy, "dark" on ivory. */
  tone?: "light" | "dark";
  /** Stage height (CSS length); panel sizes scale from it. */
  stage?: string;
}) {
  const ring: CarouselItem[] = [];
  while (ring.length < Math.max(minItems, items.length)) ring.push(...items);
  const panels = ring.slice(0, Math.max(minItems, items.length));
  const n = panels.length;
  const step = 360 / n;

  const wrapRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const panelRefs = useRef<(HTMLDivElement | null)[]>([]);
  const sizeRef = useRef<HTMLDivElement>(null);
  const state = useRef({ angle: 0, hover: false, drag: false, lastX: 0, velocity: 0 });
  const [radius, setRadius] = useState(320);
  const [active, setActive] = useState(0);
  const reduced = useReducedMotion();
  const inView = useInView(wrapRef);

  // Radius so neighbouring panels sit side by side with a little air.
  useEffect(() => {
    const el = sizeRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const w = el.offsetWidth;
      setRadius(Math.round((w / 2 / Math.tan(Math.PI / n)) * 1.12 + 12));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [n]);

  const apply = () => {
    const a = state.current.angle;
    if (ringRef.current) ringRef.current.style.transform = `translateZ(${-radius}px) rotateY(${a}deg)`;
    panelRefs.current.forEach((p, i) => {
      if (!p) return;
      const facing = Math.cos(((i * step + a) * Math.PI) / 180);
      p.style.opacity = String(0.25 + 0.75 * Math.max(0, facing));
      p.style.filter = facing > 0.92 ? "none" : `brightness(${0.55 + 0.45 * Math.max(0, facing)})`;
    });
    const idx = (((Math.round(-a / step) % n) + n) % n) % items.length;
    setActive((prev) => (prev === idx ? prev : idx));
  };

  useEffect(() => {
    apply();
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const s = state.current;
      if (!s.drag) {
        if (Math.abs(s.velocity) > 0.01) {
          s.angle += s.velocity;
          s.velocity *= 0.92;
        } else if (!s.hover && !reduced && inView && !gsap.isTweening(s)) {
          s.angle -= speed * dt;
        }
      }
      apply();
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [radius, reduced, inView, n, speed]);

  const go = (dir: number) => {
    const s = state.current;
    s.velocity = 0;
    const target = Math.round(s.angle / step) * step - dir * step;
    gsap.to(s, { angle: target, duration: reduced ? 0 : 0.9, ease: "power3.out" });
  };

  const onPointerDown = (e: React.PointerEvent) => {
    const s = state.current;
    s.drag = true;
    s.lastX = e.clientX;
    s.velocity = 0;
    gsap.killTweensOf(s);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const s = state.current;
    if (!s.drag) return;
    const dx = e.clientX - s.lastX;
    s.lastX = e.clientX;
    s.angle += dx * 0.25;
    s.velocity = dx * 0.25;
  };
  const endDrag = () => {
    state.current.drag = false;
  };

  const btn =
    tone === "light"
      ? "border-white/40 text-white hover:bg-white hover:text-deep"
      : "border-deep/30 text-deep hover:bg-deep hover:text-white";

  return (
    <div
      ref={wrapRef}
      role="region"
      aria-roledescription="carousel"
      aria-label={label}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") go(1);
        if (e.key === "ArrowLeft") go(-1);
      }}
      className="relative outline-none"
      style={{ ["--stage" as string]: stage }}
    >
      <div
        className="relative flex h-[min(110vw,var(--stage))] cursor-grab touch-pan-y select-none items-center justify-center active:cursor-grabbing [perspective:1600px]"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onPointerEnter={() => (state.current.hover = true)}
        onPointerLeave={() => {
          state.current.hover = false;
          endDrag();
        }}
      >
        {/* floor glow */}
        <div aria-hidden="true" className={`absolute bottom-[4%] h-16 w-[70%] rounded-[50%] blur-2xl ${tone === "light" ? "bg-black/35" : "bg-deep/20"}`} />
        <div ref={sizeRef} className={`${itemClass} invisible absolute`} aria-hidden="true" />
        <div ref={ringRef} className="relative [transform-style:preserve-3d]" style={{ transform: `translateZ(${-radius}px)` }}>
          {panels.map((it, i) => (
            <div
              key={`${it.key}-${i}`}
              ref={(el) => {
                panelRefs.current[i] = el;
              }}
              aria-hidden={i >= items.length || undefined}
              className={`${itemClass} ${aspect} absolute left-1/2 top-1/2 [backface-visibility:hidden]`}
              style={{ transform: `translate(-50%, -50%) rotateY(${i * step}deg) translateZ(${radius}px)` }}
            >
              {it.node}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-3 flex items-center justify-center gap-5">
        <button type="button" onClick={() => go(-1)} aria-label="Previous" className={`flex h-11 w-11 items-center justify-center rounded-full border transition-colors ${btn}`}>
          ←
        </button>
        <p aria-live="polite" className={`display min-w-[9rem] text-center text-xl italic sm:text-2xl ${tone === "light" ? "text-white" : "text-deep"}`}>
          {items[active]?.label}
        </p>
        <button type="button" onClick={() => go(1)} aria-label="Next" className={`flex h-11 w-11 items-center justify-center rounded-full border transition-colors ${btn}`}>
          →
        </button>
      </div>
    </div>
  );
}
