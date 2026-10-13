import { Kaen, type FireLook, type KaenProps } from "@tengubyte/sumi";
import { useState, type JSX } from "react";
import type { Row } from "./apiRows";
import { Choice, Code, Study, useReplay } from "./parts";

const FIRE: readonly Row[] = [
  ["text", "string", "none", "One character, or two, to set alight. Without it, or src, the fire burns along the bottom edge."],
  ["src", "string", "none", "A picture with a transparent background to set alight round its outline. Another origin must allow CORS."],
  ["label", "string", "none", "What the character or picture shows. Without it the canvas is hidden from assistive technology."],
  ["look", '"shu" | "sumi" | "night"', '"shu"', "Vermilion on paper, black ink, or brighter for a dark page."],
  ["reach", "number", "0.6 (text, src 0.13)", "How high the flames climb, as a share of the shorter side."],
  ["font, weight", "string, number", "a Mincho stack, 700", "A CSS font family you load. The fire waits for it."],
  ["color", "#rrggbb", "by look", "The character: sumi on shu, vermilion on sumi, paper white on night."],
  ["seed", "number", "1", "Changes every tongue and whorl."],
  ["speed, delay", "number", "1, 0", "2 burns twice as fast; seconds to wait once in view."],
  ["className, style", "", "", "Size the canvas here. A character or picture sits a little below its middle."],
];

type Fuel = "edge" | "炎" | "tengu";

const TENGU = "A crow tengu seated on a rock";

const FUEL: Readonly<Record<Fuel, { readonly props: KaenProps; readonly code: string }>> = {
  edge: { props: {}, code: "" },
  炎: { props: { text: "炎", label: "Flame", font: '"Yuji Syuku"', weight: 400 }, code: `\n  text="炎"\n  label="Flame"\n  font='"Yuji Syuku"'\n  weight={400}` },
  tengu: { props: { src: "/art/tengu.webp", label: TENGU }, code: `\n  src="/tengu.webp"\n  label="${TENGU}"` },
};

export function FireStudy({ dark }: { readonly dark: boolean }): JSX.Element {
  const [run, replay] = useReplay();
  const [look, setLook] = useState<FireLook>(dark ? "night" : "shu");
  const [fuel, setFuel] = useState<Fuel>("edge");
  const fire = <Kaen key={`${look} ${fuel} ${String(run)}`} {...FUEL[fuel].props} look={look} style={{ display: "block", width: "100%", aspectRatio: "4 / 3" }} />;
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
        It burns along the bottom edge, round a character, or round the outline of a picture with a transparent
        background, and climbs above it. The fire paints its own colours, so pick the look for the page. It runs
        only while it is on screen; with reduced motion it holds one frame.
      </p>
      <div className="controls">
        <Choice label="Look" options={[["shu", "Shu"], ["sumi", "Ink"], ["night", "Dark page"]]} value={look} onChange={setLook} />
        <Choice label="Fuel" options={[["edge", "Edge"], ["炎", "炎"], ["tengu", "Tengu"]]} value={fuel} onChange={setFuel} />
        <button type="button" className="primary" onClick={replay}>
          Replay
        </button>
      </div>
      <Code>{`<Kaen${FUEL[fuel].code}${look === "shu" ? "" : `\n  look="${look}"`}
  style={{ width: "100%", aspectRatio: "4 / 3" }}
/>`}</Code>
    </Study>
  );
}
