import { NOISE_GLSL } from "./noiseGlsl.js";

/**
 * Paper torn by hand, in units of `unit` px so the tear looks the same at any size. `kind` 0 tears the
 * border off `image` to a ragged frame, 1 tears a sheet of `sheet` across the middle, and 2 tears a cover
 * of `sheet` away from `image`. The edge wanders at three scales, a thin `core` band shows where the tear
 * sheared the sheet, long fibres reach past it, and the lifted sheet throws a soft shadow.
 */
export const TORN_FRAGMENT = `
precision highp float;
uniform vec2 size;
uniform float unit;
uniform float progress;
uniform float kind;
uniform float flip;
uniform float seed;
uniform sampler2D image;
uniform vec3 sheet;
uniform vec3 core;
${NOISE_GLSL}
mat2 rot(float a) {
  float c = cos(a);
  float s = sin(a);
  return mat2(c, -s, s, c);
}
float sdBox(vec2 p, vec2 b) {
  vec2 q = abs(p) - b;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0);
}
// The hand's path, the paper's clumps and single fibre ends.
float rag(vec2 p) {
  return 0.1 * (fbm(p * 2.6 + seed) - 0.5) + 0.024 * (noise2(p * 26.0 + seed * 1.7) - 0.5) + 0.007 * (noise2(p * 120.0 - seed) - 0.5);
}
// Kozo fibres are long and thin and cross at every angle.
float fibres(vec2 p) {
  float f = 0.0;
  for (int i = 0; i < 4; i++) {
    float fi = float(i);
    vec2 r = rot(seed * 2.3 + fi * 1.37) * p;
    f = max(f, smoothstep(0.8, 0.92, noise2(vec2(r.x * 11.0, r.y * 230.0) + vec2(fi * 17.1, seed * 5.0))));
  }
  return f;
}
// Signed distance to the tear: below 0 is the sheet that stays.
float edge(vec2 p) {
  vec2 h = size * 0.5 / unit;
  float t = 1.0 - pow(1.0 - clamp01(progress), 3.0);
  if (kind < 0.5) return sdBox(p, h - mix(-0.14, 0.085, t)) + rag(p);
  if (kind < 1.5) {
    // The strip below the line comes away down and to the left, so the running tear slants back from its tip.
    float line = rag(p) - p.y;
    float front = mix(-h.x - 0.2, h.x + 0.9, t);
    return min(line, front - p.x + 0.9 * p.y + 1.6 * rag(p * vec2(1.0, 0.6) + 7.0));
  }
  float front = mix(-h.x - 0.25, h.x + 0.25, t) + 0.18 * p.y;
  return front + rag(p * vec2(0.5, 1.0)) - p.x;
}
void main() {
  vec2 p = (gl_FragCoord.xy - size * 0.5) / unit;
  p.y *= flip;
  float aa = 1.2 / unit;
  float d = edge(p);
  // Light from the upper left: the shadow falls down and to the right.
  float ds = edge(p - vec2(0.006, -0.01 * flip));
  vec4 picture = texture2D(image, gl_FragCoord.xy / size);
  vec3 front = kind < 0.5 ? picture.rgb : sheet;
  if (kind > 1.5) front = sheet * (1.0 + 0.08 * (fbm(p * vec2(9.0, 3.0) + seed) - 0.5)) - 0.025 * fibres(p * 1.6 + 3.0);
  vec4 under = kind > 1.5 ? vec4(picture.rgb * picture.a, picture.a) : vec4(0.0);
  float shadow = 0.3 * smoothstep(0.025, -0.006, ds) * step(0.0, d);
  under = vec4(under.rgb * (1.0 - shadow), under.a + shadow * (1.0 - under.a));
  float reach = 0.018 + 0.012 * noise2(p * 20.0 + seed);
  float fa = 0.85 * fibres(p) * smoothstep(reach, 0.0, d) * step(0.0, d);
  under = vec4(core * fa + under.rgb * (1.0 - fa), fa + under.a * (1.0 - fa));
  float rimW = 0.004 + 0.012 * noise2(p * 26.0 - seed);
  float rim = max(smoothstep(-rimW, -rimW * 0.3, d), smoothstep(-rimW * 2.2, -rimW, d) * fibres(p + 0.37));
  float sheetA = smoothstep(aa, -aa, d) * (kind < 0.5 ? picture.a : 1.0);
  gl_FragColor = vec4(mix(front, core, rim) * sheetA + under.rgb * (1.0 - sheetA), sheetA + under.a * (1.0 - sheetA));
}`;
