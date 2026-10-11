"use client";

import { useEffect, useRef, type CSSProperties, type JSX } from "react";
import { wipeIn, type Blot, type WipeOptions } from "../core/wipeIn.js";

export interface InkWipeProps extends Omit<WipeOptions, "from"> {
  /** The image the ink brings in. */
  readonly src: string;
  /** The image's own size in px, so the page reserves its space before it loads. */
  readonly width: number;
  readonly height: number;
  readonly alt: string;
  /** An image in the same box that the ink wipes away. */
  readonly from?: string | undefined;
  /** Sizes the wrapper. Width alone keeps the image's shape. */
  readonly className?: string | undefined;
  readonly style?: CSSProperties | undefined;
}

const FILL: CSSProperties = { display: "block", width: "100%", height: "100%" };

/**
 * An image that comes in under blooming ink, once, when it scrolls into view. The finished image is a
 * plain image, so it shows without JavaScript, without WebGL and with reduced motion.
 */
export function InkWipe(props: InkWipeProps): JSX.Element {
  const { src, width, height, alt, from, className, style, blots, color, seed, duration, delay } = props;
  const art = useRef<HTMLImageElement>(null);
  const before = useRef<HTMLImageElement>(null);
  // Compared by content, so an inline array does not restart the wipe on every render.
  const spots = blots === undefined ? "" : JSON.stringify(blots);

  useEffect(() => {
    if (!art.current) return;
    const list = spots === "" ? undefined : (JSON.parse(spots) as Blot[]);
    return wipeIn(art.current, { from: before.current ?? undefined, blots: list, color, seed, duration, delay });
  }, [src, from, spots, color, seed, duration, delay]);

  return (
    <div className={className} style={{ position: "relative", ...style }}>
      {from !== undefined && (
        <img ref={before} src={from} width={width} height={height} alt="" aria-hidden="true" decoding="async" style={{ ...FILL, position: "absolute", inset: 0 }} />
      )}
      <img ref={art} src={src} width={width} height={height} alt={alt} decoding="async" style={FILL} />
    </div>
  );
}
