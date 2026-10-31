import type { NextConfig } from "next";
import { IMAGE_HOSTS } from "./src/config/images";

const securityHeaders = [
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Our pages may not be framed by other sites (clickjacking). Razorpay frames
  // *into* our page, which this does not affect.
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'self'" },
  {
    key: "Permissions-Policy",
    value: 'camera=(), microphone=(), geolocation=(), payment=(self "https://api.razorpay.com")',
  },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // Dev only: lets phones on the same Wi-Fi (http://192.168.x.x:3000) load the
  // dev server's scripts. Without this the page never hydrates on a phone, so
  // nothing interactive works (chat button, hero videos).
  allowedDevOrigins: ["192.168.*.*", "10.*.*.*", "*.local"],
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  cacheComponents: true,
  partialPrefetching: true,
  images: {
    // Product images pasted into the admin can come from these hosts.
    remotePatterns: IMAGE_HOSTS.map((hostname) => ({ protocol: "https" as const, hostname })),
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  turbopack: {
    root: __dirname,
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
