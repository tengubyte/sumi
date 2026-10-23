import { BAND_SECONDS, COVERED_AT, kasumiFragment, MIST_SECONDS } from "./kasumiGlsl.js";
import { playCanvas, playShare, prefersReducedMotion, type CanvasPainter } from "./play.js";
import { random } from "./random.js";
import { coverProgram, drawCover, fitCanvas } from "./webgl.js";

export interface KasumiOptions {
  /** Changes the bands' stepped ends and their leaf. Default 1. */
  readonly seed?: number | undefined;
  /** Seconds until both bands have settled. Default 1.4. */
  readonly duration?: number | undefined;
  /** Seconds to wait after it scrolls into view. Default 0. */
  readonly delay?: number | undefined;
}

export interface KasumiTransitionOptions {
  /** Changes the bands' stepped ends and their leaf. Default 1. */
  readonly seed?: number | undefined;
  /** Seconds for the bands to close and open again, not counting the wait for `swap`. Default 1.8. */
  readonly duration?: number | undefined;
  /** Cover this positioned element instead of the viewport. */
  readonly within?: HTMLElement | undefined;
}

interface Bands {
  /** `time` runs the band's timeline in seconds. */
  draw(time: number): void;
  dispose(): void;
}

function bands(canvas: HTMLCanvasElement, cover: 0 | 1, seed: number): Bands | null {
  const gl = canvas.getContext("webgl", { alpha: true, premultipliedAlpha: true, antialias: false, depth: false });
  if (!gl) return null;
  const at = coverProgram(gl, kasumiFragment(cover));
  if (!at) return null;
  gl.uniform1f(at("seed"), random(seed)() * 50);
  const [uSize, uCss, uTime] = [at("size"), at("css"), at("time")];
  return {
    draw(time) {
      fitCanvas(gl, canvas);
      gl.uniform2f(uSize, canvas.width, canvas.height);
      gl.uniform1f(uCss, canvas.width / Math.max(canvas.clientWidth, 1) / canvas.height);
      gl.uniform1f(uTime, time);
      drawCover(gl);
    },
    dispose() {
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    },
  };
}

/** Returns null when WebGL or the shader is unavailable. */
export function kasumiPainter(canvas: HTMLCanvasElement, options: KasumiOptions = {}): CanvasPainter | null {
  const mist = bands(canvas, 0, options.seed ?? 1);
  if (!mist) return null;
  const duration = Math.max(options.duration ?? BAND_SECONDS, 0);
  return {
    duration,
    draw(seconds) {
      mist.draw(duration > 0 ? (seconds / duration) * BAND_SECONDS : BAND_SECONDS);
    },
    dispose() {
      mist.dispose();
    },
  };
}

/**
 * Slides two gold cloud bands across `canvas` from either side once it scrolls into view, to settle as a
 * divider between sections. Size the canvas with CSS: full width and 80 to 160 px tall suits it. The last
 * frame stays, and a resize redraws it. Reduced motion shows the settled bands; no WebGL draws nothing.
 * Returns the cleanup.
 */
export function paintKasumi(canvas: HTMLCanvasElement, options: KasumiOptions = {}): () => void {
  return playCanvas(canvas, () => kasumiPainter(canvas, options), options.delay ?? 0);
}

/**
 * Draws gold cloud bands across the viewport (or `within`) from alternating sides, calls `swap` once
 * nothing shows and waits for it, then drifts the bands out the far side. Resolves when they have gone.
 * Each call plays once. Reduced motion or no WebGL just swaps. Clicks pass through to the page under it.
 */
export async function kasumiTransition(swap: () => unknown, options: KasumiTransitionOptions = {}): Promise<void> {
  const surface = prefersReducedMotion() ? null : document.createElement("canvas");
  const mist = surface ? bands(surface, 1, options.seed ?? 1) : null;
  if (!surface || !mist) {
    await swap();
    return;
  }
  surface.setAttribute("aria-hidden", "true");
  surface.style.cssText = `position:${options.within ? "absolute" : "fixed"};inset:0;width:100%;height:100%;z-index:2147483647;pointer-events:none`;
  (options.within ?? document.body).append(surface);
  const half = Math.max(options.duration ?? 1.8, 0) / 2;
  try {
    await playShare(half, (share) => {
      mist.draw(share * COVERED_AT);
    });
    await swap();
    await playShare(half, (share) => {
      mist.draw(COVERED_AT + share * (MIST_SECONDS - COVERED_AT));
    });
  } finally {
    mist.dispose();
    surface.remove();
  }
}
