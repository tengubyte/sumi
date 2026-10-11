import { FLOOD_FRAGMENT } from "./floodGlsl.js";
import { playClock, prefersReducedMotion } from "./play.js";
import { random } from "./random.js";
import { rgb, type Hex } from "./splatShader.js";
import { coverProgram, drawCover, fitCanvas } from "./webgl.js";

/** A point as shares of the covered box, y down. */
export type Spot = readonly [x: number, y: number];

export interface TransitionOptions {
  /** Where the ink floods from. Default the middle. For a click: `[e.clientX / innerWidth, e.clientY / innerHeight]`. */
  readonly from?: Spot | undefined;
  /** Where the paper opens from. Default the same point. Outside 0 to 1 pours from past an edge. */
  readonly to?: Spot | undefined;
  /** Default `#161314` (sumi). */
  readonly color?: Hex | undefined;
  /** Changes the shape of the fronts. Default 1. */
  readonly seed?: number | undefined;
  /** Seconds for the flood and the opening together, not counting the wait for `swap`. Default 1.6. */
  readonly duration?: number | undefined;
  /** Cover this positioned element instead of the viewport. */
  readonly within?: HTMLElement | undefined;
}

const WARP = 0.3;

/** How far a front must travel from `spot` to pass every corner of a box `aspect` wide, warp and all. */
export function floodReach([x, y]: Spot, aspect: number): number {
  const corners = [[0, 0], [aspect, 0], [0, 1], [aspect, 1]] as const;
  return Math.max(...corners.map(([cx, cy]) => Math.hypot(cx - x * aspect, cy - y))) + WARP * 0.5 + 0.12;
}

const easeInOut = (t: number): number => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);
const clamp01 = (t: number): number => Math.min(Math.max(t, 0), 1);

interface Flood {
  /** `t` runs 0 to 1: flooded by 0.45, opening from 0.55. */
  draw(t: number): void;
  dispose(): void;
}

function floodPainter(canvas: HTMLCanvasElement, options: TransitionOptions): Flood | null {
  const gl = canvas.getContext("webgl", { alpha: true, premultipliedAlpha: true, antialias: false, depth: false });
  if (!gl) return null;
  const at = coverProgram(gl, FLOOD_FRAGMENT);
  if (!at) return null;
  const from = options.from ?? [0.5, 0.5];
  const to = options.to ?? from;
  gl.uniform2f(at("origin"), from[0], from[1]);
  gl.uniform2f(at("exit"), to[0], to[1]);
  gl.uniform3fv(at("ink"), rgb(options.color ?? "#161314"));
  gl.uniform1f(at("seed"), random(options.seed ?? 1)() * 50);
  gl.uniform1f(at("warpAmount"), WARP);
  const [uSize, uIn, uOut] = [at("size"), at("inFront"), at("outFront")];
  return {
    draw(t) {
      fitCanvas(gl, canvas);
      const aspect = canvas.width / canvas.height;
      gl.uniform2f(uSize, canvas.width, canvas.height);
      gl.uniform1f(uIn, t <= 0 ? -1 : easeInOut(clamp01(t / 0.45)) * floodReach(from, aspect));
      gl.uniform1f(uOut, t < 0.55 ? -1 : clamp01((t - 0.55) / 0.45) ** 1.5 * floodReach(to, aspect));
      drawCover(gl);
    },
    dispose() {
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    },
  };
}

const play = (seconds: number, frame: (share: number) => void): Promise<void> =>
  new Promise((resolve) => {
    playClock(seconds, 0, (s) => {
      frame(seconds > 0 ? s / seconds : 1);
    }, resolve);
  });

/**
 * Floods the viewport (or `within`) with ink, calls `swap` once nothing shows and waits for it, then
 * opens the paper again. Resolves when the ink has gone. Each call plays once. Reduced motion or no
 * WebGL just swaps. Clicks pass through the ink to the page under it.
 */
export async function inkTransition(swap: () => unknown, options: TransitionOptions = {}): Promise<void> {
  const surface = prefersReducedMotion() ? null : document.createElement("canvas");
  const flood = surface ? floodPainter(surface, options) : null;
  if (!surface || !flood) {
    await swap();
    return;
  }
  surface.setAttribute("aria-hidden", "true");
  surface.style.cssText = `position:${options.within ? "absolute" : "fixed"};inset:0;width:100%;height:100%;z-index:2147483647;pointer-events:none`;
  (options.within ?? document.body).append(surface);
  const half = Math.max(options.duration ?? 1.6, 0) / 2;
  try {
    await play(half, (share) => {
      flood.draw(share / 2);
    });
    await swap();
    await play(half, (share) => {
      flood.draw(0.5 + share / 2);
    });
  } finally {
    flood.dispose();
    surface.remove();
  }
}
