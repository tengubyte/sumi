"use client";

import { useEffect, useRef, type CSSProperties, type JSX } from "react";
import { bloomBranch, type BloomOptions } from "../core/hanasaka.js";

export interface HanasakaProps extends BloomOptions {
  /** Size the canvas here. */
  readonly className?: string | undefined;
  readonly style?: CSSProperties | undefined;
}

/** A cherry branch brushed in once it scrolls into view, blossoms opening along it. It is decoration. */
export function Hanasaka(props: HanasakaProps): JSX.Element {
  const { className, style, from, angle, reach, flowers, petals, wind, bark, outline, pink, heart, seed, duration, delay } = props;
  const canvas = useRef<HTMLCanvasElement>(null);
  // Compared by content, so inline arrays do not regrow the branch on every render.
  const start = from === undefined ? "" : from.join(" ");
  const air = wind === undefined ? "" : wind.join(" ");
  const run = [start, angle, reach, flowers, petals, air, bark, outline, pink, heart, seed, duration, delay].map(String).join(" ");

  useEffect(() => {
    if (!canvas.current) return;
    const pair = (text: string): [number, number] | undefined => {
      const [x, y] = text.split(" ").map(Number);
      return x === undefined || y === undefined ? undefined : [x, y];
    };
    return bloomBranch(canvas.current, { from: pair(start), angle, reach, flowers, petals, wind: pair(air), bark, outline, pink, heart, seed, duration, delay });
  }, [start, angle, reach, flowers, petals, air, bark, outline, pink, heart, seed, duration, delay]);

  // A new canvas per run: a canvas whose WebGL context was released cannot get another.
  return <canvas key={run} ref={canvas} aria-hidden="true" className={className} style={{ pointerEvents: "none", ...style }} />;
}
