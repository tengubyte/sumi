import { loopInView, playCanvas, prefersReducedMotion, type CanvasPainter } from "./play.js";
import { random } from "./random.js";
import { SHUCHUSEN_FRAGMENT } from "./shuchusenGlsl.js";
import { rgb, type Hex } from "./splatShader.js";
import { coverProgram, drawCover, fitCanvas } from "./webgl.js";

export interface FocusOptions {
  /** `"focus"` (default) runs lines in toward a point; `"speed"` streams them past in parallel. */
  readonly lines?: "focus" | "speed" | undefined;
  /** The point the lines run toward, as shares of the canvas (y down). Default the middle. */
  readonly focus?: readonly [x: number, y: number] | undefined;
  /** Half the width and half the height of the clear oval round the focus, as shares of the canvas. Default `[0.32, 0.3]`. */
  readonly clear?: readonly [x: number, y: number] | undefined;
  /** How many lines go round. Default 150. */
  readonly count?: number | undefined;
  /** Line thickness; 2 is twice as heavy. Default 1. */
  readonly weight?: number | undefined;
  /** Default `#161314` (sumi). */
  readonly color?: Hex | undefined;
  /** How often the lines are drawn anew, per second; 0 keeps one drawing. Default 10. */
  readonly fps?: number | undefined;
  /** Speed lines only: their direction in degrees, 0 across. Default 0. */
  readonly angle?: number | undefined;
  /** Speed lines only: 2 streams twice as fast. Default 1. */
  readonly speed?: number | undefined;
  /** Changes every line. Default 1. */
  readonly seed?: number | undefined;
  /** Seconds to wait after the canvas scrolls into view. Default 0. */
  readonly delay?: number | undefined;
}

/** Returns null when WebGL or the shader is unavailable. A `still` painter keeps one finished drawing. */
export function focusPainter(canvas: HTMLCanvasElement, options: FocusOptions = {}, still = false): CanvasPainter | null {
  const gl = canvas.getContext("webgl", { alpha: true, premultipliedAlpha: true, antialias: false, depth: false });
  if (!gl) return null;
  const at = coverProgram(gl, SHUCHUSEN_FRAGMENT);
  if (!at) return null;
  const [x, y] = options.focus ?? [0.5, 0.5];
  const [cx, cy] = options.clear ?? [0.32, 0.3];
  gl.uniform1f(at("lines"), options.lines === "speed" ? 1 : 0);
  gl.uniform2f(at("focus"), x, 1 - y);
  gl.uniform2f(at("clear"), Math.max(cx, 0.01), Math.max(cy, 0.01));
  gl.uniform1f(at("count"), Math.min(Math.max(Math.round(options.count ?? 150), 8), 600));
  gl.uniform1f(at("weight"), 0.006 * Math.max(options.weight ?? 1, 0));
  gl.uniform1f(at("fps"), still ? 0 : Math.max(options.fps ?? 10, 0));
  gl.uniform1f(at("angle"), ((options.angle ?? 0) * Math.PI) / 180);
  gl.uniform1f(at("speed"), options.speed ?? 1);
  gl.uniform1f(at("seed"), random(options.seed ?? 1)() * 50);
  gl.uniform3fv(at("color"), rgb(options.color ?? "#161314"));
  const uSize = at("size");
  const uTime = at("time");
  return {
    duration: still ? 0 : Infinity,
    draw(seconds) {
      fitCanvas(gl, canvas);
      gl.uniform2f(uSize, canvas.width, canvas.height);
      // A still drawing is the lines fully in, at one moment of the stream.
      gl.uniform1f(uTime, still ? 1 : seconds);
      drawCover(gl);
    },
    dispose() {
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    },
  };
}

/**
 * Draws manga focus lines on `canvas`, toward a point or streaming past, redrawn several times a second
 * while the canvas is on screen. Size the canvas with CSS and lay it behind what the lines point at.
 * Reduced motion keeps one still drawing; no WebGL draws nothing. Returns the cleanup.
 */
export function focusLines(canvas: HTMLCanvasElement, options: FocusOptions = {}): () => void {
  if (prefersReducedMotion()) return playCanvas(canvas, () => focusPainter(canvas, options, true), options.delay ?? 0);
  return loopInView(canvas, () => focusPainter(canvas, options), options.delay ?? 0);
}
