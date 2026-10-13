import "@fontsource/shippori-mincho/latin-500.css";
import "@fontsource/shippori-mincho/latin-700.css";
import { Hinoko, Kaen, Suminagashi, TachigamiText, TornBand } from "@tengubyte/sumi";
import type { JSX } from "react";
import { ShowcaseBar } from "./Showcase";
import { ForgeFooter, ForgeHeader, Order } from "./SumiganeParts";

const PAPER = "#f5f1ee";

const SHAPES = [
  { name: "Gyuto", what: "The chef's knife. Long and pointed, it rocks through herbs and slices a roast in one draw." },
  { name: "Santoku", what: "Named for three virtues, meat, fish and vegetables. Its flatter edge chops straight down." },
  { name: "Petty", what: "The small one, for shallots, fruit and the work you do in your hand." },
] as const;

function Hero(): JSX.Element {
  return (
    <section className="forge-hero wrap" aria-labelledby="forge-title">
      <figure className="forge-cut">
        <TachigamiText text="炭金" label="Sumigane, charcoal and metal" font='"Yuji Syuku"' weight={400} textColor="#161314" color="#d8001a" mode="apart" delay={0.3} />
        <figcaption>
          Cut with <a href="/effects#slash">TachigamiText</a>
        </figcaption>
      </figure>
      <div className="forge-intro">
        <h1 id="forge-title" tabIndex={-1}>
          Sumigane Forge
        </h1>
        <div>
          <p>Kitchen knives forged one at a time over pine charcoal. The name joins sumi, charcoal, and kane, metal.</p>
          <a className="forge-button" href="#order">
            Order a knife
          </a>
        </div>
      </div>
    </section>
  );
}

function Forge(): JSX.Element {
  return (
    <section id="forge" className="forge-night" aria-labelledby="forge-fire-title">
      <TornBand color={PAPER} side="bottom" seed={4} style={{ display: "block", width: "100%", height: 72 }} />
      <div className="wrap forge-fire-text">
        <h2 id="forge-fire-title">Forged over pine charcoal</h2>
        <p>
          Pine charcoal is the old fuel of Japanese smiths. It burns clean and steady, and its glow lets a smith judge
          the heat by colour, so the forge is kept dim.
        </p>
        <p>Each blade starts as a core of hard steel welded between two layers of soft iron. The hammer draws it out, then it is quenched in water and tempered.</p>
        <p className="forge-cap">
          Fire by <a href="/effects#fire">Kaen</a>, embers by <a href="/effects#embers">Hinoko</a>, the torn edges by{" "}
          <a href="/effects#torn">TornBand</a>
        </p>
      </div>
      <div className="forge-fire">
        <Kaen look="night" seed={3} className="forge-flames" />
        <Hinoko count={90} wind={0.2} style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} />
      </div>
      <TornBand color={PAPER} side="top" seed={9} style={{ display: "block", width: "100%", height: 72 }} />
    </section>
  );
}

function Shapes(): JSX.Element {
  return (
    <section id="knives" className="forge-shapes wrap" aria-labelledby="knives-title">
      <h2 id="knives-title">Three shapes</h2>
      <ul>
        {SHAPES.map((shape) => (
          <li key={shape.name}>
            <h3>{shape.name}</h3>
            <p>{shape.what}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Finish(): JSX.Element {
  return (
    <section id="finish" className="forge-finish wrap" aria-labelledby="finish-title">
      <div>
        <h2 id="finish-title">The suminagashi finish</h2>
        <p>
          Suminagashi is the old craft of floating ink on water and lifting it onto paper. A blade can carry the same
          lines. Its cladding is folded from two kinds of iron and etched, so the layers show on the steel.
        </p>
      </div>
      <figure>
        <Suminagashi pattern="flow" color="#161314" accent="#4b4547" className="forge-water" />
        <figcaption>
          Floated with <a href="/effects#float">Suminagashi</a>
        </figcaption>
      </figure>
    </section>
  );
}

/**
 * A made-up knife forge built from six of the effects, each named in a caption. It brings its own header, footer
 * and type, so it reads as another site that uses sumi rather than a page of the docs.
 */
export function Sumigane(): JSX.Element {
  return (
    <div className="forge-page">
      <ShowcaseBar name="Sumigane" />
      <ForgeHeader />
      <main>
        <Hero />
        <Forge />
        <Shapes />
        <Finish />
        <section id="order" className="forge-order wrap" aria-labelledby="order-title">
          <h2 id="order-title">Order a knife</h2>
          <p>Pick a shape and a finish. The forge is made up, so the order goes nowhere, but sending it shows the seal a forge would press on your slip.</p>
          <Order />
        </section>
      </main>
      <ForgeFooter />
    </div>
  );
}
