import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { sortedPosts } from "@/content/blog";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Guides & stories",
  description: "3D printing guides: choosing materials, caring for prints and preparing files for custom orders.",
};

export default function BlogIndex() {
  const [first, ...rest] = sortedPosts();
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
      <p className="text-xs font-semibold tracking-[0.2em] text-primary-strong uppercase">Journal</p>
      <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">Guides &amp; stories</h1>
      <p className="mt-3 max-w-xl text-lg text-muted-foreground">
        What we&apos;ve learned printing thousands of layers, written for people who just want things that work.
      </p>

      {first && (
        <Link
          href={`/blog/${first.slug}`}
          className="group mt-10 block rounded-3xl border border-border bg-surface p-6 transition-colors hover:border-primary sm:p-10"
        >
          <p className="text-xs font-semibold text-primary-strong">
            {first.tag} · {first.readMins} min read
          </p>
          <h2 className="mt-3 text-2xl leading-tight font-bold sm:text-4xl">{first.title}</h2>
          <p className="mt-3 max-w-2xl text-muted-foreground">{first.excerpt}</p>
          <span className="mt-6 inline-flex items-center gap-1 text-sm font-semibold">
            Read the guide <ArrowUpRight className="h-4 w-4 transition-transform group-hover:rotate-45" />
          </span>
        </Link>
      )}

      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        {rest.map((p) => (
          <Link
            key={p.slug}
            href={`/blog/${p.slug}`}
            className="group flex flex-col rounded-3xl border border-border bg-surface p-6 transition-colors hover:border-primary"
          >
            <p className="text-xs font-semibold text-primary-strong">
              {p.tag} · {p.readMins} min read
            </p>
            <h2 className="mt-3 text-xl leading-snug font-bold">{p.title}</h2>
            <p className="mt-2 flex-1 text-sm text-muted-foreground">{p.excerpt}</p>
            <p className="mt-5 text-xs text-muted-foreground">{formatDate(new Date(p.date))}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
