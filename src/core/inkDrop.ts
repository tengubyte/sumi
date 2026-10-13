import { fluidPainter } from "./dropFluid.js";
import { DROP_FRAGMENT, DROP_SECONDS } from "./dropGlsl.js";
import { DROP_TOP_FRAGMENT } from "./dropTopGlsl.js";
import { playCanvas, type CanvasPainter } from "./play.js";
import { random } from "./random.js";
import { rgb, type Hex } from "./splatShader.js";
import { coverProgram, drawCover, fitCanvas } from "./webgl.js";

/** Where a drop lands, as shares of the canvas (y down), when in seconds, and its own ink. */
export type Drop = readonly [x: number, y: number, start?: number, color?: Hex];

export interface DropOptions {
  /** `"side"` watches the ink sink through the water; `"top"` looks down as it lands and splashes. Default `"side"`. */
  readonly view?: "side" | "top" | undefined;
  /**
   * Up to three. Default one near the top in the middle for the side view, and one in the middle for the
   * top view. Side drops sink most of the way down, so leave room below them.
   */
  readonly drops?: readonly Drop[] | undefined;
  /** Ink for drops without their own. Default `#161314` (sumi). */
  readonly color?: Hex | undefined;
  /** Changes how the ink breaks up and where the rays point. Default 1. */
  readonly seed?: number | undefined;
  /** How much the water churns, 0 to 2: more curls from the side, more bend in the rays from above. Default 0.6. */
  readonly swirl?: number | undefined;
  /** 2 runs twice as fast. Default 1. */
  readonly speed?: number | undefined;
  /** Seconds to wait after the canvas scrolls into view. Default 0. */
  readonly delay?: number | undefined;
}

/** Seconds the drops take at speed 1: the last one lands, then sinks or spreads and settles. */
export function dropSeconds(drops: readonly Drop[]): number {
  return Math.max(0, ...drops.slice(0, 3).map(([, , start = 0]) => start)) + DROP_SECONDS;
}

// The trace is the costly part; past half a megapixel the soft ink gains nothing from more pixels.
const MAX_PIXELS = 500_000;

/** A shader that draws any frame straight from the time: the top view, or the side view without the fluid. */
function tracedPainter(canvas: HTMLCanvasElement, gl: WebGLRenderingContext, fragment: string, drops: readonly Drop[], options: DropOptions, run: number): CanvasPainter | null {
  const at = coverProgram(gl, fragment);
  if (!at) return null;
  const packed = new Float32Array(12);
  const colors = new Float32Array(9);
  drops.forEach(([x, y, start = 0, color], i) => {
    packed.set([x, y, Math.max(start, 0), 1], i * 4);
    colors.set(rgb(color ?? options.color ?? "#161314"), i * 3);
  });
  gl.uniform4fv(at("drops"), packed);
  gl.uniform3fv(at("colors"), colors);
  gl.uniform1f(at("seed"), random(options.seed ?? 1)() * 50);
  gl.uniform1f(at("swirl"), Math.min(Math.max(options.swirl ?? 0.6, 0), 2));
  const speed = Math.max(options.speed ?? 1, 0.05);
  const uSize = at("size");
  const uTime = at("time");
  return {
    duration: run / speed,
    draw(seconds) {
      fitCanvas(gl, canvas, MAX_PIXELS);
      gl.uniform2f(uSize, canvas.width, canvas.height);
      gl.uniform1f(uTime, Math.min(Math.max(seconds * speed, 0.0001), run));
      drawCover(gl);
    },
    dispose() {
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    },
  };
}

/**
 * Returns null when WebGL or the shader is unavailable. The side view needs half-float render targets;
 * without them it falls back to a traced vortex ring.
 */
export function dropPainter(canvas: HTMLCanvasElement, options: DropOptions = {}): CanvasPainter | null {
  const gl = canvas.getContext("webgl", { alpha: true, premultipliedAlpha: true, antialias: false, depth: false });
  if (!gl) return null;
  const top = options.view === "top";
  const drops = (options.drops ?? [top ? [0.5, 0.5] : [0.5, 0.1]]).slice(0, 3);
  const run = dropSeconds(drops);
  if (top) return tracedPainter(canvas, gl, DROP_TOP_FRAGMENT, drops, options, run);
  return fluidPainter(canvas, gl, drops, options, run) ?? tracedPainter(canvas, gl, DROP_FRAGMENT, drops, options, run);
}

/**
 * Drops ink into still water on `canvas` once it scrolls into view. Size the canvas with CSS. The last
 * frame stays, and a resize redraws it. Reduced motion shows the settled ink; no WebGL draws nothing.
 * Returns the cleanup.
 */
export function dropInk(canvas: HTMLCanvasElement, options: DropOptions = {}): () => void {
  return playCanvas(canvas, () => dropPainter(canvas, options), options.delay ?? 0);
}
