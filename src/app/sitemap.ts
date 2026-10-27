import type { MetadataRoute } from "next";
import { getAllProductSlugs } from "@/server/queries/catalog";
import { site } from "@/config/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await getAllProductSlugs();
  const staticPaths = [
    "",
    "/products",
    "/custom-order",
    "/about",
    "/contact",
    "/track",
    "/policies/shipping",
    "/policies/privacy",
    "/policies/terms",
  ];
  return [
    ...staticPaths.map((p) => ({ url: `${site.url}${p}` })),
    ...products.map((p) => ({ url: `${site.url}/products/${p.slug}`, lastModified: p.updatedAt })),
  ];
}
