/**
 * The cherry blossom in GLSL: `petal(q)`, a notched petal's distance; `blossom(...)`, a five-petal flower
 * with an ink outline and a dark heart; `over` and `rot`. Needs `pixel`, `outline`, `pink` and `deep`
 * uniforms and the noise from `NOISE_GLSL` declared first.
 */
export const BLOSSOM_GLSL = `
const float TAU = 6.2831853;
vec2 rot(vec2 v, float a) {
  float c = cos(a);
  float s = sin(a);
  return vec2(c * v.x + s * v.y, -s * v.x + c * v.y);
}
// One petal along +x from the heart to a notched tip at x = 1, in petal units.
float petal(vec2 q) {
  vec2 e = (q - vec2(0.52, 0.0)) / vec2(0.5, 0.34);
  float d = (length(e) - 1.0) * 0.34;
  float notch = length((q - vec2(1.05, 0.0)) / vec2(1.0, 1.6)) - 0.12;
  return max(d, -notch);
}
vec4 over(vec4 top, vec4 under) {
  return top + under * (1.0 - top.a);
}
// A flower in its own units: petal fill, an ink outline that breaks here and there, a dark heart.
vec4 blossom(vec2 q, float open, float bud, float scale, float tint) {
  float px = pixel / scale;
  float r = length(q);
  if (r > 1.25) return vec4(0.0);
  float a = atan(q.y, q.x) + (1.0 - open) * 0.7;
  float sector = TAU / 5.0;
  float a5 = mod(a + sector * 0.5, sector) - sector * 0.5;
  float spread = mix(0.35, 1.0, open);
  vec2 pq = r * vec2(cos(a5), sin(a5)) / spread;
  float d = petal(pq) * spread;
  // A bud is the five petals still folded round the heart.
  if (bud > 0.5) d = length(q / vec2(0.62, 0.45)) * 0.45 - 0.45;
  float fill = smoothstep(px, -px, d);
  float k = r / spread;
  vec3 col = mix(deep, pink, smoothstep(0.05, 0.55, k));
  col = mix(col, vec3(1.0, 0.975, 0.98), smoothstep(0.55, 1.05, k) * 0.55);
  col *= 0.94 + 0.08 * noise2(q * 9.0 + tint * 40.0) + tint * 0.06;
  col = mix(col, deep, (1.0 - smoothstep(0.0, 0.035, abs(pq.y))) * smoothstep(0.75, 0.2, pq.x) * 0.35 * (1.0 - bud));
  float lw = (1.1 + 0.6 * noise2(q * 6.0 + tint * 13.0)) * px;
  float ink = (1.0 - smoothstep(lw * 0.5, lw * 0.5 + px, abs(d))) * step(0.15, noise2(vec2(a * 3.0, tint * 9.0)));
  vec4 c = vec4(col * fill, fill);
  if (bud < 0.5) {
    // The heart: a dark star with stamens tipped in gold.
    float s6 = TAU / 6.0;
    float as = mod(a + s6 * 0.5, s6) - s6 * 0.5;
    vec2 sq = r * vec2(cos(as), sin(as));
    float stamen = (1.0 - smoothstep(0.012, 0.012 + px, abs(sq.y))) * step(0.06, sq.x) * step(sq.x, 0.3 * open);
    float tip = smoothstep(0.045 + px, 0.045, length(sq - vec2(0.32 * open, 0.0)));
    float heart = smoothstep(0.1 + px, 0.1, r);
    c = over(vec4(deep * 0.7 * stamen, stamen) * fill, c);
    c = over(vec4(vec3(0.93, 0.72, 0.29) * tip, tip) * open, c);
    c = over(vec4(deep * 0.55 * heart, heart), c);
  }
  return over(vec4(outline * ink, ink), c);
}
`;
