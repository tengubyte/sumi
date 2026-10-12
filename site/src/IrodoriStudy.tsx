import { Irodori, type Blot } from "@tengubyte/sumi";
import { useState, type JSX } from "react";
import type { Row } from "./apiRows";
import { Choice, Code, Study, useReplay } from "./parts";

const IRODORI: readonly Row[] = [
  ["src, width, height, alt", "", "required", "The picture, and its own size in px."],
  ["blooms", "[x, y, start][]", "three", "Where colour starts, as shares of the picture, and when, as a share of the run. Up to five."],
  ["paper, ink", "#rrggbb", '"#f5f1eb", "#161314"', "The light and the dark of the wash."],
  ["seed", "number", "1", "Changes the shape of the blooms."],
  ["duration, delay", "number", "2.6, 0", "Seconds the colour takes, and seconds to wait once in view."],
  ["className, style", "", "", "Sizes the wrapper. Width alone keeps the picture's shape."],
];

type Art = "scene" | "tengu";
type Spread = "three" | "edge" | "five";

const ART: Readonly<Record<Art, { readonly src: string; readonly width: number; readonly height: number; readonly alt: string }>> = {
  scene: { src: "/art/scene.webp", width: 1200, height: 800, alt: "A red sun over blue hills, a river, a red bridge and cherry blossom" },
  tengu: { src: "/art/tengu.webp", width: 720, height: 480, alt: "A crow tengu in black and red, seated on a rock inside a red brush circle" },
};

const BLOOMS: Readonly<Record<Spread, readonly Blot[] | undefined>> = {
  three: undefined,
  edge: [[-0.1, 0.5, 0]],
  five: [[0.2, 0.2, 0], [0.8, 0.3, 0.1], [0.35, 0.75, 0.2], [0.7, 0.8, 0.3], [0.5, 0.5, 0.4]],
};

const CODE: Readonly<Record<Spread, string>> = {
  three: "",
  edge: "\n  blooms={[[-0.1, 0.5, 0]]}\n  duration={3.4}",
  five: "\n  blooms={[\n    [0.2, 0.2, 0],\n    [0.8, 0.3, 0.1],\n    [0.35, 0.75, 0.2],\n    [0.7, 0.8, 0.3],\n    [0.5, 0.5, 0.4],\n  ]}",
};

export function IrodoriStudy(): JSX.Element {
  const [run, replay] = useReplay();
  const [art, setArt] = useState<Art>("scene");
  const [spread, setSpread] = useState<Spread>("three");
  const [seed, setSeed] = useState(1);
  const shuffle = (): void => {
    setSeed(Math.floor(Math.random() * 900) + 1);
  };
  const picture = ART[art];
  return (
    <Study
      id="irodori"
      kanji="彩"
      title="Colour a picture in"
      what="Irodori"
      props={{ rows: IRODORI, label: "Irodori props" }}
      stage={
        <Irodori
          key={`${art} ${spread} ${String(seed)} ${String(run)}`}
          {...picture}
          blooms={BLOOMS[spread]}
          seed={seed}
          duration={spread === "edge" ? 3.4 : undefined}
        />
      }
    >
      <p>
        The picture starts as an ink wash on paper. Colour seeps in from a few wet blooms, each with a ragged,
        lobed edge and a dark rim where the pigment pools, until they meet and the picture is whole.
      </p>
      <p>
        It ends on the plain image, so the picture shows as it is without WebGL and with reduced motion. Until
        the colour starts the browser greys the image, so nothing flashes in full colour first.
      </p>
      <div className="controls">
        <Choice label="Picture" options={[["scene", "Scene"], ["tengu", "Tengu"]]} value={art} onChange={setArt} />
        <Choice label="Blooms" options={[["three", "Three"], ["edge", "From the edge"], ["five", "Five"]]} value={spread} onChange={setSpread} />
        <button type="button" className="primary" onClick={shuffle}>
          New seed
        </button>
        <button type="button" onClick={replay}>
          Replay
        </button>
      </div>
      <Code>{`<Irodori
  src="${picture.src.replace("/art", "")}"
  width={${String(picture.width)}}
  height={${String(picture.height)}}
  alt="..."${CODE[spread]}
/>`}</Code>
    </Study>
  );
}
