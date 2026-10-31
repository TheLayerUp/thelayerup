// Single source of truth for brand + business rules.
export const site = {
  name: process.env.NEXT_PUBLIC_APP_NAME || "TheLayerUp",
  tagline: "Crafted layer by layer, designed for you.",
  description: "Premium 3D printed lamps, decor, keychains, and custom prints. Designed and printed in Chennai, India.",
  url: (process.env.NEXT_PUBLIC_APP_URL || "https://thelayerup.in").replace(/\/$/, ""),
  orderPrefix: "TLU",
  contact: {
    email: "hello@thelayerup.in",
    phone: "+91 63832 71769",
    whatsapp: "916383271769",
    // Telegram username without the @. ⚠️ Confirm this handle exists.
    telegram: "thelayerup",
    city: "Chennai, Tamil Nadu",
  },
  social: {
    instagram: "https://www.instagram.com/thelayerup.in/",
    instagramHandle: "@thelayerup.in",
  },
  shipping: {
    freeAbove: 999,
    flatRate: 79,
  },
  // Cash on delivery. ⚠️ Fee and cap are starting values; tune them to your courier's COD charges.
  cod: {
    enabled: true,
    fee: 49,
    /** COD is offered up to this order total; above it, pay online. */
    maxOrder: 5000,
  },
  // Matches the refund policy: damage/defects reported within 48 hours of delivery.
  returns: {
    windowHours: 48,
    reasons: ["Damaged in transit", "Printing defect", "Wrong item received", "Item missing from parcel"],
  },
  // Hero social proof. ⚠️ Keep these honest — update the count as orders grow.
  socialProof: {
    customers: "100+",
    rating: 5,
    /** Initials shown in the overlapping avatar stack. */
    avatars: ["P", "K", "A", "R"],
  },
  // Refer-a-friend. ⚠️ Starting values; set them to what you're happy to give away.
  referral: {
    /** Welcome coupon for the friend who signs up with a code. */
    friendPercent: 10,
    friendMaxDiscount: 200,
    /** Thank-you coupon for the referrer after the friend's first order. */
    referrerFlat: 100,
    referrerMinOrder: 499,
  },
} as const;

/** One-tap contact links, shared by the floating contact button, footer and contact page. */
export const contactLinks = {
  whatsapp: `https://wa.me/${site.contact.whatsapp}?text=${encodeURIComponent(`Hi ${site.name}! I have a question.`)}`,
  instagram: site.social.instagram,
  telegram: `https://t.me/${site.contact.telegram}`,
  phone: `tel:${site.contact.phone.replace(/\s/g, "")}`,
};

export function shippingFor(subtotal: number): number {
  if (subtotal === 0) return 0;
  return subtotal >= site.shipping.freeAbove ? 0 : site.shipping.flatRate;
}
