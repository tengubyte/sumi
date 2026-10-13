import { Fluid, type Flow } from "./fluid.js";
import type { Drop, DropOptions } from "./inkDrop.js";
import type { CanvasPainter } from "./play.js";
import { random } from "./random.js";
import { rgb } from "./splatShader.js";
import { fitCanvas } from "./webgl.js";

// The simulation always steps a 60th of a second, so a run looks the same at any frame rate.
const STEP = 1 / 60;
// How dark the ink is where it is thick: 1 - exp(-STRENGTH * amount).
const STRENGTH = 4;

const vec = (...values: number[]): Float32Array => Float32Array.from(values);

/** Lets one drop into the water: a rough blob of ink, a push down, and small eddies below it. */
function land(fluid: Fluid, drop: Drop, ink: readonly number[], seed: number, swirl: number): void {
  const [x, top] = drop;
  const y = 1 - top;
  // Uneven ink is what the sinking pull works on: the thicker patches fall faster and become the fingers.
  fluid.splat("ink", vec(x, y), 0.035, vec(...ink.map((c) => c * 1.4), 1.4), 0.6, seed);
  fluid.splat("velocity", vec(x, y + 0.01), 0.03, vec(0, -0.12, 0, 0));
  const jitter = 0.01 * swirl;
  for (let k = 0; k < 6; k++) {
    const at = vec(x + Math.sin(seed * 13 + k * 7.1) * 0.12, y - 0.05 - 0.08 * k + Math.cos(seed * 5 + k * 3.3) * 0.08);
    fluid.splat("velocity", at, 0.02, vec(Math.sin(k * 2.1 + seed) * jitter, Math.cos(k * 1.7 + seed) * jitter, 0, 0));
  }
}

/**
 * The side view as a fluid: each drop sinks because ink is heavier than water, and the uneven pull
 * rolls it into a cap that breaks into curls and filaments. Returns null when the device cannot run it.
 */
export function fluidPainter(canvas: HTMLCanvasElement, gl: WebGLRenderingContext, drops: readonly Drop[], options: DropOptions, run: number): CanvasPainter | null {
  fitCanvas(gl, canvas);
  const aspect = Math.min(Math.max(canvas.clientWidth / Math.max(canvas.clientHeight, 1), 0.25), 4);
  const fluid = Fluid.open(gl, aspect);
  if (!fluid) return null;
  const seed = random(options.seed ?? 1)() * 50;
  const swirl = Math.min(Math.max(options.swirl ?? 0.6, 0), 2);
  const speed = Math.max(options.speed ?? 1, 0.05);
  const inks = drops.map(([, , , color]) => rgb(color ?? options.color ?? "#161314"));
  // A gentler pull keeps the last frame in mid water, with its curls apart, instead of piled on the floor.
  const flow: Flow = { curl: 10 * swirl, sink: 2, velocityDecay: 0.99, inkDecay: 0.9995 };
  let clock = 0;
  const landed = new Set<number>();
  // A frame never runs the water backwards: a resize or a late frame only shows or catches up.
  const advance = (until: number): void => {
    while (clock < until) {
      drops.forEach((drop, i) => {
        if (landed.has(i) || clock < (drop[2] ?? 0)) return;
        landed.add(i);
        land(fluid, drop, inks[i] ?? [0, 0, 0], seed + i * 1.7, swirl);
      });
      fluid.step(STEP, flow);
      clock += STEP;
    }
  };
  return {
    duration: run / speed,
    draw(seconds) {
      fitCanvas(gl, canvas);
      advance(Math.min(seconds * speed, run));
      fluid.show(STRENGTH);
    },
    dispose() {
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    },
  };
}
