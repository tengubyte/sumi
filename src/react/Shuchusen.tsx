"use client";

import { useEffect, useRef, type CSSProperties, type JSX } from "react";
import { focusLines, type FocusOptions } from "../core/shuchusen.js";

export interface ShuchusenProps extends FocusOptions {
  /** Size the canvas here, behind whatever the lines point at. */
  readonly className?: string | undefined;
  readonly style?: CSSProperties | undefined;
}

/** Manga focus lines, or speed lines, redrawn several times a second while on screen. It is decoration. */
export function Shuchusen(props: ShuchusenProps): JSX.Element {
  const { className, style, lines, focus, clear, count, weight, color, fps, angle, speed, seed, delay } = props;
  const canvas = useRef<HTMLCanvasElement>(null);
  // Compared by content, so an inline array does not restart the lines on every render.
  const point = focus === undefined ? "" : focus.join(" ");
  const oval = clear === undefined ? "" : clear.join(" ");
  const run = [lines, point, oval, count, weight, color, fps, angle, speed, seed, delay].map(String).join(" ");

  useEffect(() => {
    if (!canvas.current) return;
    const pair = (text: string): [number, number] | undefined => {
      const [x, y] = text.split(" ").map(Number);
      return x === undefined || y === undefined ? undefined : [x, y];
    };
    return focusLines(canvas.current, { lines, focus: pair(point), clear: pair(oval), count, weight, color, fps, angle, speed, seed, delay });
  }, [lines, point, oval, count, weight, color, fps, angle, speed, seed, delay]);

  // A new canvas per run: a canvas whose WebGL context was released cannot get another.
  return <canvas key={run} ref={canvas} aria-hidden="true" className={className} style={{ pointerEvents: "none", ...style }} />;
}
