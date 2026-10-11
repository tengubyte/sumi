import type { JSX } from "react";
import { useMedia } from "./parts";

// In page order, so the index reads the way the page scrolls.
const GROUPS = [
  ["Brush", [["ring", "BrushReveal"], ["brush", "BrushPaint"], ["mark", "BrushMark"], ["hanko", "Hanko"], ["enso", "Enso"]]],
  ["Water", [["float", "Suminagashi"], ["drop", "InkDrop"]]],
  ["Image and page", [["wipe", "InkWipe"], ["transition", "inkTransition"]]],
  ["Scene", [["sansui", "Sansui"], ["splat", "InkSplat"]]],
  ["Core", [["api", "Without React"]]],
] as const;

/** Links to every effect's section. A menu on phones; on wider screens it stays open and the toggle is hidden. */
export function EffectIndex(): JSX.Element {
  const wide = useMedia("(min-width: 640px)");
  return (
    <nav className="index" aria-label="Effects">
      <details open={wide}>
        <summary>Effects</summary>
        <ul>
          {GROUPS.map(([group, links]) => (
            <li key={group}>
              <span>{group}</span>
              <ul>
                {links.map(([id, name]) => (
                  <li key={id}>
                    <a href={`#${id}`}>{name}</a>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </details>
    </nav>
  );
}
