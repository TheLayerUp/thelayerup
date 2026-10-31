"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useId, useState } from "react";
import { ArrowUpRight, Loader2, Search } from "lucide-react";
import { formatPrice, cn } from "@/lib/utils";
import type { SearchSuggestion } from "@/server/queries/catalog";
import { useLocalized } from "@/i18n/LanguageProvider";

const POPULAR = ["Lamps", "Planters", "Keychains", "Desk"];

/** Search input with type-ahead suggestions (↑/↓ to move, Enter to open, Esc to close). */
export default function SearchBox({ onDone }: { onDone: () => void }) {
  const router = useRouter();
  const loc = useLocalized();
  const listId = useId();
  const [q, setQ] = useState("");
  const [results, setResults] = useState<SearchSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(-1);

  const term = q.trim();

  useEffect(() => {
    if (term.length < 2) return;
    const ctrl = new AbortController();
    // Debounced so typing doesn't fire a request per keystroke.
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(term)}`, { signal: ctrl.signal });
        const data = (await res.json()) as { results: SearchSuggestion[] };
        setResults(data.results);
        setActive(-1);
      } catch {
        // Aborted or offline; the full search page still works on Enter.
      } finally {
        if (!ctrl.signal.aborted) setLoading(false);
      }
    }, 180);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [term]);

  const shown = term.length >= 2 ? results : [];

  const go = (href: string) => {
    onDone();
    router.push(href);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") onDone();
    if (!shown.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => (i + 1) % shown.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => (i <= 0 ? shown.length - 1 : i - 1));
    } else if (e.key === "Enter" && active >= 0) {
      e.preventDefault();
      go(`/products/${shown[active].slug}`);
    }
  };

  return (
    <div>
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          go(term ? `/products?q=${encodeURIComponent(term)}` : "/products");
        }}
        className="relative"
      >
        <Search className="pointer-events-none absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
        <input
          name="q"
          autoFocus
          autoComplete="off"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Search lamps, planters, keychains…"
          role="combobox"
          aria-expanded={shown.length > 0}
          aria-controls={listId}
          aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
          className="h-12 w-full rounded-2xl border border-border bg-surface pr-12 pl-12 text-base outline-none focus:border-primary focus:ring-2 focus:ring-primary/25"
        />
        {loading && (
          <Loader2 className="absolute top-1/2 right-4 h-5 w-5 -translate-y-1/2 animate-spin text-muted-foreground" />
        )}
      </form>

      {shown.length > 0 ? (
        <ul id={listId} role="listbox" className="mt-2 max-h-[60vh] overflow-y-auto">
          {shown.map((r, i) => (
            <li key={r.id} id={`${listId}-${i}`} role="option" aria-selected={i === active}>
              <button
                type="button"
                onClick={() => go(`/products/${r.slug}`)}
                onMouseEnter={() => setActive(i)}
                className={cn(
                  "flex w-full cursor-pointer items-center gap-3 rounded-2xl p-2 text-left transition-colors",
                  i === active ? "bg-surface-2" : "hover:bg-surface-2"
                )}
              >
                <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-surface-2">
                  <Image src={r.image} alt="" fill sizes="48px" className="object-cover" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">{loc(r.name, r.nameHi)}</span>
                  <span className="block text-xs text-muted-foreground">{loc(r.category, r.categoryHi)}</span>
                </span>
                <span className="text-sm font-bold">{formatPrice(r.price)}</span>
              </button>
            </li>
          ))}
          <li>
            <button
              type="button"
              onClick={() => go(`/products?q=${encodeURIComponent(term)}`)}
              className="mt-1 flex w-full cursor-pointer items-center justify-between rounded-2xl px-3 py-2.5 text-sm font-semibold text-primary-strong hover:bg-surface-2"
            >
              See all results for &ldquo;{term}&rdquo;
              <ArrowUpRight className="h-4 w-4" />
            </button>
          </li>
        </ul>
      ) : term.length >= 2 && !loading ? (
        <p className="px-2 pt-3 text-sm text-muted-foreground">No matches yet. Press Enter to search everything.</p>
      ) : (
        <div className="flex flex-wrap items-center gap-2 px-1 pt-3">
          <span className="text-xs text-muted-foreground">Popular:</span>
          {POPULAR.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setQ(p)}
              className="cursor-pointer rounded-full border border-border px-3 py-1 text-xs font-medium hover:border-primary hover:text-primary-strong"
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
