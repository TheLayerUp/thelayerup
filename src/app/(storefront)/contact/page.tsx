import type { Metadata } from "next";
import { Mail, Phone, MapPin, Clock, MessageCircle } from "lucide-react";
import { ContactForm } from "@/components/forms/InquiryForms";
import { buttonVariants } from "@/components/ui/button";
import { site } from "@/config/site";

export const metadata: Metadata = {
  title: "Contact us",
  description: `Get in touch with ${site.name}. Questions, bulk orders, collaborations — we'd love to hear from you.`,
};

export default function ContactPage() {
  const details = [
    { icon: Mail, label: "Email", value: site.contact.email, href: `mailto:${site.contact.email}` },
    { icon: Phone, label: "Phone", value: site.contact.phone, href: `tel:${site.contact.phone.replace(/\s/g, "")}` },
    { icon: MapPin, label: "Studio", value: site.contact.city },
    { icon: Clock, label: "Hours", value: "Mon – Sat, 10 AM – 7 PM IST" },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-bold sm:text-5xl">Say hello</h1>
      <p className="mt-2 text-muted-foreground">
        Questions, bulk orders, collaborations — we usually reply within a day.
      </p>

      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_380px]">
        <div className="rounded-3xl border border-border bg-surface p-6 sm:p-8">
          <ContactForm />
        </div>

        <div className="space-y-4">
          {details.map((item) => {
            const content = (
              <>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/12 text-primary-strong">
                  <item.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-medium">{item.label}</p>
                  <p className="text-sm text-muted-foreground">{item.value}</p>
                </div>
              </>
            );
            return item.href ? (
              <a
                key={item.label}
                href={item.href}
                className="flex items-center gap-4 rounded-2xl border border-border bg-surface p-4 hover:border-primary/50"
              >
                {content}
              </a>
            ) : (
              <div key={item.label} className="flex items-center gap-4 rounded-2xl border border-border bg-surface p-4">
                {content}
              </div>
            );
          })}

          <div className="rounded-3xl bg-foreground p-6 text-background">
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <MessageCircle className="h-5 w-5 text-primary" /> Chat on WhatsApp
            </h2>
            <p className="mt-2 text-sm opacity-75">Quickest way to ask about an order or a custom idea.</p>
            <a
              href={`https://wa.me/${site.contact.whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonVariants({ className: "mt-4" })}
            >
              Open WhatsApp
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
