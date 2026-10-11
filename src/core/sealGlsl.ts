import { NOISE_GLSL } from "./noiseGlsl.js";

/** The seal's own clock: down by 0.35 s, rocked round by 0.95 s, lifted away by 1.4 s. */
export const SEAL_SECONDS = 1.6;

/**
 * A seal impression in a canvas, centred, `scale` px per seal unit (y down). The face is a box of
 * half size `halfSize` or an ellipse; `glyph` holds the characters as alpha over the face. Paste only
 * reaches the paper's high points, and the seal is rocked round once, so the impression builds up
 * unevenly and keeps a few white specks. A soft shadow comes down before it and lifts away after.
 */
export const SEAL_FRAGMENT = `
precision highp float;
uniform vec2 size;
uniform float time;
uniform float seed;
uniform float turn;
uniform vec2 halfSize;
uniform float scale;
uniform float white;
uniform float roundSeal;
uniform vec3 color;
uniform sampler2D glyph;
${NOISE_GLSL}
float sdBox(vec2 p, vec2 b, float r) {
  vec2 q = abs(p) - b + r;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}
float shape(vec2 p, vec2 h) {
  return roundSeal > 0.5 ? (length(p / h) - 1.0) * min(h.x, h.y) : sdBox(p, h, 0.05);
}

void main() {
  vec2 p = (gl_FragCoord.xy - size * 0.5) / scale;
  p.y = -p.y;
  float aa = 1.5 / scale;
  float down = clamp01(time / 0.35);
  float contact = clamp01((time - 0.35) / 0.6);
  float lift = clamp01((time - 0.95) / 0.45);

  // Carved stone: the cut wanders a little and the border has a few bites out of it.
  vec2 w = vec2(fbm(p * 6.0 + seed), fbm(p * 6.0 + seed + 4.3)) - 0.5;
  vec2 q = p + w * 0.025 + (vec2(noise2(p * 40.0 + seed), noise2(p * 40.0 - seed)) - 0.5) * 0.008;
  float edge = shape(q, halfSize);
  float bite = smoothstep(0.72, 0.9, noise2(vec2(atan(q.y, q.x) * 5.0, seed * 3.0)));
  edge += bite * 0.05 * smoothstep(-0.12, 0.0, edge);
  float block = smoothstep(aa, -aa, edge);
  float g = smoothstep(0.35, 0.65, texture2D(glyph, q / halfSize * 0.5 + 0.5).a);
  float border = 0.09 * min(halfSize.x, halfSize.y);
  float ring = block * smoothstep(border + aa, border - aa, -edge);
  float mask = white > 0.5 ? block * (1.0 - g) : max(ring, g * block);

  float a = turn * 6.2832;
  vec2 r = mat2(cos(a), -sin(a), sin(a), cos(a)) * p;
  float grain = 0.5 * fbm(r * vec2(12.0, 30.0) + seed) + 0.5 * noise2(p * 110.0 + seed);
  float press = 0.0;
  for (int i = 0; i < 12; i++) {
    float f = (float(i) + 0.5) / 12.0;
    vec2 c = 0.5 * halfSize * vec2(cos(f * 6.2832 + a), sin(f * 6.2832 + a));
    press += step(f, contact) * exp(-dot(p - c, p - c) / 0.4);
  }
  press = press / 12.0 * 1.4 + 0.5 * contact + 0.12 * dot(p, vec2(cos(a), sin(a)));
  float inkA = mask * smoothstep(0.45, 0.7, press + (grain - 0.5) * 0.8) * 0.94;

  // The shadow is large and faint while the seal is high, and the seal's own face hides it once down.
  float height = (1.0 - down) + lift;
  float sd = shape(p - vec2(0.1, 0.14) * height, halfSize * (1.0 + 0.12 * height));
  float shadowA = (1.0 - lift) * (0.02 + 0.07 * down) * smoothstep(0.1 + 0.6 * height, -0.15, sd);
  shadowA *= step(0.001, down + lift) * mix(1.0, smoothstep(-0.02, 0.06, shape(p, halfSize)), step(0.001, contact));
  vec3 shade = vec3(0.09, 0.07, 0.075);
  gl_FragColor = vec4(shade * shadowA + color * inkA * (1.0 - shadowA), shadowA + inkA * (1.0 - shadowA));
}`;
