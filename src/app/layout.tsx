import type { Metadata, Viewport } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import { Toaster } from "react-hot-toast";
import { site } from "@/config/site";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const display = Space_Grotesk({ subsets: ["latin"], variable: "--font-display" });

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
  icons: { icon: "/images/logo.png" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5ece5" },
    { media: "(prefers-color-scheme: dark)", color: "#14100d" },
  ],
};

// Applies the saved/system theme before first paint to avoid a flash.
const themeScript = `(function(){try{var t=localStorage.getItem("theme");if(t==="dark"||(!t&&matchMedia("(prefers-color-scheme: dark)").matches))document.documentElement.classList.add("dark")}catch(e){}})()`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en-IN" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className={`${inter.variable} ${display.variable} font-sans antialiased`}>
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
