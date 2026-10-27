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
    city: "Chennai, Tamil Nadu",
  },
  social: {
    instagram: "https://instagram.com/thelayerup",
  },
  shipping: {
    freeAbove: 999,
    flatRate: 79,
  },
} as const;

export function shippingFor(subtotal: number): number {
  if (subtotal === 0) return 0;
  return subtotal >= site.shipping.freeAbove ? 0 : site.shipping.flatRate;
}
