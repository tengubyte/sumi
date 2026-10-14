import { InkDrop, type Drop, type DropKind } from "@tengubyte/sumi";
import { useState, type JSX } from "react";
import { inkFor } from "./BrushStudy";
import { Choice, Code, Range, Study, useReplay } from "./parts";

type View = "side" | "top";
type Fall = "one" | "red" | "three";

const SIDE: Readonly<Record<Fall, readonly Drop[]>> = {
  one: [[0.5, 0.1]],
  red: [[0.38, 0.1], [0.64, 0.1, 0.9, "#d8001a"]],
  three: [[0.26, 0.1], [0.52, 0.14, 0.6], [0.77, 0.09, 1.2]],
};

// From above, each drop spreads round where it lands, so they sit lower and further apart. One drop lands
// where its kind puts it by default.
const TOP: Readonly<Record<Exclude<Fall, "one">, readonly Drop[]>> = {
  red: [[0.38, 0.45], [0.64, 0.56, 0.9, "#d8001a"]],
  three: [[0.28, 0.36], [0.7, 0.34, 0.6], [0.5, 0.7, 1.2]],
};

// A drip runs down and a flick throws up to the right, so both start nearer the opposite edge.
const SHIFT: Partial<Record<DropKind, readonly [number, number]>> = { drip: [0, -0.25], flick: [-0.15, 0.15] };

const KINDS: readonly (readonly [DropKind, string])[] = [
  ["drop", "Drop"],
  ["splash", "Splash"],
  ["flick", "Flick"],
  ["spray", "Spray"],
  ["bloom", "Bloom"],
  ["drip", "Drip"],
  ["ring", "Ring"],
];

const near = (n: number): number => Math.round(n * 100) / 100;

function topDrops(kind: DropKind, fall: Fall): readonly Drop[] | undefined {
  if (fall === "one") return undefined;
  const [dx, dy] = SHIFT[kind] ?? [0, 0];
  return TOP[fall].map(([x, y, ...rest]): Drop => [near(x + dx), near(y + dy), ...rest]);
}

export function DropStudy({ dark }: { readonly dark: boolean }): JSX.Element {
  const [run, replay] = useReplay();
  const [view, setView] = useState<View>("side");
  const [kind, setKind] = useState<DropKind>("splash");
  const [fall, setFall] = useState<Fall>("red");
  const [swirl, setSwirl] = useState(0.6);
  const top = view === "top";
  const drops = top ? topDrops(kind, fall) : SIDE[fall];
  return (
    <Study
      id="drop"
      kanji="滴"
      title="Drop ink"
      what="InkDrop"
      stage={<InkDrop key={`${view} ${kind} ${fall} ${String(run)}`} view={view} kind={top ? kind : undefined} drops={drops} swirl={swirl} color={inkFor(dark)} style={{ display: "block", width: "100%", aspectRatio: "4 / 3" }} />}
    >
      <p>
        From the side, the ink falls into still water. It is heavier than water, so a drop sinks, and its thick
        patches fall faster than its thin ones, which rolls it into a cap that breaks into curls and threads. This
        view is a small fluid simulation stepped sixty times a second; devices without half-float textures get a
        traced vortex ring instead.
      </p>
      <p>
        From above, the ink lands on washi as a drop, a splash, a brush flick, a dry-brush spray, a grey bloom, a
        drip that runs or a ring that dries dark at its edge. Satellite drops skid as they land, so their tails
        point away from it, and a grey halo wicks into the paper fibres after the black. Every frame comes
        straight from the time, the last one included.
      </p>
      <div className="controls">
        <Choice label="View" options={[["side", "Side"], ["top", "Top"]]} value={view} onChange={setView} />
        {top && <Choice label="Kind" options={KINDS} value={kind} onChange={setKind} />}
        <Choice label="Drops" options={[["one", "One"], ["red", "With red"], ["three", "Three"]]} value={fall} onChange={setFall} />
        <button type="button" className="primary" onClick={replay}>
          Replay
        </button>
        {!top && <Range label="Swirl" value={swirl} min={0} max={1.5} step={0.1} onChange={setSwirl} />}
      </div>
      <Code>{`<InkDrop${top ? `\n  view="top"\n  kind="${kind}"` : ""}${drops ? `\n  drops={${JSON.stringify(drops)}}` : ""}${top || swirl === 0.6 ? "" : `\n  swirl={${String(swirl)}}`}
  style={{ width: "100%", aspectRatio: "4 / 3" }}
/>`}</Code>
    </Study>
  );
}
