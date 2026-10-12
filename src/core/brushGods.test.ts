import { describe, expect, it } from "vitest";
import { ensoStroke, fudePad } from "./fude";
import { bloomPainter, growBranch } from "./hanasaka";
import { slashPainter } from "./tachigami";

describe("growBranch", () => {
  const branch = growBranch(3, 4 / 3, [-0.04, 0.8], 0.45, 1, 22);

  it("grows the same branch from the same seed", () => {
    expect(growBranch(3, 4 / 3, [-0.04, 0.8], 0.45, 1, 22)).toEqual(branch);
    expect(growBranch(4, 4 / 3, [-0.04, 0.8], 0.45, 1, 22)).not.toEqual(branch);
  });

  it("stays inside the shader's room", () => {
    const small = growBranch(3, 4 / 3, [-0.04, 0.8], 0.45, 1, 40, { segs: 6, flowers: 5, petals: 2 });
    expect(small.segs.length).toBeLessThanOrEqual(6);
    expect(small.blooms.length).toBeLessThanOrEqual(5);
    expect(branch.segs.length).toBeLessThanOrEqual(24);
    expect(branch.blooms.length).toBe(22);
  });

  it("paints the branch in first and opens every blossom before the end", () => {
    for (const [, , , , , , t0, t1] of branch.segs) {
      expect(t0).toBeGreaterThanOrEqual(0);
      expect(t1).toBeLessThanOrEqual(0.45 + 1e-9);
    }
    const opens = branch.blooms.map((b) => b[4]);
    expect(Math.max(...opens)).toBeLessThanOrEqual(0.82);
    expect(opens).toEqual([...opens].sort((a, b) => a - b));
  });

  it("starts where it was told", () => {
    const [ax, ay] = branch.segs[0] ?? [];
    expect(ax).toBeCloseTo((-0.04 - 0.5) * (4 / 3), 6);
    expect(ay).toBeCloseTo(0.5 - 0.8, 6);
  });
});

describe("ensoStroke", () => {
  it("stays on the canvas and leaves a gap", () => {
    const { points } = ensoStroke();
    for (const [x, y] of points) {
      expect(x).toBeGreaterThan(0);
      expect(x).toBeLessThan(1);
      expect(y).toBeGreaterThan(0);
      expect(y).toBeLessThan(1);
    }
    const [first] = points;
    const last = points[points.length - 1];
    expect(Math.hypot((first?.[0] ?? 0) - (last?.[0] ?? 0), (first?.[1] ?? 0) - (last?.[1] ?? 0))).toBeGreaterThan(0.05);
  });
});

describe("without WebGL", () => {
  it("returns no painter and no pad", () => {
    const noWebGL = { getContext: () => null } as unknown as HTMLCanvasElement;
    expect(slashPainter(noWebGL, () => ({}) as HTMLImageElement)).toBeNull();
    expect(bloomPainter(noWebGL)).toBeNull();
    expect(fudePad(noWebGL)).toBeNull();
  });
});
