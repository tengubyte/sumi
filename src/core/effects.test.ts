import { describe, expect, it } from "vitest";
import { MARK_TYPES, markPad, markStrokes } from "./mark";
import { sansuiPainter } from "./sansui";
import { blotUniforms, wipePainter } from "./wipeIn";

describe("markStrokes", () => {
  it("keeps every mark inside its padded overlay", () => {
    const w = 160;
    const h = 40;
    const size = [w + 2 * markPad(h), h + 2 * markPad(h)] as const;
    for (const type of MARK_TYPES) {
      for (const stroke of markStrokes(type, w, h, 3).strokes) {
        expect(stroke.points.every(([x, y]) => x > 0 && x < size[0] && y > 0 && y < size[1])).toBe(true);
      }
    }
  });

  it("draws the same mark for the same seed and a different one for another", () => {
    expect(markStrokes("circle", 100, 30, 5)).toEqual(markStrokes("circle", 100, 30, 5));
    expect(markStrokes("circle", 100, 30, 6).strokes[0]?.points[0]).not.toEqual(markStrokes("circle", 100, 30, 5).strokes[0]?.points[0]);
  });

  it("draws a box in three strokes and keeps small marks from going hairline", () => {
    expect(markStrokes("box", 60, 20, 1).strokes).toHaveLength(3);
    expect(markStrokes("strike", 60, 10, 1).radius).toBeGreaterThanOrEqual(2);
  });
});

describe("blotUniforms", () => {
  it("moves each front fast enough to pass its farthest corner by the end", () => {
    const [x, y, start, speed] = blotUniforms([[0, 1, 0.2]], 2);
    expect([x, y]).toEqual([0, 1]);
    expect(start).toBeCloseTo(0.2);
    // From the bottom left corner, the farthest is the top right, sqrt(2 * 2 + 1) away.
    expect((speed ?? 0) * (1 - 0.2)).toBeGreaterThan(Math.hypot(2, 1));
  });

  it("leaves unused blots off and ignores more than three", () => {
    const one = blotUniforms([[0.5, 0.5, 0]], 1);
    expect(one[7]).toBe(0);
    expect(blotUniforms(Array.from({ length: 5 }, () => [0.5, 0.5, 0] as const), 1)).toHaveLength(12);
  });
});

describe("without WebGL", () => {
  it("returns no painter", () => {
    const noWebGL = { getContext: () => null } as unknown as HTMLCanvasElement;
    expect(sansuiPainter(noWebGL)).toBeNull();
    expect(wipePainter(noWebGL, {} as HTMLImageElement)).toBeNull();
  });
});
