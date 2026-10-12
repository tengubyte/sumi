type Point = readonly [number, number];

/** A stroke for `trace`: points as shares of the canvas (y down), and the hand's pace and pressure along it. */
export interface FudeStroke {
  readonly points: readonly (readonly [x: number, y: number])[];
  /** Milliseconds the stroke takes. Default 900. */
  readonly ms?: number | undefined;
  /** The hand's relative speed at each share of the stroke drawn. Default even. */
  readonly pace?: ((share: number) => number) | undefined;
  /** Pressure from 0 to 1 at each share of the stroke drawn. Default 0.5. */
  readonly pressure?: ((share: number) => number) | undefined;
}

/** What moves the brush: positions in device px, times in ms. */
export interface Hand {
  down(x: number, y: number, t: number, pressure: number): void;
  move(x: number, y: number, t: number, pressure: number): void;
  up(x: number, y: number, t: number, pressure: number): void;
}

/** Plays `stroke` through `hand` on a `width` by `height` canvas at a hand's pace. `instant` lands it at once. */
export async function traceStroke(stroke: FudeStroke, width: number, height: number, hand: Hand, instant: boolean): Promise<void> {
  const P = stroke.points.map(([x, y]): Point => [x * width, y * height]);
  const first = P[0];
  if (!first) return;
  const pace = stroke.pace ?? ((): number => 1);
  const pressure = stroke.pressure ?? ((): number => 0.5);
  const lengths = P.slice(1).map(([x, y], i) => {
    const [px, py] = P[i] ?? first;
    return Math.hypot(x - px, y - py);
  });
  const total = lengths.reduce((a, b) => a + b, 0) || 1;
  let done = 0;
  const gaps = lengths.map((l) => {
    done += l;
    return l / Math.max(pace(done / total), 0.05);
  });
  const scale = (stroke.ms ?? 900) / (gaps.reduce((a, b) => a + b, 0) || 1);
  let t = performance.now();
  done = 0;
  hand.down(first[0], first[1], t, pressure(0));
  for (const [i, [x, y]] of P.slice(1).entries()) {
    t += (gaps[i] ?? 0) * scale;
    done += lengths[i] ?? 0;
    if (!instant) await new Promise((resolve) => setTimeout(resolve, Math.max(t - performance.now(), 0)));
    hand.move(x, y, t, pressure(done / total));
  }
  const [lx, ly] = P[P.length - 1] ?? first;
  hand.up(lx, ly, t + 8, pressure(1));
}

/** An ensō traced clockwise from the upper left as a hand does: a slow press, quickening, a dry flick. */
export function ensoStroke(aspect = 4 / 3, radius = 0.32): FudeStroke {
  const points = Array.from({ length: 121 }, (_, i): readonly [number, number] => {
    const a = Math.PI * 0.8 - (i / 120) * Math.PI * 1.85;
    const wobble = 1 + 0.035 * Math.sin(i * 0.17) + 0.02 * Math.sin(i * 0.05);
    return [0.5 + (Math.cos(a) * radius * wobble) / aspect, 0.52 - Math.sin(a) * radius * wobble];
  });
  return { points, ms: 950, pace: (u) => 0.35 + 1.35 * Math.min(u * 1.6, 1) + 0.6 * u * u, pressure: (u) => 0.9 - 0.6 * u };
}
