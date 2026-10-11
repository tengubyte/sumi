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
