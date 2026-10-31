import type { Metadata, Viewport } from "next";
import { Caveat, Inter, Space_Grotesk } from "next/font/google";
import { Toaster } from "react-hot-toast";
import { site } from "@/config/site";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const display = Space_Grotesk({ subsets: ["latin"], variable: "--font-display" });
// Handwritten accent for the hero's sticky notes.
const hand = Caveat({ subsets: ["latin"], weight: ["500", "700"], variable: "--font-caveat" });

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.name} | 3D Printed Products, Designed for You`,
    template: `%s | ${site.name}`,
  },
  description: site.description,
  keywords: [
    "3D printing",
    "3D printed products",
    "custom 3D printing",
    "3D printed lamps",
    "3D printed decor",
    "buy 3D prints India",
  ],
  openGraph: {
    type: "website",
    locale: "en_IN",
    siteName: site.name,
    title: `${site.name} | 3D Printed Products`,
    description: site.description,
    images: ["/images/logo.png"],
  },
  icons: { icon: "/images/logo.png", apple: "/images/logo.png" },
  appleWebApp: { capable: true, title: site.name, statusBarStyle: "default" },
};

export const viewport: Viewport = {
  // Lets fixed UI (the contact button) respect the iPhone home-indicator inset.
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5ece5" },
    { media: "(prefers-color-scheme: dark)", color: "#14100d" },
  ],
};

// Applies the saved/system theme (and a dismissed announcement bar) before first paint to avoid a flash.
const themeScript = `(function(){try{var d=document.documentElement,t=localStorage.getItem("theme");if(t==="dark"||(!t&&matchMedia("(prefers-color-scheme: dark)").matches))d.classList.add("dark");if(localStorage.getItem("announce-dismissed"))d.dataset.announce="off"}catch(e){}})()`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en-IN" data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      {/* suppressHydrationWarning: browser extensions add their own classes to <body> before React hydrates. */}
      <body
        className={`${inter.variable} ${display.variable} ${hand.variable} font-sans antialiased`}
        suppressHydrationWarning
      >
        {children}
        <Toaster
          position="bottom-center"
          toastOptions={{
            className: "!bg-surface !text-foreground !border !border-border !rounded-xl !text-sm",
          }}
        />
      </body>
    </html>
  );
}
