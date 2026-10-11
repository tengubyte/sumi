/** A point in the art's own units (its SVG viewBox). */
export type Point = readonly [x: number, y: number];

/**
 * How a stroke leaves the paper: tome presses and stops, harai sweeps out to a point, hane flicks off a
 * hook, na widens before it sweeps out, rise thins as it climbs, and a dot swells toward its end.
 */
export type StrokeEnd = "tome" | "harai" | "hane" | "na" | "rise" | "dot";

export interface Stroke {
  readonly points: readonly Point[];
  readonly end: StrokeEnd;
  /** Dryness at the start and how much it grows by the end, 0 to 1. Defaults depend on the end. */
  readonly dry?: readonly [start: number, grow: number] | undefined;
}

/** Strokes in the order they are painted, inside `box` (x, y, width, height). */
export interface StrokeArt {
  readonly box: readonly [x: number, y: number, width: number, height: number];
  readonly strokes: readonly Stroke[];
}

const END_NAMES: readonly StrokeEnd[] = ["tome", "harai", "hane", "na", "rise", "dot"];

// KanjiVG tags each stroke with a CJK stroke character; the first one says how the stroke ends.
const KANJIVG_ENDS: readonly (readonly [StrokeEnd, string])[] = [
  ["harai", "㇒㇓㇇㇋"],
  ["na", "㇏㇝"],
  ["hane", "㇁㇂㇃㇆㇈㇉㇌㇖㇚㇟㇠㇡㇢"],
  ["rise", "㇀㇊㇙"],
  ["dot", "㇔"],
];

/** The end for a `data-brush-end` value or a KanjiVG `kvg:type`, such as "㇆/㇚". Tome when unknown. */
export function endFor(type: string | null): StrokeEnd {
  const named = END_NAMES.find((name) => name === type);
  if (named) return named;
  const code = type?.codePointAt(0);
  if (code === undefined) return "tome";
  const first = String.fromCodePoint(code);
  return KANJIVG_ENDS.find(([, chars]) => chars.includes(first))?.[0] ?? "tome";
}

const SHAPES = "path, line, polyline, polygon, circle, ellipse, rect";

function viewBox(svg: SVGSVGElement): StrokeArt["box"] {
  const box = svg.viewBox.baseVal;
  if (box.width > 0 && box.height > 0) return [box.x, box.y, box.width, box.height];
  return [0, 0, Number(svg.getAttribute("width")) || 100, Number(svg.getAttribute("height")) || 100];
}

/** Points every `step` units along `shape`, in the coordinates of the root `svg`. */
function sample(svg: SVGSVGElement, shape: SVGGeometryElement, step: number): Point[] {
  const length = shape.getTotalLength();
  const root = svg.getScreenCTM()?.inverse();
  const own = shape.getScreenCTM();
  if (!(length > 0) || !root || !own) return [];
  const m = root.multiply(own);
  const count = Math.max(2, Math.ceil(length / step));
  const points: Point[] = [];
  for (let i = 0; i <= count; i++) {
    const p = shape.getPointAtLength((i / count) * length);
    points.push([m.a * p.x + m.c * p.y + m.e, m.b * p.x + m.d * p.y + m.f]);
  }
  return points;
}

/**
 * Reads an SVG made of strokes: every path, line, polyline, polygon, circle, ellipse and rect, in document
 * order, becomes one stroke along its centre line. Fills are ignored. A KanjiVG file gives the character
 * in stroke order with the right ends; anywhere else, set `data-brush-end` on a shape. Needs the DOM.
 * Throws when `markup` is not an SVG.
 */
export function strokesFromSvg(markup: string): StrokeArt {
  const parsed = new DOMParser().parseFromString(markup, "image/svg+xml");
  const root = parsed.documentElement;
  if (parsed.querySelector("parsererror") || !(root instanceof SVGSVGElement)) throw new Error("sumi: not an SVG");
  const svg = document.importNode(root, true);
  const box = viewBox(svg);
  // Geometry needs the SVG laid out; a hidden host at the art's own size keeps every transform invertible.
  const host = document.createElement("div");
  host.style.cssText = `position:fixed;left:-99999px;top:0;width:${String(box[2])}px;height:${String(box[3])}px;visibility:hidden`;
  svg.setAttribute("width", String(box[2]));
  svg.setAttribute("height", String(box[3]));
  host.append(svg);
  document.body.append(host);
  try {
    const step = Math.hypot(box[2], box[3]) / 500;
    const strokes: Stroke[] = [];
    for (const shape of svg.querySelectorAll<SVGGeometryElement>(SHAPES)) {
      const points = sample(svg, shape, step);
      const end = endFor(shape.getAttribute("data-brush-end") ?? shape.getAttribute("kvg:type"));
      if (points.length > 1) strokes.push({ points, end });
    }
    return { box, strokes };
  } finally {
    host.remove();
  }
}
