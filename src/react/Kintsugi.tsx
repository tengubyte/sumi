"use client";

import { useEffect, useRef, type CSSProperties, type JSX } from "react";
import { mendIn, type MendOptions } from "../core/kintsugi.js";

export interface KintsugiProps extends MendOptions {
  /** The picture to break and mend. */
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
 * A picture broken and mended with gold, once, when it scrolls into view. Cracks run out from the blow,
 * fill with red lacquer, then gold, and a sheen crosses them. The image stays a real image, so it shows
 * without WebGL.
 */
export function Kintsugi(props: KintsugiProps): JSX.Element {
  const { src, width, height, alt, className, style, impact, seed, duration, delay } = props;
  const art = useRef<HTMLImageElement>(null);
  // Compared by content, so an inline array does not restart the break on every render.
  const point = impact === undefined ? "" : impact.join(" ");

  useEffect(() => {
    if (!art.current) return;
    const [x = 0.45, y = 0.45] = point === "" ? [] : point.split(" ").map(Number);
    return mendIn(art.current, { impact: point === "" ? undefined : [x, y], seed, duration, delay });
  }, [src, point, seed, duration, delay]);

  return (
    <div className={className} style={{ position: "relative", ...style }}>
      <img ref={art} src={src} width={width} height={height} alt={alt} decoding="async" style={{ display: "block", width: "100%", height: "100%" }} />
    </div>
  );
}
