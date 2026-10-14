import { Suminagashi, type MarblePattern } from "@tengubyte/sumi";
import { useState, type JSX } from "react";
import { inkFor } from "./BrushStudy";
import { Choice, Code, Study, useReplay } from "./parts";

const PATTERNS: readonly (readonly [MarblePattern, string])[] = [
  ["flow", "Flow"],
  ["rings", "Rings"],
  ["comb", "Comb"],
];

export function FloatStudy({ dark }: { readonly dark: boolean }): JSX.Element {
  const [run, replay] = useReplay();
  const [pattern, setPattern] = useState<MarblePattern>("flow");
  return (
    <Study
      id="float"
      kanji="流"
      title="Float ink on water"
      what="Suminagashi"
      stage={<Suminagashi key={run} pattern={pattern} color={inkFor(dark)} style={{ display: "block", width: "100%", aspectRatio: "4 / 3" }} />}
    >
      <p>
        Suminagashi is the Japanese art of floating sumi on water and lifting it onto paper. Drops of ink and
        clear water land on one spot in turn, so each pushes the last outward into a ring. Then a breath, a comb
        or a slow current pulls the rings into flowing lines.
      </p>
      <p>
        Each drop and pull is an exact map of the water's surface, from Jaffer's mathematical marbling, so every
        pixel runs the list backwards to find where its ink came from. That keeps the lines sharp at any canvas
        size.
      </p>
      <div className="controls">
        <Choice label="Pattern" options={PATTERNS} value={pattern} onChange={setPattern} />
        <button type="button" className="primary" onClick={replay}>
          Replay
        </button>
      </div>
      <Code>{`<Suminagashi
  pattern="${pattern}"
  style={{ width: 480, aspectRatio: "4 / 3" }}
/>`}</Code>
    </Study>
  );
}
