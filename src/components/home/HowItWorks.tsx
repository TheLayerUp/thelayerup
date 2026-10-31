import { Package, Truck, CreditCard, Sparkles } from "lucide-react";
import SectionHeading from "./SectionHeading";

const steps = [
  {
    icon: Sparkles,
    title: "Pick or imagine",
    description: "Choose from the collection or send us your own idea or 3D file.",
  },
  { icon: CreditCard, title: "Pay securely", description: "UPI, cards, net banking or wallets — all via Razorpay." },
  {
    icon: Package,
    title: "We print & pack",
    description: "Printed to order, hand-finished, quality-checked and packed with care.",
  },
  { icon: Truck, title: "Delivered", description: "Shipped across India with live tracking, usually in 3–7 days." },
];

export default function HowItWorks() {
  return (
    <section className="relative overflow-hidden bg-foreground py-20 text-background sm:py-28">
      <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,rgb(var(--background)/0.05)_0_1px,transparent_1px_12px)]" />
      <div className="absolute top-1/2 left-1/2 h-[500px] w-[900px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/20 blur-[140px]" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          inverted
          index="03"
          eyebrow="How it works"
          title={
            <>
              From filament
              <br />
              to your <span className="text-primary">doorstep</span>
            </>
          }
        />

        <ol className="relative grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
          {/* The "print path" connecting the steps */}
          <div className="absolute top-[3.25rem] right-[12%] left-[12%] hidden h-px bg-gradient-to-r from-primary via-background/30 to-primary lg:block" />

          {steps.map((step, index) => (
            <li
              key={step.title}
              className="reveal group relative rounded-[2rem] border border-background/10 bg-background/[0.04] p-6 backdrop-blur transition-colors hover:border-primary/60 hover:bg-background/[0.07]"
            >
              <div className="flex items-center justify-between">
                <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-[0_0_40px_-6px_rgb(254_90_53/0.8)] transition-transform group-hover:-rotate-6">
                  <step.icon className="h-6 w-6" />
                </div>
                <span className="font-display text-6xl leading-none font-bold text-background/10">0{index + 1}</span>
              </div>
              <h3 className="mt-8 text-xl font-bold">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-background/65">{step.description}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
