"use client";

import { useEffect, useRef, type CSSProperties, type JSX } from "react";
import { tearIn, type TearOptions } from "../core/tearIn.js";

export interface TornEdgeProps extends TearOptions {
  /** The picture to tear round. */
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
 * A picture torn by hand, once, when it scrolls into view: its border tears away to a ragged frame, or a
 * paper cover tears off it. The image stays a real image, so it shows without WebGL.
 */
export function TornEdge(props: TornEdgeProps): JSX.Element {
  const { src, width, height, alt, className, style, tear, color, edge, seed, duration, delay } = props;
  const art = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (!art.current) return;
    return tearIn(art.current, { tear, color, edge, seed, duration, delay });
  }, [src, tear, color, edge, seed, duration, delay]);

  return (
    <div className={className} style={{ position: "relative", ...style }}>
      <img ref={art} src={src} width={width} height={height} alt={alt} decoding="async" style={{ display: "block", width: "100%", height: "100%" }} />
    </div>
  );
}
