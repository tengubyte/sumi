import { Hanasaka } from "@tengubyte/sumi";
import { useState, type JSX } from "react";
import { Choice, Code, Study, useReplay } from "./parts";

type Grow = "left" | "above" | "rising";

const GROW: Readonly<Record<Grow, { readonly from?: readonly [number, number]; readonly angle?: number; readonly code: string }>> = {
  left: { code: "" },
  above: { from: [1.04, 0.06], angle: -146, code: "\n  from={[1.04, 0.06]}\n  angle={-146}" },
  rising: { from: [0.45, 1.06], angle: 72, code: "\n  from={[0.45, 1.06]}\n  angle={72}" },
};

const NIGHT = { bark: "#c7bdb8", outline: "#faf0f2", heart: "#eb6b8f" } as const;

export function HanasakaStudy({ dark }: { readonly dark: boolean }): JSX.Element {
  const [run, replay] = useReplay();
  const [grow, setGrow] = useState<Grow>("left");
  const [seed, setSeed] = useState(1);
  const shuffle = (): void => {
    setSeed(Math.floor(Math.random() * 900) + 1);
  };
  const { from, angle, code } = GROW[grow];
  return (
    <Study
      id="bloom"
      kanji="花"
      title="Bring a branch into bloom"
      what="Hanasaka"
      stage={
        <Hanasaka
          key={`${grow} ${String(seed)} ${String(run)}`}
          from={from}
          angle={angle}
          seed={seed}
          {...(dark ? NIGHT : {})}
          style={{ display: "block", width: "100%", aspectRatio: "4 / 3" }}
        />
      }
    >
      <p>
        A cherry branch brushed in stroke by stroke, thick at the start and thinning as it forks. Buds swell along
        it and burst open one after another, each with an ink outline and a dark heart. Then a few petals let go
        and tumble away on the wind.
      </p>
      <p>
        The last frame, the branch in full bloom, stays. With reduced motion it shows at once. The branch is
        decoration, hidden from assistive technology.
      </p>
      <div className="controls">
        <Choice label="Grow" options={[["left", "From the left"], ["above", "From above"], ["rising", "Rising"]]} value={grow} onChange={setGrow} />
        <button type="button" className="primary" onClick={shuffle}>
          New seed
        </button>
        <button type="button" onClick={replay}>
          Replay
        </button>
      </div>
      <Code>{`<Hanasaka${code}
  style={{ width: "100%", aspectRatio: "4 / 3" }}
/>`}</Code>
    </Study>
  );
}
