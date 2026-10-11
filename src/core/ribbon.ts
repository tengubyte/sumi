import { arcLengths, corners, radiusAt, type StrokeShape } from "./brushProfile.js";
import type { Point, Stroke } from "./strokes.js";

/** Floats per vertex: position (2), along, across, radius, and distance from each end of its piece (2). */
export const RIBBON_FLOATS = 7;

export interface RibbonStroke {
  readonly shape: StrokeShape;
  /** First vertex and vertex count of each triangle strip. A stroke splits at its sharp turns. */
  readonly pieces: readonly { readonly first: number; readonly count: number }[];
  readonly start: Point;
  readonly finish: Point;
  readonly dry: Stroke["dry"];
}

export interface Ribbon {
  readonly data: Float32Array;
  readonly strokes: readonly RibbonStroke[];
}

/** How close to vertical the stroke runs at point `i`, 0 (flat) to 1 (upright). */
function upright(points: readonly Point[], i: number): number {
  const [ax, ay] = points[Math.max(0, i - 1)] ?? [0, 0];
  const [bx, by] = points[Math.min(points.length - 1, i + 1)] ?? [0, 0];
  return Math.abs(by - ay) / (Math.hypot(bx - ax, by - ay) || 1);
}

function tangent(points: readonly Point[], i: number, first: number, last: number): [number, number] {
  const [ax, ay] = points[Math.max(first, i - 1)] ?? [0, 0];
  const [bx, by] = points[Math.min(last, i + 1)] ?? [0, 0];
  const length = Math.hypot(bx - ax, by - ay) || 1;
  return [(bx - ax) / length, (by - ay) / length];
}

/**
 * One triangle strip from point `first` to `last`, wide enough for the bleed past the brush. It runs on
 * past both ends by a radius, where the shader rounds it off into caps.
 */
function pushPiece(data: number[], points: readonly Point[], s: readonly number[], widths: readonly number[], first: number, last: number, margin: number): void {
  const s0 = s[first] ?? 0;
  const s1 = s[last] ?? 0;
  const pair = (x: number, y: number, [tx, ty]: [number, number], along: number, radius: number): void => {
    const off = radius + margin;
    data.push(x - ty * off, y + tx * off, along, off, radius, along - s0, s1 - along);
    data.push(x + ty * off, y - tx * off, along, -off, radius, along - s0, s1 - along);
  };
  const [x0, y0] = points[first] ?? [0, 0];
  const t0 = tangent(points, first, first, last);
  const cap0 = (widths[first] ?? 0) + margin;
  pair(x0 - t0[0] * cap0, y0 - t0[1] * cap0, t0, s0 - cap0, widths[first] ?? 0);
  for (let i = first; i <= last; i++) {
    const [x, y] = points[i] ?? [0, 0];
    pair(x, y, tangent(points, i, first, last), s[i] ?? 0, widths[i] ?? 0);
  }
  const [x1, y1] = points[last] ?? [0, 0];
  const t1 = tangent(points, last, first, last);
  const cap1 = (widths[last] ?? 0) + margin;
  pair(x1 + t1[0] * cap1, y1 + t1[1] * cap1, t1, s1 + cap1, widths[last] ?? 0);
}

/**
 * Triangle strips along every stroke for a brush of base `radius`. `contrast` (0 to 1) makes
 * horizontals thinner than verticals, as from a brush held upright.
 */
export function buildRibbon(strokes: readonly Stroke[], radius: number, contrast: number): Ribbon {
  const data: number[] = [];
  const margin = radius * 0.5;
  const built = strokes.map((stroke): RibbonStroke => {
    const { points, end } = stroke;
    const s = arcLengths(points);
    const length = s[s.length - 1] ?? 0;
    const cuts = length > 0 ? corners(points, s, radius) : [];
    const turns = cuts.map((i) => s[i] ?? 0);
    const lastTurn = turns[turns.length - 1];
    const sweeps = end === "harai" || end === "hane";
    const tail = sweeps && lastTurn !== undefined && length - lastTurn < 0.45 * length ? length - lastTurn : 0;
    const shape: StrokeShape = { length, radius, end, turns, tail };
    const widths = points.map((_, i) => radiusAt(s[i] ?? 0, shape) * (1 + contrast * (0.27 * upright(points, i) - 0.2)));
    const bounds = [0, ...cuts, points.length - 1];
    const pieces: { first: number; count: number }[] = [];
    for (let p = 0; length > 0 && p + 1 < bounds.length; p++) {
      const first = data.length / RIBBON_FLOATS;
      pushPiece(data, points, s, widths, bounds[p] ?? 0, bounds[p + 1] ?? 0, margin);
      pieces.push({ first, count: data.length / RIBBON_FLOATS - first });
    }
    return { shape, pieces, start: points[0] ?? [0, 0], finish: points[points.length - 1] ?? [0, 0], dry: stroke.dry };
  });
  return { data: new Float32Array(data), strokes: built };
}
