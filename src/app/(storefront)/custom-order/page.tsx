import type { Metadata } from "next";
import { Upload, KeyRound, Cog, Gift, Building2, Wrench, Shapes } from "lucide-react";
import { CustomOrderForm } from "@/components/forms/InquiryForms";

export const metadata: Metadata = {
  title: "Custom 3D printing",
  description:
    "Send us your 3D file or idea and get a quote within 24 hours. Nameplates, prototypes, gifts, replacement parts and bulk orders.",
};

const ideas = [
  { icon: KeyRound, text: "Name keychains & nameplates" },
  { icon: Cog, text: "Prototypes & functional parts" },
  { icon: Shapes, text: "Figurines, cosplay & decor" },
  { icon: Wrench, text: "Replacement parts" },
  { icon: Gift, text: "Personalised gifts" },
  { icon: Building2, text: "Corporate gifts & bulk orders" },
];

const timeline = [
  { label: "Quote", time: "Within 24 hours" },
  { label: "Design review", time: "1–2 days" },
  { label: "Printing", time: "2–5 days" },
  { label: "Shipping", time: "3–5 days" },
];

export default function CustomOrderPage() {
  return (
    <div>
      <section className="bg-layers border-b border-border">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary-strong">
            <Upload className="h-3.5 w-3.5" /> Custom 3D printing
          </div>
          <h1 className="mt-4 max-w-2xl text-4xl font-bold sm:text-5xl">Bring your idea. We&apos;ll print it.</h1>
          <p className="mt-3 max-w-2xl text-lg text-muted-foreground">
            Share a 3D file or just describe what you need — we&apos;ll reply with a quote and material recommendation
            within 24 hours. No minimum order.
          </p>
        </div>
      </section>

      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1fr_340px] lg:px-8">
        <div className="rounded-3xl border border-border bg-surface p-6 sm:p-8">
          <h2 className="mb-6 text-xl font-semibold">Request a quote</h2>
          <CustomOrderForm />
        </div>

        <aside className="space-y-6">
          <div className="rounded-3xl border border-border bg-surface p-6">
            <h3 className="font-semibold">What we can print</h3>
            <ul className="mt-4 space-y-3">
              {ideas.map((item) => (
                <li key={item.text} className="flex items-center gap-3 text-sm text-muted-foreground">
                  <item.icon className="h-4 w-4 shrink-0 text-primary" /> {item.text}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-3xl border border-border bg-surface p-6">
            <h3 className="font-semibold">Typical timeline</h3>
            <dl className="mt-4 space-y-3">
              {timeline.map((item) => (
                <div key={item.label} className="flex justify-between text-sm">
                  <dt className="text-muted-foreground">{item.label}</dt>
                  <dd className="font-medium">{item.time}</dd>
                </div>
              ))}
            </dl>
          </div>
        </aside>
      </div>
    </div>
  );
}
