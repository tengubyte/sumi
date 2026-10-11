import { describe, expect, it } from "vitest";
import { joHaKyu } from "./ease";

describe("joHaKyu", () => {
  it("starts at 0, ends at 1 and clamps outside that", () => {
    expect(joHaKyu(0)).toBe(0);
    expect(joHaKyu(1)).toBeCloseTo(1, 6);
    expect(joHaKyu(-1)).toBe(0);
    expect(joHaKyu(2)).toBeCloseTo(1, 6);
  });

  it("never runs backwards", () => {
    let last = 0;
    for (let t = 0; t <= 1; t += 0.01) {
      const value = joHaKyu(t);
      expect(value).toBeGreaterThanOrEqual(last - 1e-9);
      last = value;
    }
  });

  it("is slow while the brush presses and fastest as it leaves", () => {
    expect(joHaKyu(0.28)).toBeCloseTo(0.06, 3);
    expect(joHaKyu(0.7)).toBeCloseTo(0.55, 3);
    expect(joHaKyu(1) - joHaKyu(0.9)).toBeGreaterThan(joHaKyu(0.1) - joHaKyu(0));
  });
});
