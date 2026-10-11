"use client";

import { useEffect, useRef, type CSSProperties, type JSX, type ReactNode } from "react";
import { paintMark, type MarkOptions, type MarkType } from "../core/mark.js";

export interface BrushMarkProps extends MarkOptions {
  /** Default "underline". */
  readonly type?: MarkType | undefined;
  /** The words to mark. They stay on one line. */
  readonly children: ReactNode;
  readonly className?: string | undefined;
  readonly style?: CSSProperties | undefined;
}

// Positioned for the overlay, a stacking context so a highlight sits behind the text, one line to measure.
const WRAP: CSSProperties = { position: "relative", zIndex: 0, whiteSpace: "nowrap" };

/** Paints a brush mark round its words once, when they scroll into view. The mark is decoration. */
export function BrushMark(props: BrushMarkProps): JSX.Element {
  const { type = "underline", children, className, style, seed, color, speed, delay } = props;
  const wrap = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!wrap.current) return;
    return paintMark(wrap.current, type, { seed, color, speed, delay });
  }, [type, seed, color, speed, delay]);

  return (
    <span ref={wrap} className={className} style={{ ...WRAP, ...style }}>
      {children}
    </span>
  );
}
