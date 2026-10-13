import { NOISE_GLSL } from "./noiseGlsl.js";

// Stable fluids (Stam 1999) for the side view. Each pass reads its four neighbours, a texel apart.
export const FLUID_VERTEX = `
attribute vec2 corner;
uniform vec2 texel;
varying vec2 uv, l, r, t, b;
void main() {
  uv = corner * 0.5 + 0.5;
  l = uv - vec2(texel.x, 0.0);
  r = uv + vec2(texel.x, 0.0);
  t = uv + vec2(0.0, texel.y);
  b = uv - vec2(0.0, texel.y);
  gl_Position = vec4(corner, 0.0, 1.0);
}`;

const HEAD = `
precision highp float;
varying vec2 uv, l, r, t, b;
`;

/** Carries a field along the water's velocity, in canvas heights per second, by tracing each cell back. */
export const ADVECT = `${HEAD}
uniform sampler2D vel, src;
uniform float dt, decay, aspect;
void main() {
  vec2 v = texture2D(vel, uv).xy;
  gl_FragColor = decay * texture2D(src, uv - dt * vec2(v.x / aspect, v.y));
}`;

export const CURL = `${HEAD}
uniform sampler2D vel;
uniform float h;
void main() {
  float c = texture2D(vel, r).y - texture2D(vel, l).y - texture2D(vel, t).x + texture2D(vel, b).x;
  gl_FragColor = vec4(c / (2.0 * h), 0.0, 0.0, 1.0);
}`;

/**
 * Vorticity confinement, eps h (N x w), puts back the small swirls the coarse grid smears away. Ink is
 * heavier than water and sinks where it gathers; that pull on uneven ink grows the caps and fingers.
 */
export const FORCE = `${HEAD}
uniform sampler2D vel, curl, ink;
uniform float dt, eps, sink, h;
void main() {
  float c = texture2D(curl, uv).x;
  vec2 n = vec2(abs(texture2D(curl, t).x) - abs(texture2D(curl, b).x), abs(texture2D(curl, r).x) - abs(texture2D(curl, l).x));
  n /= length(n) + 1e-4;
  vec2 v = texture2D(vel, uv).xy + dt * eps * h * c * vec2(n.x, -n.y);
  v.y -= dt * sink * texture2D(ink, uv).a;
  gl_FragColor = vec4(v, 0.0, 1.0);
}`;

/** The walls reflect the flow, so no water leaves the canvas. */
export const DIVERGENCE = `${HEAD}
uniform sampler2D vel;
uniform float h;
void main() {
  vec2 c = texture2D(vel, uv).xy;
  float L = l.x < 0.0 ? -c.x : texture2D(vel, l).x;
  float R = r.x > 1.0 ? -c.x : texture2D(vel, r).x;
  float T = t.y > 1.0 ? -c.y : texture2D(vel, t).y;
  float B = b.y < 0.0 ? -c.y : texture2D(vel, b).y;
  gl_FragColor = vec4((R - L + T - B) / (2.0 * h), 0.0, 0.0, 1.0);
}`;

export const JACOBI = `${HEAD}
uniform sampler2D p, div;
uniform float h;
void main() {
  float s = texture2D(p, l).x + texture2D(p, r).x + texture2D(p, t).x + texture2D(p, b).x;
  gl_FragColor = vec4((s - h * h * texture2D(div, uv).x) * 0.25, 0.0, 0.0, 1.0);
}`;

/** Takes the pressure gradient off, which leaves water that neither bunches nor thins. */
export const PROJECT = `${HEAD}
uniform sampler2D p, vel;
uniform float h;
void main() {
  vec2 g = vec2(texture2D(p, r).x - texture2D(p, l).x, texture2D(p, t).x - texture2D(p, b).x) / (2.0 * h);
  gl_FragColor = vec4(texture2D(vel, uv).xy - g, 0.0, 1.0);
}`;

/** Adds a soft, uneven blob: ink as premultiplied colour with its amount in alpha, or a push of velocity. */
export const SPLAT = `${HEAD}
${NOISE_GLSL}
uniform sampler2D src;
uniform vec2 at;
uniform float aspect, radius, rough, seed;
uniform vec4 add;
void main() {
  vec2 e = uv - at;
  e.x *= aspect;
  float g = exp(-dot(e, e) / (radius * radius));
  float n = mix(1.0, 0.4 + 1.2 * fbm(uv * vec2(aspect, 1.0) * 40.0 + seed), rough);
  gl_FragColor = texture2D(src, uv) + add * g * n;
}`;

/**
 * Ink to premultiplied colour: thick ink is near opaque, a thin wash lets the page through. Ink that
 * reaches the walls fades out over the last few pixels, so the water reads as wider than the canvas.
 */
export const SHOW = `${HEAD}
uniform sampler2D ink;
uniform float strength, aspect;
void main() {
  vec4 i = texture2D(ink, uv);
  float d = max(i.a, 0.0);
  float wall = min(min(uv.x, 1.0 - uv.x) * aspect, min(uv.y, 1.0 - uv.y));
  float a = (1.0 - exp(-strength * d)) * smoothstep(0.0, 0.06, wall);
  gl_FragColor = vec4(clamp(i.rgb / max(d, 1e-4), 0.0, 1.0) * a, a);
}`;
