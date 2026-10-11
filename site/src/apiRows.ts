export type Row = readonly [name: string, type: string, defaultValue: string, what: string];

export const REVEAL: readonly Row[] = [
  ["src", "string", "required", "Brush art on a transparent background."],
  ["width, height", "number", "required", "The art's own size, so the page reserves its space."],
  ["sweep", '"line" | "ring"', '"line"', "Left to right, or clockwise round the centre."],
  ["startAngle", "number", "0", "Ring only: where the stroke starts, degrees clockwise from 3 o'clock."],
  ["duration", "number", "1.4", "Seconds the stroke takes."],
  ["delay", "number", "0", "Seconds to wait once it is in view."],
  ["ease", "(t) => number", "joHaKyu", "Time to progress, both 0 to 1. Pass a stable function."],
  ["alt, className, style", "", "", "Alt is empty by default. Width alone keeps the art's shape."],
];

export const SPLAT: readonly Row[] = [
  ["seed", "number", "3.7", "Changes every finger, bead and droplet."],
  ["angle", "number", "160", "Direction of travel, degrees clockwise from pointing right."],
  ["x, y", "number", "1.04, 0.3", "Where the pool lands, as a share of the canvas. Above 1 is past the edge."],
  ["size", "number", "0.12", "Pool radius as a share of the canvas width."],
  ["color", "#rrggbb", '"#d8001a"', "The main ink."],
  ["underColor", "#rrggbb | null", '"#161314"', "A smaller second splat under it, or null for none."],
  ["mist", "number", "0.55", "How much mist, 0 to 1."],
  ["duration, delay", "number", "2.2, 0", "Seconds until the last mist lands, and to wait once in view."],
  ["className, style", "", "", "Size the canvas here; the splat scales with its width."],
];

export const BRUSH: readonly Row[] = [
  ["svg", "string", "required", "SVG markup made of strokes, such as a KanjiVG file. Fills are ignored."],
  ["label", "string", "none", "What the art says. Without it the canvas is hidden from assistive technology."],
  ["weight", "number", "0.034", "Brush radius as a share of the art's width."],
  ["speed", "number", "1", "2 paints twice as fast."],
  ["color", "#rrggbb", '"#161314"', "The ink."],
  ["bleed", "number", "0.07", "Ink that bleeds into the paper past the edges, 0 to 0.3."],
  ["contrast", "number", "0.8", "How much thinner horizontals are than verticals, 0 to 1."],
  ["bristles", "number", "22", "Bristle lines across the brush."],
  ["delay", "number", "0", "Seconds to wait once it is in view."],
  ["className, style", "", "", "Size the canvas here; the art sits centred without stretching."],
];

export const ENSO: readonly Row[] = [
  ["seed", "number", "7", "Where it starts and lifts, its wobble, weight and dryness."],
  ["weight", "number", "from seed", "Brush radius as a share of the canvas width."],
  ["speed, color, bleed, delay", "", "", "As for BrushPaint."],
  ["className, style", "", "", "Size the canvas here."],
];

export const FLOAT: readonly Row[] = [
  ["pattern", '"flow" | "rings" | "comb"', '"flow"', "A preset, laid out for the canvas's shape."],
  ["ops", "MarbleOp[]", "none", "Your own drops, ring systems, tines, waves and vortices instead."],
  ["color", "#rrggbb", '"#161314"', "The ink. Pale rings are the same ink, thinner."],
  ["accent", "#rrggbb", '"#d8001a"', "The one accent ring."],
  ["delay", "number", "0", "Seconds to wait once it is in view."],
  ["className, style", "", "", "Size the canvas here."],
];
