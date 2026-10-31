import type { Metadata } from "next";
import { Building2, Gift, Package, PartyPopper, Percent, Truck } from "lucide-react";
import { CustomOrderForm } from "@/components/forms/InquiryForms";

export const metadata: Metadata = {
  title: "Bulk & corporate orders",
  description:
    "Branded 3D printed gifts, event giveaways and merchandise in bulk. Volume pricing, logo printing and pan-India delivery.",
};

const uses = [
  { icon: Building2, title: "Corporate gifting", text: "Desk organisers, phone stands and nameplates with your logo." },
  {
    icon: PartyPopper,
    title: "Events & weddings",
    text: "Return gifts, table markers and keychains with names or dates.",
  },
  { icon: Gift, title: "Merch & giveaways", text: "Branded keychains, coasters and figurines for launches." },
];

// Pricing is quoted per order, so these stay descriptive rather than promising a rate.
const tiers = [
  { label: "From", value: "25 pieces" },
  { label: "Pricing", value: "Per-volume" },
  { label: "Quote in", value: "24 hours" },
];

export default function BulkOrdersPage() {
  return (
    <div>
      <section className="border-b border-border">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
          <p className="text-xs font-semibold tracking-[0.2em] text-primary-strong uppercase">Bulk &amp; corporate</p>
          <h1 className="mt-3 max-w-3xl text-4xl leading-[1.02] font-bold tracking-tight sm:text-6xl">
            Printed gifts for your whole team, event or brand.
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-muted-foreground">
            From 25 pieces up. Add your logo or names, pick colours, and we&apos;ll print, pack and ship across India.
          </p>
          <dl className="mt-8 grid max-w-xl grid-cols-3 gap-3">
            {tiers.map((t) => (
              <div key={t.label} className="rounded-2xl border border-border bg-surface p-4">
                <dt className="text-xs text-muted-foreground">{t.label}</dt>
                <dd className="mt-1 font-display text-lg font-bold">{t.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1fr_360px] lg:px-8">
        <div className="rounded-3xl border border-border bg-surface p-6 sm:p-8">
          <h2 className="mb-6 text-xl font-semibold">Tell us about your order</h2>
          <CustomOrderForm bulk />
        </div>
        <aside className="space-y-4">
          {uses.map((u) => (
            <div key={u.title} className="rounded-3xl border border-border bg-surface p-6">
              <u.icon className="h-5 w-5 text-primary" />
              <h3 className="mt-3 font-semibold">{u.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{u.text}</p>
            </div>
          ))}
          <ul className="space-y-2 rounded-3xl border border-border bg-surface p-6 text-sm text-muted-foreground">
            <li className="flex items-center gap-2">
              <Percent className="h-4 w-4 text-primary" /> GST invoice on request
            </li>
            <li className="flex items-center gap-2">
              <Package className="h-4 w-4 text-primary" /> Sample piece before the full run
            </li>
            <li className="flex items-center gap-2">
              <Truck className="h-4 w-4 text-primary" /> Split delivery to multiple cities
            </li>
          </ul>
        </aside>
      </div>
    </div>
  );
}
