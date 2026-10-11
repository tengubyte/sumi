import { playCanvas, type CanvasPainter } from "./play.js";
import { random } from "./random.js";
import { rgb, type Hex } from "./splatShader.js";
import { TORN_FRAGMENT } from "./tornGlsl.js";
import { coverProgram, drawCover, fitCanvas, uploadTexture } from "./webgl.js";

export interface TornOptions {
  /** The sheet: the band, or the cover over a picture. */
  readonly color?: Hex | undefined;
  /** The white core that shows along the tear. Default `#fdfcfa`. */
  readonly edge?: Hex | undefined;
  /** Changes the path of the tear. Default 1. */
  readonly seed?: number | undefined;
  /** Seconds the tear takes. */
  readonly duration?: number | undefined;
  /** Seconds to wait after it scrolls into view. Default 0. */
  readonly delay?: number | undefined;
}

export interface BandOptions extends TornOptions {
  /** Which edge of the band is torn: the band sits above a torn bottom edge, or below a torn top edge. Default `"bottom"`. */
  readonly side?: "bottom" | "top" | undefined;
}

export const TORN_KIND = { frame: 0, band: 1, cover: 2 } as const;
export type TornKind = keyof typeof TORN_KIND;

// The tear's own scale: fibres a couple of CSS px wide and a wander of a few tens, whatever the size.
const UNIT_PX = 400;

/** Returns null when WebGL or the shader is unavailable. A picture must have loaded. */
export function tornPainter(canvas: HTMLCanvasElement, kind: TornKind, options: BandOptions = {}, picture?: HTMLImageElement): CanvasPainter | null {
  const gl = canvas.getContext("webgl", { alpha: true, premultipliedAlpha: true, antialias: false, depth: false });
  if (!gl) return null;
  const at = coverProgram(gl, TORN_FRAGMENT);
  if (!at) return null;
  if (picture) {
    // Flipped, so texture coordinates match gl_FragCoord with (0, 0) at the bottom left.
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.activeTexture(gl.TEXTURE0);
    uploadTexture(gl, picture, gl.RGBA, false);
  }
  gl.uniform1i(at("image"), 0);
  gl.uniform1f(at("kind"), TORN_KIND[kind]);
  gl.uniform1f(at("flip"), options.side === "top" ? -1 : 1);
  gl.uniform1f(at("seed"), random(options.seed ?? 1)() * 50);
  gl.uniform3fv(at("sheet"), rgb(options.color ?? (kind === "cover" ? "#dbd1bd" : "#161314")));
  gl.uniform3fv(at("core"), rgb(options.edge ?? "#fdfcfa"));
  const duration = Math.max(options.duration ?? (kind === "band" ? 1.6 : 1.4), 0);
  const uSize = at("size");
  const uUnit = at("unit");
  const uProgress = at("progress");
  return {
    duration,
    draw(seconds) {
      fitCanvas(gl, canvas);
      gl.uniform2f(uSize, canvas.width, canvas.height);
      gl.uniform1f(uUnit, (UNIT_PX * canvas.width) / Math.max(canvas.clientWidth, 1));
      gl.uniform1f(uProgress, duration > 0 ? seconds / duration : 1);
      drawCover(gl);
    },
    dispose() {
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    },
  };
}

/**
 * Tears a band of `options.color` across `canvas` from left to right once it scrolls into view, for the
 * edge of a section. Size the canvas with CSS, 80 to 120 px tall; the tear runs along its middle. The last
 * frame stays, and a resize redraws it. Reduced motion shows the torn band; no WebGL draws nothing.
 * Returns the cleanup.
 */
export function tearBand(canvas: HTMLCanvasElement, options: BandOptions = {}): () => void {
  return playCanvas(canvas, () => tornPainter(canvas, "band", options), options.delay ?? 0);
}
