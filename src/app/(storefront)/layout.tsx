import { Suspense } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import CartDrawer from "@/components/layout/CartDrawer";
import AccountButton, { AccountButtonFallback } from "@/components/layout/AccountButton";

export default function StorefrontLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
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
    </div>
  );
}
