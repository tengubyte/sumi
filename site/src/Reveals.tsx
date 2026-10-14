import { BrushReveal } from "@tengubyte/sumi";
import { useState, type JSX } from "react";
import { Code, Range, Study, useReplay } from "./parts";

export function RingStudy(): JSX.Element {
  const [run, replay] = useReplay();
  const [duration, setDuration] = useState(1.4);
  return (
    <Study
      id="ring"
      kanji="円"
      title="Paint a ring"
      what='BrushReveal with sweep="ring"'
      stage={<BrushReveal key={run} src="/art/enso.webp" width={560} height={560} sweep="ring" startAngle={2} duration={duration} />}
    >
      <p>
        An ensō is one stroke. This one was laid clockwise from 3 o'clock, so BrushReveal uncovers the art along
        that path instead of fading it in.
      </p>
      <p>
        The front frays because each bristle line reaches its own distance, and ink just behind it reads darker
        while it is wet. The timing follows jo-ha-kyu. The brush presses, speeds up, and leaves the paper still moving.
      </p>
      <p>
        When the stroke lands, the canvas ends on the image's own pixels, hands back to the plain image and
        releases its WebGL context.
      </p>
      <div className="controls">
        <button type="button" className="primary" onClick={replay}>
          Replay
        </button>
        <Range label="Duration" value={duration} min={0.6} max={3} step={0.1} unit=" s" onChange={setDuration} />
      </div>
      <Code>{`<BrushReveal
  src="/enso.webp"
  width={560}
  height={560}
  sweep="ring"
  startAngle={2}
  duration={${String(duration)}}
/>`}</Code>
    </Study>
  );
}

export function BandStudy(): JSX.Element {
  const [run, replay] = useReplay();
  const [duration, setDuration] = useState(1.4);
  return (
    <Study
      id="band"
      kanji="一"
      title="Paint a band"
      what='BrushReveal with sweep="line"'
      stage={
        <BrushReveal key={run} src="/art/brush-band.webp" width={1342} height={130} duration={duration} style={{ height: 56, marginBlock: 48 }} />
      }
    >
      <p>
        The line sweep paints left to right. TenguByte uses this band to join the four steps of its process, so
        one stroke runs through all of them.
      </p>
      <p>
        Give the wrapper a width and a height to stretch the art to fill, as here, or a width alone to keep its
        shape.
      </p>
      <div className="controls">
        <button type="button" className="primary" onClick={replay}>
          Replay
        </button>
        <Range label="Duration" value={duration} min={0.6} max={3} step={0.1} unit=" s" onChange={setDuration} />
      </div>
      <Code>{`<BrushReveal
  src="/band.webp"
  width={1342}
  height={130}
  duration={${String(duration)}}
  style={{ height: 56 }}
/>`}</Code>
    </Study>
  );
}
