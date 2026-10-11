import { TornBand, TornEdge } from "@tengubyte/sumi";
import { useState, type JSX } from "react";
import { TORN } from "./apiRows";
import { inkFor } from "./BrushStudy";
import { Choice, Code, Study, useReplay } from "./parts";

type Tear = "frame" | "cover" | "band";

const picture = (tear: string): string => `<TornEdge${tear}
  src="/sansui.webp"
  width={1200}
  height={674}
  alt="Ink mountains"
/>`;

const CODE: Readonly<Record<Tear, string>> = {
  frame: picture(""),
  cover: picture(`\n  tear="cover"`),
  band: `<TornBand
  color="#161314"
  style={{ width: "100%", height: 96 }}
/>`,
};

export function TornStudy({ dark }: { readonly dark: boolean }): JSX.Element {
  const [run, replay] = useReplay();
  const [tear, setTear] = useState<Tear>("frame");
  const [seed, setSeed] = useState(1);
  const shuffle = (): void => {
    setSeed(Math.floor(Math.random() * 900) + 1);
  };
  const stage =
    tear === "band" ? (
      <div key={run} className="band-stage">
        <TornBand color={inkFor(dark)} seed={seed} style={{ width: "100%", height: 96 }} />
        <p>The next section starts under the tear.</p>
      </div>
    ) : (
      // A pale picture loses its torn edge against pale paper, so it is shown on a dark page, as Sekiro's site does.
      <div className="night">
        <TornEdge key={`${tear} ${String(run)}`} tear={tear} seed={seed} src="/art/sansui.webp" width={1200} height={674} alt="Ink-wash mountains under a red sun" />
      </div>
    );
  return (
    <Study id="torn" kanji="破" title="Tear the paper" what="TornEdge and TornBand" props={{ rows: TORN, label: "TornEdge and TornBand props" }} stage={stage}>
      <p>
        Paper torn by hand. The edge wanders at three scales, a thin white core shows where the tear split the
        sheet, and long fibres reach past it. The torn sheet throws a soft shadow.
      </p>
      <p>
        A frame stays torn round the picture. A cover tears off and leaves the plain image. TornBand tears a strip
        across the edge of a section, along its bottom or its top. The tear is measured in pixels, so a thumbnail
        and a hero tear alike.
      </p>
      <div className="controls">
        <Choice label="Tear" options={[["frame", "Frame"], ["cover", "Cover"], ["band", "Band"]]} value={tear} onChange={setTear} />
        <button type="button" className="primary" onClick={shuffle}>
          New seed
        </button>
        <button type="button" onClick={replay}>
          Replay
        </button>
      </div>
      <Code>{CODE[tear]}</Code>
    </Study>
  );
}
