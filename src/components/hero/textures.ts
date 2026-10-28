import * as THREE from "three";

/** Resolve a next/font CSS variable to a family string usable by canvas. */
export function fontFamily(variable: string, fallback: string) {
  if (typeof window === "undefined") return fallback;
  const v = getComputedStyle(document.documentElement).getPropertyValue(variable).trim();
  return v ? `${v}, ${fallback}` : fallback;
}

export async function ensureFonts(serif: string, sans: string) {
  try {
    await Promise.all([
      document.fonts.load(`400 80px ${serif}`),
      document.fonts.load(`italic 400 80px ${serif}`),
      document.fonts.load(`600 40px ${sans}`),
    ]);
  } catch {
    /* fall back to whatever is available */
  }
}

function canvas(w: number, h: number) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d")!;
  return { c, ctx };
}

function toTexture(c: HTMLCanvasElement, repeat = false) {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

/** Draw text, shrinking it until it fits maxWidth. */
function fit(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, font: (size: number) => string, size: number, spacing = "0px") {
  ctx.letterSpacing = spacing;
  let s = size;
  ctx.font = font(s);
  while (ctx.measureText(text).width > maxWidth && s > 10) {
    s -= 2;
    ctx.font = font(s);
  }
  ctx.fillText(text, x, y);
}

export type CardText = {
  /** First line of the letter, e.g. "Hello, Friend,". */
  greeting: string;
  message: string;
  signOff: string;
  age: number;
  /** Optional background photo for the letter (e.g. the trio photo). */
  photo?: string | null;
  /** Where the faces are in the photo (0–1), so the crop keeps them in view. */
  photoFocusY?: number;
};

export function loadImage(src: string) {
  return new Promise<HTMLImageElement | null>((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

export function cardTexture(t: CardText, serif: string, sans: string, photo: HTMLImageElement | null) {
  const W = 2048;
  const H = 1312;
  const { c, ctx } = canvas(W, H);
  const cx = W / 2;
  const max = W - 320;
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  const { greeting } = t;

  if (photo) {
    // Cover-fit the photo, keeping the faces in frame.
    const scale = Math.max(W / photo.width, H / photo.height);
    const dw = photo.width * scale;
    const dh = photo.height * scale;
    const focusY = t.photoFocusY ?? 0.4;
    const dy = Math.min(0, Math.max(H - dh, H * 0.38 - focusY * dh));
    ctx.drawImage(photo, (W - dw) / 2, dy, dw, dh);

    // Burgundy wash so the white lettering reads, deepest at the bottom.
    const wash = ctx.createLinearGradient(0, 0, 0, H);
    wash.addColorStop(0, "rgba(91,16,37,0.15)");
    wash.addColorStop(0.45, "rgba(91,16,37,0.35)");
    wash.addColorStop(0.72, "rgba(91,16,37,0.85)");
    wash.addColorStop(1, "rgba(42,6,16,0.95)");
    ctx.fillStyle = wash;
    ctx.fillRect(0, 0, W, H);

    ctx.strokeStyle = "rgba(255,255,255,0.85)";
    ctx.lineWidth = 5;
    ctx.strokeRect(56, 56, W - 112, H - 112);
    ctx.strokeStyle = "rgba(217,213,214,0.55)";
    ctx.lineWidth = 2;
    ctx.strokeRect(80, 80, W - 160, H - 160);

    ctx.fillStyle = "#FFFFFF";
    fit(ctx, greeting, cx, 930, max, (s) => `italic 400 ${s}px ${serif}`, 150, "-2px");
    ctx.fillStyle = "#FFFFFF";
    fit(ctx, t.message, cx, 1065, max, (s) => `400 ${s}px ${serif}`, 84, "-1px");
    ctx.fillStyle = "#D9D5D6";
    fit(ctx, t.signOff.toUpperCase(), cx, 1180, max, (s) => `600 ${s}px ${sans}`, 30, "9px");
    return toTexture(c);
  }

  // No photo yet: clean ivory letter.
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, "#FFFFFF");
  bg.addColorStop(1, "#FAF7F4");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  ctx.save();
  ctx.globalAlpha = 0.06;
  ctx.fillStyle = "#8B263F";
  ctx.textAlign = "right";
  ctx.font = `italic 400 900px ${serif}`;
  ctx.fillText(String(t.age), W - 90, H - 120);
  ctx.restore();

  ctx.strokeStyle = "#5B1025";
  ctx.lineWidth = 6;
  ctx.strokeRect(56, 56, W - 112, H - 112);
  ctx.strokeStyle = "#D9D5D6";
  ctx.lineWidth = 3;
  ctx.strokeRect(80, 80, W - 160, H - 160);

  ctx.fillStyle = "#5B1025";
  fit(ctx, greeting, cx, 520, max, (s) => `italic 400 ${s}px ${serif}`, 190, "-3px");
  ctx.fillStyle = "#741B35";
  fit(ctx, t.message, cx, 720, max, (s) => `400 ${s}px ${serif}`, 92, "-1px");

  ctx.fillStyle = "#8B263F";
  ctx.save();
  ctx.translate(cx, 850);
  ctx.rotate(Math.PI / 4);
  ctx.fillRect(-9, -9, 18, 18);
  ctx.restore();
  ctx.fillRect(cx - 260, 849, 210, 2);
  ctx.fillRect(cx + 50, 849, 210, 2);

  ctx.fillStyle = "#5B1025";
  fit(ctx, t.signOff.toUpperCase(), cx, 980, max, (s) => `600 ${s}px ${sans}`, 36, "10px");
  return toTexture(c);
}

export function envelopeTextTexture(serif: string, sans: string) {
  const { c, ctx } = canvas(1024, 300);
  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(255,255,255,0.75)";
  fit(ctx, "FOR YOUR EYES ONLY", 512, 70, 900, (s) => `600 ${s}px ${sans}`, 28, "12px");
  ctx.fillStyle = "#FFFFFF";
  fit(ctx, "You're invited", 512, 200, 900, (s) => `italic 400 ${s}px ${serif}`, 112, "-2px");
  ctx.fillStyle = "rgba(217,213,214,0.7)";
  ctx.fillRect(412, 250, 200, 2);
  return toTexture(c);
}

export function sealTexture(serif: string, label: string) {
  const S = 512;
  const { c, ctx } = canvas(S, S);
  const g = ctx.createRadialGradient(S * 0.4, S * 0.35, 20, S / 2, S / 2, S / 2);
  g.addColorStop(0, "#A23250");
  g.addColorStop(0.55, "#8B263F");
  g.addColorStop(1, "#5B1025");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, S, S);
  ctx.strokeStyle = "rgba(255,255,255,0.45)";
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(S / 2, S / 2, S * 0.36, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = "#FFFFFF";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `italic 400 ${S * 0.36}px ${serif}`;
  ctx.fillText(label, S / 2, S / 2 + 8);
  const t = toTexture(c);
  // Cylinder cap UVs are rotated a quarter turn relative to the camera.
  t.center.set(0.5, 0.5);
  t.rotation = Math.PI / 2;
  return t;
}

/** Ivory envelope liner with a fine burgundy lattice — tiles once per world unit. */
export function linerTexture() {
  const S = 256;
  const { c, ctx } = canvas(S, S);
  ctx.fillStyle = "#FAF7F4";
  ctx.fillRect(0, 0, S, S);
  ctx.strokeStyle = "rgba(139,38,63,0.32)";
  ctx.lineWidth = 2;
  for (let i = -S; i <= S * 2; i += S / 4) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i + S, S);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(i, S);
    ctx.lineTo(i + S, 0);
    ctx.stroke();
  }
  ctx.fillStyle = "rgba(91,16,37,0.55)";
  for (let x = 0; x <= S; x += S / 4) {
    for (let y = 0; y <= S; y += S / 4) {
      ctx.beginPath();
      ctx.arc(x + S / 8, y, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  const t = toTexture(c, true);
  t.repeat.set(2.5, 2.5);
  return t;
}
