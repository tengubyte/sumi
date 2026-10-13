import "@fontsource/zen-maru-gothic/latin-400.css";
import "@fontsource/zen-maru-gothic/latin-700.css";
import { Enso, Hanasaka, InkDrop, Sansui } from "@tengubyte/sumi";
import type { JSX } from "react";
import { ShowcaseBar } from "./Showcase";
import { Book, TsukiFooter, TsukiHeader } from "./TsukimiParts";

/** Pale ink reads as moonlit ridges on the night ground; gold is the moon, the button and the seal, nothing else. */
const RIDGE = "#8e97ba";
const GOLD = "#e3c77a";
const MOON_PAPER = "#ece6d6";

function Hero(): JSX.Element {
  return (
    <section className="tsuki-hero" aria-labelledby="tsuki-title">
      {/* The name and the action come first, so a laptop's first screen holds them with the moon. */}
      <div className="wrap tsuki-intro">
        <h1 id="tsuki-title" tabIndex={-1}>
          Tsukimi-an
        </h1>
        <div>
          <p>A tea house that opens on moonlit nights. Tsukimi is moon viewing, and an is a small, plain hut.</p>
          <a className="tsuki-button" href="#book">
            Book a seat
          </a>
        </div>
      </div>
      <figure>
        <Sansui color={RIDGE} sunColor={GOLD} mist={0.7} seed={5} className="tsuki-ridges" />
        <figcaption className="wrap">
          Painted with <a href="/effects#sansui">Sansui</a>
        </figcaption>
      </figure>
    </section>
  );
}

function Tea(): JSX.Element {
  return (
    <section id="tea" className="tsuki-tea wrap" aria-labelledby="tea-title">
      <figure>
        <InkDrop drops={[[0.36, 0.08], [0.66, 0.12, 1]]} color="#8db86b" className="tsuki-drop" />
        <figcaption>
          Dropped with <a href="/effects#drop">InkDrop</a>
        </figcaption>
      </figure>
      <div>
        <h2 id="tea-title">The tea</h2>
        <p>
          Matcha is green tea leaf ground to a fine powder. The host whisks it with hot water in a bowl until it froths,
          and each guest drinks the bowl in a few sips.
        </p>
      </div>
    </section>
  );
}

function Spring(): JSX.Element {
  return (
    <section id="spring" className="tsuki-spring" aria-labelledby="spring-title">
      <div className="wrap">
        <h2 id="spring-title">Spring nights</h2>
        <p>Yozakura is cherry blossom seen at night. While the tree by the veranda is in bloom, tea is served under it after dark.</p>
      </div>
      <figure>
        <Hanasaka from={[-0.03, 0.9]} angle={8} reach={2.6} bark="#6e6070" outline="#2a2238" seed={6} className="tsuki-branch" />
        <figcaption className="wrap">
          Grown with <a href="/effects#bloom">Hanasaka</a>
        </figcaption>
      </figure>
    </section>
  );
}

function Circle(): JSX.Element {
  return (
    <section id="circle" className="tsuki-circle wrap" aria-labelledby="circle-title">
      {/* Only the short name fits inside the ring at every width; the words that explain it follow. */}
      <div className="tsuki-ring">
        <Enso color={MOON_PAPER} seed={2} className="tsuki-enso" />
        <h2 id="circle-title">Ichigo ichie</h2>
      </div>
      <p>
        One time, one meeting. The phrase comes from the tea ceremony. Each gathering happens once and will not come
        again, so host and guests give it their whole attention.
      </p>
      <p className="tsuki-cap">
        Drawn with <a href="/effects#enso">Enso</a>
      </p>
    </section>
  );
}

/**
 * A made-up tea house built from five of the effects, each named in a caption. Night where Sumigane is paper, so
 * the two together show one package in two looks.
 */
export function Tsukimi(): JSX.Element {
  return (
    <div className="tsuki-page">
      <ShowcaseBar name="Tsukimi-an" />
      <TsukiHeader />
      <main>
        <Hero />
        <Tea />
        <Spring />
        <Circle />
        <section id="book" className="tsuki-book wrap" aria-labelledby="book-title">
          <h2 id="book-title">Book a seat</h2>
          <p>Nothing leaves this page. Sending it shows the seal a host would press on your card.</p>
          <Book />
        </section>
      </main>
      <TsukiFooter />
    </div>
  );
}
