export type Group = "brush" | "water" | "image" | "scene";

export const GROUPS: readonly (readonly [Group, string])[] = [
  ["brush", "Brush"],
  ["water", "Water"],
  ["image", "Image and page"],
  ["scene", "Scene"],
];

export interface Effect {
  /** Its studies in `BODIES`, and its docs page under /docs. */
  readonly slug: string;
  /** The component, as the README heads its section. */
  readonly name: string;
  readonly group: Group;
  /** The ids of its study sections, which old `/#section` links point at. */
  readonly anchors: readonly string[];
}

/** In page order, grouped. */
export const EFFECTS: readonly Effect[] = [
  { slug: "brush-reveal", name: "BrushReveal", group: "brush", anchors: ["ring", "unroll", "band"] },
  { slug: "brush-paint", name: "BrushPaint", group: "brush", anchors: ["brush"] },
  { slug: "brush-mark", name: "BrushMark", group: "brush", anchors: ["mark"] },
  { slug: "hanko", name: "Hanko", group: "brush", anchors: ["hanko"] },
  { slug: "kanji-strike", name: "KanjiStrike", group: "brush", anchors: ["strike"] },
  { slug: "enso", name: "Enso", group: "brush", anchors: ["enso"] },
  { slug: "fude", name: "Fude", group: "brush", anchors: ["fude"] },
  { slug: "suminagashi", name: "Suminagashi", group: "water", anchors: ["float"] },
  { slug: "ink-drop", name: "InkDrop", group: "water", anchors: ["drop"] },
  { slug: "ink-wipe", name: "InkWipe", group: "image", anchors: ["wipe"] },
  { slug: "ink-transition", name: "inkTransition", group: "image", anchors: ["transition"] },
  { slug: "torn-edge", name: "TornEdge", group: "image", anchors: ["torn"] },
  { slug: "irodori", name: "Irodori", group: "image", anchors: ["irodori"] },
  { slug: "hake", name: "HakeCut", group: "image", anchors: ["hake"] },
  { slug: "tachigami", name: "Tachigami", group: "image", anchors: ["slash"] },
  { slug: "sansui", name: "Sansui", group: "scene", anchors: ["sansui"] },
  { slug: "ink-splat", name: "InkSplat", group: "scene", anchors: ["splat"] },
  { slug: "hinoko", name: "Hinoko", group: "scene", anchors: ["embers"] },
  { slug: "kaen", name: "Kaen", group: "scene", anchors: ["fire"] },
  { slug: "shuchusen", name: "Shuchusen", group: "scene", anchors: ["focus"] },
  { slug: "hanasaka", name: "Hanasaka", group: "scene", anchors: ["bloom"] },
];

/** The effects page. */
export const LIST = { path: "/effects", name: "Effects", line: "Every effect in sumi. Each one plays as it scrolls into view." } as const;

/** The site was one page; an old `/#section` link now opens that section on the effects page, or the docs. */
export function addressForAnchor(hash: string): string | undefined {
  const id = hash.replace(/^#/, "");
  if (id === "api") return "/docs/without-react";
  return EFFECTS.some((effect) => effect.anchors.includes(id)) ? `${LIST.path}#${id}` : undefined;
}
