import { NOISE_GLSL } from "./noiseGlsl.js";

/** Seconds a drop takes to sink and settle after it lands, at speed 1. */
export const DROP_SECONDS = 4.5;

/**
 * Ink dropped into still water, in a canvas one unit high (y down). Each drop sinks as a vortex ring,
 * two opposite cores in this cross-section, whose rim rolls up into a mushroom and frays into filaments.
 * Every pixel traces its water back to the moment each drop landed, so a frame is a pure function of
 * time and the last frame needs no history. The side view draws this where the fluid cannot run.
 */
export const DROP_FRAGMENT = `
precision highp float;
uniform vec2 size;
uniform float time;
uniform float seed;
uniform float swirl;
uniform vec4 drops[3];
uniform vec3 colors[3];
${NOISE_GLSL}
const float A = 0.05;
const float RC = 0.065;
const float G0 = 0.18;
const float T = 3.0;
const float SPREAD = 0.5;
const int K = 16;

// Value noise and its gradient from one look at four corners.
vec2 noiseGrad(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  vec2 du = 6.0 * f * (1.0 - f);
  float a = hash2(i);
  float b = hash2(i + vec2(1.0, 0.0));
  float c = hash2(i + vec2(0.0, 1.0));
  float k = a - b - c + hash2(i + vec2(1.0, 1.0));
  return du * vec2(b - a + k * u.y, c - a + k * u.x);
}

// How far the ring has sunk s seconds after landing. It widens as it slows, a = A (1 + SPREAD u) with
// u = 1 - exp(-s / T), and moves at the speed each core induces at the other, g / (4 pi a).
float sunk(float s) {
  return G0 * T / (12.566 * A * SPREAD) * log(1.0 + SPREAD * (1.0 - exp(-s / T))) * (1.0 - exp(-4.0 * A * A / (RC * RC)));
}

vec2 ringFlow(vec2 p, vec4 d, float tau, float aspect) {
  float s = tau - d.z;
  if (d.w < 0.5 || s < 0.0) return vec2(0.0);
  float a = A * (1.0 + SPREAD * (1.0 - exp(-s / T)));
  float g = G0 * exp(-s / T);
  vec2 r = p - vec2(d.x * aspect, d.y + sunk(s));
  vec2 v = vec2(0.0);
  for (int k = 0; k < 2; k++) {
    float sg = k == 0 ? 1.0 : -1.0;
    vec2 q = r + vec2(sg * a, 0.0);
    float r2 = dot(q, q) + 1e-6;
    v += sg * g / (6.2832 * r2) * (1.0 - exp(-r2 / (RC * RC))) * vec2(-q.y, q.x);
  }
  return v;
}

vec2 velocity(vec2 p, float tau, float aspect) {
  vec2 v = ringFlow(p, drops[0], tau, aspect) + ringFlow(p, drops[1], tau, aspect) + ringFlow(p, drops[2], tau, aspect);
  // Where the water moves, a curl of noise frays it. A curl has no divergence, so ink never bunches up.
  vec2 o = vec2(seed, tau * 0.25);
  vec2 grad = 10.0 * noiseGrad(p * 10.0 + o) + 10.0 * noiseGrad(p * 20.0 - o);
  return v + swirl * (0.002 + 0.6 * length(v)) * vec2(grad.y, -grad.x) * 0.06;
}

float blob(vec2 q, vec4 d, float aspect, float age) {
  vec2 t = q - vec2(d.x * aspect, d.y);
  float w = 0.006 + 0.018 * age;
  float body = smoothstep(0.055 + w, 0.055 - w, length(t));
  // A thin stem where the drop went in.
  float stem = 0.3 * smoothstep(0.004 + 0.3 * w, 0.0, abs(t.x)) * smoothstep(-0.04, -0.01, t.y) * step(t.y, 0.0);
  return max(body, stem);
}

void main() {
  float aspect = size.x / size.y;
  vec2 p = vec2(gl_FragCoord.x / size.y, 1.0 - gl_FragCoord.y / size.y);
  // Ink only ever reaches a box round each drop's path, so the rest of the canvas skips the trace.
  bool near = false;
  for (int j = 0; j < 3; j++) {
    vec4 d = drops[j];
    vec2 r = p - vec2(d.x * aspect, d.y);
    near = near || (d.w > 0.5 && time >= d.z && abs(r.x) < 0.24 && r.y > -0.12 && r.y < sunk(time - d.z) + 0.22);
  }
  if (!near) {
    gl_FragColor = vec4(0.0);
    return;
  }
  // The swirl is fastest just after landing and dies away, so steps are packed toward the start: equal
  // steps in 1 - exp(-t / T), each taken at its midpoint.
  float span = 1.0 - exp(-time / T);
  vec2 q = p;
  float tau = time;
  vec3 got = vec3(-1.0);
  for (int k = 0; k < K; k++) {
    float next = -T * log(1.0 - (1.0 - float(k + 1) / float(K)) * span);
    float h = tau - next;
    vec2 mid = q - 0.5 * h * velocity(q, tau, aspect);
    q -= h * velocity(mid, tau - 0.5 * h, aspect);
    tau = next;
    for (int j = 0; j < 3; j++) {
      vec4 d = drops[j];
      float g = j == 0 ? got.x : j == 1 ? got.y : got.z;
      if (d.w > 0.5 && time >= d.z && g < 0.0 && tau <= d.z + 1e-4) {
        float b = blob(q, d, aspect, time - d.z);
        if (j == 0) got.x = b; else if (j == 1) got.y = b; else got.z = b;
      }
    }
  }
  vec4 col = vec4(0.0);
  for (int j = 0; j < 3; j++) {
    float rho = max(j == 0 ? got.x : j == 1 ? got.y : got.z, 0.0);
    // The ink thins as it spreads, from near black to a grey wash.
    float sigma = 3.5 * (0.3 + 0.7 * exp(-max(time - drops[j].z, 0.0) / 3.0));
    float a = (1.0 - exp(-sigma * rho)) * 0.97;
    col = vec4(colors[j] * a, a) + col * (1.0 - a);
  }
  gl_FragColor = col;
}`;
