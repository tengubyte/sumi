"use client";

import { useEffect, useRef, type CSSProperties, type JSX } from "react";
import { slashIn, type SlashOptions } from "../core/tachigami.js";

export interface TachigamiProps extends SlashOptions {
  /** The picture to cut. */
  readonly src: string;
  /** The image's own size in px, so the page reserves its space before it loads. */
  readonly width: number;
  readonly height: number;
  readonly alt: string;
  /** Sizes the wrapper. Width alone keeps the image's shape. */
  readonly className?: string | undefined;
  readonly style?: CSSProperties | undefined;
}

/**
 * A picture cut by one slash of the brush, once, when it scrolls into view. The halves part along the cut
 * and close again, stay apart, or the top half falls away. The image stays a real image, so it shows
 * without WebGL.
 */
export function Tachigami(props: TachigamiProps): JSX.Element {
  const { src, width, height, alt, className, style, mode, through, angle, color, glint, seed, duration, delay } = props;
  const art = useRef<HTMLImageElement>(null);
  // Compared by content, so an inline array does not restart the cut on every render.
  const point = through === undefined ? "" : through.join(" ");

  useEffect(() => {
    if (!art.current) return;
    const [x = 0.5, y = 0.5] = point === "" ? [] : point.split(" ").map(Number);
    return slashIn(art.current, { mode, through: point === "" ? undefined : [x, y], angle, color, glint, seed, duration, delay });
  }, [src, mode, point, angle, color, glint, seed, duration, delay]);

  return (
    <div className={className} style={{ position: "relative", ...style }}>
      <img ref={art} src={src} width={width} height={height} alt={alt} decoding="async" style={{ display: "block", width: "100%", height: "100%" }} />
    </div>
  );
}
