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

/** Calls `frame` with the share of `seconds` gone, 0 to 1, on each animation frame. Resolves at 1. */
export const playShare = (seconds: number, frame: (share: number) => void): Promise<void> =>
  new Promise((resolve) => {
    playClock(seconds, 0, (s) => {
      frame(seconds > 0 ? s / seconds : 1);
    }, resolve);
  });

/** A canvas laid over `image`, which must fill a positioned parent, for an effect that runs on the picture. */
export function overlayCanvas(image: HTMLImageElement): HTMLCanvasElement {
  const surface = document.createElement("canvas");
  surface.setAttribute("aria-hidden", "true");
  surface.style.cssText = "position:absolute;inset:0;width:100%;height:100%;pointer-events:none";
  image.after(surface);
  return surface;
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

/**
 * Runs a painter from `create` only while the canvas is on screen, so an endless effect off screen costs
 * nothing. The WebGL context opens the first time the canvas shows. Returns the cleanup, which releases it.
 */
export function loopInView(canvas: HTMLCanvasElement, create: () => CanvasPainter | null, delay: number): () => void {
  let painter: CanvasPainter | null = null;
  let request = 0;
  let last = 0;
  let seconds = -delay;
  let running = false;
  const tick = (now: number): void => {
    // A long gap, such as a background tab, moves the clock on by a frame, not by the whole gap.
    seconds += Math.min((now - last) / 1000, 0.1);
    last = now;
    painter?.draw(Math.max(seconds, 0));
    request = requestAnimationFrame(tick);
  };
  // Chrome paints a canvas whose WebGL context was released as a white box, so the canvas leaves the page too.
  const stop = (): void => {
    observer.disconnect();
    cancelAnimationFrame(request);
    canvas.hidden = true;
    painter?.dispose();
    painter = null;
  };
  const observer = new IntersectionObserver((entries) => {
    const visible = entries.some((entry) => entry.isIntersecting);
    if (visible && !running) {
      painter ??= create();
      if (!painter) {
        stop();
        return;
      }
      last = performance.now();
      request = requestAnimationFrame(tick);
    }
    if (!visible) cancelAnimationFrame(request);
    running = visible;
  });
  canvas.hidden = false;
  canvas.addEventListener("webglcontextlost", stop);
  observer.observe(canvas);
  return () => {
    canvas.removeEventListener("webglcontextlost", stop);
    stop();
  };
}
