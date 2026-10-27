// Starter catalogue used by the seed script and placeholder-art generator.
// Replace with real products (and photos) from the admin panel.

export const categories = [
  { name: "Lamps & Lighting", slug: "lamps", emoji: "💡", description: "Light that casts patterns" },
  { name: "Planters & Vases", slug: "planters", emoji: "🪴", description: "Homes for your plants" },
  { name: "Desk & Tech", slug: "desk-tech", emoji: "🖥️", description: "Stands, organisers & more" },
  { name: "Keychains", slug: "keychains", emoji: "🔑", description: "Custom & themed" },
  { name: "Wall Art", slug: "wall-art", emoji: "🎨", description: "Geometric panels" },
  { name: "Gifts", slug: "gifts", emoji: "🎁", description: "Personalised presents" },
] as const;

export type Silhouette = "lamp" | "vase" | "planter" | "stand" | "tag" | "hex" | "frame" | "figure";

export const products: {
  name: string;
  slug: string;
  category: (typeof categories)[number]["slug"];
  price: number;
  compareAtPrice?: number;
  stock: number;
  material: string;
  color: string;
  dimensions: string;
  weightGrams: number;
  featured?: boolean;
  hue: number;
  shape: Silhouette;
  description: string;
  features: string[];
}[] = [
  {
    name: "Bluma Wave Desk Lamp",
    slug: "bluma-wave-desk-lamp",
    category: "lamps",
    price: 1499,
    compareAtPrice: 1999,
    stock: 15,
    material: "PLA+",
    color: "Ivory",
    dimensions: "15 × 15 × 25 cm",
    weightGrams: 280,
    featured: true,
    hue: 18,
    shape: "lamp",
    description:
      "A sculptural wave-pattern shade that throws soft ripples of light across your desk and walls. Ships with a warm-white LED bulb and braided cable.",
    features: [
      "Wave-pattern shade casts ambient light patterns",
      "E27 socket, warm-white LED bulb included",
      "Braided 1.5 m cable with inline switch",
      "Lightweight PLA+ — cool to the touch",
    ],
  },
  {
    name: "Moon Lamp Mini",
    slug: "moon-lamp-mini",
    category: "lamps",
    price: 999,
    compareAtPrice: 1299,
    stock: 22,
    material: "PLA",
    color: "Pearl white",
    dimensions: "10 cm diameter",
    weightGrams: 160,
    featured: true,
    hue: 40,
    shape: "lamp",
    description:
      "A palm-sized moon with lunar surface detail printed from real NASA elevation data. USB-C powered with three brightness levels.",
    features: ["Surface detail from NASA lunar data", "USB-C, 3 brightness levels", "Wooden stand included"],
  },
  {
    name: "Spiral Pendant Shade",
    slug: "spiral-pendant-shade",
    category: "lamps",
    price: 1899,
    stock: 6,
    material: "PETG",
    color: "Terracotta",
    dimensions: "28 × 28 × 22 cm",
    weightGrams: 420,
    hue: 12,
    shape: "lamp",
    description: "A twisting spiral pendant that turns any bulb into a statement. Fits standard ceiling holders.",
    features: ["Fits standard B22/E27 pendant holders", "Heat-resistant PETG", "Easy wipe-clean finish"],
  },
  {
    name: "Geometric Facet Planter",
    slug: "geometric-facet-planter",
    category: "planters",
    price: 699,
    stock: 25,
    material: "PETG",
    color: "Sage",
    dimensions: "12 × 12 × 11 cm",
    weightGrams: 190,
    featured: true,
    hue: 140,
    shape: "planter",
    description:
      "Low-poly faceted planter with a hidden drainage tray. Perfect for succulents and small indoor plants.",
    features: ["Built-in drainage with removable tray", "Water-safe PETG", "Fits 10 cm nursery pots"],
  },
  {
    name: "Ripple Bud Vase",
    slug: "ripple-bud-vase",
    category: "planters",
    price: 549,
    stock: 30,
    material: "PLA",
    color: "Sand",
    dimensions: "8 × 8 × 18 cm",
    weightGrams: 120,
    hue: 35,
    shape: "vase",
    description:
      "A slim vase with a rippled silhouette for single stems and dried flowers. Watertight glass insert included.",
    features: ["Glass insert for fresh flowers", "Weighted base, won't tip", "Matte stone-like finish"],
  },
  {
    name: "Astronaut Phone Stand",
    slug: "astronaut-phone-stand",
    category: "desk-tech",
    price: 499,
    stock: 35,
    material: "PLA+",
    color: "White",
    dimensions: "9 × 8 × 12 cm",
    weightGrams: 110,
    featured: true,
    hue: 220,
    shape: "figure",
    description:
      "A tiny astronaut holds your phone at the perfect viewing angle for calls and recipes. Works with all phones, with or without a case.",
    features: ["Holds phones up to 7 inches", "Charging cable slot", "Anti-slip base"],
  },
  {
    name: "Minimal Desk Organiser",
    slug: "minimal-desk-organiser",
    category: "desk-tech",
    price: 899,
    stock: 30,
    material: "PLA+",
    color: "Charcoal",
    dimensions: "22 × 10 × 9 cm",
    weightGrams: 260,
    hue: 25,
    shape: "stand",
    description:
      "Five compartments for pens, cards, cables and your phone, in one clean slab. Designed for tidy desks and clear minds.",
    features: ["5 compartments incl. phone slot", "Felt-lined base", "Modular — add a second unit side by side"],
  },
  {
    name: "Headphone Stand Arc",
    slug: "headphone-stand-arc",
    category: "desk-tech",
    price: 799,
    stock: 18,
    material: "PLA+",
    color: "Black",
    dimensions: "12 × 12 × 26 cm",
    weightGrams: 240,
    hue: 260,
    shape: "stand",
    description:
      "A sweeping arc that holds over-ear headphones without denting the headband. Weighted base for stability.",
    features: ["Wide padded cradle", "Cable-wrap notch", "Weighted base"],
  },
  {
    name: "Custom Name Keychain",
    slug: "custom-name-keychain",
    category: "keychains",
    price: 299,
    compareAtPrice: 399,
    stock: 100,
    material: "PLA",
    color: "Choose at checkout",
    dimensions: "6 × 2 cm",
    weightGrams: 10,
    featured: true,
    hue: 8,
    shape: "tag",
    description:
      "Your name, your colours, in bold dual-colour lettering. Add the name and colours in the order notes at checkout.",
    features: ["Up to 10 characters", "Dual-colour print", "Stainless steel ring"],
  },
  {
    name: "Hexagon Wall Panel Set",
    slug: "hexagon-wall-panel-set",
    category: "wall-art",
    price: 1299,
    stock: 12,
    material: "PLA",
    color: "Mixed earth tones",
    dimensions: "Set of 6 · 15 cm each",
    weightGrams: 480,
    hue: 30,
    shape: "hex",
    description:
      "Six interlocking hexagon panels with layered relief patterns. Arrange them your way — mounting tape included.",
    features: ["6 panels, 3 relief patterns", "Damage-free mounting tape", "Mix-and-match layout"],
  },
  {
    name: "Personalised Photo Frame",
    slug: "personalised-photo-frame",
    category: "gifts",
    price: 599,
    stock: 40,
    material: "PLA+",
    color: "Ivory",
    dimensions: "Fits 4 × 6 in photo",
    weightGrams: 150,
    hue: 350,
    shape: "frame",
    description:
      "A layered frame with a name or date engraved into the border. A thoughtful gift for birthdays and anniversaries.",
    features: ["Custom text on the border", "Fits 4 × 6 in prints", "Stands or hangs"],
  },
  {
    name: "Crystal Dragon Figurine",
    slug: "crystal-dragon-figurine",
    category: "gifts",
    price: 1999,
    stock: 4,
    material: "Resin",
    color: "Translucent amber",
    dimensions: "14 × 9 × 12 cm",
    weightGrams: 210,
    featured: true,
    hue: 30,
    shape: "figure",
    description: "A finely detailed resin dragon, hand-finished and coated for a glassy translucent glow.",
    features: ["High-detail resin print", "Hand-finished & UV coated", "Gift box included"],
  },
];
