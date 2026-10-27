"use client"; // Error boundaries must be Client Components

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { site } from "@/config/site";

export default function StorefrontError({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-24 text-center">
      <AlertTriangle className="h-12 w-12 text-warning" />
      <h1 className="mt-4 text-3xl font-bold">Something went wrong</h1>
      <p className="mt-2 text-muted-foreground">
        Sorry about that — please try again. If it keeps happening, message us on WhatsApp and we&apos;ll sort it out.
      </p>
      <div className="mt-8 flex gap-3">
        <Button onClick={() => retry()}>Try again</Button>
        <a
          href={`https://wa.me/${site.contact.whatsapp}`}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonVariants({ variant: "outline" })}
        >
          WhatsApp us
        </a>
        <Link href="/" className={buttonVariants({ variant: "ghost" })}>
          Home
        </Link>
      </div>
    </div>
  );
}
