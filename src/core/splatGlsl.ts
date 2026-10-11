export const SPLAT_VERTEX = `
attribute vec2 corner;
void main() {
  gl_Position = vec4(corner, 0.0, 1.0);
}`;

/**
 * An ink splat drawn as a distance field: a pool with fingers, beads off the finger tips and thrown
 * droplets, a smaller second splat under it, plus mist. Units are canvas CSS px, y down.
 */
export const SPLAT_FRAGMENT = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform vec2 res;
uniform vec2 size;
uniform float time;
uniform vec3 ink;
uniform vec3 under;
// Per splat. A: centre x, y, throw angle, radius. B: seed, finger spread, finger count.
// C: droplet count, reach, droplet spread, delay.
uniform vec4 R0;
uniform vec3 R1;
uniform vec4 R2;
uniform vec4 K0;
uniform vec3 K1;
uniform vec4 K2;
// Mist. M0: centre x, y, angle, cone (cosine floor). M1: reach, cell size, density (0 for none), delay.
uniform vec4 M0;
uniform vec4 M1;

// Sine-free value noise: sin() of large numbers loses precision on some phone GPUs.
float hash(vec2 p) {
  vec3 q = fract(vec3(p.xyx) * 0.1031);
  q += dot(q, q.yzx + 33.33);
  return fract((q.x + q.y) * q.z);
}
float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm(vec2 p) {
  float s = 0.0;
  float a = 0.5;
  for (int i = 0; i < 4; i++) { s += a * noise(p); p = p * 2.03 + 17.1; a *= 0.5; }
  return s;
}
float expoOut(float x) { return x >= 1.0 ? 1.0 : 1.0 - pow(2.0, -10.0 * max(x, 0.0)); }
float segment(vec2 p, vec2 a, vec2 b, float ra, float rb) {
  vec2 pa = p - a;
  vec2 ba = b - a;
  float h = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-6), 0.0, 1.0);
  return length(pa - ba * h) - mix(ra, rb, h);
}
float smin(float a, float b, float k) {
  float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
  return mix(b, a, h) - k * h * (1.0 - h);
}

// Negative inside the ink.
float splat(vec2 p, vec4 A, vec3 B, vec4 C) {
  float t = time - C.w;
  if (A.w <= 0.0 || t <= 0.0) return 1e4;
  vec2 c = A.xy;
  float radius = A.w;
  float s = B.x;
  vec2 dir = vec2(cos(A.z), sin(A.z));
  vec2 side = vec2(-dir.y, dir.x);
  // An angled hit stretches the pool along the throw.
  vec2 v = p - c;
  v = dir * dot(v, dir) / (1.0 + 0.35 * expoOut(t / 0.2)) + side * dot(v, side);
  float r = length(v);
  vec2 around = v / max(r, 1e-4);
  float rim = radius * (1.0 + 0.25 * (fbm(around * 1.3 + s) - 0.5) + 0.1 * (noise(around * 6.0 + s * 3.0) - 0.5));
  float d = r - rim * expoOut(t / 0.3);
  // Fingers grow longest along the throw; some shed a bead off the tip.
  for (int i = 0; i < 18; i++) {
    float fi = float(i);
    if (fi >= B.z) break;
    float ha = hash(vec2(fi, s));
    float hl = hash(vec2(s, fi + 3.0));
    float hw = hash(vec2(fi + 7.0, s * 1.7));
    float fa = A.z + (ha - 0.5) * B.y;
    float lean = pow(0.5 + 0.5 * cos(fa - A.z), 2.5);
    float len = radius * (0.4 + 2.8 * hl * lean) * expoOut(clamp((t - 0.02) / 0.5, 0.0, 1.0));
    float w = radius * (0.07 + 0.12 * hw);
    vec2 u = vec2(cos(fa), sin(fa));
    vec2 tip = c + u * (rim * 0.8 + len);
    d = smin(d, segment(p, c + u * rim * 0.4, tip, w, w * 0.3), radius * 0.14);
    float gap = radius * (0.15 + 0.35 * hl) * expoOut(clamp((t - 0.08) / 0.6, 0.0, 1.0));
    if (hw > 0.45) d = min(d, length(p - tip - u * gap) - w * (0.5 + 0.5 * hw));
  }
  // Droplets: a motion streak behind while flying; on landing they skid, narrow tail leading.
  for (int i = 0; i < 18; i++) {
    float fi = float(i);
    if (fi >= C.x) break;
    fi += 40.0;
    float ha = hash(vec2(fi, s));
    float hd = hash(vec2(s + 2.0, fi));
    float hr = hash(vec2(fi * 1.3, s + 5.0));
    float fa = A.z + (ha - 0.5) * C.z * (0.35 + hd);
    vec2 u = vec2(cos(fa), sin(fa));
    float dist = radius * (1.9 + 4.6 * hd) * C.y;
    float e = expoOut(clamp((t - 0.02) / (0.3 + 0.55 * hd), 0.0, 1.0));
    vec2 at = c + u * dist * e;
    float rr = radius * (0.025 + 0.11 * pow(hr, 3.0));
    float streak = dist * (1.0 - e) * 0.45;
    if (streak > 0.5) d = min(d, segment(p, at - u * streak, at, rr * 0.3, rr));
    d = min(d, segment(p, at, at + u * rr * (1.0 + 3.0 * hd) * e, rr, rr * 0.2));
  }
  return d;
}

// At most one speck per grid cell, inside the throw's cone, landing later the further out it is.
// Returns the speck's distance in x when it is the main ink, in y when it is the second.
vec2 mist(vec2 p) {
  if (M1.z <= 0.0) return vec2(1e4);
  float t = time - M1.w;
  vec2 cell = floor(p / M1.y);
  vec2 at = (cell + 0.2 + 0.6 * vec2(hash(cell + 3.1), hash(cell + 8.7))) * M1.y;
  vec2 f = at - M0.xy;
  float far = length(f);
  float cone = smoothstep(M0.w, M0.w + 0.2, dot(f / max(far, 1e-4), vec2(cos(M0.z), sin(M0.z))));
  float inside = cone * smoothstep(M1.x, M1.x * 0.25, far) * smoothstep(M1.x * 0.06, M1.x * 0.14, far);
  float landed = smoothstep(0.0, 0.35, t - 0.15 - far / M1.x * 0.45 - hash(cell + 2.0) * 0.2);
  float d = step(hash(cell) / M1.z, inside * landed) > 0.5 ? length(p - at) - 0.7 * (0.5 + hash(cell + 1.3)) : 1e4;
  return hash(cell + 4.0) < 0.3 ? vec2(1e4, d) : vec2(d, 1e4);
}

void main() {
  vec2 p = vec2(gl_FragCoord.x, res.y - gl_FragCoord.y) / res * size;
  float px = size.y / res.y;
  // Ragged at the pigment scale, so no edge is a clean vector line.
  float rough = (noise(p * 0.35) - 0.5) * 0.9 + (noise(p * 0.09) - 0.5) * 1.4;
  vec2 specks = mist(p);
  float dr = min(splat(p, R0, R1, R2) + rough, specks.x);
  float dk = min(splat(p, K0, K1, K2) + rough, specks.y);
  float kr = smoothstep(px, -px, dr);
  float kb = smoothstep(px, -px, dk);
  // Dried rims are darker; granulation breaks up flat colour; ink over ink only darkens.
  float grain = 0.88 + 0.24 * fbm(p * 0.7);
  vec3 r = ink * mix(1.0, 0.72, smoothstep(5.0, 0.0, -dr)) * grain;
  vec3 k = under * mix(1.0, 0.85, smoothstep(4.0, 0.0, -dk));
  gl_FragColor = vec4(r * kr * (1.0 - kb) + k * kb * (1.0 - kr) + r * k * kr * kb, kr + kb - kr * kb);
}`;
