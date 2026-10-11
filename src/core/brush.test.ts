import { describe, expect, it } from "vitest";
import { corners, headAt, radiusAt, arcLengths, type StrokeShape } from "./brushProfile";
import { ensoArt } from "./enso";
import { buildRibbon, RIBBON_FLOATS } from "./ribbon";
import { fitView, strokePainter, strokeTimeline } from "./strokePainter";
import { endFor, type Point } from "./strokes";

const line = (n: number, to: (u: number) => Point): Point[] => Array.from({ length: n + 1 }, (_, i) => to(i / n));
const flat = line(100, (u) => [u * 100, 0]);
// Right then down: one sharp turn at (50, 0).
const elbow = [...line(50, (u) => [u * 50, 0]), ...line(50, (u) => [50, u * 50]).slice(1)];
const shape = (end: StrokeShape["end"]): StrokeShape => ({ length: 100, radius: 4, end, turns: [], tail: 0 });

describe("endFor", () => {
  it("reads KanjiVG stroke types by their first character", () => {
    expect(endFor("㇆/㇚")).toBe("hane");
    expect(endFor("㇒")).toBe("harai");
    expect(endFor("㇏")).toBe("na");
    expect(endFor("㇔")).toBe("dot");
    expect(endFor("㇐a")).toBe("tome");
  });

  it("takes data-brush-end names as they are and falls back to tome", () => {
    expect(endFor("harai")).toBe("harai");
    expect(endFor(null)).toBe("tome");
    expect(endFor("brushy")).toBe("tome");
  });
});

describe("brush profile", () => {
  it("sweeps a harai out to a point but keeps a tome full to its end", () => {
    expect(radiusAt(100, shape("harai"))).toBeLessThan(0.2);
    expect(radiusAt(100, shape("tome"))).toBeCloseTo(4, 1);
  });

  it("finds one turn in an elbow and none in a straight line", () => {
    expect(corners(elbow, arcLengths(elbow), 4)).toHaveLength(1);
    expect(corners(flat, arcLengths(flat), 4)).toEqual([]);
  });

  it("moves the head from the start to the end of the stroke", () => {
    for (const end of ["tome", "harai", "hane"] as const) {
      expect(headAt(0, shape(end))).toBeCloseTo(0);
      expect(headAt(1, shape(end))).toBeCloseTo(100);
    }
  });
});

describe("buildRibbon", () => {
  it("lays one strip per piece, two vertices per point plus a cap at each end", () => {
    const { data, strokes } = buildRibbon([{ points: flat, end: "tome" }], 4, 0);
    expect(strokes[0]?.pieces).toEqual([{ first: 0, count: (101 + 2) * 2 }]);
    expect(data.length).toBe((101 + 2) * 2 * RIBBON_FLOATS);
  });

  it("splits a stroke at a sharp turn so each piece gets round caps", () => {
    expect(buildRibbon([{ points: elbow, end: "tome" }], 4, 0).strokes[0]?.pieces).toHaveLength(2);
  });
});

describe("strokeTimeline", () => {
  it("paints strokes one after another, longer ones for longer, faster with speed", () => {
    const { strokes } = buildRibbon([{ points: flat, end: "tome" }, { points: line(10, (u) => [u * 10, 20]), end: "dot" }], 4, 0);
    const { times, duration } = strokeTimeline(strokes, 141, 1);
    const [first, second] = times;
    expect(first && second && second.start >= first.start + first.duration).toBe(true);
    expect((first?.duration ?? 0) > (second?.duration ?? 0)).toBe(true);
    expect(strokeTimeline(strokes, 141, 2).duration).toBeLessThan(duration);
  });
});

describe("fitView", () => {
  it("grows the art's box to the canvas's shape, keeping it centred", () => {
    expect(fitView([0, 0, 100, 100], 200, 100)).toEqual([-50, 0, 200, 100]);
    expect(fitView([0, 0, 100, 100], 100, 200)).toEqual([0, -50, 100, 200]);
  });
});

describe("ensoArt", () => {
  it("draws the same ensō for the same seed and a different one for another", () => {
    expect(ensoArt(7)).toEqual(ensoArt(7));
    expect(ensoArt(8).art.strokes[0]?.points[0]).not.toEqual(ensoArt(7).art.strokes[0]?.points[0]);
  });

  it("stays inside its box and leaves a gap", () => {
    const points = ensoArt(3).art.strokes[0]?.points ?? [];
    expect(points.every(([x, y]) => x > 0 && x < 200 && y > 0 && y < 200)).toBe(true);
    const [sx, sy] = points[0] ?? [0, 0];
    const [ex, ey] = points[points.length - 1] ?? [0, 0];
    expect(Math.hypot(ex - sx, ey - sy)).toBeGreaterThan(10);
  });
});

describe("without WebGL", () => {
  it("returns no painter", () => {
    const noWebGL = { getContext: () => null } as unknown as HTMLCanvasElement;
    expect(strokePainter(noWebGL, { box: [0, 0, 1, 1], strokes: [] })).toBeNull();
  });
});
