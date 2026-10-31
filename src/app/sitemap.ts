import type { MetadataRoute } from "next";
import { getAllProductSlugs } from "@/server/queries/catalog";
import { site } from "@/config/site";
import { posts } from "@/content/blog";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await getAllProductSlugs();
  const staticPaths = [
    "",
    "/products",
    "/custom-order",
    "/bulk-orders",
    "/blog",
    "/about",
    "/contact",
    "/track",
    "/policies/shipping",
    "/policies/refunds",
    "/policies/privacy",
    "/policies/terms",
  ];
  return [
    ...staticPaths.map((p) => ({ url: `${site.url}${p}` })),
    ...posts.map((p) => ({ url: `${site.url}/blog/${p.slug}`, lastModified: new Date(p.date) })),
    ...products.map((p) => ({ url: `${site.url}/products/${p.slug}`, lastModified: p.updatedAt })),
  ];
}
