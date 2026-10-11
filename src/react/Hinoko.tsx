"use client";

import { useEffect, useRef, type CSSProperties, type JSX } from "react";
import { riseEmbers, type EmberOptions } from "../core/hinoko.js";

export interface HinokoProps extends EmberOptions {
  /** Size the canvas here, over whatever burns. Embers are light, so the page under them should be dark. */
  readonly className?: string | undefined;
  readonly style?: CSSProperties | undefined;
}

/** Embers rising off a fire while they are on screen, or one burst with `burst`. It is decoration. */
export function Hinoko(props: HinokoProps): JSX.Element {
  const { className, style, count, burst, from, spread, wind, ash, seed, speed, delay } = props;
  const canvas = useRef<HTMLCanvasElement>(null);
  // Compared by content, so an inline array does not restart the fire on every render.
  const source = from === undefined ? "" : from.join(" ");
  const run = [count, burst, source, spread, wind, ash, seed, speed, delay].map(String).join(" ");

  useEffect(() => {
    if (!canvas.current) return;
    const [x = 0.5, y = 1] = source === "" ? [] : source.split(" ").map(Number);
    return riseEmbers(canvas.current, { count, burst, from: source === "" ? undefined : [x, y], spread, wind, ash, seed, speed, delay });
  }, [count, burst, source, spread, wind, ash, seed, speed, delay]);

  // A new canvas per run: a canvas whose WebGL context was released cannot get another.
  return <canvas key={run} ref={canvas} aria-hidden="true" className={className} style={{ pointerEvents: "none", ...style }} />;
}
