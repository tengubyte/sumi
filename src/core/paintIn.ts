import { inkBrush, type InkBrush, type Sweep } from "./brushShader.js";
import { joHaKyu } from "./ease.js";
import { onceInView, playClock, prefersReducedMotion } from "./play.js";

export interface PaintOptions {
  /** How the stroke in the art travels: "line" left to right (default), "ring" clockwise round the centre. */
  readonly sweep?: Sweep | undefined;
  /** For a ring: where the stroke starts, in degrees clockwise from 3 o'clock. Default 0. */
  readonly startAngle?: number | undefined;
  /** Seconds the stroke takes. Default 1.4. */
  readonly duration?: number | undefined;
  /** Seconds to wait after the art scrolls into view. Default 0. */
  readonly delay?: number | undefined;
  /** Maps time (0 to 1) to how far the stroke has got (0 to 1). Default jo-ha-kyu. */
  readonly ease?: ((time: number) => number) | undefined;
}

/**
 * Paints `image` in once with a WebGL brush when it scrolls into view. The image must fill a positioned
 * parent: the brush draws on a canvas laid over that parent, which ends on the art's own pixels and is
 * then removed, releasing the WebGL context. Reduced motion, no WebGL, or an image that fails to decode
 * shows the plain image. Returns the cleanup, which also puts the image back.
 */
export function paintIn(image: HTMLImageElement, options: PaintOptions = {}): () => void {
  const { sweep = "line", startAngle = 0, duration = 1.4, delay = 0, ease = joHaKyu } = options;
  if (prefersReducedMotion()) return () => undefined;
  const surface = document.createElement("canvas");
  surface.setAttribute("aria-hidden", "true");
  surface.style.cssText = "position:absolute;inset:0;width:100%;height:100%;pointer-events:none";
  let brush: InkBrush | null = null;
  let cancelled = false;
  // Chrome paints a canvas whose WebGL context was released as a white box, so the canvas leaves the page.
  const land = (): void => {
    image.style.visibility = "";
    surface.remove();
    brush?.dispose();
    brush = null;
  };

  image.style.visibility = "hidden";
  image.after(surface);
  const stop = onceInView(image, () => {
    let cancelClock = (): void => undefined;
    image.decode().then(() => {
      if (cancelled) return;
      brush = inkBrush(surface, image, sweep, startAngle);
      if (!brush) {
        land();
        return;
      }
      cancelClock = playClock(duration, delay, (seconds) => brush?.draw(ease(duration > 0 ? seconds / duration : 1)), land);
    }, land);
    return () => {
      cancelClock();
    };
  });
  return () => {
    cancelled = true;
    stop();
    land();
  };
}
