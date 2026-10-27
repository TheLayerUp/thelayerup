import Link from "next/link";
import { Mail, Phone, MapPin, MessageCircle } from "lucide-react";
import Logo from "./Logo";
import NewsletterForm from "@/components/forms/NewsletterForm";
import { site } from "@/config/site";

function Instagram({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" />
    </svg>
  );
}

const footerLinks = {
  Shop: [
    { label: "All Products", href: "/products" },
    { label: "New Arrivals", href: "/products?sort=newest" },
    { label: "Custom Print", href: "/custom-order" },
  ],
  Company: [
    { label: "About Us", href: "/about" },
    { label: "Contact", href: "/contact" },
    { label: "Shipping & Returns", href: "/policies/shipping" },
  ],
  Support: [
    { label: "Track Order", href: "/track" },
    { label: "My Account", href: "/account" },
    { label: "Privacy Policy", href: "/policies/privacy" },
    { label: "Terms of Service", href: "/policies/terms" },
  ],
};

export default function Footer() {
  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 py-12 lg:grid-cols-5">
          <div className="col-span-2 space-y-4">
            <Logo />
            <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
              {site.tagline} Premium 3D printed products that blend design with technology.
            </p>
            <NewsletterForm />
            <div className="flex gap-2 pt-1">
              {[
                { href: site.social.instagram, icon: Instagram, label: "Instagram" },
                { href: `https://wa.me/${site.contact.whatsapp}`, icon: MessageCircle, label: "WhatsApp" },
                { href: `mailto:${site.contact.email}`, icon: Mail, label: "Email" },
              ].map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-2 text-muted-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
                >
                  <s.icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {Object.entries(footerLinks).map(([heading, links]) => (
            <div key={heading}>
              <h3 className="mb-4 text-sm font-semibold tracking-wider uppercase">{heading}</h3>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="flex flex-col items-center justify-between gap-3 border-t border-border py-6 text-sm text-muted-foreground sm:flex-row">
          <p>© {site.name}. Made with care in India.</p>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <Phone className="h-4 w-4" />
              {site.contact.phone}
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4" />
              {site.contact.city}
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
