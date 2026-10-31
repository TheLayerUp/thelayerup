import { Suspense } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import CartDrawer from "@/components/layout/CartDrawer";
import ContactDock from "@/components/layout/ContactDock";
import AccountButton, { AccountButtonFallback } from "@/components/layout/AccountButton";
import { LanguageProvider } from "@/i18n/LanguageProvider";

export default function StorefrontLayout({ children }: { children: React.ReactNode }) {
  return (
    // overflow-x-clip (not hidden) stops sideways scrolling on phones without breaking the sticky navbar.
    <LanguageProvider>
      <div className="flex min-h-screen flex-col overflow-x-clip">
        <Navbar
          accountSlot={
            <Suspense fallback={<AccountButtonFallback />}>
              <AccountButton />
            </Suspense>
          }
        />
        {/* Reads the pathname (close on navigation), so it streams in after the shell. */}
        <Suspense>
          <CartDrawer />
        </Suspense>
        <main className="flex-1">{children}</main>
        <Footer />
        <ContactDock />
      </div>
    </LanguageProvider>
  );
}
