import type { JSX, ReactNode } from "react";
import { Code } from "./parts";
import { Link } from "./router";

// Renders the README's own small share of markdown: fenced code, tables, flat lists and paragraphs, with
// inline code, bold and links. The README is ours, so it becomes React elements, never raw HTML.

/** README sections by their `## ` heading; the empty key holds what comes before the first one. */
export function sections(source: string): ReadonlyMap<string, string> {
  const found = new Map<string, string>();
  const [intro = "", ...rest] = source.split(/^## /m);
  found.set("", intro);
  for (const part of rest) {
    const end = part.indexOf("\n");
    found.set(part.slice(0, end).trim(), part.slice(end + 1));
  }
  return found;
}

type Block = { readonly kind: "code" | "p"; readonly text: string } | { readonly kind: "list"; readonly items: readonly string[] } | { readonly kind: "table"; readonly rows: readonly (readonly string[])[] };

/** Where a link in the README should go on this site. */
export type Resolve = (href: string) => string;

const PIPE = "\u0000";

function cells(row: string): string[] {
  return row
    .replaceAll("\\|", PIPE)
    .split("|")
    .slice(1, -1)
    .map((cell) => cell.trim().replaceAll(PIPE, "|"));
}

function blocks(source: string): Block[] {
  const lines = source.split("\n");
  const out: Block[] = [];
  let i = 0;
  const run = (keep: (line: string) => boolean): string[] => {
    const start = i;
    while (i < lines.length && keep(lines[i] ?? "")) i++;
    return lines.slice(start, i);
  };
  while (i < lines.length) {
    const line = lines[i] ?? "";
    if (line.startsWith("```")) {
      i++;
      out.push({ kind: "code", text: run((l) => !l.startsWith("```")).join("\n") });
      i++;
    } else if (line.startsWith("|")) {
      out.push({ kind: "table", rows: run((l) => l.startsWith("|")).filter((l) => !/^\|[\s|:-]+\|$/.test(l)).map(cells) });
    } else if (line.startsWith("- ")) {
      out.push({ kind: "list", items: run((l) => l.startsWith("- ")).map((l) => l.slice(2)) });
    } else if (line.trim() === "") {
      i++;
    } else {
      out.push({ kind: "p", text: run((l) => l.trim() !== "" && !/^(```|\||- )/.test(l)).join(" ") });
    }
  }
  return out;
}

const INLINE = /``\s?(.+?)\s?``|`([^`]+)`|\*\*(.+?)\*\*|\[([^\]]+)\]\(([^)\s]+)\)/g;

function inline(text: string, resolve: Resolve): ReactNode[] {
  const out: ReactNode[] = [];
  let last = 0;
  for (const match of text.matchAll(INLINE)) {
    const [whole, wide, code, bold, label, href] = match;
    out.push(text.slice(last, match.index));
    const key = match.index;
    if (wide ?? code) out.push(<code key={key}>{wide ?? code}</code>);
    else if (bold) out.push(<strong key={key}>{inline(bold, resolve)}</strong>);
    else if (label && href) out.push(<Anchor key={key} to={resolve(href)}>{inline(label, resolve)}</Anchor>);
    last = match.index + whole.length;
  }
  out.push(text.slice(last));
  return out;
}

/** A page of this site goes through the router; a section of this page or another site is a plain link. */
function Anchor({ to, children }: { readonly to: string; readonly children: ReactNode }): JSX.Element {
  return to.startsWith("/") ? <Link to={to}>{children}</Link> : <a href={to}>{children}</a>;
}

/** On a phone each row stacks, and each cell names its column, so a wide table never scrolls sideways. */
function Table({ rows, resolve }: { readonly rows: readonly (readonly string[])[]; readonly resolve: Resolve }): JSX.Element {
  const [head = [], ...body] = rows;
  return (
    <table className="md-table">
      <thead>
        <tr>
          {head.map((cell) => (
            <th key={cell}>{inline(cell, resolve)}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {body.map((row) => (
          <tr key={row.join("|")}>
            {row.map((cell, i) => (
              <td key={i} data-label={head[i]?.replaceAll("`", "")}>
                {inline(cell, resolve)}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function Markdown({ source, resolve }: { readonly source: string; readonly resolve: Resolve }): JSX.Element {
  return (
    <>
      {blocks(source).map((block, i) => {
        if (block.kind === "code") return <Code key={i}>{block.text}</Code>;
        if (block.kind === "table") return <Table key={i} rows={block.rows} resolve={resolve} />;
        if (block.kind === "list")
          return (
            <ul key={i} className="facts">
              {block.items.map((item) => (
                <li key={item}>{inline(item, resolve)}</li>
              ))}
            </ul>
          );
        return <p key={i}>{inline(block.text, resolve)}</p>;
      })}
    </>
  );
}
