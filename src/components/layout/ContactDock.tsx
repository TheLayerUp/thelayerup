"use client";

import { useEffect, useRef, useState } from "react";
import { MessageCircleMore, Phone, X } from "lucide-react";
import { InstagramIcon, TelegramIcon, WhatsAppIcon } from "@/components/icons/BrandIcons";
import { contactLinks, site } from "@/config/site";
import { cn } from "@/lib/utils";
import { useT } from "@/i18n/LanguageProvider";

const channels = [
  {
    label: "WhatsApp",
    hint: "Usually replies in minutes",
    href: contactLinks.whatsapp,
    icon: WhatsAppIcon,
    className: "bg-[#25d366] text-white",
  },
  {
    label: "Instagram",
    hint: `DM ${site.social.instagramHandle}`,
    href: contactLinks.instagram,
    icon: InstagramIcon,
    className: "bg-[linear-gradient(45deg,#f9a03f,#e1306c_50%,#833ab4)] text-white",
  },
  {
    label: "Telegram",
    hint: `@${site.contact.telegram}`,
    href: contactLinks.telegram,
    icon: TelegramIcon,
    className: "bg-[#229ed9] text-white",
  },
  {
    label: "Call us",
    hint: site.contact.phone,
    href: contactLinks.phone,
    icon: Phone,
    className: "bg-foreground text-background",
  },
];

/** Floating "talk to us" button, bottom-right, that fans out into one-tap contact channels. */
export default function ContactDock() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const t = useT();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const onPointer = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [open]);

  return (
    // The wrapper ignores the pointer: while closed, the hidden links still take up space
    // and would block clicks on whatever sits beneath them (e.g. the hero carousel arrow).
    <div
      ref={ref}
      className="pointer-events-none fixed right-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-40 flex flex-col items-end gap-3 sm:right-6 sm:bottom-6"
    >
      <ul
        id="contact-dock"
        aria-label="Contact us"
        className={cn("flex flex-col items-end gap-2.5", open && "[&_a]:pointer-events-auto")}
        inert={!open}
      >
        {channels.map((c, i) => (
          <li
            key={c.label}
            className={cn(
              "transition-all duration-300 ease-[cubic-bezier(.2,.8,.2,1.2)]",
              open ? "translate-y-0 scale-100 opacity-100" : "translate-y-4 scale-90 opacity-0"
            )}
            style={{ transitionDelay: open ? `${(channels.length - 1 - i) * 40}ms` : "0ms" }}
          >
            <a
              href={c.href}
              target={c.href.startsWith("tel:") ? undefined : "_blank"}
              rel="noopener noreferrer"
              onClick={() => setOpen(false)}
              className="group flex items-center gap-3 rounded-full border border-border bg-surface/95 py-1.5 pr-1.5 pl-4 shadow-xl shadow-foreground/10 backdrop-blur-md transition-transform active:scale-95 sm:hover:-translate-x-1"
            >
              <span className="text-right leading-tight">
                <span className="block text-sm font-semibold">{c.label === "Call us" ? t("dock.call") : c.label}</span>
                <span className="block text-[11px] text-muted-foreground">
                  {c.label === "WhatsApp" ? t("dock.whatsapp") : c.hint}
                </span>
              </span>
              <span className={cn("flex h-11 w-11 items-center justify-center rounded-full", c.className)}>
                <c.icon className="h-5 w-5" />
              </span>
            </a>
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="contact-dock"
        aria-label={open ? "Close contact options" : "Contact us"}
        className={cn(
          "group pointer-events-auto relative flex h-14 cursor-pointer items-center gap-2 rounded-full pr-5 pl-4 font-semibold shadow-2xl transition-all duration-300 active:scale-95",
          open
            ? "bg-foreground text-background"
            : "bg-primary text-primary-foreground shadow-primary/40 hover:shadow-primary/60"
        )}
      >
        {!open && (
          <span className="absolute inset-0 -z-10 animate-ping rounded-full bg-primary/40 [animation-iteration-count:3]" />
        )}
        <span className="relative h-6 w-6">
          <MessageCircleMore
            className={cn("absolute inset-0 h-6 w-6 transition-all", open ? "scale-50 rotate-90 opacity-0" : "")}
          />
          <X className={cn("absolute inset-0 h-6 w-6 transition-all", open ? "" : "scale-50 -rotate-90 opacity-0")} />
        </span>
        <span className="text-sm">{open ? t("dock.close") : t("dock.open")}</span>
      </button>
    </div>
  );
}
