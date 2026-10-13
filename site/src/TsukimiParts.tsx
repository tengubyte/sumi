import { Hanko } from "@tengubyte/sumi";
import { useEffect, useRef, useState, type JSX, type SyntheticEvent } from "react";
import { Link } from "./router";

const NIGHTS = ["A spring night, under the cherry", "An autumn night, under the full moon"] as const;

export function TsukiHeader(): JSX.Element {
  return (
    <header className="tsuki-top wrap">
      <p className="tsuki-mark">
        <span lang="ja" aria-hidden="true">
          月見庵
        </span>
        Tsukimi-an
      </p>
      <nav aria-label="Tsukimi-an">
        <a href="#tea">Tea</a>
        <a href="#spring">Spring</a>
        <a href="#circle">Ichigo ichie</a>
        <a href="#book">Book</a>
      </nav>
    </header>
  );
}

export function TsukiFooter(): JSX.Element {
  return (
    <footer className="tsuki-foot wrap">
      <p>
        Tsukimi-an is a made-up tea house. The page shows <Link to="/">sumi</Link>, brush and ink effects for React, made
        by <a href="https://tengubyte.io/">TenguByte</a>.
      </p>
    </footer>
  );
}

/** After a send: the house seal in gold, and the heading takes focus so a screen reader announces it. */
function Seated({ name, again }: { readonly name: string; readonly again: () => void }): JSX.Element {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    heading.current?.focus();
  }, []);
  return (
    <div className="tsuki-sent">
      <figure>
        <Hanko text="月" label="The Tsukimi-an seal" shape="round" color="#e3c77a" font='"Yuji Syuku"' weight={400} className="tsuki-seal" />
        <figcaption>
          Pressed by <a href="/effects#hanko">Hanko</a>
        </figcaption>
      </figure>
      <div>
        <h3 ref={heading} tabIndex={-1}>
          Seat noted{name === "" ? "" : `, ${name}`}.
        </h3>
        <p>Nothing was sent. Tsukimi-an is made up for this showcase, and this is the seal a host would press on your card.</p>
        <button type="button" className="tsuki-again" onClick={again}>
          Start again
        </button>
      </div>
    </div>
  );
}

/** The booking form. Nothing leaves the page: a send swaps the form for the house seal and says so. */
export function Book(): JSX.Element {
  const [name, setName] = useState<string | null>(null);
  const send = (e: SyntheticEvent<HTMLFormElement>): void => {
    e.preventDefault();
    const given = new FormData(e.currentTarget).get("name");
    setName(typeof given === "string" ? given.trim() : "");
  };
  if (name !== null) return <Seated name={name} again={() => { setName(null); }} />;
  return (
    <form className="tsuki-form" onSubmit={send}>
      <label>
        Your name
        <input name="name" autoComplete="name" required />
      </label>
      <label>
        Email
        <input name="email" type="email" autoComplete="email" required />
      </label>
      <label>
        Guests
        <select name="guests" defaultValue="2">
          {["1", "2", "3", "4"].map((count) => (
            <option key={count}>{count}</option>
          ))}
        </select>
      </label>
      <fieldset>
        <legend>Night</legend>
        {NIGHTS.map((night, i) => (
          <label key={night}>
            <input type="radio" name="night" value={night} defaultChecked={i === 0} /> {night}
          </label>
        ))}
      </fieldset>
      <button type="submit" className="tsuki-button">
        Book the seat
      </button>
    </form>
  );
}
