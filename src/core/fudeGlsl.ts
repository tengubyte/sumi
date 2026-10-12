import { NOISE_GLSL } from "./noiseGlsl.js";

/** One brush footprint, long across the stroke, turned to face the way the brush moves. Positions in device px, y down. */
export const STAMP_VERTEX = `
attribute vec2 corner;
attribute vec2 center;
attribute vec2 dir;
attribute vec3 shape;
uniform vec2 size;
varying vec2 local;
varying float load;
varying float tone;
void main() {
  vec2 n = vec2(-dir.y, dir.x);
  vec2 at = center + (dir * corner.x * 0.55 + n * corner.y) * shape.x;
  local = corner;
  load = shape.y;
  tone = shape.z;
  gl_Position = vec4(at.x / size.x * 2.0 - 1.0, 1.0 - at.y / size.y * 2.0, 0.0, 1.0);
}`;

/**
 * The ink a footprint leaves, blended by maximum into the paper so overlapping footprints do not darken.
 * Each bristle across the brush holds its own ink and stops at its own point as the load runs down, so
 * a drying stroke breaks into streaks; the edge frays into paper fibres fixed to the page, and ink pools
 * along both edges while the brush is wet.
 */
export const STAMP_FRAGMENT = `
precision highp float;
uniform float bristles;
uniform float seed;
uniform float pixel;
varying vec2 local;
varying float load;
varying float tone;
${NOISE_GLSL}
float hash(float n) {
  return fract(sin(n * 12.9898 + seed * 78.233) * 43758.5453);
}
void main() {
  float across = local.y;
  float fray = noise2(gl_FragCoord.xy / (pixel * 1.8)) + 0.5 * noise2(gl_FragCoord.xy / (pixel * 0.7)) - 0.75;
  float edge = smoothstep(1.0, 0.84, length(local) + 0.2 * fray);
  if (edge <= 0.0) discard;
  float b = (across * 0.5 + 0.5) * bristles;
  float i = floor(b);
  float hold = hash(i) * (1.0 - 0.5 * across * across);
  float wet = smoothstep(1.0 - hold - 0.05, 1.0 - hold + 0.05, load + 0.2);
  float f = fract(b);
  float hair = smoothstep(0.0, 0.3, f) * smoothstep(1.0, 0.7, f);
  float body = mix(hair, 1.0, smoothstep(0.3, 0.7, load));
  float pool = 1.0 + 0.14 * smoothstep(0.55, 0.95, abs(across)) * smoothstep(0.3, 0.8, load);
  float streak = 0.88 + 0.12 * hash(i + 31.0);
  gl_FragColor = vec4(min(wet * body * edge * streak * tone * pool, 1.0));
}`;

/** Shows the gathered ink: feathered a pixel into the paper fibres, grey where thin and near black where it pooled. */
export const SHOW_FRAGMENT = `
precision highp float;
uniform sampler2D paper;
uniform vec2 size;
uniform vec3 ink;
uniform float alpha;
uniform float pixel;
${NOISE_GLSL}
void main() {
  vec2 uv = gl_FragCoord.xy / size;
  vec2 o = vec2(pixel * 1.2) / size;
  float a = texture2D(paper, uv).r;
  float spread = 0.25 * (texture2D(paper, uv + vec2(o.x, 0.0)).r + texture2D(paper, uv - vec2(o.x, 0.0)).r + texture2D(paper, uv + vec2(0.0, o.y)).r + texture2D(paper, uv - vec2(0.0, o.y)).r);
  float fibre = noise2(gl_FragCoord.xy / pixel * vec2(0.9, 0.35));
  float d = max(a, spread * smoothstep(0.3, 0.8, fibre) * 0.6);
  d *= 0.93 + 0.07 * noise2(gl_FragCoord.xy / pixel * 0.6);
  vec3 c = mix(ink + vec3(0.32), ink, smoothstep(0.15, 0.95, d));
  float k = smoothstep(0.02, 0.6, d) * alpha;
  gl_FragColor = vec4(c * k, k);
}`;
