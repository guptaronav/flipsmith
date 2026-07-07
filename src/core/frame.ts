import { PAPER } from './palette';

/**
 * Frame model: a flat Uint8Array of palette indices. Drawing happens in
 * indexed space from the start — the GIF encodes exactly what the user drew,
 * no quantization, no antialiasing artifacts.
 */

export interface Point {
  x: number;
  y: number;
}

export function createFrame(width: number, height: number, fill = PAPER): Uint8Array {
  return new Uint8Array(width * height).fill(fill);
}

function stampInto(
  frame: Uint8Array,
  width: number,
  height: number,
  cx: number,
  cy: number,
  radius: number,
  colorIndex: number,
): void {
  const r2 = radius * radius;
  const x0 = Math.max(0, Math.floor(cx - radius));
  const x1 = Math.min(width - 1, Math.ceil(cx + radius));
  const y0 = Math.max(0, Math.floor(cy - radius));
  const y1 = Math.min(height - 1, Math.ceil(cy + radius));
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const dx = x - cx;
      const dy = y - cy;
      if (dx * dx + dy * dy <= r2) frame[y * width + x] = colorIndex;
    }
  }
}

/** One circular brush stamp. Returns a new frame; the input is untouched. */
export function stamp(
  frame: Uint8Array,
  width: number,
  height: number,
  center: Point,
  radius: number,
  colorIndex: number,
): Uint8Array {
  const next = Uint8Array.from(frame);
  stampInto(next, width, height, center.x, center.y, radius, colorIndex);
  return next;
}

/**
 * A stroke segment: stamps interpolated densely enough that consecutive
 * stamps overlap (step ≤ half the radius), so strokes have no gaps.
 */
export function drawStroke(
  frame: Uint8Array,
  width: number,
  height: number,
  from: Point,
  to: Point,
  radius: number,
  colorIndex: number,
): Uint8Array {
  const next = Uint8Array.from(frame);
  const dist = Math.hypot(to.x - from.x, to.y - from.y);
  const steps = Math.max(1, Math.ceil(dist / Math.max(0.5, radius / 2)));
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    stampInto(
      next,
      width,
      height,
      from.x + (to.x - from.x) * t,
      from.y + (to.y - from.y) * t,
      radius,
      colorIndex,
    );
  }
  return next;
}
