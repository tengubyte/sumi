import { BRUSH_FRAGMENT, BRUSH_VERTEX } from "./brushGlsl.js";
import { DRY_GROW, headAt } from "./brushProfile.js";
import type { CanvasPainter } from "./play.js";
import { buildRibbon, RIBBON_FLOATS, type RibbonStroke } from "./ribbon.js";
import { rgb, type Hex } from "./splatShader.js";
import type { StrokeArt } from "./strokes.js";
import { fitCanvas, linkProgram } from "./webgl.js";

export interface BrushOptions {
  /** Brush radius as a share of the art's width. Default 0.034. */
  readonly weight?: number | undefined;
  /** 2 paints twice as fast. Default 1. */
  readonly speed?: number | undefined;
  /** The ink. Default `#161314` (sumi). */
  readonly color?: Hex | undefined;
  /** Ink that bleeds into the paper past the edges, 0 to 0.3. Default 0.07. */
  readonly bleed?: number | undefined;
  /** How much thinner horizontals are than verticals, 0 to 1. Default 0.8. */
  readonly contrast?: number | undefined;
  /** Bristle lines across the brush. Default 22. */
  readonly bristles?: number | undefined;
}

export interface StrokeTime {
  readonly start: number;
  readonly duration: number;
}

/**
 * When each stroke starts and how long it takes, in seconds: by its length against the art's
 * `diagonal`, with a lift between strokes that grows with the distance the brush moves in the air.
 */
export function strokeTimeline(strokes: readonly RibbonStroke[], diagonal: number, speed: number): { times: StrokeTime[]; duration: number } {
  let clock = 0.15;
  const times = strokes.map((stroke, k): StrokeTime => {
    const prev = strokes[k - 1];
    if (prev) clock += (0.06 + (0.15 * Math.hypot(stroke.start[0] - prev.finish[0], stroke.start[1] - prev.finish[1])) / diagonal) / speed;
    const time = { start: clock, duration: (0.14 + (0.9 * stroke.shape.length) / diagonal) / speed };
    clock += time.duration;
    return time;
  });
  return { times, duration: clock + 0.2 };
}

/** The art's box grown to the canvas's shape, so the art sits centred in it without stretching. */
export function fitView(box: StrokeArt["box"], width: number, height: number): [number, number, number, number] {
  const [x, y, w, h] = box;
  const aspect = width / height;
  if (w / h < aspect) return [x - (h * aspect - w) / 2, y, h * aspect, h];
  return [x, y - (w / aspect - h) / 2, w, w / aspect];
}

function bindRibbon(gl: WebGLRenderingContext, program: WebGLProgram, data: Float32Array): void {
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
  let offset = 0;
  for (const [name, size] of [["pos", 2], ["along", 1], ["across", 1], ["radius", 1], ["ends", 2]] as const) {
    const location = gl.getAttribLocation(program, name);
    gl.enableVertexAttribArray(location);
    gl.vertexAttribPointer(location, size, gl.FLOAT, false, RIBBON_FLOATS * 4, offset * 4);
    offset += size;
  }
}

const UNIFORMS = ["view", "front", "total", "base", "px", "seed", "dryness", "dryGrow", "bristles", "bleed", "ink"] as const;
type Uniforms = Record<(typeof UNIFORMS)[number], WebGLUniformLocation | null>;

function setUp(gl: WebGLRenderingContext, art: StrokeArt, options: BrushOptions): { strokes: readonly RibbonStroke[]; u: Uniforms; radius: number } | null {
  const program = linkProgram(gl, BRUSH_VERTEX, BRUSH_FRAGMENT);
  if (!program) return null;
  gl.useProgram(program);
  const radius = (options.weight ?? 0.034) * art.box[2];
  const ribbon = buildRibbon(art.strokes, radius, options.contrast ?? 0.8);
  bindRibbon(gl, program, ribbon.data);
  const u = Object.fromEntries(UNIFORMS.map((name) => [name, gl.getUniformLocation(program, name)])) as Uniforms;
  gl.uniform1f(u.base, radius);
  gl.uniform1f(u.bristles, options.bristles ?? 22);
  gl.uniform1f(u.bleed, Math.min(Math.max(options.bleed ?? 0.07, 0), 0.3));
  gl.uniform3fv(u.ink, rgb(options.color ?? "#161314"));
  gl.enable(gl.BLEND);
  // MAX keeps a stroke that folds over itself, or a turn where two pieces meet, from inking twice.
  const minmax = gl.getExtension("EXT_blend_minmax");
  if (minmax) gl.blendEquation(minmax.MAX_EXT);
  gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
  return { strokes: ribbon.strokes, u, radius };
}

/** Paints `art` stroke by stroke. Returns null when WebGL or the shader is unavailable. */
export function strokePainter(canvas: HTMLCanvasElement, art: StrokeArt, options: BrushOptions = {}): CanvasPainter | null {
  const gl = canvas.getContext("webgl", { alpha: true, premultipliedAlpha: true, antialias: false, depth: false });
  if (!gl) return null;
  const ready = setUp(gl, art, options);
  if (!ready) return null;
  const { strokes, u, radius } = ready;
  const { times, duration } = strokeTimeline(strokes, Math.hypot(art.box[2], art.box[3]), Math.max(options.speed ?? 1, 0.05));
  let sized = false;
  const drawStroke = (stroke: RibbonStroke, k: number, seconds: number): void => {
    const time = times[k];
    if (!time || seconds < time.start) return;
    const t = Math.min((seconds - time.start) / time.duration, 1);
    // The front leads the head's centre, so at t = 1 the end cap and the frayed edges are all in.
    gl.uniform1f(u.front, headAt(t, stroke.shape) + 1.6 * radius * Math.min(t / 0.08, 1));
    gl.uniform1f(u.total, stroke.shape.length);
    gl.uniform1f(u.seed, k * 1.618);
    // The brush is dipped every fourth stroke and carries less ink each stroke after.
    const load = 1 - 0.16 * (k % 4) - 0.08 * Math.abs(Math.sin(k * 12.9898));
    gl.uniform1f(u.dryness, stroke.dry?.[0] ?? 0.02 + (1 - load) * 0.2);
    gl.uniform1f(u.dryGrow, stroke.dry?.[1] ?? DRY_GROW[stroke.shape.end]);
    for (const piece of stroke.pieces) gl.drawArrays(gl.TRIANGLE_STRIP, piece.first, piece.count);
  };
  return {
    duration,
    draw(seconds) {
      if (fitCanvas(gl, canvas) || !sized) {
        sized = true;
        gl.viewport(0, 0, canvas.width, canvas.height);
        const view = fitView(art.box, canvas.width, canvas.height);
        gl.uniform4fv(u.view, view);
        gl.uniform1f(u.px, view[2] / canvas.width);
      }
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      strokes.forEach((stroke, k) => {
        drawStroke(stroke, k, seconds);
      });
    },
    dispose() {
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    },
  };
}
