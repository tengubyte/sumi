import { HakeCut, HakeStroke } from "@tengubyte/sumi";
import { useState, type JSX } from "react";
import { Choice, Code, Study, useReplay } from "./parts";

type Cut = "edge" | "streaks" | "band" | "stroke";

const GOLD = "#c99e2b";

const picture = (extra: string): string => `<HakeCut
  src="/scene.webp"
  width={1200}
  height={800}
  alt="..."${extra}
/>`;

const CODE: Readonly<Record<Cut, string>> = {
  edge: picture(""),
  streaks: picture("\n  angle={-24}\n  offset={0}\n  streaks={1}"),
  band: picture('\n  shape="band"\n  thickness={0.5}\n  angle={-7}'),
  stroke: `<HakeStroke
  color="${GOLD}"
  thickness={0.22}
  bend={-0.5}
  angle={20}
  style={{ width: "100%", aspectRatio: "4 / 3" }}
/>`,
};

export function HakeStudy(): JSX.Element {
  const [run, replay] = useReplay();
  const [cut, setCut] = useState<Cut>("edge");
  const [seed, setSeed] = useState(1);
  const shuffle = (): void => {
    setSeed(Math.floor(Math.random() * 900) + 1);
  };
  const key = `${cut} ${String(seed)} ${String(run)}`;
  const art = { src: "/art/scene.webp", width: 1200, height: 800, alt: "A red sun over blue hills and cherry blossom", seed };
  const stage =
    cut === "stroke" ? (
      <HakeStroke key={key} color={GOLD} thickness={0.22} bend={-0.5} angle={20} seed={seed} style={{ display: "block", width: "100%", aspectRatio: "4 / 3" }} />
    ) : cut === "band" ? (
      <HakeCut key={key} {...art} shape="band" thickness={0.5} angle={-7} />
    ) : cut === "streaks" ? (
      <HakeCut key={key} {...art} angle={-24} offset={0} streaks={1} />
    ) : (
      <HakeCut key={key} {...art} />
    );
  return (
    <Study id="hake" kanji="刷" title="Brush a picture in" what="HakeCut and HakeStroke" stage={stage}>
      <p>
        One pass of a hake, the wide flat brush. Its bristles leave long streaks along the way it travels, the
        edges break up where the brush runs dry, and the head shows bristle tips as it moves.
      </p>
      <p>
        HakeCut paints a picture in and leaves it with a brushed edge, or inside one brushed band. HakeStroke
        drags a single stroke of paint across a canvas. The bristles are measured in pixels, so they stay fine at
        any size.
      </p>
      <div className="controls">
        <Choice label="Cut" options={[["edge", "Edge"], ["streaks", "Streaks"], ["band", "Band"], ["stroke", "Stroke"]]} value={cut} onChange={setCut} />
        <button type="button" className="primary" onClick={shuffle}>
          New seed
        </button>
        <button type="button" onClick={replay}>
          Replay
        </button>
      </div>
      <Code>{CODE[cut]}</Code>
    </Study>
  );
}
