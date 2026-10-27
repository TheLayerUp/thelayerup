// Generates on-brand placeholder artwork for the starter catalogue:
// each product is drawn as a stack of "print layers" in its own colour.
// Run: npm run art:generate
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { products, type Silhouette } from "../prisma/data/catalog";

const LAYERS = 34;

// Width (0–1) of the object at height t (0 = bottom, 1 = top).
const profiles: Record<Silhouette, (t: number) => number> = {
  lamp: (t) =>
    t < 0.12
      ? 0.22
      : t < 0.2
        ? 0.08
        : 0.35 + 0.35 * Math.sin(Math.PI * ((t - 0.2) / 0.8)) * (1 - 0.3 * Math.cos(t * 28)),
  vase: (t) => 0.18 + 0.22 * Math.sin(Math.PI * t * 0.9) + 0.03 * Math.sin(t * 40),
  planter: (t) => (t > 0.75 ? 0 : 0.42 + 0.22 * t + (Math.floor(t * 8) % 2 ? 0.03 : 0)),
  stand: (t) => (t < 0.15 ? 0.7 : t < 0.8 ? 0.12 : 0.12 + (t - 0.8) * 2.4),
  tag: (t) => (t < 0.25 ? 0 : t < 0.65 ? 0.62 : t < 0.78 ? 0.18 : t < 0.88 ? 0.1 : 0),
  hex: (t) => 0.62 * (1 - Math.abs(t - 0.5) * 1.15),
  frame: (t) => (t < 0.1 || t > 0.9 ? 0 : 0.6),
  figure: (t) => (t < 0.12 ? 0.42 : t < 0.55 ? 0.3 + 0.06 * Math.sin(t * 20) : t < 0.62 ? 0.14 : t < 0.9 ? 0.24 : 0),
};

function hsl(h: number, s: number, l: number) {
  return `hsl(${h} ${s}% ${l}%)`;
}

function render(hue: number, shape: Silhouette, variant: number) {
  const size = 800;
  const bg = variant === 0 ? hsl(hue, 45, 90) : hsl(hue, 30, 82);
  const bedY = 640;
  const layerH = 12;
  let bars = "";
  for (let i = 0; i < LAYERS; i++) {
    const t = i / (LAYERS - 1);
    const w = Math.max(0, profiles[shape](t)) * size * 0.78;
    if (w < 4) continue;
    const y = bedY - (i + 1) * (layerH + 2.5);
    const light = 48 + (i % 2) * 4 + t * 10;
    bars += `<rect x="${(size - w) / 2}" y="${y}" width="${w}" height="${layerH}" rx="${layerH / 2}" fill="${hsl(hue, 72, light)}"/>`;
  }
  if (shape === "frame") {
    bars += `<rect x="${size * 0.32}" y="${bedY - 400}" width="${size * 0.36}" height="300" rx="10" fill="${bg}"/>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
<rect width="${size}" height="${size}" fill="${bg}"/>
<g opacity="0.06" stroke="#000">${Array.from({ length: 40 }, (_, i) => `<line x1="0" x2="${size}" y1="${i * 20}" y2="${i * 20}"/>`).join("")}</g>
<ellipse cx="${size / 2}" cy="${bedY + 18}" rx="${size * 0.36}" ry="18" fill="#000" opacity="0.08"/>
${bars}
<rect x="${size * 0.1}" y="${bedY}" width="${size * 0.8}" height="10" rx="5" fill="#1c120c" opacity="0.85"/>
</svg>`;
}

const outDir = join(process.cwd(), "public", "images", "products");
mkdirSync(outDir, { recursive: true });
for (const p of products) {
  writeFileSync(join(outDir, `${p.slug}.svg`), render(p.hue, p.shape, 0));
  writeFileSync(join(outDir, `${p.slug}-2.svg`), render((p.hue + 25) % 360, p.shape, 1));
}
console.log(`Wrote ${products.length * 2} images to ${outDir}`);
