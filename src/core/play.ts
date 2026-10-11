/** True when the visitor asked for less motion; effects then show their last frame. */
export const prefersReducedMotion = (): boolean => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Calls `start` once, when `element` has scrolled a little way into the viewport. `start` may return
 * its own cleanup. Returns a cleanup that stops watching and ends whatever `start` began.
 */
export function onceInView(element: Element, start: () => (() => void) | undefined): () => void {
  let end: (() => void) | undefined;
  const observer = new IntersectionObserver(
    (entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      observer.disconnect();
      end = start();
    },
    { rootMargin: "0px 0px -15% 0px" },
  );
  observer.observe(element);
  return () => {
    observer.disconnect();
    end?.();
  };
}

/**
 * Calls `frame` with the seconds elapsed on each animation frame, from `delay` seconds from now until
 * `duration` seconds have passed, ending on exactly `duration`. Then calls `done`. Returns the cancel.
 */
export function playClock(duration: number, delay: number, frame: (seconds: number) => void, done?: () => void): () => void {
  const begin = performance.now() + delay * 1000;
  let request = 0;
  const tick = (now: number): void => {
    if (now >= begin) {
      const seconds = Math.min((now - begin) / 1000, duration);
      frame(seconds);
      if (seconds >= duration) {
        done?.();
        return;
      }
    }
    request = requestAnimationFrame(tick);
  };
  request = requestAnimationFrame(tick);
  return () => {
    cancelAnimationFrame(request);
  };
}

/** Draws an effect `seconds` into its run; by `duration` it has fully landed. */
export interface CanvasPainter {
  readonly duration: number;
  draw(seconds: number): void;
  dispose(): void;
}

/**
 * Plays the painter from `create` on `canvas` once it scrolls into view, `delay` seconds later. The last
 * frame stays, and a resize redraws it. Reduced motion draws the last frame; no WebGL hides the canvas.
 * Returns the cleanup, which releases the WebGL context.
 */
export function playCanvas(canvas: HTMLCanvasElement, create: () => CanvasPainter | null, delay = 0): () => void {
  let painter: CanvasPainter | null = null;
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
    painter = create();
    if (!painter) {
      stop();
      return undefined;
    }
    resize.observe(canvas);
    if (prefersReducedMotion() || painter.duration <= 0) {
      time = painter.duration;
      painter.draw(time);
      return undefined;
    }
    return playClock(painter.duration, delay, (seconds) => {
      time = seconds;
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
