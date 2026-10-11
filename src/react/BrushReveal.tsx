"use client";

import { useEffect, useRef, type CSSProperties, type JSX } from "react";
import { paintIn, type PaintOptions } from "../core/paintIn.js";

export interface BrushRevealProps extends PaintOptions {
  /** Brush art on a transparent background. */
  readonly src: string;
  /** The art's own size in px, so the page reserves its space before it loads. */
  readonly width: number;
  readonly height: number;
  /** Empty by default: brush art is usually decoration. */
  readonly alt?: string | undefined;
  /** Sizes the wrapper. Width alone keeps the art's shape; width and height stretch it to fill. */
  readonly className?: string | undefined;
  readonly style?: CSSProperties | undefined;
}

const FILL: CSSProperties = { display: "block", width: "100%", height: "100%" };

/**
 * Brush art that paints itself in once, the way the stroke was laid, when it scrolls into view. The
 * finished art is a plain image, so it shows without JavaScript, without WebGL and with reduced motion.
 */
export function BrushReveal(props: BrushRevealProps): JSX.Element {
  const { src, width, height, alt = "", className, style, sweep, startAngle, duration, delay, ease } = props;
  const art = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (!art.current) return;
    return paintIn(art.current, { sweep, startAngle, duration, delay, ease });
  }, [src, sweep, startAngle, duration, delay, ease]);

  return (
    <div className={className} style={{ position: "relative", ...style }}>
      <img ref={art} src={src} width={width} height={height} alt={alt} decoding="async" style={FILL} />
    </div>
  );
}
