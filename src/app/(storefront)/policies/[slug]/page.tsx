import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { site } from "@/config/site";

// Starter templates — have these reviewed before launch. Razorpay requires
// Terms, Privacy, Refund/Cancellation and Shipping policies to activate an account.
const policies: Record<string, { title: string; sections: { h: string; p: string }[] }> = {
  shipping: {
    title: "Shipping, Returns & Refunds",
    sections: [
      {
        h: "Processing time",
        p: "Every item is printed to order. Orders are usually printed, finished and dispatched within 2–4 business days. Custom orders follow the timeline in your quote.",
      },
      {
        h: "Delivery",
        p: `We ship across India through trusted courier partners. Delivery typically takes 3–7 business days after dispatch. Shipping is free on orders above ₹${site.shipping.freeAbove}; a flat ₹${site.shipping.flatRate} applies otherwise. You'll receive a tracking link by email once your order ships.`,
      },
      {
        h: "Damaged or defective items",
        p: "If your item arrives damaged or has a printing defect, email us within 48 hours of delivery with photos and your order number. We'll reprint and replace it at no cost, or issue a full refund.",
      },
      {
        h: "Returns",
        p: "Because products are made to order, we don't accept returns for change of mind. Personalised and custom items are non-returnable unless defective.",
      },
      {
        h: "Cancellations",
        p: "You can cancel an order within 12 hours of placing it, before printing starts, for a full refund. Contact us with your order number.",
      },
      { h: "Refunds", p: "Approved refunds are issued to the original payment method within 5–7 business days." },
    ],
  },
  privacy: {
    title: "Privacy Policy",
    sections: [
      {
        h: "What we collect",
        p: "Your name, email, phone number and shipping address when you place an order or create an account, and messages you send us. Payments are processed by Razorpay; we never see or store your card or UPI details.",
      },
      {
        h: "How we use it",
        p: "To process and deliver your orders, send order updates, respond to enquiries and — only if you subscribe — send occasional product news.",
      },
      {
        h: "Sharing",
        p: "We share delivery details with our courier partners and payment details with Razorpay, only as needed to fulfil your order. We never sell your data.",
      },
      {
        h: "Your choices",
        p: `You can ask us to access, correct or delete your data at any time by emailing ${site.contact.email}.`,
      },
    ],
  },
  terms: {
    title: "Terms of Service",
    sections: [
      {
        h: "Products",
        p: "3D printed items have natural layer lines and small variations in colour and finish. Product photos are representative; sizes may vary by ±2 mm.",
      },
      {
        h: "Pricing",
        p: "All prices are in Indian Rupees and inclusive of applicable taxes. We may change prices at any time, but the price you pay is the one shown at checkout.",
      },
      {
        h: "Custom designs",
        p: "By submitting a design you confirm you have the right to reproduce it. We may decline requests that infringe intellectual property or are unsafe.",
      },
      { h: "Liability", p: "Our liability for any order is limited to the amount paid for that order." },
      {
        h: "Governing law",
        p: "These terms are governed by the laws of India, with courts in Chennai, Tamil Nadu having jurisdiction.",
      },
    ],
  },
};

export function generateStaticParams() {
  return Object.keys(policies).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps<"/policies/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  return { title: policies[slug]?.title ?? "Policy" };
}

export default function PolicyPage({ params }: PageProps<"/policies/[slug]">) {
  return (
    <Suspense fallback={<div className="mx-auto min-h-[60vh] max-w-3xl px-4 py-12" />}>
      <Policy params={params} />
    </Suspense>
  );
}

async function Policy({ params }: Pick<PageProps<"/policies/[slug]">, "params">) {
  const { slug } = await params;
  const policy = policies[slug];
  if (!policy) notFound();

  return (
    <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold sm:text-4xl">{policy.title}</h1>
      <div className="mt-8 space-y-6">
        {policy.sections.map((s) => (
          <section key={s.h}>
            <h2 className="text-lg font-semibold">{s.h}</h2>
            <p className="mt-2 leading-relaxed text-muted-foreground">{s.p}</p>
          </section>
        ))}
      </div>
      <p className="mt-10 text-sm text-muted-foreground">
        Questions? Email{" "}
        <a className="text-primary-strong underline" href={`mailto:${site.contact.email}`}>
          {site.contact.email}
        </a>
        .
      </p>
    </article>
  );
}
