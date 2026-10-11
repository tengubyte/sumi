import type { JSX } from "react";
import { BrushStudy } from "./BrushStudy";
import { DropStudy } from "./DropStudy";
import { EmberStudy } from "./EmberStudy";
import { EnsoStudy } from "./EnsoStudy";
import { FloatStudy } from "./FloatStudy";
import { HankoStudy } from "./HankoStudy";
import { MarkStudy } from "./MarkStudy";
import { BandStudy, RingStudy } from "./Reveals";
import { SansuiStudy } from "./SansuiStudy";
import { SplatStudy } from "./SplatStudy";
import { StrikeStudy } from "./StrikeStudy";
import { TornStudy } from "./TornStudy";
import { TransitionStudy } from "./TransitionStudy";
import { UnrollStudy } from "./UnrollStudy";
import { WipeStudy } from "./WipeStudy";

type Body = (dark: boolean) => JSX.Element;

/** Each effect's studies, by its slug in `EFFECTS`. */
export const BODIES: Readonly<Record<string, Body>> = {
  "brush-reveal": () => (
    <>
      <RingStudy />
      <UnrollStudy />
      <BandStudy />
    </>
  ),
  "brush-paint": (dark) => <BrushStudy dark={dark} />,
  "brush-mark": () => <MarkStudy />,
  hanko: () => <HankoStudy />,
  "kanji-strike": () => <StrikeStudy />,
  enso: (dark) => <EnsoStudy dark={dark} />,
  suminagashi: (dark) => <FloatStudy dark={dark} />,
  "ink-drop": (dark) => <DropStudy dark={dark} />,
  "ink-wipe": (dark) => <WipeStudy dark={dark} />,
  "ink-transition": (dark) => <TransitionStudy dark={dark} />,
  "torn-edge": (dark) => <TornStudy dark={dark} />,
  sansui: (dark) => <SansuiStudy dark={dark} />,
  "ink-splat": (dark) => <SplatStudy dark={dark} />,
  hinoko: () => <EmberStudy />,
};
