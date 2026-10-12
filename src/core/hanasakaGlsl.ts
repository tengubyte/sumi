import { BLOSSOM_GLSL } from "./blossomGlsl.js";
import { NOISE_GLSL } from "./noiseGlsl.js";

export interface BloomRoom {
  readonly segs: number;
  readonly flowers: number;
  readonly petals: number;
}

const BLOOM_MAIN = `
void main() {
  float m = min(size.x, size.y);
  vec2 p = (gl_FragCoord.xy - size * 0.5) / m;
  vec4 col = vec4(0.0);

  // The branch: tapered strokes laid down in order, each as far as the brush has reached.
  float best = 1.0;
  float along = 0.0;
  float across = 0.0;
  for (int i = 0; i < SEGS; i++) {
    if (float(i) >= counts.x) break;
    vec4 A = segA[i];
    vec4 B = segB[i];
    float grow = clamp01((time - B.z) / max(B.w - B.z, 0.0001));
    if (grow <= 0.0) continue;
    vec2 pa = p - A.xy;
    vec2 ba = A.zw - A.xy;
    float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, grow);
    float r = mix(B.x, B.y, h);
    vec2 foot = pa - ba * h;
    float d = length(foot) - r;
    if (d < best) {
      best = d;
      along = h * length(ba) + float(i) * 1.7;
      across = dot(foot, vec2(-ba.y, ba.x) / length(ba)) / max(r, 0.0001);
    }
  }
  float wood = smoothstep(pixel, -pixel, best);
  if (wood > 0.0) {
    // Dry streaks along the stroke, darker where the ink pools at its edges.
    float s = 0.6 * noise2(vec2(along * 26.0, across * 2.2 + seed)) + 0.4 * noise2(vec2(along * 70.0, across * 5.0));
    float gap = smoothstep(0.62, 0.7, s) * smoothstep(0.35, 0.9, abs(across));
    vec3 c = mix(bark * 0.55, bark, s) * (0.9 + 0.2 * (1.0 - abs(across)));
    float a = wood * (1.0 - gap * 0.85);
    col = vec4(c * a, a);
  }

  for (int i = 0; i < FLOWERS; i++) {
    if (float(i) >= counts.y) break;
    vec4 A = flowA[i];
    vec4 B = flowB[i];
    float b = clamp01((time - B.x) / bloom);
    if (b <= 0.0) continue;
    vec2 q = rot(p - A.xy, A.w) / A.z;
    if (dot(q, q) > 4.0) continue;
    // Opens with a little overshoot, the way a bud bursts.
    float open = 1.0 + 2.7 * pow(b - 1.0, 3.0) + 1.7 * pow(b - 1.0, 2.0);
    vec4 f = blossom(q / max(open, 0.05), clamp01(open), B.y, A.z * max(open, 0.05), B.z);
    // A soft pale ring as it opens.
    float ring = exp(-pow((length(q) - (0.9 + 1.4 * b)) * 5.0, 2.0)) * (1.0 - b) * 0.16 * (1.0 - B.y);
    col = over(f, col);
    col += vec4(vec3(1.0, 0.92, 0.95) * ring, ring) * (1.0 - col.a * 0.5);
  }

  // Petals that let go: they tumble, flipping edge-on, and ride the wind out.
  for (int i = 0; i < PETALS; i++) {
    if (float(i) >= counts.z) break;
    vec4 A = petA[i];
    vec4 B = petB[i];
    float age = (time - B.x) * seconds;
    if (age <= 0.0) continue;
    vec2 at = A.xy + (A.zw + wind) * age + vec2(0.03 * sin(age * 2.3 + B.w), -0.02 * age * age);
    vec2 q = rot(p - at, B.y * age + B.w);
    float flip = cos(age * 3.1 + B.w * 2.0);
    q.x /= max(abs(flip), 0.18);
    q /= B.z;
    if (dot(q, q) > 2.0) continue;
    float px = pixel / B.z;
    float d = petal(q + vec2(0.5, 0.0));
    float fill = smoothstep(px, -px, d) * (1.0 - smoothstep(0.85, 1.0, time));
    vec3 c = mix(pink, vec3(1.0, 0.97, 0.98), smoothstep(-0.4, 0.5, q.x)) * (0.85 + 0.15 * abs(flip));
    float ink = (1.0 - smoothstep(px * 0.6, px * 1.6, abs(d))) * fill;
    col = over(over(vec4(outline * ink, ink), vec4(c * fill, fill)), col);
  }
  gl_FragColor = col;
}`;

/**
 * A cherry branch brushed in segment by segment, blossoms opening along it, and petals letting go on the
 * wind. Segments are tapered strokes (a, b, radii, the share of the run they grow over); blossoms are
 * notched five-petal flowers with ink outlines; petals tumble edge-on as they drift. Lengths are in units
 * of the canvas's shorter side, from its middle, y up. `room` fixes the array sizes, which WebGL 1 needs
 * at compile time, to what the device's uniform limit allows.
 */
export const bloomFragment = (room: BloomRoom): string => `
precision highp float;
#define SEGS ${String(room.segs)}
#define FLOWERS ${String(room.flowers)}
#define PETALS ${String(room.petals)}
uniform vec2 size;
uniform float time;
uniform float seconds;
uniform float pixel;
uniform float seed;
uniform vec4 segA[SEGS];
uniform vec4 segB[SEGS];
uniform vec4 flowA[FLOWERS];
uniform vec4 flowB[FLOWERS];
uniform vec4 petA[PETALS];
uniform vec4 petB[PETALS];
uniform vec3 counts;
uniform float bloom;
uniform vec3 bark;
uniform vec3 outline;
uniform vec3 pink;
uniform vec3 deep;
uniform vec2 wind;
${NOISE_GLSL}
${BLOSSOM_GLSL}
${BLOOM_MAIN}`;
