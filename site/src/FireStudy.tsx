import { Kaen, type FireLook } from "@tengubyte/sumi";
import { useState, type JSX } from "react";
import type { Row } from "./apiRows";
import { Choice, Code, Study, useReplay } from "./parts";

const FIRE: readonly Row[] = [
  ["text", "string", "none", "One character, or two, to set alight. Without it the fire burns along the bottom edge."],
  ["label", "string", "none", "What the character means. Without it the canvas is hidden from assistive technology."],
  ["look", '"shu" | "sumi" | "night"', '"shu"', "Vermilion on paper, black ink, or brighter for a dark page."],
  ["reach", "number", "0.6 (text 0.13)", "How high the flames climb, as a share of the shorter side."],
  ["font, weight", "string, number", "a Mincho stack, 700", "A CSS font family you load. The fire waits for it."],
  ["color", "#rrggbb", "by look", "The character: sumi on shu, vermilion on sumi, paper white on night."],
  ["seed", "number", "1", "Changes every tongue and whorl."],
  ["speed, delay", "number", "1, 0", "2 burns twice as fast; seconds to wait once in view."],
  ["className, style", "", "", "Size the canvas here. A character sits a little below its middle."],
];

type Shape = "edge" | "炎";

export function FireStudy({ dark }: { readonly dark: boolean }): JSX.Element {
  const [run, replay] = useReplay();
  const [look, setLook] = useState<FireLook>(dark ? "night" : "shu");
  const [shape, setShape] = useState<Shape>("edge");
  const text = shape === "edge" ? undefined : shape;
  const fire = (
    <Kaen
      key={`${look} ${shape} ${String(run)}`}
      text={text}
      label={text === undefined ? undefined : "Flame"}
      font='"Yuji Syuku"'
      weight={400}
      look={look}
      style={{ display: "block", width: "100%", aspectRatio: "4 / 3" }}
    />
  );
  return (
    <Study
      id="fire"
      kanji="炎"
      title="Set it alight"
      what="Kaen"
      props={{ rows: FIRE, label: "Kaen props" }}
      stage={<div className={look === "night" ? "night" : "paper"}>{fire}</div>}
    >
      <p>
        Fire as the Heiji scroll and the Blue Fudo paint it: one mass of tongues that rise to points, sway more the
        higher they reach and break off at the top while new ones come up from below. Fine pale and dark strands
        run up each tongue, a pale line runs just inside the outline, and slow whorls turn the flow.
      </p>
      <p>
        It burns along the bottom edge, or round a character and climbs above it. The fire paints its own colours,
        so pick the look for the page. It runs only while it is on screen; with reduced motion it holds one frame.
      </p>
      <div className="controls">
        <Choice label="Look" options={[["shu", "Shu"], ["sumi", "Ink"], ["night", "Dark page"]]} value={look} onChange={setLook} />
        <Choice label="Fuel" options={[["edge", "Edge"], ["炎", "炎"]]} value={shape} onChange={setShape} />
        <button type="button" className="primary" onClick={replay}>
          Replay
        </button>
      </div>
      <Code>{`<Kaen${text === undefined ? "" : `\n  text="${text}"\n  label="Flame"\n  font='"Yuji Syuku"'\n  weight={400}`}${look === "shu" ? "" : `\n  look="${look}"`}
  style={{ width: "100%", aspectRatio: "4 / 3" }}
/>`}</Code>
    </Study>
  );
}
