"use client";

import { useOptimistic, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import toast from "react-hot-toast";
import { toggleWishlist } from "@/server/actions/account";
import { cn } from "@/lib/utils";
import { useT } from "@/i18n/LanguageProvider";

export default function WishlistButton({
  productId,
  initial,
  variant = "full",
}: {
  productId: string;
  initial: boolean;
  variant?: "full" | "icon";
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [saved, setSaved] = useOptimistic(initial);
  const [pending, startTransition] = useTransition();
  const t = useT();

  const onClick = (e: React.MouseEvent) => {
    e.preventDefault();
    startTransition(async () => {
      setSaved(!saved);
      const { status } = await toggleWishlist(productId);
      if (status === "login") {
        toast("Sign in to save favourites");
        router.push(`/login?callbackUrl=${encodeURIComponent(pathname)}`);
        return;
      }
      toast.success(status === "added" ? "Saved to your wishlist" : "Removed from your wishlist");
      router.refresh();
    });
  };

  const label = saved ? "Remove from wishlist" : "Save to wishlist";
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      aria-pressed={saved}
      aria-label={label}
      className={cn(
        "flex cursor-pointer items-center justify-center gap-2 border font-semibold transition-all active:scale-95 disabled:opacity-70",
        variant === "full" ? "h-14 rounded-xl px-5 text-sm" : "h-10 w-10 rounded-full shadow",
        saved
          ? "border-primary bg-primary/10 text-primary-strong"
          : "border-border bg-surface text-foreground hover:border-primary"
      )}
    >
      <Heart className={cn("h-5 w-5 transition-transform", saved && "scale-110 fill-primary text-primary")} />
      {variant === "full" && (saved ? t("pdp.saved") : t("pdp.save"))}
    </button>
  );
}
