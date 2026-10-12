"use client";

import { useEffect, useRef, type CSSProperties, type JSX } from "react";
import { colorIn, type ColorOptions } from "../core/irodori.js";
import type { Blot } from "../core/wipeIn.js";

export interface IrodoriProps extends ColorOptions {
  /** The picture to colour in. */
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
 * A picture that starts as an ink wash and takes its colour from spreading wet blooms, once, when it
 * scrolls into view. It ends on the plain image, which shows without WebGL and with reduced motion.
 */
export function Irodori(props: IrodoriProps): JSX.Element {
  const { src, width, height, alt, className, style, blooms, paper, ink, seed, duration, delay } = props;
  const art = useRef<HTMLImageElement>(null);
  // Compared by content, so an inline array does not restart the colour on every render.
  const spots = blooms === undefined ? "" : JSON.stringify(blooms);

  useEffect(() => {
    if (!art.current) return;
    const list = spots === "" ? undefined : (JSON.parse(spots) as Blot[]);
    return colorIn(art.current, { blooms: list, paper, ink, seed, duration, delay });
  }, [src, spots, paper, ink, seed, duration, delay]);

  return (
    <div className={className} style={{ position: "relative", ...style }}>
      <img ref={art} src={src} width={width} height={height} alt={alt} decoding="async" style={{ display: "block", width: "100%", height: "100%" }} />
    </div>
  );
}
