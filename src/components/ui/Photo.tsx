import Image from "next/image";
import type { Photo as PhotoType } from "@/config/event";

type Props = {
  photo: PhotoType | null;
  /** Width / height of the frame the photo fills. */
  frameAspect: number;
  /** Rendered frame width, for the `sizes` hint (CSS length). */
  sizes: string;
  monogram?: string;
  label?: string;
  priority?: boolean;
  className?: string;
  /** Tint non-portrait photos toward the burgundy palette until hovered. */
  tint?: boolean;
};

/**
 * A photo that fills its (relatively positioned) parent. Supports a "crop"
 * window so individual portraits can be framed out of a group photo, and
 * falls back to a monogram placeholder when the file isn't there yet.
 */
export function Photo({ photo, frameAspect, sizes, monogram, label, priority, className = "", tint }: Props) {
  if (!photo) return <Placeholder monogram={monogram} label={label} className={className} />;

  // next/image `fill` can't take its own width/height, so a crop sizes and positions
  // a wrapper box instead and the image fills that box.
  let box: React.CSSProperties = { inset: 0 };
  let renderedSizes = sizes;
  if (photo.crop) {
    const { x, y, zoom } = photo.crop;
    // Rendered image size as a multiple of the frame, then position so (x, y) sits
    // at the frame centre — clamped so the image always covers the frame.
    const h = zoom * Math.max(1, frameAspect / photo.aspect);
    const w = (h * photo.aspect) / frameAspect;
    const left = Math.min(0, Math.max(1 - w, 0.5 - x * w));
    const top = Math.min(0, Math.max(1 - h, 0.45 - y * h));
    box = { width: `${w * 100}%`, height: `${h * 100}%`, left: `${left * 100}%`, top: `${top * 100}%` };
    renderedSizes = scaleSizes(sizes, w);
  }

  return (
    <div className={`absolute inset-0 overflow-hidden ${tint ? "group/tint" : ""} ${className}`}>
      <div className="absolute" style={box}>
        <Image src={photo.src} alt={photo.alt} fill sizes={renderedSizes} priority={priority} quality={85} style={{ objectFit: "cover" }} />
      </div>
      {tint && (
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-deep mix-blend-color opacity-70 transition-opacity duration-700 group-hover/tint:opacity-15 group-focus-within/tint:opacity-15"
        />
      )}
    </div>
  );
}

/** Scales each length in a `sizes` list, e.g. "(min-width: 640px) 440px, 84vw" × 1.2. */
function scaleSizes(sizes: string, factor: number) {
  return sizes
    .split(",")
    .map((entry) => {
      const parts = entry.trim().split(/\s+(?=[^\s]+$)/);
      const length = parts.pop()!;
      return [...parts, `calc(${length} * ${factor.toFixed(2)})`].join(" ");
    })
    .join(", ");
}

function Placeholder({ monogram = "21", label = "Photo coming soon", className = "" }: { monogram?: string; label?: string; className?: string }) {
  return (
    <div
      role="img"
      aria-label={label}
      className={`absolute inset-0 flex flex-col items-center justify-center overflow-hidden bg-[radial-gradient(120%_90%_at_30%_20%,var(--color-rich),var(--color-deep)_60%,var(--color-ink))] text-white ${className}`}
    >
      <div className="absolute inset-3 border border-white/20" aria-hidden="true" />
      <span className="display text-[clamp(3rem,9vw,7rem)] italic text-white/90">{monogram}</span>
      <span className="eyebrow mt-4 text-[0.6rem] text-silver/80">{label}</span>
    </div>
  );
}
