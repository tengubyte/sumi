"use client";

import { useEffect, useRef, type CSSProperties, type JSX } from "react";
import { hakeIn, type HakeCutOptions } from "../core/hake.js";

export interface HakeCutProps extends HakeCutOptions {
  /** The picture the brush paints in. */
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
 * A picture painted in by one pass of a wide flat brush, once, when it scrolls into view, leaving a
 * dry-brushed edge or band. The image stays a real image, so it shows without WebGL.
 */
export function HakeCut(props: HakeCutProps): JSX.Element {
  const { src, width, height, alt, className, style, shape, side, offset, thickness, streaks, angle, seed, duration, delay } = props;
  const art = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (!art.current) return;
    return hakeIn(art.current, { shape, side, offset, thickness, streaks, angle, seed, duration, delay });
  }, [src, shape, side, offset, thickness, streaks, angle, seed, duration, delay]);

  return (
    <div className={className} style={{ position: "relative", ...style }}>
      <img ref={art} src={src} width={width} height={height} alt={alt} decoding="async" style={{ display: "block", width: "100%", height: "100%" }} />
    </div>
  );
}
