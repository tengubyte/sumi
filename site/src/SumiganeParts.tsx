import { Hanko } from "@tengubyte/sumi";
import { useEffect, useRef, useState, type JSX, type SyntheticEvent } from "react";
import { Link } from "./router";

const SHAPES = ["Gyuto", "Santoku", "Petty"] as const;

/** sumi speaking above the forge's own header: the forge is made up, and this is the way back to the docs. */
export function ShowcaseBar(): JSX.Element {
  return (
    <p className="forge-bar">
      A showcase for sumi. Sumigane is made up, and everything that moves here is a sumi effect, named in its caption.{" "}
      <Link to="/">Back to sumi</Link>
    </p>
  );
}

export function ForgeHeader(): JSX.Element {
  return (
    <header className="forge-top wrap">
      <p className="forge-mark">
        <span lang="ja" aria-hidden="true">
          炭金
        </span>
        Sumigane
      </p>
      <nav aria-label="Sumigane">
        <a href="#forge">Forge</a>
        <a href="#knives">Knives</a>
        <a href="#finish">Finish</a>
        <a href="#order">Order</a>
      </nav>
    </header>
  );
}

export function ForgeFooter(): JSX.Element {
  return (
    <footer className="forge-foot wrap">
      <p>
        Sumigane is a made-up forge. The page shows <Link to="/">sumi</Link>, brush and ink effects for React, made by{" "}
        <a href="https://tengubyte.io/">TenguByte</a>.
      </p>
    </footer>
  );
}

/** After a send: the forge's seal pressed, and the heading takes focus so a screen reader announces it. */
function Sent({ name, again }: { readonly name: string; readonly again: () => void }): JSX.Element {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    heading.current?.focus();
  }, []);
  return (
    <div className="forge-sent">
      <figure>
        <Hanko text="炭金" label="The Sumigane seal" shape="tall" font='"Yuji Syuku"' weight={400} className="forge-seal" />
        <figcaption>
          Pressed by <a href="/effects#hanko">Hanko</a>
        </figcaption>
      </figure>
      <div>
        <h3 ref={heading} tabIndex={-1}>
          Order noted{name === "" ? "" : `, ${name}`}.
        </h3>
        <p>Nothing was sent. Sumigane is made up for this showcase, and this is the seal a forge would press on your order slip.</p>
        <button type="button" className="forge-again" onClick={again}>
          Start again
        </button>
      </div>
    </div>
  );
}

/** The order form. Nothing leaves the page: a send swaps the form for the forge's seal and says so. */
export function Order(): JSX.Element {
  const [name, setName] = useState<string | null>(null);
  const send = (e: SyntheticEvent<HTMLFormElement>): void => {
    e.preventDefault();
    const given = new FormData(e.currentTarget).get("name");
    setName(typeof given === "string" ? given.trim() : "");
  };
  if (name !== null) return <Sent name={name} again={() => { setName(null); }} />;
  return (
    <form className="forge-form" onSubmit={send}>
      <label>
        Your name
        <input name="name" autoComplete="name" required />
      </label>
      <label>
        Email
        <input name="email" type="email" autoComplete="email" required />
      </label>
      <label>
        Shape
        <select name="shape" defaultValue={SHAPES[0]}>
          {SHAPES.map((shape) => (
            <option key={shape}>{shape}</option>
          ))}
        </select>
      </label>
      <fieldset>
        <legend>Finish</legend>
        <label>
          <input type="radio" name="finish" value="kurouchi" defaultChecked /> Kurouchi, the black forge scale left on
        </label>
        <label>
          <input type="radio" name="finish" value="suminagashi" /> Suminagashi, folded and etched
        </label>
      </fieldset>
      <button type="submit" className="forge-button">
        Place the order
      </button>
    </form>
  );
}
