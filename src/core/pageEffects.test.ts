import { describe, expect, it } from "vitest";
import { hakePainter } from "./hake";
import { bloomReach, colorPainter } from "./irodori";
import { focusPainter } from "./shuchusen";

describe("bloomReach", () => {
  it("reaches the far corner from a single bloom", () => {
    // One bloom at the top left of a square must cover the bottom right corner, √2 away.
    expect(bloomReach([[0, 0, 0]], 1) * 0.72).toBeGreaterThan(Math.SQRT2);
  });

  it("needs less reach the more blooms share the picture", () => {
    const one = bloomReach([[0.5, 0.5, 0]], 1.5);
    const four = bloomReach([[0.25, 0.25, 0], [0.75, 0.25, 0], [0.25, 0.75, 0], [0.75, 0.75, 0]], 1.5);
    expect(four).toBeLessThan(one);
  });

  it("measures a tall picture against its width", () => {
    // A bloom in the middle of a picture twice as tall as wide is one width from the top and bottom edges.
    expect((bloomReach([[0.5, 0.5, 0]], 0.5) - 0.08) * 0.72).toBeCloseTo(Math.hypot(0.5, 1), 6);
  });
});

describe("without WebGL", () => {
  it("returns no painter", () => {
    const noWebGL = { getContext: () => null } as unknown as HTMLCanvasElement;
    const picture = {} as HTMLImageElement;
    expect(colorPainter(noWebGL, picture)).toBeNull();
    expect(hakePainter(noWebGL, "edge", {}, picture)).toBeNull();
    expect(hakePainter(noWebGL, "stroke")).toBeNull();
    expect(focusPainter(noWebGL)).toBeNull();
  });
});
