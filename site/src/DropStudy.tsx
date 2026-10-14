import { InkDrop, type Drop } from "@tengubyte/sumi";
import { useState, type JSX } from "react";
import { inkFor } from "./BrushStudy";
import { Choice, Code, Range, Study, useReplay } from "./parts";

type View = "side" | "top";
type Fall = "one" | "red" | "three";

// From above, each splash spreads round its landing, so the drops sit lower and further apart.
const FALLS: Readonly<Record<View, Readonly<Record<Fall, readonly Drop[]>>>> = {
  side: {
    one: [[0.5, 0.1]],
    red: [[0.38, 0.1], [0.64, 0.1, 0.9, "#d8001a"]],
    three: [[0.26, 0.1], [0.52, 0.14, 0.6], [0.77, 0.09, 1.2]],
  },
  top: {
    one: [[0.5, 0.5]],
    red: [[0.38, 0.45], [0.64, 0.56, 0.9, "#d8001a"]],
    three: [[0.28, 0.36], [0.7, 0.34, 0.6], [0.5, 0.7, 1.2]],
  },
};

export function DropStudy({ dark }: { readonly dark: boolean }): JSX.Element {
  const [run, replay] = useReplay();
  const [view, setView] = useState<View>("side");
  const [fall, setFall] = useState<Fall>("red");
  const [swirl, setSwirl] = useState(0.6);
  const drops = FALLS[view][fall];
  return (
    <Study
      id="drop"
      kanji="滴"
      title="Drop ink in water"
      what="InkDrop"
      stage={<InkDrop key={`${view} ${fall} ${String(run)}`} view={view} drops={drops} swirl={swirl} color={inkFor(dark)} style={{ display: "block", width: "100%", aspectRatio: "4 / 3" }} />}
    >
      <p>
        Ink is heavier than water, so a drop sinks. Its thick patches fall faster than its thin ones, which rolls the
        drop into a cap and breaks the cap into curls and threads. Seen from above, the landing throws the ink outward,
        far harder in a few directions, and those become the rays.
      </p>
      <p>
        The side view is a small fluid simulation. The water&apos;s speed lives on a coarse grid and the ink on a fine
        one, stepped sixty times a second. Devices without half-float textures get a traced vortex ring instead. The
        top view needs no simulation, so any frame, the last one included, comes straight from the time.
      </p>
      <div className="controls">
        <Choice label="View" options={[["side", "Side"], ["top", "Top"]]} value={view} onChange={setView} />
        <Choice label="Drops" options={[["one", "One"], ["red", "With red"], ["three", "Three"]]} value={fall} onChange={setFall} />
        <button type="button" className="primary" onClick={replay}>
          Replay
        </button>
        <Range label="Swirl" value={swirl} min={0} max={1.5} step={0.1} onChange={setSwirl} />
      </div>
      <Code>{`<InkDrop${view === "top" ? `\n  view="top"` : ""}
  drops={${JSON.stringify(drops)}}${swirl === 0.6 ? "" : `\n  swirl={${String(swirl)}}`}
  style={{ width: "100%", aspectRatio: "4 / 3" }}
/>`}</Code>
    </Study>
  );
}
