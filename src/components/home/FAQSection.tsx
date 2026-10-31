import Link from "next/link";
import { Plus } from "lucide-react";
import { site } from "@/config/site";
import { formatPrice } from "@/lib/utils";
import SectionHeading from "./SectionHeading";

const faqs = [
  {
    q: "How long does delivery take?",
    a: "Everything is printed to order, then shipped across India with live tracking. Most orders arrive within 3–7 business days.",
  },
  {
    q: "How much is shipping?",
    a: `Shipping is free on orders over ${formatPrice(site.shipping.freeAbove)}. Below that, it's a flat ${formatPrice(site.shipping.flatRate)}.`,
  },
  {
    q: "What materials do you print with?",
    a: "Mostly PLA and PLA+ (plant-based and durable), PETG for strength and outdoor use, ABS for heat resistance, and resin for fine detail. Each product page lists its material.",
  },
  {
    q: "Can you print my own design?",
    a: "Yes — share a link to your 3D file (STL, OBJ, STEP, 3MF) or reference images, or just describe what you need on the custom print page. We'll reply with a quote within 24 hours.",
  },
  {
    q: "How do I pay?",
    a: "Checkout is handled securely by Razorpay — UPI, credit and debit cards, net banking and wallets are all supported.",
  },
];

export default function FAQSection() {
  return (
    <section className="py-20 sm:py-28">
      <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-[1fr_1.4fr] lg:gap-20 lg:px-8">
        <div>
          <SectionHeading index="06" eyebrow="FAQ" title="Good questions" />
          <p className="-mt-6 text-muted-foreground">
            Something else on your mind?{" "}
            <Link href="/contact" className="font-semibold text-foreground underline-offset-4 hover:underline">
              Get in touch
            </Link>{" "}
            or message us on WhatsApp.
          </p>
        </div>

        <div className="divide-y divide-border border-y border-border">
          {faqs.map((item) => (
            <details key={item.q} className="group py-2 [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-4 text-lg font-semibold transition-colors hover:text-primary-strong">
                {item.q}
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border transition-all group-open:rotate-45 group-open:border-primary group-open:bg-primary group-open:text-primary-foreground">
                  <Plus className="h-4 w-4" />
                </span>
              </summary>
              <p className="max-w-2xl pb-5 leading-relaxed text-muted-foreground">{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
