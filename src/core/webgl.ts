function compile(gl: WebGLRenderingContext, type: number, source: string): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (gl.getShaderParameter(shader, gl.COMPILE_STATUS) === true) return shader;
  gl.deleteShader(shader);
  return null;
}

/**
 * Compiles and links a program. Returns null when the driver rejects it, so the caller can keep the
 * plain image. The shaders are released once linked; deleting the program frees the rest.
 */
export function linkProgram(gl: WebGLRenderingContext, vertexSource: string, fragmentSource: string): WebGLProgram | null {
  const vertex = compile(gl, gl.VERTEX_SHADER, vertexSource);
  const fragment = compile(gl, gl.FRAGMENT_SHADER, fragmentSource);
  if (!vertex || !fragment) return null;
  const program = gl.createProgram();
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);
  if (gl.getProgramParameter(program, gl.LINK_STATUS) === true) return program;
  gl.deleteProgram(program);
  return null;
}

/** Uploads an image for sampling without mipmaps or repeat, which WebGL 1 needs for sizes that are not powers of two. */
export function uploadTexture(gl: WebGLRenderingContext, image: TexImageSource, format: number, premultiply: boolean): WebGLTexture {
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, premultiply);
  gl.texImage2D(gl.TEXTURE_2D, 0, format, format, gl.UNSIGNED_BYTE, image);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  return texture;
}

/**
 * Matches the canvas buffer to its CSS size at up to 2x density, and to no more than `maxPixels` in all.
 * Returns true when it changed.
 */
export function fitCanvas(gl: WebGLRenderingContext, canvas: HTMLCanvasElement, maxPixels = Infinity): boolean {
  const area = Math.max(canvas.clientWidth * canvas.clientHeight, 1);
  const scale = Math.min(window.devicePixelRatio, 2, Math.sqrt(maxPixels / area));
  const width = Math.max(1, Math.round(canvas.clientWidth * scale));
  const height = Math.max(1, Math.round(canvas.clientHeight * scale));
  if (canvas.width === width && canvas.height === height) return false;
  canvas.width = width;
  canvas.height = height;
  gl.viewport(0, 0, width, height);
  return true;
}

/** Covers the canvas with one triangle; the fragment shader does the rest. */
export const COVER_VERTEX = `
attribute vec2 corner;
void main() {
  gl_Position = vec4(corner, 0.0, 1.0);
}`;

/**
 * Links `fragmentSource` with COVER_VERTEX, makes it current and binds the triangle. Returns the uniform
 * lookup, or null when the driver rejects the shaders.
 */
export function coverProgram(gl: WebGLRenderingContext, fragmentSource: string): ((name: string) => WebGLUniformLocation | null) | null {
  const program = linkProgram(gl, COVER_VERTEX, fragmentSource);
  if (!program) return null;
  gl.useProgram(program);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const corner = gl.getAttribLocation(program, "corner");
  gl.enableVertexAttribArray(corner);
  gl.vertexAttribPointer(corner, 2, gl.FLOAT, false, 0, 0);
  return (name) => gl.getUniformLocation(program, name);
}

/** Clears the canvas and draws the covering triangle. */
export function drawCover(gl: WebGLRenderingContext): void {
  gl.clearColor(0, 0, 0, 0);
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.drawArrays(gl.TRIANGLES, 0, 3);
}
