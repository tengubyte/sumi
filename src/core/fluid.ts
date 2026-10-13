import { ADVECT, CURL, DIVERGENCE, FLUID_VERTEX, FORCE, JACOBI, PROJECT, SHOW, SPLAT } from "./fluidGlsl.js";
import { linkProgram } from "./webgl.js";

interface Target {
  readonly texture: WebGLTexture;
  readonly buffer: WebGLFramebuffer;
  readonly width: number;
  readonly height: number;
}

/** A field read from one texture while the next state is written to the other. */
class Pair {
  constructor(
    public read: Target,
    public write: Target,
  ) {}

  swap(): void {
    [this.read, this.write] = [this.write, this.read];
  }
}

interface Fields {
  readonly ink: Pair;
  readonly velocity: Pair;
  readonly pressure: Pair;
  readonly divergence: Target;
  readonly curl: Target;
}

type Uniform = number | Float32Array | Target;
type Program = readonly [WebGLProgram, (name: string) => WebGLUniformLocation | null];

const PASSES = { advect: ADVECT, curl: CURL, force: FORCE, divergence: DIVERGENCE, jacobi: JACOBI, project: PROJECT, splat: SPLAT, show: SHOW } as const;
type Pass = keyof typeof PASSES;

/** How the water behaves on each step. */
export interface Flow {
  readonly curl: number;
  readonly sink: number;
  readonly velocityDecay: number;
  readonly inkDecay: number;
}

// Velocity changes slowly across the canvas, so it lives on a coarse grid; the ink keeps fine filaments.
const VELOCITY_ROWS = 160;
const INK_ROWS = 640;
const PRESSURE_STEPS = 24;

function target(gl: WebGLRenderingContext, type: number, width: number, height: number): Target | null {
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, type, null);
  const buffer = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, buffer);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
  const complete = gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE;
  if (complete) {
    gl.viewport(0, 0, width, height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
  }
  // Back to the canvas, so a fallback painter draws to the page and not into a half-made target.
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  return complete ? { texture, buffer, width, height } : null;
}

function program(gl: WebGLRenderingContext, fragment: string): Program | null {
  const linked = linkProgram(gl, FLUID_VERTEX, fragment);
  if (!linked) return null;
  const found = new Map<string, WebGLUniformLocation | null>();
  const at = (name: string): WebGLUniformLocation | null => {
    if (!found.has(name)) found.set(name, gl.getUniformLocation(linked, name));
    return found.get(name) ?? null;
  };
  return [linked, at];
}

/** Ink in water on half-float textures. Velocity is in canvas heights per second, y up. */
export class Fluid {
  private constructor(
    private readonly gl: WebGLRenderingContext,
    private readonly programs: Readonly<Record<Pass, Program>>,
    private readonly fields: Fields,
    private readonly aspect: number,
  ) {
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  }

  /** Null when the device cannot render to and filter half-float textures, or the shaders fail. */
  static open(gl: WebGLRenderingContext, aspect: number): Fluid | null {
    const half = gl.getExtension("OES_texture_half_float");
    // Without linear filtering of half floats the back-trace turns blocky.
    if (!half || !gl.getExtension("OES_texture_half_float_linear")) return null;
    gl.getExtension("EXT_color_buffer_half_float");
    const programs: Partial<Record<Pass, Program>> = {};
    for (const [pass, source] of Object.entries(PASSES) as [Pass, string][]) {
      const made = program(gl, source);
      if (!made) return null;
      programs[pass] = made;
    }
    const make = (rows: number): Target | null => target(gl, half.HALF_FLOAT_OES, Math.max(1, Math.round(rows * aspect)), rows);
    const [a, b] = [make(INK_ROWS), make(INK_ROWS)];
    const [c, d, e, f, g, h] = Array.from({ length: 6 }, () => make(VELOCITY_ROWS));
    if (!a || !b || !c || !d || !e || !f || !g || !h) return null;
    const fields = { ink: new Pair(a, b), velocity: new Pair(c, d), pressure: new Pair(e, f), divergence: g, curl: h };
    return new Fluid(gl, programs as Record<Pass, Program>, fields, aspect);
  }

  /** A soft blob at `at` (shares of the canvas, y up), `radius` in canvas heights. */
  splat(field: "ink" | "velocity", at: Float32Array, radius: number, add: Float32Array, rough = 0, seed = 0): void {
    const pair = this.fields[field];
    this.run("splat", pair.write, { src: pair.read, at, aspect: this.aspect, radius, rough, seed, add });
    pair.swap();
  }

  step(dt: number, flow: Flow): void {
    const { velocity, pressure, ink, divergence, curl } = this.fields;
    const { aspect } = this;
    const h = 1 / VELOCITY_ROWS;
    this.run("curl", curl, { vel: velocity.read, h });
    this.run("force", velocity.write, { vel: velocity.read, curl, ink: ink.read, dt, h, eps: flow.curl, sink: flow.sink });
    velocity.swap();
    this.run("divergence", divergence, { vel: velocity.read, h });
    for (let i = 0; i < PRESSURE_STEPS; i++) {
      this.run("jacobi", pressure.write, { p: pressure.read, div: divergence, h });
      pressure.swap();
    }
    this.run("project", velocity.write, { p: pressure.read, vel: velocity.read, h });
    velocity.swap();
    this.run("advect", velocity.write, { vel: velocity.read, src: velocity.read, dt, decay: flow.velocityDecay, aspect });
    velocity.swap();
    this.run("advect", ink.write, { vel: velocity.read, src: ink.read, dt, decay: flow.inkDecay, aspect });
    ink.swap();
  }

  /** Draws the ink to the canvas as premultiplied colour. */
  show(strength: number): void {
    this.run("show", null, { ink: this.fields.ink.read, strength, aspect: this.aspect });
  }

  private run(pass: Pass, out: Target | null, uniforms: Readonly<Record<string, Uniform>>): void {
    const { gl } = this;
    const [linked, at] = this.programs[pass];
    gl.useProgram(linked);
    const corner = gl.getAttribLocation(linked, "corner");
    gl.enableVertexAttribArray(corner);
    gl.vertexAttribPointer(corner, 2, gl.FLOAT, false, 0, 0);
    let unit = 0;
    for (const [name, value] of Object.entries(uniforms)) {
      if (typeof value === "number") gl.uniform1f(at(name), value);
      else if (!(value instanceof Float32Array)) {
        gl.activeTexture(gl.TEXTURE0 + unit);
        gl.bindTexture(gl.TEXTURE_2D, value.texture);
        gl.uniform1i(at(name), unit++);
      } else if (value.length === 2) gl.uniform2fv(at(name), value);
      else gl.uniform4fv(at(name), value);
    }
    const width = out ? out.width : gl.drawingBufferWidth;
    const height = out ? out.height : gl.drawingBufferHeight;
    gl.uniform2f(at("texel"), 1 / width, 1 / height);
    gl.bindFramebuffer(gl.FRAMEBUFFER, out ? out.buffer : null);
    gl.viewport(0, 0, width, height);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }
}
