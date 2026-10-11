/** What a drop puts on the water: nothing (clear water that pushes ink aside), ink, pale ink, or the accent. */
export type MarbleInk = "clear" | "ink" | "pale" | "accent";

interface Timed {
  /** Seconds from the start of the run when it begins. */
  readonly at: number;
  /** Seconds it takes. */
  readonly span: number;
}

/**
 * One step of a suminagashi, in tray heights (the tray is 1 high), y down, angles in radians. A drop lands
 * and pushes out what is already there; a ring system is `n` drops landing in turn on one spot, ink and
 * clear water alternately, with drop `accent` (counted from the first) in the accent colour. A tine is
 * pulled through the water, a wave shears it sideways, and a vortex turns it.
 */
export type MarbleOp = Timed &
  (
    | { readonly kind: "drop"; readonly x: number; readonly y: number; readonly r: number; readonly ink: MarbleInk }
    | { readonly kind: "rings"; readonly x: number; readonly y: number; readonly r: number; readonly n: number; readonly accent?: number | undefined }
    | { readonly kind: "tine"; readonly x: number; readonly y: number; readonly angle: number; readonly shift: number; readonly sharp: number }
    | { readonly kind: "wave"; readonly angle: number; readonly amp: number; readonly length: number; readonly phase?: number | undefined }
    | { readonly kind: "vortex"; readonly x: number; readonly y: number; readonly turn: number; readonly sharp: number }
  );

const INK_INDEX: Readonly<Record<MarbleInk, number>> = { clear: 0, ink: 1, pale: 2, accent: 3 };

const easeOut = (t: number): number => 1 - (1 - t) ** 3;
const easeInOut = (t: number): number => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

function rows(op: MarbleOp, t: number): [number[], number[]] {
  switch (op.kind) {
    case "drop":
      return [[0, op.x, op.y, op.r * easeOut(t)], [INK_INDEX[op.ink], 0, 0, 0]];
    case "tine":
      return [[1, op.x, op.y, op.angle], [op.shift * easeInOut(t), op.sharp, 0, 0]];
    case "wave":
      return [[2, op.angle, op.amp * easeInOut(t), op.length], [op.phase ?? 0, 0, 0, 0]];
    case "vortex":
      return [[3, op.x, op.y, op.turn * easeInOut(t)], [op.sharp, 0, 0, 0]];
    case "rings":
      return [[4, op.x, op.y, op.r], [op.n * t, op.accent ?? -9, 0, 0]];
  }
}

/** The shader's uniforms `seconds` into the run: the first `max` operations that have begun, newest first. */
export function marbleRows(ops: readonly MarbleOp[], seconds: number, max: number): { count: number; a: Float32Array; b: Float32Array } {
  const live = ops.filter((op) => seconds >= op.at).slice(0, max).reverse();
  const a = new Float32Array(max * 4);
  const b = new Float32Array(max * 4);
  live.forEach((op, i) => {
    const [rowA, rowB] = rows(op, op.span > 0 ? Math.min((seconds - op.at) / op.span, 1) : 1);
    a.set(rowA, i * 4);
    b.set(rowB, i * 4);
  });
  return { count: live.length, a, b };
}

/** Seconds until the last operation settles. */
export const marbleSeconds = (ops: readonly MarbleOp[]): number => ops.reduce((end, op) => Math.max(end, op.at + op.span), 0);

export const MARBLE_PATTERNS = ["rings", "flow", "comb"] as const;
export type MarblePattern = (typeof MARBLE_PATTERNS)[number];

/** A preset laid out for a tray `aspect` times as wide as it is high. */
export function marblePattern(pattern: MarblePattern, aspect: number): MarbleOp[] {
  const cx = aspect / 2;
  if (pattern === "rings") {
    // One spot, 36 drops in turn with one in the accent, then two crossing waves make the rings wander.
    return [
      { kind: "rings", x: cx, y: 0.5, r: 0.055, n: 36, accent: 20, at: 0, span: 3.2 },
      { kind: "wave", angle: 0.4, amp: 0.035, length: 0.32, phase: 0.5, at: 3.3, span: 2 },
      { kind: "wave", angle: 2.1, amp: 0.03, length: 0.27, phase: 1.7, at: 3.6, span: 2 },
    ];
  }
  if (pattern === "comb") {
    // Three spots in a row, then a comb drawn up and down through them, alternating direction.
    const spots = [0.22, 0.5, 0.78].map((f, k): MarbleOp => ({ kind: "rings", x: aspect * f, y: 0.5, r: 0.045, n: 22, at: k * 0.25, span: 2.6 }));
    const tines = [0.15, 0.32, 0.5, 0.68, 0.85].map(
      (f, k): MarbleOp => ({ kind: "tine", x: aspect * f, y: 0, angle: Math.PI / 2, shift: k % 2 ? -0.13 : 0.13, sharp: 0.03, at: 3 + k * 0.18, span: 1.4 }),
    );
    return [...spots, ...tines];
  }
  // Three spots that crowd each other, then two waves and a slow turn: the whole sheet flows.
  return [
    { kind: "rings", x: aspect * 0.3, y: 0.4, r: 0.05, n: 40, accent: 18, at: 0, span: 3 },
    { kind: "rings", x: aspect * 0.72, y: 0.36, r: 0.048, n: 36, at: 0.3, span: 2.8 },
    { kind: "rings", x: aspect * 0.5, y: 0.7, r: 0.05, n: 38, at: 0.6, span: 2.8 },
    { kind: "wave", angle: 0.2, amp: 0.07, length: 0.75, phase: 0.3, at: 3.2, span: 2 },
    { kind: "wave", angle: 1.75, amp: 0.05, length: 0.5, phase: 1.1, at: 3.5, span: 2 },
    { kind: "vortex", x: cx, y: 0.52, turn: 1.5, sharp: 0.3, at: 3.8, span: 2.2 },
  ];
}
