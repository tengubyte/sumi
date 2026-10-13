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

export const MARK: readonly Row[] = [
  ["type", '"underline" | "circle" | "highlight" | "strike" | "box"', '"underline"', "The mark. A highlight goes behind the text."],
  ["seed", "number", "1", "How far off true the hand is."],
  ["color", "#rrggbb", '"#d8001a"', "The ink."],
  ["speed, delay", "number", "1, 0", "As for BrushPaint. Stagger marks with delay."],
  ["children", "ReactNode", "required", "The words. They stay on one line."],
];

export const WIPE: readonly Row[] = [
  ["src, width, height, alt", "", "required", "The image the ink brings in, and its own size in px."],
  ["from", "string", "none", "An image in the same box that the ink wipes away."],
  ["blots", "[x, y, start][]", "[[0.5, 0.5, 0]]", "Up to three: where, as shares of the image, and when, 0 to 1."],
  ["color", "#rrggbb", '"#161314"', "The ink at the spreading edge."],
  ["seed", "number", "1", "Changes the shape of the bloom."],
  ["duration, delay", "number", "1.8, 0", "Seconds the bloom takes, and to wait once in view."],
];

export const SANSUI: readonly Row[] = [
  ["seed", "number", "3", "Changes every ridge."],
  ["sun", "boolean", "true", "A sun behind the far ridges, half veiled by mist."],
  ["mist", "number", "0.6", "How much mist lies between the ridges, 0 to 1."],
  ["color, sunColor", "#rrggbb", '"#161314", "#d8001a"', "The ink and the sun."],
  ["speed, delay", "number", "1, 0", "2 paints twice as fast; seconds to wait once in view."],
  ["className, style", "", "", "Size the canvas here; wide shapes suit it."],
];

export const FLOAT: readonly Row[] = [
  ["pattern", '"flow" | "rings" | "comb"', '"flow"', "A preset, laid out for the canvas's shape."],
  ["ops", "MarbleOp[]", "none", "Your own drops, ring systems, tines, waves and vortices instead."],
  ["color", "#rrggbb", '"#161314"', "The ink. Pale rings are the same ink, thinner."],
  ["accent", "#rrggbb", '"#d8001a"', "The one accent ring."],
  ["delay", "number", "0", "Seconds to wait once it is in view."],
  ["className, style", "", "", "Size the canvas here."],
];

export const HANKO: readonly Row[] = [
  ["text", "string", "required", "One to four characters, read in columns from the right."],
  ["label", "string", "none", "What the seal says. Without it the canvas is hidden from assistive technology."],
  ["shape", '"square" | "tall" | "round"', '"square"', "Tall suits two or three characters in a column."],
  ["white", "boolean", "false", "White characters cut into a red block, instead of red characters in a border."],
  ["font, weight", "string, number", "a Mincho stack, 700", "A CSS font family you load. The seal waits for it."],
  ["color", "#rrggbb", '"#d8001a"', "The seal paste."],
  ["seed", "number", "1", "Paper grain, chips in the border and which side pressed harder."],
  ["speed, delay", "number", "1, 0", "2 presses twice as fast; seconds to wait once in view."],
  ["className, style", "", "", "A square canvas for square and round seals, about 1:1.6 for tall ones."],
];

export const DROP: readonly Row[] = [
  ["view", '"side" | "top"', '"side"', "Watch the ink sink through the water, or look down as it lands and splashes."],
  ["drops", "[x, y, start?, color?][]", "[[0.5, 0.1]], top [[0.5, 0.5]]", "Up to three: where, as shares of the canvas, when in seconds, and their ink."],
  ["color", "#rrggbb", '"#161314"', "Ink for drops without their own."],
  ["swirl", "number", "0.6", "How much the water churns, 0 to 2. More curls from the side, more bend in the rays from above."],
  ["seed", "number", "1", "How the ink breaks up and where the rays point."],
  ["speed, delay", "number", "1, 0", "2 runs twice as fast; seconds to wait once in view."],
  ["className, style", "", "", "Size the canvas here. Side drops sink most of the way down; a splash from above reaches about 40% of the height."],
];

export const TORN: readonly Row[] = [
  ["src, width, height, alt", "", "required", "TornEdge: the picture, and its own size in px."],
  ["tear", '"frame" | "cover"', '"frame"', "TornEdge: tear the border off to a ragged frame, or tear a cover off and end on the plain image."],
  ["side", '"bottom" | "top"', '"bottom"', "TornBand: which edge of the band is torn."],
  ["color", "#rrggbb", '"#161314", "#dbd1bd"', "The band, or the cover's paper."],
  ["edge", "#rrggbb", '"#fdfcfa"', "The white core along the tear."],
  ["seed", "number", "1", "Changes the path of the tear."],
  ["duration, delay", "number", "1.4 (band 1.6), 0", "Seconds the tear takes, and seconds to wait once in view."],
  ["className, style", "", "", "TornBand: full width and 80 to 120 px tall suits a section edge."],
];

export const STRIKE: readonly Row[] = [
  ["text", "string", "required", "One character, or two."],
  ["label", "string", "none", "What it means. Without it the canvas is hidden from assistive technology."],
  ["font, weight", "string, number", "a Mincho stack, 700", "A CSS font family you load. The strike waits for it."],
  ["color", "#rrggbb", '"#d8001a"', "The ink."],
  ["angle", "number", "-20", "Direction of the sweep, degrees clockwise from pointing right."],
  ["glow", "boolean", "false", "A red halo, for dark pages."],
  ["seed", "number", "1", "Changes the streaks and the drops."],
  ["speed, delay", "number", "1, 0", "2 strikes twice as fast; seconds to wait once in view."],
  ["className, style", "", "", "Size the canvas here; the character takes 92% of its shorter side."],
];

export const EMBERS: readonly Row[] = [
  ["count", "number", "120", "Embers in the air at once, at most 400."],
  ["burst", "boolean", "false", "One shower that dies down, instead of a fire that keeps going."],
  ["from", "[x, y]", "[0.5, 1]", "Where they leave from, as shares of the canvas."],
  ["spread", "number", "1 (burst 0.1)", "The share of the width they leave across."],
  ["wind", "number", "0.15", "Sideways drift, -1 to 1."],
  ["ash", "number", "0.1", "The share that are tumbling flakes of ash."],
  ["seed", "number", "1", "Changes every ember's path."],
  ["speed, delay", "number", "1, 0", "2 runs twice as fast; seconds to wait once in view."],
  ["className, style", "", "", "Lay the canvas over whatever burns, on a dark page."],
];

export const TRANSITION: readonly Row[] = [
  ["swap", "() => unknown", "required", "The change to make once nothing shows. A promise keeps the ink down until it settles."],
  ["from", "[x, y]", "[0.5, 0.5]", "Where the ink floods from, as shares of the covered box."],
  ["to", "[x, y]", "from", "Where the paper opens from. Outside 0 to 1 is past an edge."],
  ["color", "#rrggbb", '"#161314"', "The ink."],
  ["seed", "number", "1", "Changes the shape of the fronts."],
  ["duration", "number", "1.6", "Seconds for the flood and the opening, not counting the wait for swap."],
  ["within", "HTMLElement", "the window", "Cover a positioned element instead."],
];
