import { Kaen, Sansui } from "@tengubyte/sumi";
import type { JSX } from "react";
import { Link } from "./router";
import { SHOWCASE, SUMIGANE, TSUKIMI } from "./showcases";

/** sumi speaking above a showcase's own header: the site is made up, and these are the ways back to the docs. */
export function ShowcaseBar({ name }: { readonly name: string }): JSX.Element {
  return (
    <p className="showcase-bar">
      A showcase for sumi. {name} is made up, and everything that moves here is a sumi effect, named in its caption.{" "}
      <Link to={SHOWCASE.path}>All showcases</Link> <Link to="/">Back to sumi</Link>
    </p>
  );
}

/** Each card plays the site's own lead effect, on the site's own ground. */
const SITES = [
  {
    page: SUMIGANE,
    look: "Washi paper torn open onto a forge at night, set in Shippori Mincho.",
    uses: "TachigamiText, TornBand, Kaen, Hinoko, Suminagashi, Hanko",
    stage: <Kaen look="night" seed={3} className="showcase-preview" />,
    ground: "#0f0c0b",
  },
  {
    page: TSUKIMI,
    look: "Night indigo with a gold moon, set in Zen Maru Gothic.",
    uses: "Sansui, InkDrop, Hanasaka, Enso, Hanko",
    stage: <Sansui color="#8e97ba" sunColor="#e3c77a" mist={0.7} seed={5} className="showcase-preview" />,
    ground: "#11152a",
  },
] as const;

export function ShowcaseList(): JSX.Element {
  return (
    <main className="wrap">
      <header className="page-head">
        <h1 tabIndex={-1}>Showcase</h1>
        <p className="lede">
          Two made-up sites, each with its own header, type and colours, built from the same package. Hanko is in both,
          red at the forge and gold at the tea house.
        </p>
      </header>
      <ul className="showcase-grid">
        {SITES.map((site) => (
          <li key={site.page.path} className="showcase-card">
            <div className="showcase-stage" style={{ background: site.ground }}>
              {site.stage}
            </div>
            <h2>
              <Link to={site.page.path}>{site.page.name}</Link>
            </h2>
            <p>{site.look}</p>
            <p className="showcase-uses">Uses {site.uses}.</p>
          </li>
        ))}
      </ul>
    </main>
  );
}
