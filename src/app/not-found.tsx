import Link from "next/link";
import { LogoMark } from "@/components/layout/Logo";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="bg-layers flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <LogoMark className="h-14 w-14" />
      <h1 className="mt-6 text-5xl font-bold">404</h1>
      <p className="mt-2 text-muted-foreground">This page fell off the print bed.</p>
      <Link href="/" className={buttonVariants({ className: "mt-8" })}>
        Back to home
      </Link>
    </div>
  );
}
