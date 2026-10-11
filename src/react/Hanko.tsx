"use client";

import { useEffect, useRef, type CSSProperties, type JSX } from "react";
import { pressSeal, type SealOptions } from "../core/seal.js";

export interface HankoProps extends SealOptions {
  /** One to four characters, read in columns from the right, each top to bottom. */
  readonly text: string;
  /** What the seal says, such as a name. Without it the canvas is decoration and hidden from assistive technology. */
  readonly label?: string | undefined;
  /** Size the canvas here: square for square and round seals, about 1:1.6 for tall ones. */
  readonly className?: string | undefined;
  readonly style?: CSSProperties | undefined;
}

/** A seal pressed in vermilion paste, once, when it scrolls into view. Mount it after a send to stamp it. */
export function Hanko(props: HankoProps): JSX.Element {
  const { text, label, className, style, shape, white, font, weight, color, seed, speed, delay } = props;
  const canvas = useRef<HTMLCanvasElement>(null);
  const run = [text, shape, white, font, weight, color, seed, speed, delay].map(String).join(" ");

  useEffect(() => {
    if (!canvas.current) return;
    return pressSeal(canvas.current, text, { shape, white, font, weight, color, seed, speed, delay });
  }, [text, shape, white, font, weight, color, seed, speed, delay]);

  const a11y = label === undefined ? { "aria-hidden": true } : { role: "img", "aria-label": label };
  // A new canvas per run: a canvas whose WebGL context was released cannot get another.
  return <canvas key={run} ref={canvas} {...a11y} className={className} style={{ pointerEvents: "none", ...style }} />;
}
