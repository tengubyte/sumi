import { Brush } from "./fudeBrush.js";
import { InkSheet } from "./fudeSheet.js";
import { traceStroke, type FudeStroke, type Hand } from "./fudeTrace.js";
import { prefersReducedMotion } from "./play.js";
import { random } from "./random.js";
import { rgb, type Hex } from "./splatShader.js";

export { ensoStroke, type FudeStroke } from "./fudeTrace.js";

export interface FudeOptions {
  /** The ink. Default `#161314` (sumi). */
  readonly color?: Hex | undefined;
  /** The brush's half width in CSS px at an even pace. Default 9. */
  readonly size?: number | undefined;
  /** CSS px of stroke a loaded brush lasts before it is dry. Default 1200. */
  readonly dryAfter?: number | undefined;
  /** Seconds of rest before the strokes fade; 0 keeps them. Default 1.6. */
  readonly fadeAfter?: number | undefined;
  /** Told when the brush goes down and comes up, to change the page while drawing. */
  readonly onDrawing?: ((drawing: boolean) => void) | undefined;
  /** Changes how much ink each bristle holds. Default 1. */
  readonly seed?: number | undefined;
}

export interface FudePad {
  /** Draws a stroke as a hand would, resolving when the brush lifts. Reduced motion draws it at once. */
  trace(stroke: FudeStroke): Promise<void>;
  /** Wipes the paper. */
  clear(): void;
  /** Stops listening and releases the WebGL context. */
  stop(): void;
}

/** Feeds pointer input to `hand` in device px. A pen's pressure counts; a mouse or finger presses evenly. */
function listen(canvas: HTMLCanvasElement, hand: Hand, pixel: () => number): () => void {
  const at = (e: PointerEvent): [number, number] => {
    const r = canvas.getBoundingClientRect();
    return [(e.clientX - r.left) * pixel(), (e.clientY - r.top) * pixel()];
  };
  const force = (e: PointerEvent): number => (e.pointerType === "pen" ? e.pressure : 0.5);
  const onDown = (e: PointerEvent): void => {
    if (e.button !== 0) return;
    canvas.setPointerCapture(e.pointerId);
    hand.down(...at(e), e.timeStamp, force(e));
  };
  // Coalesced events keep the curve of a fast stroke. Safari has none.
  const onMove = (e: PointerEvent): void => {
    const coalesced = "getCoalescedEvents" in e ? e.getCoalescedEvents() : [];
    for (const c of coalesced.length > 0 ? coalesced : [e]) hand.move(...at(c), c.timeStamp, force(c));
  };
  const onUp = (e: PointerEvent): void => {
    hand.up(...at(e), e.timeStamp, force(e));
  };
  const events = [["pointerdown", onDown], ["pointermove", onMove], ["pointerup", onUp], ["pointercancel", onUp]] as const;
  for (const [name, handler] of events) canvas.addEventListener(name, handler);
  return () => {
    for (const [name, handler] of events) canvas.removeEventListener(name, handler);
  };
}

class Pad implements Hand {
  private brush: Brush;
  private restedAt = 0;
  private alpha = 1;
  private frame = 0;
  private readonly reduced = prefersReducedMotion();
  private readonly fadeAfter: number;
  private readonly unlisten: () => void;
  private readonly resize: ResizeObserver;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly sheet: InkSheet,
    private readonly options: FudeOptions,
  ) {
    this.fadeAfter = Math.max(options.fadeAfter ?? 1.6, 0);
    this.brush = this.fresh();
    this.unlisten = listen(canvas, this, () => sheet.pixel);
    // A resize wipes the paper, so it waits for the brush to lift.
    this.resize = new ResizeObserver(() => {
      if (this.brush.down) return;
      if (sheet.fit()) this.brush = this.fresh();
      sheet.show(this.alpha);
    });
    this.resize.observe(canvas);
    canvas.style.touchAction = "none";
    canvas.addEventListener("webglcontextlost", this.stop);
  }

  down(x: number, y: number, t: number, pressure: number): void {
    this.brush.press(x, y, t, pressure);
    this.alpha = 1;
    this.restedAt = 0;
    this.options.onDrawing?.(true);
    this.run();
  }

  move(x: number, y: number, t: number, pressure: number): void {
    if (!this.brush.down) return;
    this.brush.move(x, y, t, pressure);
    this.run();
  }

  up(x: number, y: number, t: number, pressure: number): void {
    if (!this.brush.down) return;
    this.brush.lift(x, y, t, pressure);
    this.restedAt = performance.now();
    this.options.onDrawing?.(false);
    this.run();
  }

  trace(stroke: FudeStroke): Promise<void> {
    return traceStroke(stroke, this.canvas.width, this.canvas.height, this, this.reduced);
  }

  clear(): void {
    this.sheet.wipe();
    this.sheet.show(this.alpha);
  }

  readonly stop = (): void => {
    cancelAnimationFrame(this.frame);
    this.frame = 0;
    this.unlisten();
    this.resize.disconnect();
    this.canvas.removeEventListener("webglcontextlost", this.stop);
    // Chrome paints a canvas whose WebGL context was released as a white box, so the canvas leaves the page too.
    this.canvas.hidden = true;
    this.sheet.release();
  };

  private fresh(): Brush {
    const { pixel } = this.sheet;
    return new Brush((this.options.size ?? 9) * pixel, Math.max(this.options.dryAfter ?? 1200, 1) * pixel, pixel);
  }

  private run(): void {
    if (this.frame === 0) this.frame = requestAnimationFrame(this.tick);
  }

  // Runs while drawing or fading, and stops once the paper is clean again.
  private readonly tick = (now: number): void => {
    this.frame = 0;
    this.sheet.lay(this.brush.take(), this.brush.bristles);
    let more = this.brush.down;
    if (!this.brush.down && this.fadeAfter > 0 && this.restedAt > 0) {
      const rest = (now - this.restedAt) / 1000 - this.fadeAfter;
      this.alpha = this.reduced ? (rest >= 0 ? 0 : 1) : 1 - Math.min(Math.max(rest / 0.9, 0), 1);
      more = this.alpha > 0;
      if (!more) {
        this.sheet.wipe();
        this.alpha = 1;
        this.restedAt = 0;
      }
    }
    this.sheet.show(this.alpha);
    if (more) this.run();
  };
}

/**
 * Lets the visitor draw on `canvas` with a sumi brush. The brush goes in thin and presses, runs thinner
 * and greyer when fast, and dries out bristle by bristle into streaks; a slow lift stops round and a fast
 * one flicks off dry. A pen's pressure changes the width. Size the canvas with CSS; a resize wipes it.
 * Returns null without WebGL.
 */
export function fudePad(canvas: HTMLCanvasElement, options: FudeOptions = {}): FudePad | null {
  const sheet = InkSheet.open(canvas, rgb(options.color ?? "#161314"), random(options.seed ?? 1)() * 50);
  if (!sheet) return null;
  const pad = new Pad(canvas, sheet, options);
  return {
    trace: (stroke) => pad.trace(stroke),
    clear: () => {
      pad.clear();
    },
    stop: pad.stop,
  };
}
