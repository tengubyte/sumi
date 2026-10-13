import { BrushMark, InkSplat, KanjiStrike } from "@tengubyte/sumi";
import type { JSX } from "react";
import { LIST } from "./effects";
import { Code } from "./parts";
import { Link } from "./router";
import { sumiFor } from "./SplatStudy";
import { SHOWCASE } from "./showcases";

/** The mark and the site links, on every page. The effects have their own page, so this stays one row however many ship. */
export function Header(): JSX.Element {
  return (
    <div className="wrap">
      <header className="top">
        <Link to="/" className="mark" label="sumi home">
          <span className="kanji" lang="ja" aria-hidden="true">
            墨
          </span>
          sumi
        </Link>
        <nav aria-label="Site">
          <Link to="/">Home</Link>
          <Link to={LIST.path}>Effects</Link>
          <Link to={SHOWCASE.path}>Showcase</Link>
          <a href="https://github.com/tengubyte/sumi">GitHub</a>
          <a className="maker" href="https://tengubyte.io/">
            <img src="/tengubyte.svg" alt="" width={22} height={22} />
            TenguByte
          </a>
        </nav>
      </header>
    </div>
  );
}

/** The home page: what sumi is and how to install it. The effects are on their own page. */
export function Hero({ dark }: { readonly dark: boolean }): JSX.Element {
  return (
    <main className="intro">
      {/* Thrown in from past the right edge of the page, as on tengubyte.io. */}
      <InkSplat className="hero-splat" underColor={sumiFor(dark)} delay={0.4} />
      <section className="hero wrap" aria-labelledby="hero-title">
        <div>
          <h1 id="hero-title" tabIndex={-1}>
            Brush and{" "}
            <BrushMark seed={4} delay={0.6}>
              ink
            </BrushMark>{" "}
            for React
          </h1>
          <p className="lede">
            sumi has twenty-one effects, each a WebGL shader that paints in the browser. Most play once as they scroll
            into view; inkTransition plays each time you call it, Hinoko, Kaen and Shuchusen run while they are on screen,
            and Fude is a brush the visitor draws with. React is the only dependency.
          </p>
          <Code>npm install github:tengubyte/sumi#v0.9.0</Code>
          <p className="more">
            <Link to={LIST.path}>See every effect</Link> or <Link to={SHOWCASE.path}>see them build two made-up sites</Link>
          </p>
        </div>
      </section>
    </main>
  );
}

/** A path with no page. The strike is 無, nothing. */
export function NotFound(): JSX.Element {
  return (
    <main className="wrap">
      <header className="page-head">
        <h1 tabIndex={-1}>Nothing here</h1>
        <p className="lede">
          No page lives at this address. The effects are all on <Link to={LIST.path}>one page</Link>.
        </p>
      </header>
      <KanjiStrike text="無" label="Nothing" font='"Yuji Syuku"' weight={400} className="missing" />
    </main>
  );
}

export function Footer(): JSX.Element {
  return (
    <footer className="wrap">
      <p>
        Made by{" "}
        <a className="maker" href="https://tengubyte.io/">
          <img src="/tengubyte.svg" alt="" width={20} height={20} />
          TenguByte
        </a>
        , a small software studio. Sumi (墨) is the ink of Japanese brush painting.
      </p>
      <p>
        The code is MIT licensed. The ensō, band and landscape art on this site belong to TenguByte and are not part of the
        package. Stroke data for 永 and 墨 comes from <a href="https://kanjivg.tagaini.net/">KanjiVG</a> by Ulrich
        Apel, under CC BY-SA 3.0.
      </p>
    </footer>
  );
}
