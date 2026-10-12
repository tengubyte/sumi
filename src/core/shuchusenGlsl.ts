/**
 * Manga focus lines, in device px. `lines` 0 runs inked spikes in from past the frame toward `focus` (x, y
 * from the bottom left, as shares), each tapering to a point round a clear oval with half widths `clear`
 * (shares of width and height); they shoot in over the first 0.35 s. `lines` 1 lays the same spikes
 * parallel to `angle`, streaming past. Every 1 / `fps` s the lines are drawn anew, so they shiver like a
 * cut-in drawn on few frames.
 */
export const SHUCHUSEN_FRAGMENT = `
precision highp float;
uniform vec2 size;
uniform float time;
uniform float seed;
uniform float lines;
uniform vec2 focus;
uniform vec2 clear;
uniform float count;
uniform float weight;
uniform float fps;
uniform float angle;
uniform float speed;
uniform vec3 color;
float hash(vec2 p) {
  vec3 q = fract(vec3(p.xyx) * 0.1031);
  q += dot(q, q.yzx + 33.33);
  return fract((q.x + q.y) * q.z);
}
float focusLines(vec2 frag, float m, float step_) {
  vec2 d = frag - focus * size;
  float th = atan(d.y, d.x);
  float slot = 6.2831853 / count;
  float k0 = floor((th + 3.1415927) / slot);
  float shoot = 1.0 - pow(1.0 - clamp(time / 0.35, 0.0, 1.0), 3.0);
  float ink = 0.0;
  for (int j = -2; j <= 2; j++) {
    float k = mod(k0 + float(j), count);
    vec2 key = vec2(k, step_ + seed * 13.0);
    float h1 = hash(key);
    float h2 = hash(key + 17.3);
    float h3 = hash(key + 41.9);
    if (h3 < 0.18) continue;
    float a = -3.1415927 + (k + 0.1 + 0.8 * h1) * slot;
    vec2 dir = vec2(cos(a), sin(a));
    // Each line stops at the oval, pushed out a little further by its own length.
    float rin = mix(length(size), (1.0 + 0.55 * h2 * h2) / length(dir / (clear * size)), shoot);
    float along = dot(d, dir);
    if (along < rin) continue;
    // Thin at the tip and full width a long way out, as one pull of the pen.
    float w = weight * m * (0.25 + 1.6 * h3 * h3) * pow(clamp((along - rin) / (0.55 * m), 0.0, 1.0), 0.8);
    ink = max(ink, smoothstep(w + 0.75, w - 0.75, abs(dot(d, vec2(-dir.y, dir.x)))));
  }
  return ink;
}
float speedLines(vec2 frag, float m, float step_) {
  vec2 dir = vec2(cos(angle), sin(angle));
  vec2 q = vec2(dot(frag, dir), dot(frag, vec2(-dir.y, dir.x)));
  float gap = m * 0.011;
  float k0 = floor(q.y / gap);
  float run = dot(size, abs(dir)) + m;
  float ink = 0.0;
  for (int j = -1; j <= 1; j++) {
    float k = k0 + float(j);
    float h1 = hash(vec2(k, seed));
    float h2 = hash(vec2(k + 9.1, seed));
    float h3 = hash(vec2(k + 3.7, step_ + seed));
    if (h1 < 0.35) continue;
    float y = (k + 0.5 + 0.6 * (h2 - 0.5)) * gap;
    float len = m * (0.25 + 0.8 * h2);
    // Each line streams past at its own pace and shivers sideways on every drawn frame.
    float x0 = mod(h1 * 997.0 + time * speed * m * (1.6 + 2.4 * h2), run + len) - len - m * 0.5;
    float t = (q.x - x0) / len;
    if (t < 0.0 || t > 1.0) continue;
    float w = weight * m * (0.2 + 1.2 * h1 * h1) * sin(3.1415927 * t);
    ink = max(ink, smoothstep(w + 0.75, w - 0.75, abs(q.y - y - (h3 - 0.5) * gap * 0.25)));
  }
  return ink;
}
void main() {
  float m = min(size.x, size.y);
  float step_ = floor(time * fps);
  float a = lines < 0.5 ? focusLines(gl_FragCoord.xy, m, step_) : speedLines(gl_FragCoord.xy, m, step_);
  gl_FragColor = vec4(color * a, a);
}`;
