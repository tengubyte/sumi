import { BrushMark } from "@tengubyte/sumi";
import { useState, type JSX } from "react";
import { Code, Study, useReplay } from "./parts";

export function MarkStudy(): JSX.Element {
  const [run, replay] = useReplay();
  const [seed, setSeed] = useState(1);
  const shuffle = (): void => {
    setSeed(Math.floor(Math.random() * 900) + 1);
  };
  return (
    <Study
      id="mark"
      kanji="印"
      title="Mark the words"
      what="BrushMark"
      stage={
        <div key={run} className="mark-stage">
          <p className="mark-head">
            Paint the <BrushMark type="circle" seed={seed} delay={0.2}>word</BrushMark> that <BrushMark seed={seed + 1} delay={1}>matters</BrushMark>
          </p>
          <p>
            One <BrushMark type="highlight" seed={seed + 2} delay={1.6}>brush stroke</BrushMark> says more than a{" "}
            <BrushMark type="strike" seed={seed + 3} delay={2.2}>bold font</BrushMark> ever will. Draw a{" "}
            <BrushMark type="box" seed={seed + 4} delay={2.7}>box</BrushMark> round the price.
          </p>
        </div>
      }
    >
      <p>
        Rough Notation's idea, with a real brush: an underline that sags and tapers out, an ensō round a word that
        runs past where it began, a dry highlight swipe behind the text, a strike-through, and a box drawn in the
        stroke order of 口.
      </p>
      <p>
        The words stay plain text. Each mark is measured when it scrolls into view and painted on a canvas round
        it, and a seed sets how far off true the hand is. Marks keep to one line.
      </p>
      <div className="controls">
        <button type="button" className="primary" onClick={replay}>
          Replay
        </button>
        <button type="button" onClick={shuffle}>
          New hand
        </button>
      </div>
      <Code>{`Paint the <BrushMark type="circle">word</BrushMark>
that <BrushMark delay={1}>matters</BrushMark>`}</Code>
    </Study>
  );
}
