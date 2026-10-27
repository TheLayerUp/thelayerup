import Link from "next/link";
import { Printer, Users, Award, Rocket, Heart, Zap } from "lucide-react";

export const metadata = {
  title: "About Us",
  description: "Learn about TheLayerUp — our story, mission, and the team behind the 3D printed products.",
};

const values = [
  {
    icon: Heart,
    title: "Passion-Driven",
    description: "Every product is born from our love for design and 3D printing technology.",
  },
  {
    icon: Award,
    title: "Quality First",
    description: "We quality-check every single print before it reaches your doorstep.",
  },
  {
    icon: Zap,
    title: "Innovation",
    description: "Constantly experimenting with new materials, designs, and printing techniques.",
  },
  {
    icon: Users,
    title: "Customer-Centric",
    description: "Your satisfaction is our priority. We listen, adapt, and deliver.",
  },
];

// Facts about how we work — swap in real milestones (orders shipped, rating) once you have them.
const stats = [
  { value: "Chennai", label: "Designed & printed" },
  { value: "1 piece", label: "Minimum custom order" },
  { value: "4", label: "Materials: PLA, PETG, ABS, Resin" },
  { value: "24 h", label: "Custom quote turnaround" },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="bg-layers relative border-b border-border py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary-strong">
            <Printer className="h-3.5 w-3.5" />
            <span>Our Story</span>
          </div>
          <h1 className="text-4xl font-bold sm:text-5xl lg:text-6xl">
            Crafting the Future,
            <br />
            <span className="text-gradient">One Layer at a Time</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
            We started with a simple idea — make beautifully designed, functional products accessible to everyone using
            the power of 3D printing. What began as a hobby is growing into a studio for anyone who wants something made
            just for them.
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="border-b border-border bg-surface">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl font-bold sm:text-4xl">{stat.value}</div>
                <div className="mt-1 text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-12 text-center text-3xl font-bold">What We Stand For</h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((value) => (
              <div key={value.title} className="rounded-3xl border border-border bg-surface p-6 text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <value.icon className="h-6 w-6" />
                </div>
                <h3 className="text-base font-semibold">{value.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Process */}
      <section className="border-y border-border bg-surface py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-4 text-center text-3xl font-bold">Our Process</h2>
          <p className="mb-12 text-center text-muted-foreground">How we go from idea to your doorstep</p>
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
            {[
              {
                step: "01",
                title: "Design",
                desc: "Every product starts as a digital 3D model, carefully designed for both aesthetics and functionality.",
              },
              {
                step: "02",
                title: "Print & QC",
                desc: "We 3D print using premium materials and inspect every piece for quality before packaging.",
              },
              {
                step: "03",
                title: "Ship",
                desc: "Securely packed and shipped across India with real-time tracking so you know exactly when it arrives.",
              },
            ].map((item) => (
              <div key={item.step} className="relative rounded-3xl border border-border bg-surface p-6">
                <div className="mb-4 text-5xl font-black text-border">{item.step}</div>
                <h3 className="text-lg font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <Rocket className="mx-auto mb-6 h-12 w-12 text-primary" />
          <h2 className="text-3xl font-bold">Ready to Explore?</h2>
          <p className="mt-3 text-lg text-muted-foreground">Check out our collection and find something you love.</p>
          <Link
            href="/products"
            className="mt-6 inline-block rounded-xl bg-primary px-8 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:brightness-95"
          >
            Browse Products
          </Link>
        </div>
      </section>
    </div>
  );
}
