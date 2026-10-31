"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShoppingBag, Search, Menu, X, Heart } from "lucide-react";
import { Suspense, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import Logo from "./Logo";
import ThemeToggle from "./ThemeToggle";
import SearchBox from "./SearchBox";
import { cartCount, useCartStore, useHydrated } from "@/stores/cart-store";
import { cn } from "@/lib/utils";
import { LanguageToggle, useT } from "@/i18n/LanguageProvider";
import type { Key } from "@/i18n/dict";

const navLinks: { href: string; label: Key }[] = [
  { href: "/products", label: "nav.shop" },
  { href: "/custom-order", label: "nav.custom" },
  { href: "/track", label: "nav.track" },
  { href: "/about", label: "nav.about" },
  { href: "/contact", label: "nav.contact" },
];

type LinkVariant = "desktop" | "mobile";

function NavLinkList({
  pathname,
  variant,
  onNavigate,
}: {
  pathname: string;
  variant: LinkVariant;
  onNavigate?: () => void;
}) {
  const t = useT();
  return navLinks.map((link, i) => {
    const active = pathname.startsWith(link.href);
    return (
      <Link
        key={link.href}
        href={link.href}
        onClick={onNavigate}
        className={
          variant === "desktop"
            ? cn(
                "rounded-full px-3.5 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:bg-surface-2 hover:text-foreground"
              )
            : cn(
                "flex items-baseline justify-between rounded-2xl px-4 py-3 font-display text-2xl font-bold tracking-tight transition-colors",
                active ? "bg-primary text-primary-foreground" : "hover:bg-surface-2"
              )
        }
      >
        {t(link.label)}
        {variant === "mobile" && <span className="font-mono text-xs font-normal opacity-60">0{i + 1}</span>}
      </Link>
    );
  });
}

function ActiveNavLinks(props: { variant: LinkVariant; onNavigate?: () => void }) {
  return <NavLinkList pathname={usePathname()} {...props} />;
}

/** The pathname is request data, so it streams in; the fallback is the same links without highlight. */
function NavLinks(props: { variant: LinkVariant; onNavigate?: () => void }) {
  return (
    <Suspense fallback={<NavLinkList pathname="" {...props} />}>
      <ActiveNavLinks {...props} />
    </Suspense>
  );
}

/**
 * Floating pill navbar. On phones it tucks away while scrolling down and comes
 * back on the slightest scroll up, so it never eats reading space.
 */
export default function Navbar({ accountSlot }: { accountSlot: React.ReactNode }) {
  const [panel, setPanel] = useState<"menu" | "search" | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const openCart = useCartStore((s) => s.openCart);
  const items = useCartStore((s) => s.items);
  const hydrated = useHydrated();
  const itemCount = hydrated ? cartCount(items) : 0;
  const close = () => setPanel(null);
  const t = useT();

  useEffect(() => {
    let last = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 24);
      if (Math.abs(y - last) > 6) {
        setHidden(y > last && y > 160);
        last = y;
      }
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!panel) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setPanel(null);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [panel]);

  const toggle = (p: "menu" | "search") => setPanel((cur) => (cur === p ? null : p));

  return (
    <>
      <div className="announce-bar relative bg-foreground px-10 py-2 text-center text-xs font-medium text-background">
        {t("announce")}
        <button
          type="button"
          aria-label="Dismiss announcement"
          onClick={() => {
            try {
              localStorage.setItem("announce-dismissed", "1");
            } catch {}
            document.documentElement.dataset.announce = "off";
          }}
          className="absolute top-1/2 right-2 flex h-7 w-7 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full text-background/70 transition-colors hover:bg-background/15 hover:text-background"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <header
        className={cn(
          "sticky top-0 z-40 px-3 pt-3 transition-transform duration-300 sm:px-4",
          hidden && !panel && "-translate-y-[calc(100%+0.5rem)]"
        )}
      >
        {/* Click-away layer behind open panels */}
        {panel && <div className="fixed inset-0 -z-10 bg-foreground/20 backdrop-blur-[2px]" onClick={close} />}

        <div
          className={cn(
            "mx-auto max-w-6xl rounded-[1.75rem] border bg-background/75 backdrop-blur-xl transition-all duration-300 supports-[backdrop-filter]:bg-background/65",
            scrolled || panel
              ? "border-border shadow-[0_12px_40px_-12px_rgb(var(--foreground)/0.25)]"
              : "border-border/60 shadow-sm"
          )}
        >
          <nav className="flex h-14 items-center justify-between gap-2 pr-2.5 pl-4 sm:h-16 sm:pr-3 sm:pl-5">
            <Logo />

            <div className="hidden items-center gap-0.5 lg:flex">
              <NavLinks variant="desktop" />
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full"
                aria-label="Search"
                aria-expanded={panel === "search"}
                onClick={() => toggle("search")}
              >
                <Search className="h-5 w-5" />
              </Button>
              <div className="hidden sm:block">
                <LanguageToggle />
              </div>
              <div className="hidden sm:block">
                <ThemeToggle />
              </div>
              <Link
                href="/account/wishlist"
                aria-label="Wishlist"
                className="hidden h-10 w-10 items-center justify-center rounded-full hover:bg-surface-2 sm:flex"
              >
                <Heart className="h-5 w-5" />
              </Link>
              <div className="hidden lg:mx-1 lg:block">{accountSlot}</div>
              <Button
                variant="dark"
                size="icon"
                className="relative rounded-full"
                onClick={openCart}
                aria-label={`Open cart, ${itemCount} items`}
              >
                <ShoppingBag className="h-5 w-5" />
                {itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground ring-2 ring-background">
                    {itemCount > 9 ? "9+" : itemCount}
                  </span>
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full lg:hidden"
                aria-label="Menu"
                aria-expanded={panel === "menu"}
                onClick={() => toggle("menu")}
              >
                {panel === "menu" ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </nav>

          {panel === "search" && (
            <div className="animate-rise border-t border-border px-3 pt-3 pb-3 sm:px-4">
              <SearchBox onDone={close} />
            </div>
          )}

          {panel === "menu" && (
            <div className="animate-rise border-t border-border p-2 lg:hidden">
              <NavLinks variant="mobile" onNavigate={close} />
              <div className="mt-2 flex items-center justify-between gap-2 border-t border-border px-2 pt-3 pb-1">
                <div onClick={close}>{accountSlot}</div>
                <div className="flex items-center gap-1">
                  <Link
                    href="/account/wishlist"
                    onClick={close}
                    aria-label="Wishlist"
                    className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-surface-2"
                  >
                    <Heart className="h-5 w-5" />
                  </Link>
                  <LanguageToggle />
                  <ThemeToggle />
                </div>
              </div>
            </div>
          )}
        </div>
      </header>
    </>
  );
}
