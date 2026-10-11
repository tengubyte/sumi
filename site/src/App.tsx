import { InkSplat } from "@tengubyte/sumi";
import type { JSX } from "react";
import { Api } from "./Api";
import { BrushStudy } from "./BrushStudy";
import { EnsoStudy } from "./EnsoStudy";
import { FloatStudy } from "./FloatStudy";
import { Code, useDark } from "./parts";
import { BandStudy, RingStudy } from "./Reveals";
import { SplatStudy, sumiFor } from "./SplatStudy";
import { UnrollStudy } from "./UnrollStudy";

export function App(): JSX.Element {
  const dark = useDark();
  return (
    <>
      <div className="intro">
        {/* Thrown in from past the right edge of the page, as on tengubyte.io. */}
        <InkSplat className="hero-splat" underColor={sumiFor(dark)} delay={0.4} />
        <div className="wrap">
          <header className="top">
            <a className="mark" href="/" aria-label="sumi home">
              <span className="kanji" lang="ja" aria-hidden="true">
                墨
              </span>
              sumi
            </a>
            <nav aria-label="Links">
              <a href="https://github.com/tengubyte/sumi">GitHub</a>
              <a className="maker" href="https://tengubyte.io/">
                <img src="/tengubyte.svg" alt="" width={22} height={22} />
                TenguByte
              </a>
            </nav>
          </header>
          <section className="hero" aria-labelledby="hero-title">
            <div>
              <h1 id="hero-title">Brush and ink for React</h1>
              <p className="lede">
                sumi paints brush art in the way the stroke was laid, writes any SVG's strokes with a brush drawn in
                code, floats ink on water and throws ink splats. Each effect is one WebGL canvas that plays once, then
                gets out of the way. No dependencies besides React.
              </p>
              <Code>npm install github:tengubyte/sumi#v0.2.0</Code>
            </div>
          </section>
        </div>
      </div>
      <main className="wrap">
        <RingStudy />
        <UnrollStudy />
        <BandStudy />
        <BrushStudy dark={dark} />
        <EnsoStudy dark={dark} />
        <FloatStudy dark={dark} />
        <SplatStudy dark={dark} />
        <Api />
      </main>
      <Footer />
    </>
  );
}

function Footer(): JSX.Element {
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
        The code is MIT licensed. The ensō and band art on this page belong to TenguByte and are not part of the
        package. Stroke data for 永 and 墨 comes from <a href="https://kanjivg.tagaini.net/">KanjiVG</a> by Ulrich
        Apel, under CC BY-SA 3.0.
      </p>
    </footer>
  );
}
