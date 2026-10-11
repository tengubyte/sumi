import { onceInView, playClock, prefersReducedMotion } from "./play.js";
import { SPLAT_SECONDS, splatPainter, type SplatPainter, type SplatShape } from "./splatShader.js";

export interface SplatOptions extends SplatShape {
  /** Seconds from the hit until the last mist lands. Default 2.2. */
  readonly duration?: number | undefined;
  /** Seconds to wait after the canvas scrolls into view. Default 0. */
  readonly delay?: number | undefined;
}

/**
 * Throws a splat onto `canvas` once it scrolls into view. Size the canvas with CSS; the splat scales with
 * its width. The last frame stays, and a resize redraws it. Reduced motion draws the landed splat; no
 * WebGL draws nothing. Returns the cleanup, which releases the WebGL context.
 */
export function throwSplat(canvas: HTMLCanvasElement, options: SplatOptions = {}): () => void {
  const { duration = SPLAT_SECONDS, delay = 0 } = options;
  let painter: SplatPainter | null = null;
  let time = 0;
  // Chrome paints a canvas whose WebGL context was released as a white box, so the canvas leaves the page too.
  const stop = (): void => {
    canvas.hidden = true;
    painter?.dispose();
    painter = null;
  };
  const resize = new ResizeObserver(() => {
    painter?.draw(time);
  });

  canvas.hidden = false;
  canvas.addEventListener("webglcontextlost", stop);
  const unwatch = onceInView(canvas, () => {
    painter = splatPainter(canvas, options);
    if (!painter) {
      stop();
      return undefined;
    }
    resize.observe(canvas);
    if (prefersReducedMotion() || duration <= 0) {
      time = SPLAT_SECONDS;
      painter.draw(time);
      return undefined;
    }
    return playClock(duration, delay, (seconds) => {
      time = (seconds / duration) * SPLAT_SECONDS;
      painter?.draw(time);
    });
  });
  return () => {
    unwatch();
    resize.disconnect();
    canvas.removeEventListener("webglcontextlost", stop);
    stop();
  };
}
