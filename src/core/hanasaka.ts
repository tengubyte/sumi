import { bloomFragment, type BloomRoom } from "./hanasakaGlsl.js";
import { playCanvas, type CanvasPainter } from "./play.js";
import { random } from "./random.js";
import { rgb, type Hex } from "./splatShader.js";
import { coverProgram, drawCover, fitCanvas } from "./webgl.js";

export interface BloomOptions {
  /** Where the branch comes in, as shares of the canvas (y down). Default `[-0.04, 0.8]`, just past the left edge, low. */
  readonly from?: readonly [x: number, y: number] | undefined;
  /** The way it grows, in degrees: 0 right, positive up. Default 26. */
  readonly angle?: number | undefined;
  /** 1.3 grows it 30% longer. Default 1. */
  readonly reach?: number | undefined;
  /** Blossoms, at most 28. Default 22. */
  readonly flowers?: number | undefined;
  /** Petals that let go and drift off, at most 16. Default 10. */
  readonly petals?: number | undefined;
  /** The wind the petals ride, in shorter sides per second (y down). Default `[0.06, 0.02]`. */
  readonly wind?: readonly [x: number, y: number] | undefined;
  /** Default `#291f1c`. */
  readonly bark?: Hex | undefined;
  /** The blossoms' ink outlines. Default `#3b1f26`. */
  readonly outline?: Hex | undefined;
  /** The petals. Default `#f7bfd1`. */
  readonly pink?: Hex | undefined;
  /** The deep pink at each blossom's heart. Default `#db6185`. */
  readonly heart?: Hex | undefined;
  /** Changes the branch and every blossom. Default 1. */
  readonly seed?: number | undefined;
  /** Seconds. Default 5. */
  readonly duration?: number | undefined;
  /** Seconds to wait after the canvas scrolls into view. Default 0. */
  readonly delay?: number | undefined;
}

/** A tapered stroke: from (ax, ay) to (bx, by), radii ra and rb, grown over the share of the run t0 to t1. */
export type Segment = [ax: number, ay: number, bx: number, by: number, ra: number, rb: number, t0: number, t1: number];
/** A blossom: where, how big, turned how far, when it opens, whether it stays a bud, and a tint from 0 to 1. */
export type Blossom = [x: number, y: number, size: number, turn: number, opens: number, bud: number, tint: number];

const FULL: BloomRoom = { segs: 24, flowers: 28, petals: 16 };

/**
 * Grows a branch from `from` (shares of the canvas, y down) heading `angle` radians on a canvas `aspect`
 * times as wide as high. Lengths are in units of its shorter side, from its middle, y up; times are
 * shares of the run. The branch takes the first 45% of the run and the last blossom opens by 82%.
 */
export function growBranch(seed: number, aspect: number, from: readonly [number, number], angle: number, reach: number, flowers: number, room: BloomRoom = FULL): { segs: Segment[]; blooms: Blossom[] } {
  const rand = random(seed);
  const [w, h] = aspect >= 1 ? [aspect, 1] : [1, 1 / aspect];
  const segs: Segment[] = [];
  const nodes: { x: number; y: number; t: number; depth: number; tip: boolean }[] = [];
  const walk = (x: number, y: number, heading: number, r0: number, len: number, count: number, t: number, depth: number): void => {
    let [cx, cy, ca, ct] = [x, y, heading, t];
    for (let k = 0; k < count && segs.length < room.segs; k++) {
      // Trunks lean up a little as they go, twigs droop.
      ca += (rand() - 0.5) * 0.55 + (depth === 0 ? 0.04 : -0.05);
      const l = len * (0.8 + rand() * 0.45) * reach;
      const [nx, ny] = [cx + Math.cos(ca) * l, cy + Math.sin(ca) * l];
      const rb = r0 * (1 - ((k + 1) / count) * 0.7);
      const t1 = ct + l / 2.4;
      segs.push([cx, cy, nx, ny, r0 * (1 - (k / count) * 0.7), rb, ct, t1]);
      nodes.push({ x: nx, y: ny, t: t1, depth, tip: k === count - 1 });
      if (depth < 2 && k < count - 1 && rand() < (depth === 0 ? 0.7 : 0.45)) {
        const side = rand() < 0.5 ? -1 : 1;
        walk(nx, ny, ca + side * (0.55 + rand() * 0.45), rb * 0.7, len * 0.75, depth === 0 ? 3 + Math.floor(rand() * 2) : 1 + Math.floor(rand() * 2), t1, depth + 1);
      }
      [cx, cy, ct] = [nx, ny, t1];
    }
  };
  walk((from[0] - 0.5) * w, (0.5 - from[1]) * h, angle, 0.03, 0.16, 7, 0, 0);
  // Blossoms cluster at the tips and along the finer twigs.
  const spots = nodes.filter((nd) => nd.tip || nd.depth > 0 || rand() < 0.25);
  const blooms: Blossom[] = [];
  const most = Math.min(Math.max(Math.round(flowers), 0), room.flowers);
  for (let i = 0; spots.length > 0 && blooms.length < most && i < 200; i++) {
    const nd = spots[Math.floor(rand() * spots.length)] ?? spots[0];
    if (!nd) break;
    const off = 0.012 + rand() * 0.03;
    const turn = rand() * Math.PI * 2;
    const bud = rand() < 0.22 ? 1 : 0;
    blooms.push([nd.x + Math.cos(turn) * off, nd.y + Math.sin(turn) * off, bud ? 0.016 + rand() * 0.008 : 0.032 + rand() * 0.026, rand() * 6.28, nd.t + 0.03 + rand() * 0.22, bud, rand()]);
  }
  const end = Math.max(...segs.map((s) => s[7]), 0.001);
  const k = 0.45 / end;
  for (const s of segs) [s[6], s[7]] = [s[6] * k, s[7] * k];
  for (const b of blooms) b[4] = Math.min(b[4] * k, 0.82 - rand() * 0.06);
  blooms.sort((a, b) => a[4] - b[4]);
  return { segs, blooms };
}

/** How many segments, blossoms and petals the device's fragment uniforms have room for. */
function roomFor(gl: WebGLRenderingContext): BloomRoom {
  const budget = Number(gl.getParameter(gl.MAX_FRAGMENT_UNIFORM_VECTORS)) - 12;
  const share = Math.min(budget / (2 * (FULL.segs + FULL.flowers + FULL.petals)), 1);
  return { segs: Math.max(Math.floor(FULL.segs * share), 4), flowers: Math.max(Math.floor(FULL.flowers * share), 4), petals: Math.max(Math.floor(FULL.petals * share), 2) };
}

const pack = <T extends readonly number[]>(rows: readonly T[], slots: number, pick: (row: T) => readonly number[]): Float32Array => {
  const out = new Float32Array(slots * 4);
  rows.slice(0, slots).forEach((row, i) => {
    out.set(pick(row), i * 4);
  });
  return out;
};

/** Returns null when WebGL or the shader is unavailable. */
export function bloomPainter(canvas: HTMLCanvasElement, options: BloomOptions = {}): CanvasPainter | null {
  const gl = canvas.getContext("webgl", { alpha: true, premultipliedAlpha: true, antialias: false, depth: false });
  if (!gl) return null;
  const room = roomFor(gl);
  const at = coverProgram(gl, bloomFragment(room));
  if (!at) return null;
  const duration = Math.max(options.duration ?? 5, 0.5);
  const seed = options.seed ?? 1;
  const [wx, wy] = options.wind ?? [0.06, 0.02];
  gl.uniform1f(at("bloom"), 0.65 / duration);
  gl.uniform1f(at("seconds"), duration);
  gl.uniform1f(at("seed"), random(seed)() * 50);
  gl.uniform2f(at("wind"), wx, -wy);
  gl.uniform3fv(at("bark"), rgb(options.bark ?? "#291f1c"));
  gl.uniform3fv(at("outline"), rgb(options.outline ?? "#3b1f26"));
  gl.uniform3fv(at("pink"), rgb(options.pink ?? "#f7bfd1"));
  gl.uniform3fv(at("deep"), rgb(options.heart ?? "#db6185"));
  const uSize = at("size");
  const uTime = at("time");
  // The branch is laid out for the canvas's shape, so it grows again for a new one.
  const grow = (): void => {
    const aspect = canvas.width / Math.max(canvas.height, 1);
    const { segs, blooms } = growBranch(seed, aspect, options.from ?? [-0.04, 0.8], ((options.angle ?? 26) * Math.PI) / 180, options.reach ?? 1, options.flowers ?? 22, room);
    const rand = random(seed + 0.5);
    const open = blooms.filter((b) => b[5] === 0);
    const count = Math.min(Math.max(Math.round(options.petals ?? 10), 0), room.petals);
    const lets = open.length === 0 ? [] : Array.from({ length: count }, () => open[Math.floor(rand() * open.length)] ?? open[0]).filter((b): b is Blossom => b !== undefined);
    gl.uniform4fv(at("segA"), pack(segs, room.segs, (s) => s.slice(0, 4)));
    gl.uniform4fv(at("segB"), pack(segs, room.segs, (s) => s.slice(4, 8)));
    gl.uniform4fv(at("flowA"), pack(blooms, room.flowers, (b) => b.slice(0, 4)));
    gl.uniform4fv(at("flowB"), pack(blooms, room.flowers, (b) => [b[4], b[5], b[6], 0]));
    gl.uniform4fv(at("petA"), pack(lets, room.petals, (b) => [b[0] + (rand() - 0.5) * 0.02, b[1] + (rand() - 0.5) * 0.02, 0.02 + rand() * 0.06, -0.01 - rand() * 0.05]));
    gl.uniform4fv(at("petB"), pack(lets, room.petals, (b) => [Math.min(b[4] + 0.12 + rand() * 0.2, 0.9), (rand() - 0.5) * 3, b[2] * 0.6, rand() * 6.28]));
    gl.uniform3f(at("counts"), segs.length, blooms.length, lets.length);
    gl.uniform2f(uSize, canvas.width, canvas.height);
    gl.uniform1f(at("pixel"), 1 / Math.max(Math.min(canvas.width, canvas.height), 1));
  };
  let grown = false;
  return {
    duration,
    draw(seconds) {
      if (fitCanvas(gl, canvas) || !grown) {
        grow();
        grown = true;
      }
      gl.uniform1f(uTime, seconds / duration);
      drawCover(gl);
    },
    dispose() {
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    },
  };
}

/**
 * Brushes a cherry branch onto `canvas` once it scrolls into view, opens blossoms along it and lets a few
 * petals go on the wind. Size the canvas with CSS. The last frame stays, and a resize grows the branch
 * again for the new shape. Reduced motion shows the branch in bloom; no WebGL draws nothing. Returns the cleanup.
 */
export function bloomBranch(canvas: HTMLCanvasElement, options: BloomOptions = {}): () => void {
  return playCanvas(canvas, () => bloomPainter(canvas, options), options.delay ?? 0);
}
