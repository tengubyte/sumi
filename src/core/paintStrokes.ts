import { playCanvas } from "./play.js";
import { strokePainter, type BrushOptions } from "./strokePainter.js";
import { strokesFromSvg, type StrokeArt } from "./strokes.js";

export interface StrokeOptions extends BrushOptions {
  /** Seconds to wait after the canvas scrolls into view. Default 0. */
  readonly delay?: number | undefined;
}

/**
 * Paints `art` onto `canvas` stroke by stroke once it scrolls into view. `art` is SVG markup, read with
 * strokesFromSvg, or strokes already in hand. The art sits centred in the canvas without stretching, so
 * size the canvas with CSS. The last frame stays, and a resize redraws it. Reduced motion draws the
 * finished art; no WebGL draws nothing. Throws when the markup is not an SVG. Returns the cleanup.
 */
export function paintStrokes(canvas: HTMLCanvasElement, art: string | StrokeArt, options: StrokeOptions = {}): () => void {
  return playCanvas(canvas, () => strokePainter(canvas, typeof art === "string" ? strokesFromSvg(art) : art, options), options.delay ?? 0);
}
