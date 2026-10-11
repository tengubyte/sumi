import { useCallback, useEffect, useRef, useState, type JSX, type RefObject } from "react";
import { onceInView, playClock, prefersReducedMotion } from "../../src/core/play";
import { Range, Study } from "./parts";
import { unroller, type Unroller } from "./unroll";

const smooth = (t: number): number => t * t * (3 - 2 * t);

interface Unroll {
  readonly bend: number;
  readonly ready: boolean;
  readonly play: () => void;
  readonly scrub: (bend: number) => void;
}

/** Sets up the unroll on `canvas` once it is in view and plays it once, unless motion is reduced. */
function useUnroll(canvas: RefObject<HTMLCanvasElement | null>): Unroll {
  const painter = useRef<Unroller | null>(null);
  const stopPlay = useRef<() => void>(() => undefined);
  const [bend, setBend] = useState(1);
  const [ready, setReady] = useState(false);

  const play = useCallback((): void => {
    stopPlay.current();
    stopPlay.current = playClock(1.8, 0.3, (s) => {
      setBend(Math.round((1 - smooth(s / 1.8)) * 100) / 100);
    });
  }, []);

  const scrub = useCallback((value: number): void => {
    stopPlay.current();
    setBend(value);
  }, []);

  useEffect(() => {
    const surface = canvas.current;
    if (!surface) return;
    const art = new Image();
    art.src = "/art/enso.webp";
    const stop = onceInView(surface, () => {
      void art.decode().then(() => {
        painter.current = unroller(surface, art);
        if (!painter.current) return;
        setReady(true);
        if (!prefersReducedMotion()) play();
      });
      return undefined;
    });
    return () => {
      stop();
      stopPlay.current();
      painter.current?.dispose();
      painter.current = null;
    };
  }, [canvas, play]);

  useEffect(() => {
    if (ready) painter.current?.draw(bend);
  }, [bend, ready]);

  return { bend, ready, play, scrub };
}

export function UnrollStudy(): JSX.Element {
  const canvas = useRef<HTMLCanvasElement>(null);
  const { bend, ready, play, scrub } = useUnroll(canvas);
  return (
    <Study
      id="unroll"
      kanji="展"
      title="From ring to band"
      what="How the band below was made"
      eager
      stage={<canvas ref={canvas} aria-hidden="true" style={{ display: "block", width: "100%", aspectRatio: "7 / 3" }} />}
    >
      <p>
        The ensō is real brush work, so unrolling the ring by angle gives a straight stroke that keeps everything
        the brush did: the pressed start, the bristle streaks along the travel and the dry split ends.
      </p>
      <p>
        The stroke keeps its length as it straightens, which is why the band is more than twice as wide as the
        ring. This demo lives on this page only; the package paints the band you get.
      </p>
      <div className="controls">
        <button type="button" className="primary" onClick={play} disabled={!ready}>
          Unroll
        </button>
        <Range label="Bend" value={bend} min={0} max={1} step={0.01} onChange={scrub} />
      </div>
    </Study>
  );
}
