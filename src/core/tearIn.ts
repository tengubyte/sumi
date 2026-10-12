import { onceInView, overlayCanvas as overlay, playCanvas, playClock, prefersReducedMotion, type CanvasPainter } from "./play.js";
import { tornPainter, type TornOptions } from "./torn.js";

export interface TearOptions extends TornOptions {
  /**
   * `"frame"` (default) tears the picture's border away to a ragged edge, which stays. `"cover"` tears a
   * sheet of `color` (default aged paper, `#dbd1bd`) off the picture and ends on the plain image.
   */
  readonly tear?: "frame" | "cover" | undefined;
}

/** The torn frame is the finished look, so its canvas stays over the hidden image and redraws on resize. */
function tearFrame(image: HTMLImageElement, options: TearOptions): () => void {
  const surface = overlay(image);
  const show = (): void => {
    image.style.visibility = "";
  };
  let stop = (): void => undefined;
  let cancelled = false;
  surface.addEventListener("webglcontextlost", show);
  image.decode().then(
    () => {
      if (cancelled) return;
      stop = playCanvas(
        surface,
        () => {
          const painter = tornPainter(surface, "frame", options, image);
          if (painter) image.style.visibility = "hidden";
          return painter;
        },
        options.delay ?? 0,
      );
    },
    () => undefined,
  );
  return () => {
    cancelled = true;
    stop();
    surface.remove();
    show();
  };
}

/** The cover comes off and the canvas leaves, so the page ends on the plain image. */
function tearCover(image: HTMLImageElement, options: TearOptions): () => void {
  if (prefersReducedMotion()) return () => undefined;
  const surface = overlay(image);
  let painter: CanvasPainter | null = null;
  let cancelled = false;
  // Chrome paints a canvas whose WebGL context was released as a white box, so the canvas leaves the page.
  const land = (): void => {
    image.style.visibility = "";
    surface.remove();
    painter?.dispose();
    painter = null;
  };
  image.style.visibility = "hidden";
  const stop = onceInView(image, () => {
    let cancelClock = (): void => undefined;
    image.decode().then(() => {
      if (cancelled) return;
      painter = tornPainter(surface, "cover", options, image);
      if (!painter) {
        land();
        return;
      }
      painter.draw(0);
      cancelClock = playClock(painter.duration, options.delay ?? 0, (seconds) => painter?.draw(seconds), land);
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

/**
 * Tears paper round `image` once it scrolls into view. The image must fill a positioned parent: the tear
 * runs on a canvas laid over it. A frame stays torn, with reduced motion too; a cover comes off and leaves
 * the plain image, which reduced motion shows at once. Without WebGL the image shows as it is. Returns the
 * cleanup, which also puts the image back.
 */
export function tearIn(image: HTMLImageElement, options: TearOptions = {}): () => void {
  return options.tear === "cover" ? tearCover(image, options) : tearFrame(image, options);
}
