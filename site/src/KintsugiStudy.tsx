import { Kintsugi } from "@tengubyte/sumi";
import { useState, type JSX } from "react";
import { Choice, Code, Study, useReplay } from "./parts";

type Picture = "scene" | "tengu";

const PICTURES: Readonly<Record<Picture, { readonly src: string; readonly width: number; readonly height: number; readonly alt: string; readonly impact: readonly [number, number] }>> = {
  scene: { src: "/art/scene.webp", width: 1200, height: 800, alt: "A red sun over blue hills and cherry blossom", impact: [0.42, 0.48] },
  tengu: { src: "/art/tengu.webp", width: 720, height: 480, alt: "A tengu in black and red under a red ensō", impact: [0.6, 0.45] },
};

export function KintsugiStudy(): JSX.Element {
  const [run, replay] = useReplay();
  const [picture, setPicture] = useState<Picture>("scene");
  const [seed, setSeed] = useState(1);
  const shuffle = (): void => {
    setSeed(Math.floor(Math.random() * 900) + 1);
  };
  const { src, width, height, alt, impact } = PICTURES[picture];
  return (
    <Study
      id="kintsugi"
      kanji="継"
      title="Mend with gold"
      what="Kintsugi"
      stage={<Kintsugi key={`${picture} ${String(run)}`} src={src} width={width} height={height} alt={alt} impact={impact} seed={seed} />}
    >
      <p>
        Kintsugi (金継ぎ) mends broken pottery with lacquer and gold. The picture shakes, cracks run out from the
        blow, small shards near it and a few long cracks reaching the edges, each tapering to a point. Red urushi
        fills them from the blow outward, then gold is dusted on, and a sheen crosses the seams once.
      </p>
      <p>
        The mended picture stays on a canvas over the hidden image. Only its opaque part breaks, so a cut-out
        figure cracks and the space round it stays clear. The seams are measured in pixels.
      </p>
      <div className="controls">
        <Choice label="Picture" options={[["scene", "Scene"], ["tengu", "Cut-out"]]} value={picture} onChange={setPicture} />
        <button type="button" className="primary" onClick={shuffle}>
          New seed
        </button>
        <button type="button" onClick={replay}>
          Replay
        </button>
      </div>
      <Code>{`<Kintsugi
  src="${src.replace("/art", "")}"
  width={${String(width)}}
  height={${String(height)}}
  alt="..."
  impact={[${impact.join(", ")}]}
  seed={${String(seed)}}
/>`}</Code>
    </Study>
  );
}
