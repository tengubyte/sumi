import { NOISE_GLSL } from "./noiseGlsl.js";

/** The tie-dye patterns, in the order the shader numbers them. */
export const SHIBORI_PATTERNS = ["arashi", "itajime", "kanoko"] as const;
export type ShiboriPattern = (typeof SHIBORI_PATTERNS)[number];

/** Seconds each dip takes: in, out, and the air turning the dye. */
export const DIP_SECONDS = 1.4;

const SHIBORI_GLSL = `
precision highp float;
uniform vec2 size;
uniform float pixel;
uniform float time;
uniform float seed;
uniform float dips;
uniform vec3 color;
uniform vec3 cloth;
${NOISE_GLSL}
// Indigo straight out of the vat is reduced, yellow-green; air turns it blue.
const vec3 LEUCO = vec3(0.56, 0.62, 0.27);

// 1 where the cloth was bound or clamped and the dye could not reach.
float resist(vec2 p, float s) {
#if PATTERN == 0
  // Arashi: wrapped on a pole and pushed into pleats; the dye misses the pressed crests, in diagonal lines
  // that break and wander, crinkled where the cloth was scrunched along the pole.
  vec2 v = vec2(p.x * 0.8 - p.y * 0.6, p.x * 0.6 + p.y * 0.8);
  float ph = v.y * 40.0 + 3.0 * fbm(v * vec2(0.8, 0.4) + s) + 0.9 * noise2(v * vec2(2.5, 30.0) + s);
  float line = pow(0.5 + 0.5 * sin(ph * 6.28318), 3.0);
  float pressed = smoothstep(0.2, 0.8, noise2(vec2(v.x * 4.0, v.y * 40.0) + s));
  float crinkle = 0.5 + 0.5 * sin((v.x * 22.0 + 2.0 * noise2(v * vec2(6.0, 2.0) + s)) * 6.28318);
  return line * mix(0.3, 0.95, pressed) * (0.75 + 0.25 * crinkle);
#elif PATTERN == 1
  // Itajime: folded both ways and clamped between round boards, so the pattern mirrors tile to tile; the
  // dye creeps under the board's edge and reaches less into the creases.
  vec2 g = p / 0.24;
  vec2 f = abs(fract(g * 0.5) * 2.0 - 1.0);
  float edge = length(f) - 0.6 + 0.06 * (noise2(p * 40.0 + s) - 0.5) + 0.04 * (noise2(p * 160.0 + s) - 0.5);
  float board = smoothstep(0.035, -0.035, edge) + 0.35 * smoothstep(0.14, 0.0, edge);
  float crease = (smoothstep(0.05, 0.0, f.x) + smoothstep(0.05, 0.0, f.y)) * (0.25 + 0.3 * noise2(p * 30.0 + s));
  return clamp01(board + crease);
#else
  // Kanoko: tiny points bound tight in offset rows, each a white ring round a dyed tip.
  vec2 g = p / 0.055;
  g.x += 0.5 * mod(floor(g.y), 2.0);
  vec2 k = floor(g);
  vec2 f = fract(g) - 0.5 + 0.1 * (vec2(hash2(k + s), hash2(k + s + 4.0)) - 0.5);
  float rr = length(f * vec2(1.0, 1.12)) + 0.03 * (noise2(p * 120.0 + s) - 0.5);
  float outer = 0.27 + 0.05 * hash2(k + 7.0);
  float disc = smoothstep(outer + 0.03, outer - 0.03, rr);
  float tip = smoothstep(0.07, 0.035, rr);
  return disc * (1.0 - tip);
#endif
}

void main() {
  vec2 p = vec2(gl_FragCoord.x, size.y - gl_FragCoord.y) / size.y;
  vec2 css = gl_FragCoord.xy / pixel;
  float r = resist(p, seed);
  // Cotton takes the dye unevenly; the weave shows as a fine over-under grid with slubs in the threads.
  float mott = 0.86 + 0.28 * fbm(p * 7.0 + seed);
  float weave = 0.93 + 0.05 * sin(css.x * 2.1) * sin(css.y * 2.1) + 0.05 * (noise2(vec2(css.x * 0.9, p.y * 6.0) + seed) - 0.5) + 0.04 * (noise2(vec2(p.x * 5.0, css.y * 0.9) + seed) - 0.5);
  vec3 base = max(cloth, vec3(0.004));
  // Light through the dye: a depth of 1 is the full colour, a little is a pale tint of the same hue.
  vec3 ratio = max(color, vec3(0.004)) / base;
  vec3 col = cloth;
  for (int k = 0; k < 6; k++) {
    float fk = float(k);
    if (fk >= dips) break;
    float t0 = 0.15 + fk * ${String(DIP_SECONDS)};
    // The cloth goes in bottom first, so the dye line rises with a ragged edge.
    float level = (time - t0) * 1.7 - (1.0 - p.y) - 0.05 * noise2(vec2(p.x * 6.0, fk * 3.0) + seed);
    float wet = smoothstep(0.0, 0.03, level);
    if (wet <= 0.0) break;
    float ox = smoothstep(t0 + 0.8, t0 + 1.35, time + 0.15 * fbm(p * 5.0 + fk));
    // Each dip weakens the resist a little at its edge.
    float take = (1.0 - r * (1.0 - 0.06 * fk)) * mott;
    vec3 dyed = base * pow(ratio, vec3((1.0 - pow(0.7, fk + 1.0)) * take / 0.88));
    vec3 green = mix(col, mix(LEUCO, color, 0.2 * fk), 0.55 * take);
    col = mix(col, mix(green, dyed, ox), wet);
  }
  gl_FragColor = vec4(col * weave, 1.0);
}`;

/**
 * Cloth dyed dip by dip, bound in pattern `pattern` of SHIBORI_PATTERNS. The dye line rises from the
 * bottom; out of the vat the cloth is yellow-green and turns to `color` in the air; each dip is darker, and
 * the dye darkens the way light through it does, so a pale dip of indigo is sky blue, not grey. The resist
 * stays white, with dye creeping in at its edge. Pattern distances are in units of the canvas height; the
 * weave is in CSS px, `pixel` device px each.
 */
export const shiboriFragment = (pattern: number): string => `#define PATTERN ${String(pattern)}\n${SHIBORI_GLSL}`;
