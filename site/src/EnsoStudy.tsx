import { Enso } from "@tengubyte/sumi";
import { useState, type JSX } from "react";
import { inkFor } from "./BrushStudy";
import { Code, Range, Study, useReplay } from "./parts";

export function EnsoStudy({ dark }: { readonly dark: boolean }): JSX.Element {
  const [run, replay] = useReplay();
  const [seed, setSeed] = useState(7);
  const [speed, setSpeed] = useState(1);
  const shuffle = (): void => {
    setSeed(Math.floor(Math.random() * 9000) + 1);
  };
  return (
    <Study
      id="enso"
      kanji="禅"
      title="Draw an ensō"
      what="Enso"
      stage={<Enso key={run} seed={seed} speed={speed} color={inkFor(dark)} style={{ display: "block", width: "100%", aspectRatio: "1" }} />}
    >
      <p>
        The same brush, given one stroke made from a seed instead of an SVG. The seed sets where the stroke
        starts, how far round it goes before it lifts, how it wobbles, how heavy it is and how dry its tail runs.
      </p>
      <p>
        Unlike the ring above, there is no art to own: every seed is a different ensō, and the same seed always
        draws the same one.
      </p>
      <div className="controls">
        <button type="button" className="primary" onClick={shuffle}>
          New seed
        </button>
        <button type="button" onClick={replay}>
          Replay
        </button>
        <Range label="Speed" value={speed} min={0.5} max={2} step={0.1} unit="x" onChange={setSpeed} />
      </div>
      <Code>{`<Enso
  seed={${String(seed)}}
  speed={${String(speed)}}
  style={{ width: 360, aspectRatio: "1" }}
/>`}</Code>
    </Study>
  );
}
