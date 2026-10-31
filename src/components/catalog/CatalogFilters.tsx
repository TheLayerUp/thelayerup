"use client";

import { useLocalized, useT } from "@/i18n/LanguageProvider";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { Search, X } from "lucide-react";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface Props {
  categories: { slug: string; name: string; nameHi?: string | null }[];
  materials: string[];
}

export default function CatalogFilters({ categories, materials }: Props) {
  const t = useT();
  const loc = useLocalized();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();

  const active = params.get("category") ?? "";
  const q = params.get("q") ?? "";

  function update(changes: Record<string, string | null>) {
    const next = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(changes)) {
      if (v) next.set(k, v);
      else next.delete(k);
    }
    const qs = next.toString();
    startTransition(() => router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false }));
  }

  const hasFilters = [...params.keys()].length > 0;

  return (
    <div className={cn("my-8 space-y-4 transition-opacity", pending && "opacity-60")}>
      <div className="flex flex-col gap-3 sm:flex-row">
        <form
          className="relative flex-1"
          onSubmit={(e) => {
            e.preventDefault();
            update({ q: new FormData(e.currentTarget).get("q")?.toString().trim() || null });
          }}
        >
          <Search className="absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            key={q}
            name="q"
            defaultValue={q}
            placeholder={t("shop.search")}
            aria-label="Search products"
            className="h-11 w-full rounded-xl border border-border bg-surface pr-4 pl-11 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/25"
          />
        </form>
        <div className="grid grid-cols-2 gap-3 sm:flex">
          <Select
            aria-label="Material"
            value={params.get("material") ?? ""}
            onChange={(e) => update({ material: e.target.value || null })}
            className="sm:w-40"
          >
            <option value="">{t("shop.allMaterials")}</option>
            {materials.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </Select>
          <Select
            aria-label="Sort by"
            value={params.get("sort") ?? "featured"}
            onChange={(e) => update({ sort: e.target.value === "featured" ? null : e.target.value })}
            className="sm:w-44"
          >
            <option value="featured">{t("shop.featured")}</option>
            <option value="newest">{t("shop.newest")}</option>
            <option value="price-asc">{t("shop.priceAsc")}</option>
            <option value="price-desc">{t("shop.priceDesc")}</option>
          </Select>
        </div>
      </div>

      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
        {[{ slug: "", name: t("shop.all") }, ...categories].map((cat) => (
          <button
            key={cat.slug}
            onClick={() => update({ category: cat.slug || null })}
            className={cn(
              "rounded-full border px-4 py-1.5 text-sm font-medium whitespace-nowrap transition-colors",
              active === cat.slug
                ? "border-foreground bg-foreground text-background"
                : "border-border bg-surface text-muted-foreground hover:text-foreground"
            )}
          >
            {loc(cat.name, "nameHi" in cat ? cat.nameHi : null)}
          </button>
        ))}
        <label className="flex cursor-pointer items-center gap-2 rounded-full border border-border bg-surface px-4 py-1.5 text-sm whitespace-nowrap text-muted-foreground">
          <input
            type="checkbox"
            className="accent-primary"
            checked={params.get("inStock") === "1"}
            onChange={(e) => update({ inStock: e.target.checked ? "1" : null })}
          />
          In stock
        </label>
        {hasFilters && (
          <button
            onClick={() => startTransition(() => router.replace(pathname, { scroll: false }))}
            className="flex items-center gap-1 px-2 text-sm whitespace-nowrap text-muted-foreground hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" /> Clear
          </button>
        )}
      </div>
    </div>
  );
}
