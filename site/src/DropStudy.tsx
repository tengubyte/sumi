import { InkDrop, type Drop } from "@tengubyte/sumi";
import { useState, type JSX } from "react";
import { DROP } from "./apiRows";
import { inkFor } from "./BrushStudy";
import { Choice, Code, Range, Study, useReplay } from "./parts";

type Fall = "one" | "red" | "three";

const FALLS: Readonly<Record<Fall, readonly Drop[]>> = {
  one: [[0.5, 0.1]],
  red: [[0.38, 0.1], [0.64, 0.1, 0.9, "#d8001a"]],
  three: [[0.26, 0.1], [0.52, 0.14, 0.6], [0.77, 0.09, 1.2]],
};

export function DropStudy({ dark }: { readonly dark: boolean }): JSX.Element {
  const [run, replay] = useReplay();
  const [fall, setFall] = useState<Fall>("red");
  const [swirl, setSwirl] = useState(0.6);
  return (
    <Study
      id="drop"
      kanji="滴"
      title="Drop ink in water"
      what="InkDrop"
      props={{ rows: DROP, label: "InkDrop props" }}
      stage={<InkDrop key={`${fall} ${String(run)}`} drops={FALLS[fall]} swirl={swirl} color={inkFor(dark)} style={{ display: "block", width: "100%", aspectRatio: "4 / 3" }} />}
    >
      <p>
        A drop of ink in still water sinks as a ring. Its rim rolls up into a cap, a thin stem trails behind,
        and as the ring slows the edges fray into filaments and thin out to a grey wash.
      </p>
      <p>
        The ring is two spinning cores with a little curled noise on top, and every pixel traces its water back
        to the moment each drop landed. Any frame, the last one included, comes straight from the time.
      </p>
      <div className="controls">
        <Choice label="Drops" options={[["one", "One"], ["red", "With red"], ["three", "Three"]]} value={fall} onChange={setFall} />
        <button type="button" className="primary" onClick={replay}>
          Replay
        </button>
        <Range label="Swirl" value={swirl} min={0} max={1.5} step={0.1} onChange={setSwirl} />
      </div>
      <Code>{`<InkDrop
  drops={${JSON.stringify(FALLS[fall])}}${swirl === 0.6 ? "" : `\n  swirl={${String(swirl)}}`}
  style={{ width: "100%", aspectRatio: "4 / 3" }}
/>`}</Code>
    </Study>
  );
}
