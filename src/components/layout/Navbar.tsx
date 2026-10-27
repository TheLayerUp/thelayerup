"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ShoppingBag, Search, Menu, X } from "lucide-react";
import { Suspense, useState } from "react";
import { Button } from "@/components/ui/button";
import Logo from "./Logo";
import ThemeToggle from "./ThemeToggle";
import { cartCount, useCartStore, useHydrated } from "@/stores/cart-store";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/products", label: "Shop" },
  { href: "/custom-order", label: "Custom Print" },
  { href: "/track", label: "Track Order" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
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
  return navLinks.map((link) => {
    const active = pathname.startsWith(link.href);
    return (
      <Link
        key={link.href}
        href={link.href}
        onClick={onNavigate}
        className={
          variant === "desktop"
            ? cn(
                "rounded-lg px-3.5 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-primary/10 text-primary-strong"
                  : "text-muted-foreground hover:bg-surface-2 hover:text-foreground"
              )
            : cn(
                "block border-b border-border/60 py-3 text-sm font-medium",
                active ? "text-primary-strong" : "text-muted-foreground"
              )
        }
      >
        {link.label}
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

export default function Navbar({ accountSlot }: { accountSlot: React.ReactNode }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const router = useRouter();
  const openCart = useCartStore((s) => s.openCart);
  const items = useCartStore((s) => s.items);
  const hydrated = useHydrated();
  const itemCount = hydrated ? cartCount(items) : 0;

  const onSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const q = new FormData(e.currentTarget).get("q")?.toString().trim();
    setIsSearchOpen(false);
    setIsMenuOpen(false);
    router.push(q ? `/products?q=${encodeURIComponent(q)}` : "/products");
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/70 bg-background/80 backdrop-blur-xl">
      <div className="bg-foreground py-1.5 text-center text-xs font-medium text-background">
        Free shipping on orders over ₹999 · Printed to order in Chennai
      </div>
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Logo />

        <div className="hidden items-center gap-1 md:flex">
          <NavLinks variant="desktop" />
        </div>

        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" aria-label="Search" onClick={() => setIsSearchOpen((v) => !v)}>
            <Search className="h-5 w-5" />
          </Button>
          <ThemeToggle />
          <div className="hidden sm:block">{accountSlot}</div>
          <Button
            variant="ghost"
            size="icon"
            className="relative"
            onClick={openCart}
            aria-label={`Open cart, ${itemCount} items`}
          >
            <ShoppingBag className="h-5 w-5" />
            {itemCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                {itemCount > 9 ? "9+" : itemCount}
              </span>
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            aria-label="Menu"
            aria-expanded={isMenuOpen}
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </nav>

      {isSearchOpen && (
        <div className="border-t border-border bg-background px-4 py-3">
          <form onSubmit={onSearch} className="mx-auto flex max-w-2xl gap-2">
            <input
              name="q"
              autoFocus
              placeholder="Search lamps, planters, keychains…"
              className="h-11 flex-1 rounded-xl border border-border bg-surface px-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/25"
            />
            <Button type="submit">Search</Button>
          </form>
        </div>
      )}

      {isMenuOpen && (
        <div className="border-t border-border bg-background px-4 pb-4 md:hidden">
          <NavLinks variant="mobile" onNavigate={() => setIsMenuOpen(false)} />
          <div className="pt-3" onClick={() => setIsMenuOpen(false)}>
            {accountSlot}
          </div>
        </div>
      )}
    </header>
  );
}
