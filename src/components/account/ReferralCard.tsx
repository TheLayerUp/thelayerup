"use client";

import { useState } from "react";
import { Check, Copy, Gift } from "lucide-react";
import { WhatsAppIcon } from "@/components/icons/BrandIcons";

export default function ReferralCard({
  link,
  code,
  friendPercent,
  reward,
  joined,
}: {
  link: string;
  code: string;
  friendPercent: number;
  reward: string;
  joined: number;
}) {
  const [copied, setCopied] = useState(false);
  const message = `I get my 3D printed decor from TheLayerUp. Sign up with my link for ${friendPercent}% off your first order: ${link}`;

  return (
    <section className="mt-10 overflow-hidden rounded-3xl bg-foreground p-6 text-background sm:p-8">
      <p className="flex items-center gap-2 text-sm font-semibold text-primary">
        <Gift className="h-4 w-4" /> Refer a friend
      </p>
      <h2 className="mt-2 text-2xl font-bold">
        Give {friendPercent}% off, get {reward}
      </h2>
      <p className="mt-1 text-sm opacity-70">
        Your friend gets {friendPercent}% off their first order. You get a {reward} coupon when it&apos;s paid.
        {joined > 0 && ` ${joined} friend${joined === 1 ? " has" : "s have"} joined so far.`}
      </p>
      <div className="mt-5 flex flex-col gap-2 sm:flex-row">
        <code className="flex h-12 flex-1 items-center truncate rounded-xl bg-background/10 px-4 font-mono text-sm">
          {link}
        </code>
        <button
          type="button"
          onClick={async () => {
            await navigator.clipboard.writeText(link);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }}
          className="flex h-12 cursor-pointer items-center justify-center gap-2 rounded-xl bg-background px-5 text-sm font-semibold text-foreground"
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {copied ? "Copied" : `Copy · ${code}`}
        </button>
        <a
          href={`https://wa.me/?text=${encodeURIComponent(message)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-12 items-center justify-center gap-2 rounded-xl bg-[#25d366] px-5 text-sm font-semibold text-white"
        >
          <WhatsAppIcon className="h-4 w-4" /> Share
        </a>
      </div>
    </section>
  );
}
