import { Package, Truck, CreditCard, Sparkles } from "lucide-react";

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
    <section className="border-y border-border bg-surface py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 max-w-2xl">
          <p className="text-sm font-semibold tracking-wider text-primary-strong uppercase">How it works</p>
          <h2 className="mt-2 text-3xl font-bold sm:text-4xl">From filament to your doorstep</h2>
        </div>

        <ol className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, index) => (
            <li key={step.title} className="relative">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/12 text-primary-strong">
                  <step.icon className="h-6 w-6" />
                </div>
                <span className="font-display text-4xl font-bold text-border">0{index + 1}</span>
              </div>
              <h3 className="text-lg font-semibold">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.description}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
