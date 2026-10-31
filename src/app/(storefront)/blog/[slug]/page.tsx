import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { getPost, posts } from "@/content/blog";
import { site } from "@/config/site";
import { formatDate } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

export function generateStaticParams() {
  return posts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<"/blog/[slug]">): Promise<Metadata> {
  const post = getPost((await params).slug);
  if (!post) return { title: "Post not found" };
  return {
    title: post.title,
    description: post.excerpt,
    openGraph: { type: "article", publishedTime: post.date },
  };
}

// The slug is URL data, so the post streams in behind a skeleton and navigation stays instant.
export default function BlogPostPage({ params }: PageProps<"/blog/[slug]">) {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-2xl space-y-4 px-4 py-16 sm:px-6">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-64 w-full rounded-3xl" />
        </div>
      }
    >
      <BlogPost params={params} />
    </Suspense>
  );
}

async function BlogPost({ params }: Pick<PageProps<"/blog/[slug]">, "params">) {
  const post = getPost((await params).slug);
  if (!post) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt,
    datePublished: post.date,
    author: { "@type": "Organization", name: site.name },
    publisher: { "@type": "Organization", name: site.name },
    mainEntityOfPage: `${site.url}/blog/${post.slug}`,
  };

  return (
    <article className="mx-auto max-w-2xl px-4 py-12 sm:px-6 sm:py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\u003c") }}
      />
      <Link href="/blog" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> All guides
      </Link>
      <p className="mt-6 text-xs font-semibold text-primary-strong">
        {post.tag} · {post.readMins} min read · {formatDate(new Date(post.date))}
      </p>
      <h1 className="mt-3 text-3xl leading-tight font-bold tracking-tight sm:text-5xl">{post.title}</h1>
      <p className="mt-4 text-lg text-muted-foreground">{post.excerpt}</p>

      <div className="mt-10 space-y-8 leading-relaxed">
        {post.body.map((b, i) => (
          <section key={i}>
            {b.h && <h2 className="mb-3 text-xl font-bold">{b.h}</h2>}
            {b.p?.map((para, j) => (
              <p key={j} className="mt-3 text-[17px] text-foreground/85 first:mt-0">
                {para}
              </p>
            ))}
            {b.list && (
              <ul className="mt-3 space-y-2">
                {b.list.map((li) => (
                  <li key={li} className="flex gap-3 text-[17px] text-foreground/85">
                    <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                    {li}
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </div>

      <div className="mt-14 rounded-3xl bg-foreground p-8 text-background">
        <p className="font-display text-2xl font-bold">Got something to print?</p>
        <p className="mt-2 opacity-70">Get an instant estimate from your STL, or describe your idea.</p>
        <Link
          href="/custom-order"
          className="mt-5 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground"
        >
          Start a custom print <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </article>
  );
}
