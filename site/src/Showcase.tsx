import { Hanko, Kaen, Sansui } from "@tengubyte/sumi";
import type { JSX } from "react";
import { Link } from "./router";
import { SHOWCASE, SUMIGANE, TSUKIMI } from "./showcases";

/** sumi speaking above a showcase's own header: the site is made up, and these are the ways back to the docs. */
export function ShowcaseBar({ name }: { readonly name: string }): JSX.Element {
  return (
    <div className="showcase-bar">
      <p>A showcase for sumi. {name} is made up, and everything that moves here is a sumi effect, named in its caption.</p>
      <nav aria-label="sumi">
        <Link to={SHOWCASE.path}>All showcases</Link>
        <Link to="/">Back to sumi</Link>
      </nav>
    </div>
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

/** The reuse the showcase exists to prove, pressed here so nobody has to send two forms to see it. */
function Seals(): JSX.Element {
  return (
    <section className="showcase-seals" aria-labelledby="seals-title">
      <h2 id="seals-title">One component, two sites</h2>
      <p>Each site presses Hanko when its form is sent. Only the props change, and both pass Yuji Syuku as the font.</p>
      <div className="showcase-seal-row">
        <figure>
          <div className="showcase-seal-stage" style={{ background: "#f5f1ee" }}>
            <Hanko text="炭金" label="The Sumigane seal" shape="tall" font='"Yuji Syuku"' weight={400} className="showcase-seal-tall" />
          </div>
          <figcaption>
            <code>{'<Hanko text="炭金" shape="tall" />'}</code>
          </figcaption>
        </figure>
        <figure>
          <div className="showcase-seal-stage" style={{ background: "#11152a" }}>
            <Hanko text="月" label="The Tsukimi-an seal" shape="round" color="#e3c77a" font='"Yuji Syuku"' weight={400} className="showcase-seal-round" />
          </div>
          <figcaption>
            <code>{'<Hanko text="月" shape="round" color="#e3c77a" />'}</code>
          </figcaption>
        </figure>
      </div>
    </section>
  );
}

export function ShowcaseList(): JSX.Element {
  return (
    <main className="wrap">
      <header className="page-head">
        <h1 tabIndex={-1}>Showcase</h1>
        <p className="lede">Two made-up sites, each with its own header, type and colours, built from the same package.</p>
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
      <Seals />
    </main>
  );
}
