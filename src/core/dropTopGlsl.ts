import type { DropKind } from "./inkDrop.js";
import { SPLATTER_GLSL, SPLATTER_MAIN } from "./splatterGlsl.js";

// The body of inkAt for each kind. In scope: p, the drop's centre c, radius R, way of travel dirA as u and
// side, seed s, age, fibres fib, one pixel px, aa, v = p - c, far = |v|, rough and the core's grow.
const KIND_INK: Readonly<Record<DropKind, string>> = {
  // A round blot, perhaps with a smaller drop or two merged into its rim, and a few satellites.
  drop: `
  if (far > R * 3.6) return 0.0;
  float body = blot(v, R * grow, s, 0.14, 0.06);
  for (int i = 0; i < 3; i++) {
    float fi = float(i);
    float h = hash2(vec2(fi + 50.0, s));
    if (h < 0.5) continue;
    float a = TAU * hash2(vec2(s, fi + 50.0));
    body = smin(body, length(v - vec2(cos(a), sin(a)) * R * (0.85 + 0.45 * h) * grow) - R * (0.18 + 0.3 * (h - 0.5)) * grow, R * 0.1);
  }
  body += rough;
  float d = min(body, satellites(v, R, s, 16.0, 0.4, 1.35, 3.0, 0.3, age, 0.0, TAU, px) + rough * 0.3);
  return shade(p, d, body, R * 0.5, age, fib, aa);`,
  // A blot thrown out into spikes, beads past their tips, satellites and a little mist in clumps.
  splash: `
  if (far > R * 6.0) return 0.0;
  float body = rays(v, blot(v, R * 1.1 * grow, s, 0.16, 0.12), R, s, 36.0, age, px) + rough;
  float d = min(body, satellites(v, R, s, 30.0, 0.6, 1.6, 4.8, 0.22, age, 0.0, TAU, px) + rough * 0.3);
  float ring = smoothstep(R * 1.5, R * 2.2, far) * smoothstep(R * 5.5, R * 3.0, far);
  d = min(d, specks(p, 1.0 / 120.0, 0.22 * ring * smoothstep(0.4, 0.7, fbm(p * 7.0 + s)), age, s, px));
  return shade(p, d, body, R * 0.3, age, fib, aa);`,
  // A short smear where the brush let go, then streaks fanning along the throw, all curving one way, each
  // ending in a teardrop whose tail points back along the streak.
  flick: `
  if (far > R * 10.0) return 0.0;
  float body = blot(vec2(dot(v, u) / 2.6, dot(v, side)), R * 0.5 * grow, s, 0.2, 0.1) + rough;
  float turnSide = hash2(vec2(s, 9.0)) > 0.5 ? 1.0 : -1.0;
  float lines = 1e4;
  for (int i = 0; i < 8; i++) {
    float fi = float(i);
    float hl = hash2(vec2(s + 11.0, fi + 70.0));
    float hw = hash2(vec2(fi + 3.0, s + 13.0));
    vec2 ui = turn(u, (hash2(vec2(fi + 70.0, s)) - 0.5) * 0.9);
    vec2 si = vec2(-ui.y, ui.x);
    float len = R * (2.5 + 5.5 * hl);
    float bend = turnSide * (0.08 + 0.25 * hash2(vec2(s + 17.0, fi * 2.3)));
    float reach = len * expoOut((age - 0.01) / (0.1 + 0.1 * hl));
    float rw = R * (0.025 + 0.035 * hw);
    vec2 prev = ui * R * 0.3;
    for (int k = 1; k <= 4; k++) {
      float f = float(k) / 4.0;
      vec2 next = ui * (R * 0.3 + reach * f) + si * bend * reach * f * f;
      lines = min(lines, segment(v, prev, next, max(rw * (0.2 + 0.8 * (f - 0.25)), px * 0.5), rw * (0.2 + 0.8 * f)));
      prev = next;
    }
    float rh = R * (0.11 + 0.17 * hw) * smoothstep(0.75, 1.0, reach / len);
    vec2 tang = normalize(ui + si * 2.0 * bend);
    lines = smin(lines, segment(v, prev - tang * rh * 2.6, prev, rh * 0.3, rh), R * 0.04);
  }
  float d = min(min(body, lines + rough * 0.4), satellites(v, R, s, 10.0, 0.6, 2.0, 9.0, 0.25, age, dirA, 0.9, px) + rough * 0.3);
  return shade(p, d, body, R * 0.2, age, fib, aa);`,
  // A dry brush rubbed off: grainy clumps of specks thinning out from the middle, and no halo.
  spray: `
  float cloud = R * 3.0;
  if (far > cloud * 1.8) return 0.0;
  vec2 e = vec2(dot(v, u) / 1.5, dot(v, side)) + cloud * 0.35 * (vec2(fbm(v / cloud * 2.0 + s), fbm(v / cloud * 2.0 + s + 4.1)) - 0.5);
  float fall = exp(-2.2 * dot(e, e) / (cloud * cloud));
  float clump = smoothstep(0.4, 0.72, fbm(p * 9.0 + s));
  float d = specks(p, 1.0 / 150.0, min(fall * (0.08 + 0.8 * clump) * (1.0 + 1.5 * fall), 0.95), age, s, px);
  d = min(d, specks(p + 0.37, 1.0 / 60.0, fall * (0.1 + 0.5 * clump), age, s + 4.0, px));
  d = min(d, satellites(v, R, s, 14.0, 0.5, 0.8, 3.4, 0.22, age, 0.0, TAU, px));
  return shade(p, d, 1e4, 0.0, age, fib, aa);`,
  // A soft grey stain of warped lobes that keeps spreading while it is wet, mottled where the pigment
  // pooled, its edge darker in places.
  bloom: `
  if (far > R * 2.8) return 0.0;
  float g = 0.35 + 0.65 * pow(clamp01(age / 2.2), 0.45);
  vec2 w = v + R * 0.45 * (vec2(fbm(v / R * 1.2 + s), fbm(v / R * 1.2 + s + 5.2)) - 0.5);
  float d = 1e4;
  for (int i = 0; i < 6; i++) {
    float fi = float(i);
    vec2 o = R * 1.1 * (vec2(hash2(vec2(fi, s)), hash2(vec2(s, fi + 1.0))) - 0.5);
    d = smin(d, length(w - o * g) - R * (0.32 + 0.3 * hash2(vec2(fi + 3.0, s))) * g, R * 0.25);
  }
  d += R * 0.14 * (fbm(v / R * 4.0 + s) - 0.5) + 0.012 * (fib - 0.5);
  float dry = smoothstep(0.6, 2.2, age);
  float wash = 0.14 + 0.3 * fbm(p * 8.0 + s) + 0.5 * smoothstep(0.45, 0.75, fbm(p * 4.0 + s + 3.0));
  float edge = 0.22 * (1.0 - smoothstep(0.0, 0.02, -d)) * smoothstep(0.4, 0.6, noise2(p * 14.0 + s)) * (0.3 + 0.7 * dry);
  float a = min(wash + edge, 0.9) * smoothstep(0.012, -0.008, d);
  float wet = 0.08 * smoothstep(R * 0.12 * (0.3 + fib) * g, 0.0, d);
  return max(a, d > 0.0 ? wet : 0.0);`,
  // The drop runs down the sheet, slowing as it thins, a bulb leading; sometimes a second, shorter run.
  drip: `
  if (far > R * 11.0) return 0.0;
  float runs = 1e4;
  for (int i = 0; i < 2; i++) {
    float fi = float(i);
    float h = hash2(vec2(s, fi + 4.0));
    if (i == 1 && h < 0.45) continue;
    vec2 start = side * R * 0.38 * fi * (h > 0.72 ? 1.0 : -1.0);
    float run = R * (4.5 + 3.5 * h) * (1.0 - 0.55 * fi) * expoOut((age - 0.15 - 0.2 * fi) / 1.6);
    vec2 q = v - start;
    float along = dot(q, u);
    float sc = clamp(along, 0.0, run);
    float wob = R * 0.16 * (noise2(vec2(sc / R * 0.6, s + fi * 5.0)) - 0.5);
    float taper = 1.0 - 0.45 * smoothstep(0.0, 0.6, sc / max(run, 1e-4));
    float wr = max(R * (0.07 + 0.09 * noise2(vec2(sc / R * 1.3, s + 2.0 + fi))) * taper, px * 0.7);
    runs = min(runs, length(vec2(along - sc, dot(q, side) - wob)) - wr);
    float wobEnd = R * 0.16 * (noise2(vec2(run / R * 0.6, s + fi * 5.0)) - 0.5);
    float rb = R * (0.22 - 0.06 * fi) * smoothstep(0.0, R * 1.5, run);
    vec2 front = start + u * run + side * wobEnd;
    runs = smin(runs, segment(v, front - u * rb * 1.2, front + u * rb * 0.2, rb * 0.4, rb), R * 0.06);
  }
  float body = smin(blot(v, R * 0.6 * grow, s, 0.15, 0.1), runs, R * 0.15) + rough;
  float d = min(body, satellites(v, R, s, 12.0, 0.4, 1.0, 2.2, 0.25, age, 0.0, TAU, px) + rough * 0.3);
  return shade(p, d, body, R * 0.2, age, fib, aa);`,
  // As the drop dries, the pigment rides out to the pinned edge and the middle pales.
  ring: `
  if (far > R * 2.8) return 0.0;
  vec2 n = v / max(far, 1e-6);
  float edgeR = R * (1.0 + 0.1 * (noise2(n * 1.6 + s) - 0.5) + 0.04 * (noise2(n * 7.0 + s) - 0.5)) * grow;
  float dry = smoothstep(0.3, 1.8, age);
  float band = R * (0.025 + 0.07 * pow(noise2(n * 2.6 + s * 2.0), 1.5)) * (0.45 + 0.55 * dry);
  band *= 1.0 - smoothstep(0.66, 0.8, noise2(n * 2.0 + s * 4.0));
  float rimD = abs(far - edgeR + band) - band + rough * 0.5;
  float d = min(rimD, satellites(v, R, s, 14.0, 0.35, 1.2, 2.2, 0.16, age, 0.0, TAU, px));
  float inside = mix(0.45, 0.05, dry) * (0.6 + 0.8 * fbm(p * 14.0 + s)) * smoothstep(aa, -aa, far - edgeR);
  return max(shade(p, d, rimD, R * 0.15, age, fib, aa), inside);`,
};

/**
 * Sumi ink landing on washi, seen from above, for one kind. Each kind is its own program: one shader
 * holding all seven unrolls every loop and stalls the Direct3D compiler for tens of seconds. Every frame
 * comes straight from the time, so there is no simulation.
 */
export function dropTopFragment(kind: DropKind): string {
  return `${SPLATTER_GLSL}
float inkAt(vec2 p, vec2 c, float R, float dirA, float s, float age, float fib, float px) {
  vec2 u = vec2(cos(dirA), sin(dirA));
  vec2 side = vec2(-u.y, u.x);
  vec2 v = p - c;
  float far = length(v);
  float aa = 1.2 * px;
  float rough = ((noise2(p * 180.0) - 0.5) * 1.6 + (noise2(p * 45.0) - 0.5) * 2.4) / 500.0;
  float grow = sqrt(clamp01(age / 0.12));
${KIND_INK[kind]}
}
${SPLATTER_MAIN}`;
}
