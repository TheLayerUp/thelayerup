import { quoteRules } from "@/config/quote";

// Blog posts live in code: no CMS to run, and each post is statically rendered.
// To add one, append to `posts` (newest first is not required; the index sorts by date).

export type Block = { h?: string; p?: string[]; list?: string[] };

export type Post = {
  slug: string;
  title: string;
  excerpt: string;
  date: string; // YYYY-MM-DD
  readMins: number;
  tag: string;
  body: Block[];
};

export const posts: Post[] = [
  {
    slug: "pla-vs-petg-vs-abs-vs-resin",
    title: "PLA, PETG, ABS or resin: which 3D printing material should you pick?",
    excerpt: "A plain-English guide to the four materials we print with, and when each one is the right call.",
    date: "2026-10-20",
    readMins: 5,
    tag: "Materials",
    body: [
      {
        p: [
          "Most of what we sell is printed in PLA, but it isn't always the best choice. Here's how the four materials compare for everyday objects, gifts and functional parts.",
        ],
      },
      {
        h: "PLA: the everyday default",
        p: [
          "PLA is made from plant starch, prints with crisp detail and comes in the widest range of colours, including silk and matte finishes. It's stiff and strong enough for decor, lamps, planters, desk organisers and gifts.",
          "Its weak point is heat: PLA starts to soften around 55–60 °C. Don't leave PLA parts on a car dashboard in summer or put them in a dishwasher.",
        ],
      },
      {
        h: "PETG: tougher, and fine outdoors",
        p: [
          "PETG is the same family of plastic as water bottles. It flexes a little instead of snapping, shrugs off moisture and UV better than PLA, and handles about 75 °C.",
          "Pick it for outdoor planters, bike and car accessories, clips, hooks and anything that gets knocked around.",
        ],
      },
      {
        h: "ABS: when heat is the problem",
        p: [
          "ABS (the plastic LEGO bricks are made from) survives roughly 95 °C and can be smoothed to a glossy finish. It's a good fit for parts near engines, electronics enclosures and replacement parts for appliances.",
        ],
      },
      {
        h: "Resin: for fine detail",
        p: [
          "Resin printers cure liquid layers only 0.05 mm thick, so they capture tiny details like faces, text and jewellery-scale features that filament can't. Resin is more brittle and costs more per gram, so we use it for figurines, miniatures and display pieces.",
        ],
      },
      {
        h: "Quick guide",
        list: [
          "Decor, lamps, gifts → PLA",
          "Outdoors, clips, things that bend → PETG",
          "Hot places, enclosures → ABS",
          "Tiny details, figurines → resin",
        ],
      },
      {
        p: [
          "Not sure? Leave the material as “recommend one” on a custom print request and we'll suggest the right one with your quote.",
        ],
      },
    ],
  },
  {
    slug: "how-to-care-for-3d-printed-products",
    title: "How to care for your 3D printed pieces",
    excerpt: "Cleaning, heat, sunlight and water: five habits that keep prints looking new for years.",
    date: "2026-10-12",
    readMins: 3,
    tag: "Care",
    body: [
      {
        p: [
          "3D printed objects are durable, but the layer-by-layer surface needs a little different care from moulded plastic.",
        ],
      },
      {
        h: "1. Dust with a soft brush",
        p: [
          "Fine layer lines collect dust. A soft paintbrush or makeup brush gets into the grooves better than a cloth. For stubborn marks, use a damp microfibre cloth and dry it straight away.",
        ],
      },
      {
        h: "2. Keep PLA away from heat",
        p: [
          "PLA softens above about 55 °C. Keep it out of hot cars, off stove tops and out of the dishwasher. In printed lamps, always use LED bulbs, which stay cool. Never use an incandescent or halogen bulb.",
        ],
      },
      {
        h: "3. Plant pots: use a liner or drainage tray",
        p: [
          "A nursery pot or saucer inside a printed planter stops soil and minerals from staining the layers and makes repotting easy.",
        ],
      },
      {
        h: "4. Mind long direct sunlight",
        p: [
          "Bright colours can fade after months on a sunny windowsill. PETG holds up better outdoors if you need a piece in the sun.",
        ],
      },
      {
        h: "5. Not food-safe by default",
        p: [
          "Layer lines can trap bacteria, so treat printed pieces as decorative unless we've specifically sold them as food-safe.",
        ],
      },
    ],
  },
  {
    slug: "preparing-a-file-for-custom-3d-printing",
    title: "Preparing a file for a custom 3D print",
    excerpt: "File formats, units, wall thickness and the details that make quotes faster and prints better.",
    date: "2026-10-04",
    readMins: 4,
    tag: "Custom prints",
    body: [
      {
        p: [
          "You don't need a perfect file to get a custom print. A sketch and a few measurements are often enough. If you do have a 3D model, these checks save a round of back-and-forth.",
        ],
      },
      {
        h: "Formats we accept",
        list: [
          "STL: the most common; works with our instant quote calculator",
          "3MF: keeps colours and units; great if you have it",
          "OBJ and STEP: fine too (STEP is best for engineering parts)",
        ],
      },
      {
        h: "Check the units",
        p: [
          "STL files don't store units, so we assume millimetres. If your model shows up 25× too small, it was probably exported in inches. The instant quote shows the size it read, so you can check before you send.",
        ],
      },
      {
        h: "Walls and small features",
        list: [
          "Walls: at least 1.2 mm for filament prints, 0.8 mm for resin",
          "Embossed or engraved text: at least 0.6 mm deep and 1 mm wide strokes",
          "Holes for screws: model them 0.2–0.3 mm larger than the screw",
        ],
      },
      {
        h: "Size limits",
        p: [
          `Our print bed is ${quoteRules.buildVolume.x} × ${quoteRules.buildVolume.y} × ${quoteRules.buildVolume.z} mm. Bigger pieces are printed in parts and joined. Mention it and we'll plan the split lines so they're hidden.`,
        ],
      },
      {
        h: "Get an instant estimate",
        p: [
          "Drop your STL into the instant quote on the custom print page to see the size, weight and an estimated price in each material. Then send the request and we'll confirm within 24 hours.",
        ],
      },
    ],
  },
];

export function getPost(slug: string) {
  return posts.find((p) => p.slug === slug) ?? null;
}

export function sortedPosts() {
  return [...posts].sort((a, b) => b.date.localeCompare(a.date));
}
