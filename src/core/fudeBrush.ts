/** A footprint: where, facing which way, how wide, the ink left in the brush and how dark it lays. */
export type Stamp = readonly [x: number, y: number, dx: number, dy: number, radius: number, load: number, tone: number];
type Point = readonly [number, number];

/**
 * The hand on the brush, in device px. It turns pointer samples into footprints every half pixel along
 * a smoothed curve. The brush goes in thin and presses, runs thinner when fast and with less pressure,
 * spends ink with distance, and on lifting either rounds off (tome) or flicks off dry (harai).
 */
export class Brush {
  down = false;
  bristles = 12;
  private stamps: Stamp[] = [];
  // a: where the last curve ended; c: its control point, the last smoothed sample.
  private a: Point = [0, 0];
  private c: Point = [0, 0];
  private t = 0;
  private speed = 0;
  private pressure = 0.5;
  private radius = 0;
  private dir: Point = [1, 0];
  private load = 1;
  private travelled = 0;

  /** `base` is the half width in device px, `dryAfter` the device px a full load lasts, `pixel` device px per CSS px. */
  constructor(
    private readonly base: number,
    private readonly dryAfter: number,
    private readonly pixel: number,
  ) {}

  /** The footprints laid since the last call. */
  take(): Stamp[] {
    const out = this.stamps;
    this.stamps = [];
    return out;
  }

  press(x: number, y: number, t: number, pressure: number): void {
    Object.assign(this, { down: true, a: [x, y], c: [x, y], t, speed: 0, pressure, radius: this.base * 0.45, load: 1, travelled: 0 });
    this.bristles = Math.max(6, Math.round((this.base * 2) / (2.4 * this.pixel)));
    this.stamp(x, y, this.radius);
  }

  move(x: number, y: number, t: number, pressure: number): void {
    if (!this.down) return;
    // A light low-pass on the hand, so a mouse's steps do not show.
    const p: Point = [this.c[0] + (x - this.c[0]) * 0.65, this.c[1] + (y - this.c[1]) * 0.65];
    const d = Math.hypot(p[0] - this.c[0], p[1] - this.c[1]);
    if (d < 0.3) return;
    this.speed = this.speed * 0.75 + (d / Math.max(t - this.t, 1) / this.pixel) * 0.25;
    this.pressure = this.pressure * 0.6 + pressure * 0.4;
    this.t = t;
    const mid: Point = [(this.c[0] + p[0]) / 2, (this.c[1] + p[1]) / 2];
    this.curve(this.a, this.c, mid);
    this.a = mid;
    this.c = p;
  }

  lift(x: number, y: number, t: number, pressure: number): void {
    if (!this.down) return;
    this.move(x, y, t, pressure);
    this.curve(this.a, this.c, this.c);
    const r0 = this.radius;
    const [fx, fy] = this.c;
    const fast = this.speed > 0.8;
    // A fast lift flicks the brush off to a dry point (harai); a slow one settles and rounds off (tome).
    const reach = fast ? Math.min(Math.max((this.speed - 0.8) * 3, 0.6), 3) * this.base : this.base * 0.5;
    const steps = Math.ceil(reach / 0.5);
    for (let i = 1; i <= steps; i++) {
      const f = i / steps;
      if (fast) this.load -= 1.6 / steps;
      this.stamp(fx + this.dir[0] * reach * f, fy + this.dir[1] * reach * f, fast ? r0 * (1 - f) ** 1.2 : r0 * (1.05 - 0.35 * f * f));
    }
    this.down = false;
  }

  // Fast strokes skip over the paper: they lay less ink and break up sooner, and read greyer.
  private stamp(x: number, y: number, radius: number): void {
    const load = this.load - 0.25 * Math.min(Math.max(this.speed - 0.7, 0), 2);
    const tone = 0.97 - 0.14 * Math.min(this.speed / 1.5, 1) - 0.18 * (1 - Math.max(this.load, 0));
    this.stamps.push([x, y, this.dir[0], this.dir[1], Math.max(radius, 0.35), Math.max(load, -0.5), tone]);
  }

  private target(): number {
    const press = 0.55 + this.pressure * 0.9;
    const pace = Math.min(Math.max(1.2 - 0.5 * this.speed, 0.42), 1.2);
    // The brush goes in and presses down, then settles: a swell over its first breadth or two.
    const land = 1 + 0.38 * Math.exp(-this.travelled / (this.base * 1.4));
    return this.base * press * pace * land;
  }

  private curve(from: Point, ctrl: Point, to: Point): void {
    const len = Math.hypot(ctrl[0] - from[0], ctrl[1] - from[1]) + Math.hypot(to[0] - ctrl[0], to[1] - ctrl[1]);
    if (len < 0.01) return;
    const steps = Math.ceil(len / 0.5);
    let prev = from;
    for (let k = 1; k <= steps; k++) {
      const u = k / steps;
      const v = 1 - u;
      const p: Point = [v * v * from[0] + 2 * v * u * ctrl[0] + u * u * to[0], v * v * from[1] + 2 * v * u * ctrl[1] + u * u * to[1]];
      const tx = 2 * v * (ctrl[0] - from[0]) + 2 * u * (to[0] - ctrl[0]);
      const ty = 2 * v * (ctrl[1] - from[1]) + 2 * u * (to[1] - ctrl[1]);
      const tl = Math.hypot(tx, ty);
      if (tl > 1e-6) this.dir = [tx / tl, ty / tl];
      const ds = Math.hypot(p[0] - prev[0], p[1] - prev[1]);
      this.travelled += ds;
      this.load -= ds / this.dryAfter;
      this.radius += (this.target() - this.radius) * (1 - Math.exp(-ds / (this.base * 0.9)));
      this.stamp(p[0], p[1], this.radius);
      prev = p;
    }
  }
}
