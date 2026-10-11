import type { Point, StrokeEnd } from "./strokes.js";

/** 0 at both ends of 0..1 and 1 in the middle; 0 outside. */
export const bump = (x: number): number => (x > 0 && x < 1 ? Math.sin(Math.PI * x) : 0);

export function smooth(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

/** Arc length at every point, from 0 at the first. */
export function arcLengths(points: readonly Point[]): number[] {
  const s = [0];
  for (let i = 1; i < points.length; i++) {
    const [ax, ay] = points[i - 1] ?? [0, 0];
    const [bx, by] = points[i] ?? [0, 0];
    s.push((s[i - 1] ?? 0) + Math.hypot(bx - ax, by - ay));
  }
  return s;
}

/**
 * Indices of sharp turns (over 60 degrees), measured across a window `reach` long either side so a turn
 * rounded off over a short curve still counts. One index per turn, at its sharpest.
 */
export function corners(points: readonly Point[], s: readonly number[], reach: number): number[] {
  const found: { i: number; turn: number }[] = [];
  let k = 1;
  while (k < points.length - 1 && (s[k] ?? 0) < reach) k++;
  for (let i = k; i < points.length - k; i++) {
    const [ax, ay] = points[i - k] ?? [0, 0];
    const [bx, by] = points[i] ?? [0, 0];
    const [cx, cy] = points[i + k] ?? [0, 0];
    const ux = bx - ax, uy = by - ay, wx = cx - bx, wy = cy - by;
    const cos = (ux * wx + uy * wy) / (Math.hypot(ux, uy) * Math.hypot(wx, wy) || 1);
    const turn = Math.acos(Math.max(-1, Math.min(1, cos)));
    if (turn < Math.PI / 3) continue;
    const last = found[found.length - 1];
    if (last && i - last.i < 2 * k) {
      if (turn > last.turn) found[found.length - 1] = { i, turn };
    } else found.push({ i, turn });
  }
  return found.map((c) => c.i);
}

/** Where a stroke's shape changes for its end: what a harai sweeps over or a hane flicks along. */
export interface StrokeShape {
  readonly length: number;
  readonly radius: number;
  readonly end: StrokeEnd;
  /** Arc lengths of the sharp turns. */
  readonly turns: readonly number[];
  /** Length of the stretch after the last turn when it is a short tail, or 0. */
  readonly tail: number;
}

/** The length a hane's flick takes, past the body of the stroke. */
export const hookLength = ({ length, radius, tail }: StrokeShape): number => tail || Math.min(0.22 * length, 3.2 * radius);

function endTaper(x: number, shape: StrokeShape): number {
  const { length: L, radius: R, end } = shape;
  if (end === "tome") return 1 + 0.1 * bump((x - (L - 2 * R)) / (2 * R));
  if (end === "dot") return 0.45 + 0.75 * Math.pow(x / L, 0.7);
  if (end === "na") {
    const u = x / L;
    return (1 + 0.35 * smooth(0.2, 0.8, u)) * (u > 0.8 ? 1 - 0.72 * Math.pow((u - 0.8) / 0.2, 1.2) : 1);
  }
  const span = end === "rise" ? L : end === "hane" ? hookLength(shape) : shape.tail || 0.55 * L;
  const y = (x - (L - span)) / span;
  // A hane presses just before it flicks; a rising stroke starts with its weight down.
  const press = end === "hane" ? 1 + 0.12 * bump((x - (L - span - 1.5 * R)) / (1.5 * R)) : end === "rise" ? 1.15 : 1;
  return press * (y > 0 ? Math.max(0.04, Math.pow(1 - y, end === "hane" ? 1.1 : 0.85)) : 1);
}

/** Brush radius at arc length `x`: the landing press, a lighter middle, a shoulder at each turn, then the end. */
export function radiusAt(x: number, shape: StrokeShape): number {
  const { length: L, radius: R, end } = shape;
  let k = end === "dot" ? 1 : 1 + 0.18 * bump(x / (2.2 * R));
  k *= 1 - 0.08 * Math.sin((Math.PI * x) / L) * Math.min(L / (10 * R), 1);
  for (const turn of shape.turns) k *= 1 + 0.16 * Math.exp(-(((x - turn) / R) ** 2));
  return R * k * endTaper(x, shape);
}

/** Where the brush head is along a stroke at local time `t` (0 to 1): sweeps speed up, the rest ease in and out. */
export function headAt(t: number, shape: StrokeShape): number {
  const { length: L, end } = shape;
  if (end === "harai" || end === "rise" || end === "na") return L * (0.35 * t + 0.65 * t * t);
  if (end === "hane") {
    const body = L - hookLength(shape);
    return t < 0.82 ? body * (0.5 - 0.5 * Math.cos((Math.PI * t) / 0.82)) : body + (L - body) * ((t - 0.82) / 0.18);
  }
  return L * (0.5 - 0.5 * Math.cos(Math.PI * t));
}

/** How much drier a stroke gets by its end: sweeps run the brush out of ink, a dot never does. */
export const DRY_GROW: Readonly<Record<StrokeEnd, number>> = { harai: 0.5, rise: 0.45, na: 0.25, hane: 0.2, tome: 0.12, dot: 0 };
