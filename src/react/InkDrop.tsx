"use client";

import { useEffect, useRef, type CSSProperties, type JSX } from "react";
import { dropInk, type Drop, type DropOptions } from "../core/inkDrop.js";

export interface InkDropProps extends DropOptions {
  /** Size the canvas here. */
  readonly className?: string | undefined;
  readonly style?: CSSProperties | undefined;
}

/** Ink dropped into still water, once, when it scrolls into view. It is decoration. */
export function InkDrop(props: InkDropProps): JSX.Element {
  const { className, style, drops, color, seed, swirl, speed, delay } = props;
  const canvas = useRef<HTMLCanvasElement>(null);
  // Compared by content, so an inline array does not restart the drops on every render.
  const spots = drops === undefined ? "" : JSON.stringify(drops);
  const run = [spots, color, seed, swirl, speed, delay].map(String).join(" ");

  useEffect(() => {
    if (!canvas.current) return;
    const list = spots === "" ? undefined : (JSON.parse(spots) as Drop[]);
    return dropInk(canvas.current, { drops: list, color, seed, swirl, speed, delay });
  }, [spots, color, seed, swirl, speed, delay]);

  // A new canvas per run: a canvas whose WebGL context was released cannot get another.
  return <canvas key={run} ref={canvas} aria-hidden="true" className={className} style={{ pointerEvents: "none", ...style }} />;
}
