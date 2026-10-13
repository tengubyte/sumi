"use client";

import { useEffect, useRef, type CSSProperties, type JSX } from "react";
import { kindleFire, type FireOptions } from "../core/kaen.js";

export interface KaenProps extends FireOptions {
  /** What the burning character means, such as "Flame". Without it the canvas is decoration and hidden from assistive technology. */
  readonly label?: string | undefined;
  /** Size the canvas here. Along the edge the fire climbs from its bottom; a character sits a little below its middle. */
  readonly className?: string | undefined;
  readonly style?: CSSProperties | undefined;
}

/** Fire painted as the old scrolls paint it, burning along the bottom edge or round a character while it is on screen. */
export function Kaen(props: KaenProps): JSX.Element {
  const { label, className, style, text, look, reach, font, weight, color, seed, speed, delay } = props;
  const canvas = useRef<HTMLCanvasElement>(null);
  const run = [text, look, reach, font, weight, color, seed, speed, delay].map(String).join(" ");

  useEffect(() => {
    if (!canvas.current) return;
    return kindleFire(canvas.current, { text, look, reach, font, weight, color, seed, speed, delay });
  }, [text, look, reach, font, weight, color, seed, speed, delay]);

  const a11y = label === undefined ? { "aria-hidden": true } : { role: "img", "aria-label": label };
  // A new canvas per run: a canvas whose WebGL context was released cannot get another.
  return <canvas key={run} ref={canvas} {...a11y} className={className} style={{ pointerEvents: "none", ...style }} />;
}
