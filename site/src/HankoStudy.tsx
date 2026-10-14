import { Hanko, type SealShape } from "@tengubyte/sumi";
import { useState, type JSX } from "react";
import { Choice, Code, Study, useReplay } from "./parts";

type Seal = "ink" | "tengu" | "ichigo" | "wa";

const SEALS: Readonly<Record<Seal, { readonly text: string; readonly shape: SealShape; readonly white: boolean }>> = {
  ink: { text: "墨", shape: "square", white: false },
  tengu: { text: "天狗", shape: "tall", white: true },
  ichigo: { text: "一期一会", shape: "square", white: true },
  wa: { text: "和", shape: "round", white: false },
};

export function HankoStudy(): JSX.Element {
  const [run, replay] = useReplay();
  const [pick, setPick] = useState<Seal>("tengu");
  const [seed, setSeed] = useState(1);
  const { text, shape, white } = SEALS[pick];
  const tall = shape === "tall";
  const shuffle = (): void => {
    setSeed(Math.floor(Math.random() * 900) + 1);
  };
  return (
    <Study
      id="hanko"
      kanji="判"
      title="Press a seal"
      what="Hanko"
      stage={
        <Hanko
          key={`${pick} ${String(run)}`}
          text={text}
          label={text}
          shape={shape}
          white={white}
          seed={seed}
          font='"Yuji Syuku"'
          weight={400}
          style={{ display: "block", margin: "0 auto", width: tall ? "40%" : "64%", aspectRatio: tall ? "1 / 1.6" : "1 / 1" }}
        />
      }
    >
      <p>
        A seal in vermilion paste closes a painting or signs a letter. It comes down, is rocked once round its
        face and lifts. The paste only reaches the paper's high points, so the impression keeps white specks,
        one side comes out lighter and the carved border has a few chips.
      </p>
      <p>
        One to four characters in any font you load, read in columns from the right. Red characters in a border
        (shubun) or white characters cut into a red block (hakubun), square, tall or round.
      </p>
      <div className="controls">
        <Choice label="Seal" options={[["ink", "墨"], ["tengu", "天狗"], ["ichigo", "一期一会"], ["wa", "和"]]} value={pick} onChange={setPick} />
        <button type="button" className="primary" onClick={shuffle}>
          New seed
        </button>
        <button type="button" onClick={replay}>
          Replay
        </button>
      </div>
      <Code>{`<Hanko
  text="${text}"${shape === "square" ? "" : `\n  shape="${shape}"`}${white ? "\n  white" : ""}
  font='"Yuji Syuku"'
  style={{ width: ${tall ? "100, aspectRatio: \"1 / 1.6\"" : "160, aspectRatio: \"1 / 1\""} }}
/>`}</Code>
    </Study>
  );
}
