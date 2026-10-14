import { fluidPainter } from "./dropFluid.js";
import { DROP_FRAGMENT, DROP_SECONDS } from "./dropGlsl.js";
import { dropTopFragment } from "./dropTopGlsl.js";
import { playCanvas, type CanvasPainter } from "./play.js";
import { random } from "./random.js";
import { rgb, type Hex } from "./splatShader.js";
import { coverProgram, drawCover, fitCanvas } from "./webgl.js";

/** Where a drop lands, as shares of the canvas (y down), when in seconds, and its own ink. */
export type Drop = readonly [x: number, y: number, start?: number, color?: Hex];

/** What lands on the paper in the top view. */
export type DropKind = "drop" | "splash" | "flick" | "spray" | "bloom" | "drip" | "ring";

// Each kind's radius at size 1 (a share of the canvas height), the way it travels in degrees, and where one
// drop lands by default.
const SPLATTER: Readonly<Record<DropKind, { readonly radius: number; readonly angle: number; readonly at: readonly [number, number] }>> = {
  drop: { radius: 0.1, angle: 0, at: [0.5, 0.5] },
  splash: { radius: 0.08, angle: 0, at: [0.5, 0.5] },
  flick: { radius: 0.06, angle: -30, at: [0.25, 0.7] },
  spray: { radius: 0.1, angle: 0, at: [0.5, 0.5] },
  bloom: { radius: 0.22, angle: 0, at: [0.5, 0.5] },
  drip: { radius: 0.08, angle: 90, at: [0.5, 0.2] },
  ring: { radius: 0.15, angle: 0, at: [0.5, 0.5] },
};

export interface DropOptions {
  /** `"side"` watches the ink sink through the water; `"top"` looks down as it lands on paper. Default `"side"`. */
  readonly view?: "side" | "top" | undefined;
  /**
   * Up to three. Default one near the top in the middle for the side view; for the top view, one in the
   * middle, or near the top for a drip and low on the left for a flick. Side drops sink most of the way
   * down, so leave room below them.
   */
  readonly drops?: readonly Drop[] | undefined;
  /** Ink for drops without their own. Default `#161314` (sumi). */
  readonly color?: Hex | undefined;
  /** Changes how the ink breaks up, where the spikes point and where the satellites land. Default 1. */
  readonly seed?: number | undefined;
  /** Side view: how much the water churns, 0 to 2. Default 0.6. */
  readonly swirl?: number | undefined;
  /** Top view: what lands. Default `"splash"`. */
  readonly kind?: DropKind | undefined;
  /** Top view: how big each one lands, 0.2 to 3. Default 1. */
  readonly size?: number | undefined;
  /**
   * Top view: the way a flick throws or a drip runs, and the way a spray stretches, in degrees clockwise
   * from pointing right. Default -30 for a flick, 90 for a drip, 0 otherwise.
   */
  readonly angle?: number | undefined;
  /** 2 runs twice as fast. Default 1. */
  readonly speed?: number | undefined;
  /** Seconds to wait after the canvas scrolls into view. Default 0. */
  readonly delay?: number | undefined;
}

// Seconds from landing until the top view has settled: the halo stops creeping, a drip stops running and a
// ring's rim has dried dark.
const TOP_SECONDS = 3;

/** Seconds the drops take at speed 1: the last one lands, then sinks or spreads and settles. */
export function dropSeconds(drops: readonly Drop[], settle = DROP_SECONDS): number {
  return Math.max(0, ...drops.slice(0, 3).map(([, , start = 0]) => start)) + settle;
}

// The trace is the costly part; past half a megapixel the soft ink gains nothing from more pixels.
const MAX_PIXELS = 500_000;

/**
 * A shader that draws any frame straight from the time: the top view, or the side view without the fluid.
 * `look` is the top view's radius, angle in radians and seed.
 */
function tracedPainter(canvas: HTMLCanvasElement, gl: WebGLRenderingContext, fragment: string, drops: readonly Drop[], options: DropOptions, run: number, look?: readonly [number, number, number]): CanvasPainter | null {
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
  if (look) gl.uniform3fv(at("look"), look);
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
  if (options.view === "top") {
    // A kind from plain JavaScript that is not one of the seven lands as a splash.
    const kind = options.kind !== undefined && Object.hasOwn(SPLATTER, options.kind) ? options.kind : "splash";
    const splatter = SPLATTER[kind];
    const drops = (options.drops ?? [splatter.at]).slice(0, 3);
    const radius = splatter.radius * Math.min(Math.max(options.size ?? 1, 0.2), 3);
    const angle = ((options.angle ?? splatter.angle) * Math.PI) / 180;
    const seed = random(options.seed ?? 1)() * 50;
    return tracedPainter(canvas, gl, dropTopFragment(kind), drops, options, dropSeconds(drops, TOP_SECONDS), [radius, angle, seed]);
  }
  const drops = (options.drops ?? [[0.5, 0.1]]).slice(0, 3);
  const run = dropSeconds(drops);
  return fluidPainter(canvas, gl, drops, options, run) ?? tracedPainter(canvas, gl, DROP_FRAGMENT, drops, options, run);
}

/**
 * Drops ink on `canvas` once it scrolls into view: into still water from the side, or onto paper from
 * above. Size the canvas with CSS. The last frame stays, and a resize redraws it. Reduced motion shows the
 * settled ink; no WebGL draws nothing. Returns the cleanup.
 */
export function dropInk(canvas: HTMLCanvasElement, options: DropOptions = {}): () => void {
  return playCanvas(canvas, () => dropPainter(canvas, options), options.delay ?? 0);
}
