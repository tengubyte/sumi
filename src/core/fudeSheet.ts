import type { Stamp } from "./fudeBrush.js";
import { SHOW_FRAGMENT, STAMP_FRAGMENT, STAMP_VERTEX } from "./fudeGlsl.js";
import { COVER_VERTEX, fitCanvas, linkProgram } from "./webgl.js";

const CORNERS = [[-1, -1], [1, -1], [1, 1], [-1, -1], [1, 1], [-1, 1]] as const;
const FLOATS = 9;
const ATTRIBUTES = [["corner", 2, 0], ["center", 2, 2], ["dir", 2, 4], ["shape", 3, 6]] as const;

/**
 * The paper the ink gathers on: a texture the size of the canvas that footprints are drawn into, and the
 * pass that shows it. A new canvas size wipes it.
 */
export class InkSheet {
  /** Device px per CSS px. */
  pixel = 1;
  private texture: WebGLTexture | null = null;
  private readonly fbo: WebGLFramebuffer | null;
  private readonly stampBuffer: WebGLBuffer | null;
  private readonly coverBuffer: WebGLBuffer | null;
  private readonly max: EXT_blend_minmax | null;

  private constructor(
    private readonly gl: WebGLRenderingContext,
    private readonly canvas: HTMLCanvasElement,
    private readonly stampProgram: WebGLProgram,
    private readonly showProgram: WebGLProgram,
  ) {
    this.fbo = gl.createFramebuffer();
    this.stampBuffer = gl.createBuffer();
    this.coverBuffer = gl.createBuffer();
    this.max = gl.getExtension("EXT_blend_minmax");
    gl.bindBuffer(gl.ARRAY_BUFFER, this.coverBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  }

  /** Returns null when WebGL or the shaders are unavailable. */
  static open(canvas: HTMLCanvasElement, ink: readonly [number, number, number], seed: number): InkSheet | null {
    const gl = canvas.getContext("webgl", { alpha: true, premultipliedAlpha: true, antialias: false, depth: false });
    if (!gl) return null;
    const stamp = linkProgram(gl, STAMP_VERTEX, STAMP_FRAGMENT);
    const show = linkProgram(gl, COVER_VERTEX, SHOW_FRAGMENT);
    if (!stamp || !show) return null;
    const sheet = new InkSheet(gl, canvas, stamp, show);
    gl.useProgram(stamp);
    gl.uniform1f(gl.getUniformLocation(stamp, "seed"), seed);
    gl.useProgram(show);
    gl.uniform3f(gl.getUniformLocation(show, "ink"), ...ink);
    gl.uniform1i(gl.getUniformLocation(show, "paper"), 0);
    sheet.fit();
    return sheet;
  }

  /** Matches the canvas to its CSS size. Returns true when it changed, which wipes the paper. */
  fit(): boolean {
    const { gl, canvas } = this;
    if (!fitCanvas(gl, canvas) && this.texture) return false;
    this.pixel = canvas.width / Math.max(canvas.clientWidth, 1);
    if (this.texture) gl.deleteTexture(this.texture);
    this.texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, canvas.width, canvas.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    for (const name of [gl.TEXTURE_MIN_FILTER, gl.TEXTURE_MAG_FILTER]) gl.texParameteri(gl.TEXTURE_2D, name, gl.LINEAR);
    for (const name of [gl.TEXTURE_WRAP_S, gl.TEXTURE_WRAP_T]) gl.texParameteri(gl.TEXTURE_2D, name, gl.CLAMP_TO_EDGE);
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.texture, 0);
    this.wipe();
    for (const program of [this.stampProgram, this.showProgram]) {
      gl.useProgram(program);
      gl.uniform2f(gl.getUniformLocation(program, "size"), canvas.width, canvas.height);
      gl.uniform1f(gl.getUniformLocation(program, "pixel"), this.pixel);
    }
    return true;
  }

  wipe(): void {
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.fbo);
    this.gl.clearColor(0, 0, 0, 0);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);
  }

  /** Draws footprints into the paper. Overlapping ones keep the darker ink rather than adding up. */
  lay(stamps: readonly Stamp[], bristles: number): void {
    if (stamps.length === 0) return;
    const { gl } = this;
    const data = new Float32Array(stamps.length * CORNERS.length * FLOATS);
    stamps.forEach(([x, y, dx, dy, r, load, tone], i) => {
      CORNERS.forEach(([cx, cy], k) => {
        data.set([cx, cy, x, y, dx, dy, r, load, tone], (i * CORNERS.length + k) * FLOATS);
      });
    });
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.useProgram(this.stampProgram);
    gl.uniform1f(gl.getUniformLocation(this.stampProgram, "bristles"), bristles);
    gl.enable(gl.BLEND);
    if (this.max) gl.blendEquation(this.max.MAX_EXT);
    gl.blendFunc(gl.ONE, this.max ? gl.ONE : gl.ONE_MINUS_SRC_ALPHA);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.stampBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.DYNAMIC_DRAW);
    const locations = ATTRIBUTES.map(([name, n, offset]) => {
      const loc = gl.getAttribLocation(this.stampProgram, name);
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, n, gl.FLOAT, false, FLOATS * 4, offset * 4);
      return loc;
    });
    gl.drawArrays(gl.TRIANGLES, 0, data.length / FLOATS);
    for (const loc of locations) gl.disableVertexAttribArray(loc);
    gl.disable(gl.BLEND);
    gl.blendEquation(gl.FUNC_ADD);
  }

  /** Shows the paper on the canvas at `alpha`. */
  show(alpha: number): void {
    const { gl } = this;
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.useProgram(this.showProgram);
    gl.uniform1f(gl.getUniformLocation(this.showProgram, "alpha"), alpha);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.coverBuffer);
    const loc = gl.getAttribLocation(this.showProgram, "corner");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.disableVertexAttribArray(loc);
  }

  release(): void {
    this.gl.getExtension("WEBGL_lose_context")?.loseContext();
  }
}
