import { Shibori, type ShiboriPattern } from "@tengubyte/sumi";
import { useState, type JSX } from "react";
import { Choice, Code, Range, Study, useReplay } from "./parts";

export function ShiboriStudy(): JSX.Element {
  const [run, replay] = useReplay();
  const [pattern, setPattern] = useState<ShiboriPattern>("itajime");
  const [dips, setDips] = useState(3);
  const [seed, setSeed] = useState(1);
  const shuffle = (): void => {
    setSeed(Math.floor(Math.random() * 900) + 1);
  };
  return (
    <Study
      id="shibori"
      kanji="絞"
      title="Dye the cloth"
      what="Shibori"
      stage={<Shibori key={run} pattern={pattern} dips={dips} seed={seed} style={{ display: "block", width: "100%", aspectRatio: "3 / 2" }} />}
    >
      <p>
        Shibori (絞り) is Japanese tie-dye. The cloth goes into the indigo vat bottom first, comes out
        yellow-green and turns blue in the air, and each dip goes darker. Where it was bound, pleated or
        clamped, the dye cannot reach, and it creeps in a little at the edge.
      </p>
      <p>
        Arashi is pleated on a pole, so the dye misses the pressed crests in diagonal lines. Itajime is folded
        and clamped between round boards. Kanoko is tied in tiny points, each a white ring round a dyed tip.
      </p>
      <div className="controls">
        <Choice label="Pattern" options={[["arashi", "Arashi"], ["itajime", "Itajime"], ["kanoko", "Kanoko"]]} value={pattern} onChange={setPattern} />
        <button type="button" className="primary" onClick={shuffle}>
          New seed
        </button>
        <button type="button" onClick={replay}>
          Replay
        </button>
        <Range label="Dips" value={dips} min={1} max={6} step={1} onChange={setDips} />
      </div>
      <Code>{`<Shibori
  pattern="${pattern}"
  dips={${String(dips)}}
  style={{ width: "100%", aspectRatio: "3 / 2" }}
/>`}</Code>
    </Study>
  );
}
