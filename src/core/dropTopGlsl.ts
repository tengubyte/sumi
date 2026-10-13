import { NOISE_GLSL } from "./noiseGlsl.js";

/**
 * Ink dropped on water, seen from above, in a canvas one unit high (y down). Each drop throws its ink
 * outward with a push k(direction) / r. Under that push the ink in a direction reaches
 * r^2 = core^2 + grow(t) k, so the splash is a polar shape and a frame is a pure function of time.
 * A few directions push far harder than the rest; those become the needle rays.
 */
export const DROP_TOP_FRAGMENT = `
precision highp float;
uniform vec2 size;
uniform float time;
uniform float seed;
uniform float swirl;
uniform vec4 drops[3];
uniform vec3 colors[3];
${NOISE_GLSL}
const float CORE = 0.06;
const float SPREAD = 0.012;
const float TAU = 1.0;
const int THROWN = 28;

// How hard the landing pushes ink in direction n: broad lobes, and a few needle rays on top. The lobes
// are not clamped, since a clamped lobe ends in a flat arc that reads as a square tab.
float push(vec2 n, float s) {
  vec2 lp = n * 2.0 + s;
  float lobe = max((noise2(lp) * 2.0 + noise2(lp * 2.1)) / 3.0 - 0.3, 0.0) / 0.4;
  float ray = smoothstep(0.52, 1.0, noise2(n * 14.0 + s * 3.0));
  return 0.3 + 0.8 * lobe * lobe + 5.5 * pow(ray, 3.5);
}

float reach(vec2 n, float s, float age) {
  float rim = (noise2(n * 5.0 + s * 2.0) * 2.0 + noise2(n * 13.0 + s)) / 3.0 - 0.5;
  float core = CORE * (1.0 + 0.5 * rim) * (1.0 - exp(-age / 0.06));
  float grow = 2.0 * SPREAD * TAU * (1.0 - exp(-age / TAU));
  return sqrt(core * core + grow * push(n, s));
}

// Drops thrown past the tips of the strongest rays, each drawn out a little along its flight.
float thrown(vec2 p, float s, float age, float aa) {
  float a = 0.0;
  vec2 toward = normalize(p + 1e-6);
  for (int i = 0; i < THROWN; i++) {
    float fi = float(i);
    float angle = fi * 6.2832 / float(THROWN) + 0.1 * sin(fi * 7.3 + s);
    vec2 n = vec2(cos(angle), sin(angle));
    // Only the drops in this pixel's direction can reach it; the rest skip the noise.
    if (dot(toward, n) < 0.95) continue;
    float k = push(n, s);
    float radius = (0.003 + 0.008 * fract(fi * 0.37 + s * 0.5)) * smoothstep(0.8, 1.8, k) * (1.0 - exp(-age / 0.1));
    vec2 e = p - n * reach(n, s, age) * (1.08 + 0.45 * fract(fi * 0.618 + s));
    float d = length(vec2(dot(e, n) / 1.6, dot(e, vec2(-n.y, n.x))));
    a = max(a, 1.0 - smoothstep(radius - aa, radius + aa, d));
  }
  return a;
}

// One drop's ink at p, relative to where it landed: the splash, its thrown drops and a grey bleed.
float splash(vec2 p, float s, float age, float aa) {
  if (length(p) > 0.75) return 0.0;
  // The water bends the rays a little, so they never run quite straight.
  vec2 bend = vec2(noise2(p * 4.0 + s), noise2(p * 4.0 + s + 9.0)) - 0.5;
  vec2 q = p + 0.08 * swirl * bend * smoothstep(0.0, 0.25, length(p));
  float r = length(q) + 1e-6;
  float edge = reach(q / r, s, age);
  float a = max(1.0 - smoothstep(edge - aa, edge + aa, r), thrown(p, s, age, aa));
  // While the water is wet, a grey bleed creeps out from the edge.
  float wet = 0.3 * min(age / 3.0, 1.0) * (0.4 + fbm(p * 30.0 + s));
  float bleed = 0.25 * (1.0 - smoothstep(edge, max(edge * (1.0 + wet), edge + aa), r));
  return max(a, bleed) * (1.0 - 0.1 * fbm(p * 14.0 + s));
}

void main() {
  float aspect = size.x / size.y;
  vec2 p = vec2(gl_FragCoord.x / size.y, 1.0 - gl_FragCoord.y / size.y);
  float aa = 1.5 / size.y;
  vec4 col = vec4(0.0);
  for (int j = 0; j < 3; j++) {
    vec4 d = drops[j];
    if (d.w < 0.5 || time < d.z) continue;
    float a = splash(p - vec2(d.x * aspect, d.y), seed + float(j) * 7.3, time - d.z, aa);
    col = vec4(colors[j] * a, a) + col * (1.0 - a);
  }
  gl_FragColor = col;
}`;
