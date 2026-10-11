/**
 * Embers as short streaks, one quad per ember: `vert` is the ember's index and the quad corner. Positions are
 * in canvas heights, x from 0 to the aspect ratio, y up. Each ember leaves `source` (spread across `spread`
 * of the width), is thrown up hard in a burst, then rises on the heat, swaying in eddies and drifting with
 * `wind`. A share `ashShare` are dark flakes of ash that tumble instead.
 */
export const HINOKO_VERTEX = `
attribute vec3 vert;
uniform vec2 size;
uniform float pixel;
uniform float time;
uniform float seed;
uniform float burst;
uniform vec2 source;
uniform float spread;
uniform float wind;
uniform float ashShare;
varying vec2 corner;
varying float heat;
varying float fade;
varying float ash;
varying float shape;
varying float segment;
float h(float n) {
  return fract(sin(n * 12.9898 + seed * 78.233) * 43758.5453);
}
vec2 place(float id, float age) {
  float aspect = size.x / size.y;
  float isAsh = step(h(id + 9.0), ashShare);
  vec2 pos = vec2(source.x * aspect + (h(id + 3.0) - 0.5) * spread * aspect, source.y);
  pos += vec2(wind, mix(0.22, 0.45, h(id + 4.0)) * mix(1.0, 0.55, isAsh)) * age;
  if (burst > 0.5) {
    // Thrown up hard at first, then drag takes over and the heat carries them.
    float a = (h(id + 5.0) - 0.5) * 1.3;
    pos += vec2(sin(a), cos(a)) * mix(0.25, 0.9, h(id + 6.0)) * (1.0 - exp(-age * 2.6)) / 2.6;
  }
  // Air that eddies: two slow sways and a faster flutter, stronger as the ember climbs.
  float ph = h(id + 7.0) * 6.2832;
  pos.x += (0.035 * sin(age * 1.3 + ph) + 0.018 * sin(age * 3.7 + ph * 2.0)) * min(age, 1.0) + 0.006 * sin(age * 11.0 + ph * 3.0);
  pos.y += 0.01 * sin(age * 2.3 + ph);
  return pos;
}
void main() {
  float id = vert.x;
  float life = mix(2.4, 5.0, h(id + 1.0));
  float age = burst > 0.5 ? time - 0.7 * pow(h(id + 2.0), 2.0) : mod(time + h(id + 2.0) * 40.0, life);
  float k = age / life;
  ash = step(h(id + 9.0), ashShare);
  shape = h(id + 13.0);
  vec2 pos = place(id, age);
  vec2 vel = (pos - place(id, max(age - 0.04, 0.0))) / 0.04;
  float speed = length(vel);
  vec2 along = speed > 0.0001 ? vel / speed : vec2(0.0, 1.0);
  float radius = mix(1.2, 3.0, h(id + 8.0)) * pixel / size.y * mix(1.0, 1.7, ash);
  float len = ash > 0.5 ? radius : max(radius, speed * 0.03);
  if (ash > 0.5) {
    float spin = age * mix(-3.0, 3.0, h(id + 11.0));
    along = vec2(cos(spin), sin(spin));
  }
  // Room round each ember for its glow.
  float pad = ash > 0.5 ? 1.2 : 3.5;
  corner = vec2(vert.y * (len / radius + pad), vert.z * pad);
  segment = len / radius - 1.0;
  heat = (1.0 - k) * (0.65 + 0.35 * sin(age * mix(9.0, 23.0, h(id + 10.0)) + id));
  // The fire catches over the first second, so a loop does not open on a sky already full of embers.
  fade = step(0.0, age) * step(age, life) * smoothstep(0.0, 0.06, k) * (1.0 - smoothstep(0.7, 1.0, k)) * max(burst, clamp(time, 0.0, 1.0));
  vec2 at = pos + along * vert.y * (len + radius * pad) + vec2(-along.y, along.x) * vert.z * radius * pad;
  gl_Position = vec4(vec2(at.x * size.y / size.x, at.y) * 2.0 - 1.0, 0.0, 1.0);
}`;

/** Light, so it adds up: a hot core and a halo, white-yellow when fresh and red as it cools. Ash covers instead. */
export const HINOKO_FRAGMENT = `
precision highp float;
varying vec2 corner;
varying float heat;
varying float fade;
varying float ash;
varying float shape;
varying float segment;
void main() {
  if (ash > 0.5) {
    float a = atan(corner.y, corner.x);
    float r = length(corner * vec2(1.0, 1.6 + shape));
    float edge = 0.9 + 0.18 * sin(a * 3.0 + shape * 20.0) + 0.1 * sin(a * 7.0 - shape * 9.0);
    float f = smoothstep(edge, edge - 0.4, r) * fade * 0.5;
    gl_FragColor = vec4(vec3(0.2, 0.18, 0.18) * f, f);
    return;
  }
  vec2 d = vec2(max(abs(corner.x) - segment, 0.0), corner.y);
  float r2 = dot(d, d);
  vec3 col = heat < 0.5 ? mix(vec3(0.55, 0.04, 0.02), vec3(1.0, 0.38, 0.06), heat * 2.0) : mix(vec3(1.0, 0.38, 0.06), vec3(1.0, 0.86, 0.55), heat * 2.0 - 1.0);
  float i = (exp(-r2 * 2.2) + exp(-r2 * 0.35) * 0.35 * heat) * fade * (0.4 + 0.8 * heat);
  gl_FragColor = vec4(col * i, max(col.r, max(col.g, col.b)) * i);
}`;
