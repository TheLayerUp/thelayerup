import type { MetadataRoute } from "next";
import { site } from "@/config/site";

// Lets shoppers "Add to Home Screen" and open the store full-screen like an app.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: site.name,
    short_name: site.name,
    description: site.description,
    start_url: "/",
    display: "standalone",
    background_color: "#f5ece5",
    theme_color: "#f5ece5",
    categories: ["shopping", "lifestyle"],
    icons: [{ src: "/images/logo.png", sizes: "640x640", type: "image/png", purpose: "any" }],
    shortcuts: [
      { name: "Shop", url: "/products" },
      { name: "Custom print", url: "/custom-order" },
      { name: "Track order", url: "/track" },
    ],
  };
}
