import { describe, expect, it } from "vitest";
import { MARBLE_PATTERNS, marblePattern, marbleRows, marbleSeconds, type MarbleOp } from "./marble";

const drop: MarbleOp = { kind: "drop", x: 0.5, y: 0.5, r: 0.1, ink: "ink", at: 0, span: 1 };
const wave: MarbleOp = { kind: "wave", angle: 0, amp: 0.05, length: 0.5, at: 1, span: 2 };

describe("marbleRows", () => {
  it("leaves out what has not begun and puts the newest first", () => {
    expect(marbleRows([drop, wave], 0.5, 8).count).toBe(1);
    const { count, a } = marbleRows([drop, wave], 2, 8);
    expect(count).toBe(2);
    expect([a[0], a[4]]).toEqual([2, 0]);
  });

  it("grows a drop to its full radius and a ring system to all its drops", () => {
    expect(marbleRows([drop], 5, 4).a[3]).toBeCloseTo(0.1);
    const rings: MarbleOp = { kind: "rings", x: 0, y: 0, r: 0.05, n: 30, at: 0, span: 3 };
    expect(marbleRows([rings], 1.5, 4).b[0]).toBeCloseTo(15);
    expect(marbleRows([rings], 9, 4).b[0]).toBeCloseTo(30);
  });

  it("draws only the first operations a device has room for", () => {
    expect(marbleRows(Array.from({ length: 40 }, () => drop), 5, 28).count).toBe(28);
  });
});

describe("marblePattern", () => {
  it("lays every preset out inside the tray and lets it settle in a few seconds", () => {
    for (const name of MARBLE_PATTERNS) {
      const ops = marblePattern(name, 4 / 3);
      expect(ops.length).toBeLessThanOrEqual(28);
      expect(marbleSeconds(ops)).toBeGreaterThan(3);
      expect(marbleSeconds(ops)).toBeLessThan(7);
      for (const op of ops) if ("x" in op && op.kind !== "tine") expect(op.x).toBeLessThan(4 / 3);
    }
  });
});
