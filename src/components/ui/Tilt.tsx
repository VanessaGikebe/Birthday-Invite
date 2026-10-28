"use client";

import { tiltHandlers } from "@/lib/hooks";

/** Wraps content in a pointer-reactive 3D tilt with a soft silver sheen. */
export default function Tilt({
  children,
  className = "",
  max = 8,
  sheen = true,
  style,
}: {
  children: React.ReactNode;
  className?: string;
  max?: number;
  sheen?: boolean;
  style?: React.CSSProperties;
}) {
  return (
    <div className={`[perspective:1200px] ${className}`} style={style}>
      <div
        {...tiltHandlers(max)}
        className="group/tilt relative h-full w-full transition-transform duration-500 ease-[var(--ease-luxe)] [transform-style:preserve-3d] [transform:rotateX(var(--rx,0deg))_rotateY(var(--ry,0deg))]"
      >
        {children}
        {sheen && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-10 opacity-0 mix-blend-soft-light transition-opacity duration-500 group-hover/tilt:opacity-100"
            style={{ background: "radial-gradient(circle at var(--mx,50%) var(--my,50%), rgba(255,255,255,.75), transparent 55%)" }}
          />
        )}
      </div>
    </div>
  );
}
