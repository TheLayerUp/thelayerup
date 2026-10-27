import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { categories, products } from "./data/catalog";

const prisma = new PrismaClient();

const isLocalDb = /@(localhost|127.0.0.1)[:/]/.test(process.env.DATABASE_URL ?? "");
// Placeholder products belong in dev/CI, not on the live store, unless asked for.
const seedSamples = isLocalDb || process.env.CI === "true" || process.env.SEED_SAMPLE_PRODUCTS === "true";

async function main() {
  for (const [i, c] of categories.entries()) {
    await prisma.category.upsert({
      where: { slug: c.slug },
      update: { name: c.name, emoji: c.emoji, description: c.description, displayOrder: i },
      create: { ...c, displayOrder: i },
    });
  }
  const catIds = new Map(
    (await prisma.category.findMany({ select: { id: true, slug: true } })).map((c) => [c.slug, c.id])
  );

  if (!seedSamples) console.log("Skipping sample products (set SEED_SAMPLE_PRODUCTS=true to include them).");
  for (const p of seedSamples ? products : []) {
    const data = {
      name: p.name,
      description: p.description,
      features: p.features,
      price: p.price,
      compareAtPrice: p.compareAtPrice ?? null,
      stock: p.stock,
      material: p.material,
      color: p.color,
      dimensions: p.dimensions,
      weightGrams: p.weightGrams,
      isFeatured: p.featured ?? false,
      categoryId: catIds.get(p.category)!,
    };
    const product = await prisma.product.upsert({
      where: { slug: p.slug },
      update: data,
      create: { ...data, slug: p.slug },
    });
    await prisma.productImage.deleteMany({ where: { productId: product.id } });
    await prisma.productImage.createMany({
      data: [
        { productId: product.id, url: `/images/products/${p.slug}.svg`, altText: p.name, displayOrder: 0 },
        {
          productId: product.id,
          url: `/images/products/${p.slug}-2.svg`,
          altText: `${p.name} alternate`,
          displayOrder: 1,
        },
      ],
    });
  }

  await prisma.coupon.upsert({
    where: { code: "WELCOME10" },
    update: {},
    create: { code: "WELCOME10", type: "PERCENTAGE", value: 10, maxDiscount: 300 },
  });
  await prisma.coupon.upsert({
    where: { code: "FLAT150" },
    update: {},
    create: { code: "FLAT150", type: "FLAT", value: 150, minOrderValue: 1499 },
  });

  const adminEmail = process.env.SEED_ADMIN_EMAIL?.toLowerCase();
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;
  if (adminEmail && adminPassword && !isLocalDb && process.env.CI !== "true" && adminPassword.length < 12) {
    throw new Error("SEED_ADMIN_PASSWORD must be at least 12 characters for a non-local database.");
  }
  if (adminEmail && adminPassword) {
    await prisma.user.upsert({
      where: { email: adminEmail },
      update: { role: "ADMIN" },
      create: {
        email: adminEmail,
        name: "Store Admin",
        role: "ADMIN",
        passwordHash: await bcrypt.hash(adminPassword, 12),
      },
    });
    console.log(`Admin user: ${adminEmail}`);
  }

  console.log(`Seeded ${categories.length} categories, ${seedSamples ? products.length : 0} products, 2 coupons.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
