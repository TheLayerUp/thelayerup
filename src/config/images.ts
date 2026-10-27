// Hosts next/image may load product photos from. Used by next.config.ts and by
// the admin product form, so an unsupported URL is rejected at save time
// instead of crashing the product page.
export const IMAGE_HOSTS = ["res.cloudinary.com", "utfs.io", "images.unsplash.com"] as const;

export function isAllowedImageUrl(url: string) {
  if (url.startsWith("/") && !url.startsWith("//")) return true;
  try {
    const u = new URL(url);
    return u.protocol === "https:" && (IMAGE_HOSTS as readonly string[]).includes(u.hostname);
  } catch {
    return false;
  }
}
