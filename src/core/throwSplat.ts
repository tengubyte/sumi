import { playCanvas } from "./play.js";
import { SPLAT_SECONDS, splatPainter, type SplatShape } from "./splatShader.js";

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
  const run = Math.max(duration, 0);
  return playCanvas(
    canvas,
    () => {
      const painter = splatPainter(canvas, options);
      if (!painter) return null;
      // The splat's own clock always runs to SPLAT_SECONDS; `duration` only stretches it.
      return {
        duration: run,
        draw: (seconds) => {
          painter.draw(run > 0 ? (seconds / run) * SPLAT_SECONDS : SPLAT_SECONDS);
        },
        dispose: () => {
          painter.dispose();
        },
      };
    },
    delay,
  );
}
