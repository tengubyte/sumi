import { playCanvas, type CanvasPainter } from "./play.js";
import { random } from "./random.js";
import { DIP_SECONDS, SHIBORI_PATTERNS, shiboriFragment, type ShiboriPattern } from "./shiboriGlsl.js";
import { rgb, type Hex } from "./splatShader.js";
import { coverProgram, drawCover, fitCanvas } from "./webgl.js";

export { SHIBORI_PATTERNS, type ShiboriPattern };

export interface ShiboriOptions {
  /** How the cloth was bound: `"arashi"` pleated on a pole, `"itajime"` folded and clamped, `"kanoko"` tied in dots. Default `"itajime"`. */
  readonly pattern?: ShiboriPattern | undefined;
  /** Dips in the vat, 1 to 6; each one darker. Default 3. */
  readonly dips?: number | undefined;
  /** The dye at its deepest, after six dips. Default `#122645` (indigo). */
  readonly color?: Hex | undefined;
  /** The undyed cloth, which the resist keeps. Default `#ede8d9`. */
  readonly cloth?: Hex | undefined;
  /** Changes the folds, the mottling and the weave. Default 1. */
  readonly seed?: number | undefined;
  /** 2 dyes twice as fast. Default 1. */
  readonly speed?: number | undefined;
  /** Seconds to wait after the canvas scrolls into view. Default 0. */
  readonly delay?: number | undefined;
}

const dipCount = (dips: number | undefined): number => Math.min(Math.max(Math.round(dips ?? 3), 1), 6);

/** Seconds until the last dip has turned in the air. */
export const shiboriSeconds = (dips?: number, speed = 1): number => (0.3 + dipCount(dips) * DIP_SECONDS) / Math.max(speed, 0.05);

/** Returns null when WebGL or the shader is unavailable. */
export function shiboriPainter(canvas: HTMLCanvasElement, options: ShiboriOptions = {}): CanvasPainter | null {
  const gl = canvas.getContext("webgl", { alpha: true, premultipliedAlpha: true, antialias: false, depth: false });
  if (!gl) return null;
  const pattern = SHIBORI_PATTERNS.indexOf(options.pattern ?? "itajime");
  const at = coverProgram(gl, shiboriFragment(pattern < 0 ? 1 : pattern));
  if (!at) return null;
  gl.uniform1f(at("seed"), random(options.seed ?? 1)() * 50);
  gl.uniform1f(at("dips"), dipCount(options.dips));
  gl.uniform3fv(at("color"), rgb(options.color ?? "#122645"));
  gl.uniform3fv(at("cloth"), rgb(options.cloth ?? "#ede8d9"));
  const speed = Math.max(options.speed ?? 1, 0.05);
  const duration = shiboriSeconds(options.dips, speed);
  const [uSize, uPixel, uTime] = [at("size"), at("pixel"), at("time")];
  return {
    duration,
    draw(seconds) {
      fitCanvas(gl, canvas);
      gl.uniform2f(uSize, canvas.width, canvas.height);
      gl.uniform1f(uPixel, canvas.width / Math.max(canvas.clientWidth, 1));
      gl.uniform1f(uTime, Math.min(seconds, duration) * speed);
      drawCover(gl);
    },
    dispose() {
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    },
  };
}

/**
 * Dyes cloth on `canvas` once it scrolls into view: it goes into the vat bottom first, comes out
 * yellow-green and turns blue in the air, dip after dip, while the bound parts stay white. Size the canvas
 * with CSS. The last frame stays, and a resize redraws it. Reduced motion shows the dyed cloth; no WebGL
 * draws nothing. Returns the cleanup.
 */
export function dyeShibori(canvas: HTMLCanvasElement, options: ShiboriOptions = {}): () => void {
  return playCanvas(canvas, () => shiboriPainter(canvas, options), options.delay ?? 0);
}
