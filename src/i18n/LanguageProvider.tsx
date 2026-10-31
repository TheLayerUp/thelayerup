"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { Check } from "lucide-react";
import { site } from "@/config/site";
import { formatPrice } from "@/lib/utils";
import { LANGS, dict, type Key, type Lang } from "./dict";

/** Short label for the navbar button, full name for the menu, and the BCP 47 tag for <html lang>. */
const LANG_META: Record<Lang, { short: string; name: string; tag: string }> = {
  en: { short: "EN", name: "English", tag: "en-IN" },
  hi: { short: "हिं", name: "हिन्दी", tag: "hi-IN" },
  ta: { short: "த", name: "தமிழ்", tag: "ta-IN" },
};

const isLang = (v: string | null): v is Lang => (LANGS as readonly string[]).includes(v ?? "");

const STORAGE_KEY = "lang";
const Ctx = createContext<{ lang: Lang; setLang: (l: Lang) => void }>({ lang: "en", setLang: () => {} });

/**
 * Pages render in English (so they stay statically cached); a saved Hindi or
 * Tamil preference is applied right after hydration.
 */
export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reading a browser-only preference after mount
    if (isLang(saved) && saved !== "en") setLangState(saved);
  }, []);

  useEffect(() => {
    document.documentElement.lang = LANG_META[lang].tag;
  }, [lang]);

  const setLang = useCallback((l: Lang) => {
    localStorage.setItem(STORAGE_KEY, l);
    setLangState(l);
  }, []);

  return <Ctx.Provider value={{ lang, setLang }}>{children}</Ctx.Provider>;
}

export function useLang() {
  return useContext(Ctx);
}

export function useT() {
  const { lang } = useLang();
  return useCallback((key: Key) => dict[lang][key].replace("{free}", formatPrice(site.shipping.freeAbove)), [lang]);
}

/** Catalogue content: the Hindi version when the store is in हिं and one was entered, else English (Tamil has no catalogue translations yet). */
export function useLocalized() {
  const { lang } = useLang();
  return useCallback((en: string, hi?: string | null) => (lang === "hi" && hi ? hi : en), [lang]);
}

/** Server-component version of useLocalized. */
export function L({ en, hi }: { en: string; hi?: string | null }) {
  return <>{useLocalized()(en, hi)}</>;
}

/** Translated text for use inside server components. */
export function T({ k, amount }: { k: Key; amount?: string }) {
  const text = useT()(k);
  return <>{amount === undefined ? text : text.replace("{amount}", amount)}</>;
}

/** Language picker: a small menu with English, Hindi and Tamil. */
export function LanguageToggle({ className }: { className?: string }) {
  const { lang, setLang } = useLang();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={`Language: ${LANG_META[lang].name}`}
        aria-haspopup="menu"
        aria-expanded={open}
        className={
          className ??
          "flex h-10 min-w-10 cursor-pointer items-center justify-center rounded-full px-2 text-xs font-bold hover:bg-surface-2"
        }
      >
        {LANG_META[lang].short}
      </button>
      {open && (
        <div
          role="menu"
          className="animate-rise absolute top-full right-0 z-50 mt-2 min-w-36 rounded-2xl border border-border bg-background p-1 shadow-[0_12px_40px_-12px_rgb(var(--foreground)/0.3)]"
        >
          {LANGS.map((l) => (
            <button
              key={l}
              type="button"
              role="menuitemradio"
              aria-checked={l === lang}
              lang={LANG_META[l].tag}
              onClick={() => {
                setLang(l);
                setOpen(false);
              }}
              className="flex w-full cursor-pointer items-center justify-between gap-3 rounded-xl px-3 py-2 text-left text-sm font-medium hover:bg-surface-2"
            >
              {LANG_META[l].name}
              {l === lang && <Check className="h-4 w-4 text-primary" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
