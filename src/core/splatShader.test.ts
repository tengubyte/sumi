import { describe, expect, it } from "vitest";
import { inkBrush } from "./brushShader";
import { rgb, splatPainter, splatUniforms } from "./splatShader";

const noWebGL = { getContext: () => null } as unknown as HTMLCanvasElement;

describe("splatUniforms", () => {
  it("scales the splat with the canvas width", () => {
    const small = splatUniforms(360, 396, {});
    const large = splatUniforms(720, 396, {});
    expect(large.R0?.[3]).toBeCloseTo((small.R0?.[3] ?? 0) * 2);
    expect(large.M1?.[0]).toBeCloseTo((small.M1?.[0] ?? 0) * 2);
  });

  it("matches the TenguByte founder splat with the defaults", () => {
    const u = splatUniforms(360, 396, {});
    expect(u.R0?.map((v) => Math.round(v * 10) / 10)).toEqual([374.4, 118.8, 2.8, 43.2]);
  });

  it("drops the second splat when underColor is null, and clamps mist", () => {
    const u = splatUniforms(360, 396, { underColor: null, mist: 3 });
    expect(u.K0).toEqual([0, 0, 0, 0]);
    expect(u.M1?.[2]).toBe(1);
  });
});

describe("rgb", () => {
  it("reads #rrggbb and treats anything else as black", () => {
    expect(rgb("#ff8000")).toEqual([1, 128 / 255, 0]);
    expect(rgb("#f80")).toEqual([0, 0, 0]);
  });
});

describe("without WebGL", () => {
  it("returns no painter, so the caller keeps the plain image or nothing", () => {
    expect(splatPainter(noWebGL)).toBeNull();
    expect(inkBrush(noWebGL, {} as HTMLImageElement, "ring")).toBeNull();
  });
});
