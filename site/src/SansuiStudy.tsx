import { Sansui } from "@tengubyte/sumi";
import { useState, type JSX } from "react";
import { inkFor } from "./BrushStudy";
import { Code, Range, Study, useReplay } from "./parts";

export function SansuiStudy({ dark }: { readonly dark: boolean }): JSX.Element {
  const [run, replay] = useReplay();
  const [seed, setSeed] = useState(3);
  const [sun, setSun] = useState(true);
  const [mist, setMist] = useState(0.6);
  const shuffle = (): void => {
    setSeed(Math.floor(Math.random() * 900) + 1);
  };
  return (
    <Study
      id="sansui"
      kanji="山"
      title="Paint the mountains"
      what="Sansui"
      stage={<Sansui key={run} seed={seed} sun={sun} mist={mist} color={inkFor(dark)} style={{ display: "block", width: "100%", aspectRatio: "16 / 9" }} />}
    >
      <p>
        Sansui (山水), mountain and water, is ink-wash landscape. Five ridges are brushed in from far to near:
        each ridge line goes on left to right, then its wash creeps down from it and thins into mist. Far ridges
        stay pale and soft; only the near ones get a hard brush line.
      </p>
      <p>No art and no images: every seed is a different range, drawn in one pass of one shader.</p>
      <div className="controls">
        <button type="button" className="primary" onClick={shuffle}>
          New seed
        </button>
        <button type="button" onClick={replay}>
          Replay
        </button>
        <Range label="Mist" value={mist} min={0} max={1} step={0.05} onChange={setMist} />
        <label>
          <input type="checkbox" checked={sun} onChange={(e) => { setSun(e.target.checked); }} />
          Sun
        </label>
      </div>
      <Code>{`<Sansui
  seed={${String(seed)}}
  mist={${String(mist)}}${sun ? "" : "\n  sun={false}"}
  style={{ width: "100%", aspectRatio: "16 / 9" }}
/>`}</Code>
    </Study>
  );
}
