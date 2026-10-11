import { paintStrokes } from "./paintStrokes.js";
import type { BrushOptions } from "./strokePainter.js";
import type { Point, StrokeArt } from "./strokes.js";

/** A seeded generator, so a seed always draws the same ensō. */
function random(seed: number): () => number {
  let a = Math.floor(seed * 1000) >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * One ensō stroke from a seed, in a 200 by 200 box: where it starts, how far round it goes, how it
 * wobbles and how dry its tail runs. Also the brush weight that suits it.
 */
export function ensoArt(seed: number): { art: StrokeArt; weight: number } {
  const next = random(seed);
  // Clockwise from about 7 o'clock, most of the way round, leaving a gap.
  const start = ((100 + next() * 50) * Math.PI) / 180;
  const sweep = ((305 + next() * 40) * Math.PI) / 180;
  const size = 68 + next() * 6;
  const spiral = (next() - 0.6) * 0.08;
  const phase = next() * 10;
  const points: Point[] = [];
  for (let i = 0; i <= 900; i++) {
    const u = i / 900;
    const a = start + sweep * u;
    const r = size * (1 + 0.022 * Math.sin(a * 2 + phase) + 0.012 * Math.sin(a * 5 + phase * 2) + spiral * u);
    points.push([100 + r * Math.cos(a), 100 + r * Math.sin(a)]);
  }
  const dry = [0.03, 0.75 + next() * 0.35] as const;
  return { art: { box: [0, 0, 200, 200], strokes: [{ points, end: "harai", dry }] }, weight: (11 + next() * 5) / 200 };
}

export interface EnsoOptions extends Omit<BrushOptions, "bristles" | "contrast"> {
  /** Changes where the stroke starts and ends, its wobble, weight and dryness. Default 7. */
  readonly seed?: number | undefined;
  /** Seconds to wait after the canvas scrolls into view. Default 0. */
  readonly delay?: number | undefined;
}

/** Paints a seeded ensō onto `canvas` once it scrolls into view. Returns the cleanup. */
export function paintEnso(canvas: HTMLCanvasElement, options: EnsoOptions = {}): () => void {
  const { art, weight } = ensoArt(options.seed ?? 7);
  // A big brush held loosely: more bristles, less difference between flat and upright.
  return paintStrokes(canvas, art, { ...options, weight: options.weight ?? weight, bristles: 36, contrast: 0.35, speed: (options.speed ?? 1) * 0.75 });
}
