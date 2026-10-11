import { playCanvas } from "./play.js";
import { random } from "./random.js";
import type { Hex } from "./splatShader.js";
import { strokePainter } from "./strokePainter.js";
import type { Point, Stroke } from "./strokes.js";

export const MARK_TYPES = ["underline", "circle", "highlight", "strike", "box"] as const;
export type MarkType = (typeof MARK_TYPES)[number];

/** A mark's strokes in overlay px, and the brush radius that suits it. */
export interface MarkShape {
  readonly strokes: Stroke[];
  readonly radius: number;
}

/** The word's box inside the overlay, and the hand's unsteadiness. */
interface Frame {
  readonly x0: number;
  readonly y0: number;
  readonly x1: number;
  readonly y1: number;
  readonly w: number;
  readonly h: number;
  readonly next: () => number;
  readonly off: (amount: number) => number;
}

const line = (n: number, at: (u: number) => Point): Point[] => Array.from({ length: n + 1 }, (_, i) => at(i / n));
const segment = ([ax, ay]: Point, [bx, by]: Point, n: number): Point[] => line(n, (u) => [ax + (bx - ax) * u, ay + (by - ay) * u]);
const rad = (deg: number): number => (deg * Math.PI) / 180;

const MARKS: Readonly<Record<MarkType, (f: Frame) => MarkShape>> = {
  underline: ({ x0, x1, y1, h, next, off }) => {
    const ya = y1 + h * 0.02 + off(h * 0.08);
    const yb = y1 - h * 0.04 + off(h * 0.08);
    const sag = h * (0.04 + next() * 0.05);
    const points = line(120, (u) => [x0 - h * 0.12 + (x1 - x0 + h * 0.3) * u, ya + (yb - ya) * u + sag * Math.sin(Math.PI * u)]);
    return { strokes: [{ points, end: "harai" }], radius: Math.max(h * 0.075, 2.2) };
  },
  strike: ({ x0, y0, w, h, off }) => {
    const ya = y0 + h * 0.58 + off(h * 0.06);
    const yb = y0 + h * 0.5 + off(h * 0.06);
    return { strokes: [{ points: segment([x0 - h * 0.1, ya], [x0 + w + h * 0.15, yb], 120), end: "harai" }], radius: Math.max(h * 0.06, 2) };
  },
  // A wide, dry swipe that runs on past the word and lifts.
  highlight: ({ x0, y0, w, h, next, off }) => {
    const ya = y0 + h * 0.58 + off(h * 0.05);
    const yb = y0 + h * 0.52 + off(h * 0.05);
    const phase = next();
    const points = line(120, (u) => [x0 - h * 0.2 + (w + h * 0.75) * u, ya + (yb - ya) * u + h * 0.03 * Math.sin(Math.PI * u * 2 + phase)]);
    return { strokes: [{ points, end: "harai", dry: [0.04, 0.55] }], radius: h * 0.42 };
  },
  // An ensō round the word: from the lower left, on past where it began, tilted a little.
  circle: ({ x0, y0, x1, y1, w, h, next, off }) => {
    const cx = (x0 + x1) / 2;
    const cy = (y0 + y1) / 2 + h * 0.03;
    const rx = w / 2 + h * 0.3;
    const ry = h / 2 + h * 0.2;
    const start = rad(200 + off(30));
    const sweep = rad(375 + off(20));
    const tilt = rad(-4 + off(6));
    const phase = next() * 6;
    const points = line(240, (u) => {
      const a = start + sweep * u;
      const k = 1 + 0.03 * Math.sin(a * 2 + phase) + 0.04 * u;
      const ex = rx * k * Math.cos(a);
      const ey = ry * k * Math.sin(a);
      return [cx + ex * Math.cos(tilt) - ey * Math.sin(tilt), cy + ex * Math.sin(tilt) + ey * Math.cos(tilt)];
    });
    return { strokes: [{ points, end: "harai", dry: [0.02, 0.3] }], radius: Math.max(h * 0.05, 2.2) };
  },
  // Drawn like 口: the left side, then the top and right in one stroke, then the bottom.
  box: ({ x0, y0, x1, y1, h, off }) => {
    const e = h * 0.08;
    const L = x0 - h * 0.3 + off(e);
    const R = x1 + h * 0.3 + off(e);
    const T = y0 - h * 0.12 + off(e);
    const B = y1 + h * 0.12 + off(e);
    const strokes: Stroke[] = [
      { points: segment([L, T], [L + off(e), B + e], 60), end: "tome" },
      { points: [...segment([L, T], [R, T + off(e)], 80), ...segment([R, T], [R + off(e), B], 60).slice(1)], end: "hane" },
      { points: segment([L, B], [R + e, B + off(e)], 80), end: "tome" },
    ];
    return { strokes, radius: Math.max(h * 0.06, 2) };
  },
};

/** Room round a word `h` px tall for the circle and its brush. */
export const markPad = (h: number): number => Math.ceil(h * 0.8);

/** Strokes for a mark round a word `w` by `h` px, in an overlay padded by `markPad(h)` on every side. */
export function markStrokes(type: MarkType, w: number, h: number, seed: number): MarkShape {
  const pad = markPad(h);
  const next = random(seed);
  return MARKS[type]({ x0: pad, y0: pad, x1: pad + w, y1: pad + h, w, h, next, off: (amount) => (next() - 0.5) * amount });
}

export interface MarkOptions {
  /** How far off true the hand is. Default 1. */
  readonly seed?: number | undefined;
  /** Default `#d8001a`. */
  readonly color?: Hex | undefined;
  /** 2 paints twice as fast. Default 1. */
  readonly speed?: number | undefined;
  /** Seconds to wait after the word scrolls into view. Default 0. */
  readonly delay?: number | undefined;
}

/**
 * Paints a brush mark round `element` once it scrolls into view. The element must be positioned and on
 * one line; a highlight goes behind its text, so it should also start a stacking context (z-index: 0).
 * The word is measured when it comes into view. Returns the cleanup, which removes the mark.
 */
export function paintMark(element: HTMLElement, type: MarkType, options: MarkOptions = {}): () => void {
  const canvas = document.createElement("canvas");
  canvas.setAttribute("aria-hidden", "true");
  const place = (): MarkShape & { width: number; height: number } => {
    const { width: w, height: h } = element.getBoundingClientRect();
    const pad = markPad(h);
    const width = w + 2 * pad;
    const height = h + 2 * pad;
    const behind = type === "highlight" ? "z-index:-1;opacity:0.32;" : "";
    canvas.style.cssText = `position:absolute;left:${String(-pad)}px;top:${String(-pad)}px;width:${String(width)}px;height:${String(height)}px;pointer-events:none;${behind}`;
    return { ...markStrokes(type, w, h, options.seed ?? 1), width, height };
  };
  place();
  element.append(canvas);
  const stop = playCanvas(
    canvas,
    () => {
      // Measured again now: web fonts have usually loaded by the time the word is in view.
      const { strokes, radius, width, height } = place();
      const art = { box: [0, 0, width, height] as const, strokes };
      return strokePainter(canvas, art, { weight: radius / width, contrast: 0.25, bleed: 0.04, color: options.color ?? "#d8001a", speed: options.speed });
    },
    options.delay ?? 0,
  );
  return () => {
    stop();
    canvas.remove();
  };
}
