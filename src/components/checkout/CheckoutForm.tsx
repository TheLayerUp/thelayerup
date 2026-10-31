"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, Banknote, CreditCard, FlaskConical, Tag, X } from "lucide-react";
import toast from "react-hot-toast";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useCartStore, useHydrated, type CartItem } from "@/stores/cart-store";
import { confirmRazorpayPayment, confirmTestPayment, quoteCart, startCheckout } from "@/server/actions/checkout";
import type { PricedCart } from "@/server/services/orders";
import type { AddressInput } from "@/lib/validators";
import { INDIAN_STATES } from "@/config/india";
import { site } from "@/config/site";
import { codFeeFor } from "@/lib/pricing";
import { useLang, useLocalized, useT } from "@/i18n/LanguageProvider";
import { cn, formatPrice } from "@/lib/utils";

type SavedAddress = AddressInput & { id: string; line2: string };

interface Props {
  addresses: SavedAddress[];
  defaultName: string;
  mode: "razorpay" | "test" | "disabled";
}

type RazorpayResponse = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void; on: (e: string, cb: () => void) => void };
  }
}

function loadRazorpay(): Promise<boolean> {
  if (window.Razorpay) return Promise.resolve(true);
  return new Promise((resolve) => {
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

const emptyAddress = (name: string): AddressInput => ({
  fullName: name,
  phone: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  pincode: "",
});

export default function CheckoutForm({ addresses, defaultName, mode }: Props) {
  const router = useRouter();
  const hydrated = useHydrated();
  const { items, replaceItems, clearCart } = useCartStore();

  const [selectedAddress, setSelectedAddress] = useState<string>(addresses[0]?.id ?? "new");
  const [address, setAddress] = useState<AddressInput>(emptyAddress(defaultName));
  const [saveAddress, setSaveAddress] = useState(addresses.length === 0);
  const [notes, setNotes] = useState("");
  const t = useT();
  const loc = useLocalized();
  const { lang } = useLang();
  const [payMethod, setPayMethod] = useState<"ONLINE" | "COD">(mode === "disabled" ? "COD" : "ONLINE");
  const [couponInput, setCouponInput] = useState("");
  const [coupon, setCoupon] = useState<string | undefined>();
  const [couponError, setCouponError] = useState<string | null>(null);
  const [priced, setPriced] = useState<PricedCart | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);
  const [quoting, startQuote] = useTransition();
  const [placed, setPlaced] = useState(false);

  const cartKey = items.map((i) => `${i.id}:${i.quantity}`).join(",");

  /** Keep the local cart in line with what the server says is purchasable. */
  const syncCart = useCallback(
    (p: PricedCart) => {
      const next: CartItem[] = p.lines.map((l) => {
        const existing = items.find((i) => i.id === l.productId);
        return {
          id: l.productId,
          slug: l.slug,
          name: l.name,
          price: l.unitPrice,
          image: existing?.image ?? l.image ?? "/images/placeholder-product.svg",
          quantity: l.quantity,
          maxStock: existing?.maxStock ?? l.quantity,
        };
      });
      const changed =
        next.map((i) => `${i.id}:${i.quantity}:${i.price}`).join(",") !==
        items.map((i) => `${i.id}:${i.quantity}:${i.price}`).join(",");
      if (changed) replaceItems(next);
    },
    [items, replaceItems]
  );

  useEffect(() => {
    if (!hydrated || items.length === 0) return;
    startQuote(async () => {
      const p = await quoteCart(
        items.map((i) => ({ productId: i.id, quantity: i.quantity })),
        coupon
      );
      setPriced(p);
      syncCart(p);
      if (coupon && !p.coupon) {
        setCouponError(p.problems.at(-1) ?? "That coupon can't be applied.");
        setCoupon(undefined);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, cartKey, coupon]);

  if (!hydrated) return null;

  if (items.length === 0 && !placed) {
    return (
      <div className="mt-10 rounded-3xl border border-dashed border-border py-20 text-center">
        <p className="text-lg font-medium">Your cart is empty</p>
        <Link href="/products" className={buttonVariants({ className: "mt-6" })}>
          Browse products
        </Link>
      </div>
    );
  }

  const shipTo: AddressInput = selectedAddress === "new" ? address : addresses.find((a) => a.id === selectedAddress)!;

  const set = (k: keyof AddressInput) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setAddress((a) => ({ ...a, [k]: e.target.value }));
  const err = (k: string) => errors[`address.${k}`];

  const codFee = priced ? codFeeFor(priced.total, site.cod) : null;
  const useCod = payMethod === "COD" && codFee !== null;
  const payable = (priced?.total ?? 0) + (useCod ? codFee : 0);

  async function finish(orderNumber: string) {
    setPlaced(true);
    clearCart();
    router.push(`/checkout/success?order=${orderNumber}`);
  }

  async function onPay() {
    setFormError(null);
    setErrors({});
    setPaying(true);
    try {
      const res = await startCheckout({
        address: shipTo,
        items: items.map((i) => ({ productId: i.id, quantity: i.quantity })),
        couponCode: coupon,
        notes: notes || undefined,
        saveAddress: selectedAddress === "new" && saveAddress,
        paymentMethod: useCod ? "COD" : "ONLINE",
        // Order emails exist in English and Hindi; Tamil shoppers get English.
        locale: lang === "hi" ? "hi" : "en",
      });

      if (!res.ok) {
        setFormError(res.error);
        if (res.errors) setErrors(res.errors);
        if (res.priced) {
          setPriced(res.priced);
          syncCart(res.priced);
        }
        setPaying(false);
        return;
      }

      if (res.mode === "cod") return finish(res.orderNumber);

      if (res.mode === "test") {
        const done = await confirmTestPayment(res.orderId);
        if (done.ok) return finish(done.orderNumber);
        setFormError(done.error);
        setPaying(false);
        return;
      }

      if (!(await loadRazorpay()) || !window.Razorpay) {
        setFormError("Couldn't load the payment window. Check your connection and try again.");
        setPaying(false);
        return;
      }

      const rzp = new window.Razorpay({
        key: res.razorpayKey,
        amount: res.amount * 100,
        currency: "INR",
        name: "TheLayerUp",
        description: `Order ${res.orderNumber}`,
        order_id: res.razorpayOrderId,
        prefill: res.prefill,
        theme: { color: "#fe5a35" },
        handler: async (r: RazorpayResponse) => {
          const done = await confirmRazorpayPayment({ orderId: res.orderId, ...r });
          if (done.ok) return finish(done.orderNumber);
          setFormError(done.error);
          setPaying(false);
        },
        modal: {
          ondismiss: () => {
            setPaying(false);
            toast("Payment cancelled. You can try again anytime.");
          },
        },
      });
      rzp.on("payment.failed", () => {
        setFormError("Payment failed. No money was taken — please try another method.");
      });
      rzp.open();
    } catch (e) {
      console.error(e);
      setFormError("Something went wrong. Please try again.");
      setPaying(false);
    }
  }

  return (
    <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px]">
      <div className="space-y-6">
        {mode === "test" && (
          <div className="flex gap-3 rounded-2xl border border-warning/40 bg-warning/10 p-4 text-sm">
            <FlaskConical className="h-5 w-5 shrink-0 text-warning" />
            <p>
              <strong>Test payment mode.</strong> Razorpay keys aren&apos;t configured, so orders are marked paid
              without charging. This mode is disabled in production.
            </p>
          </div>
        )}

        <section className="rounded-3xl border border-border bg-surface p-6">
          <h2 className="text-lg font-semibold">{t("co.address")}</h2>

          {addresses.length > 0 && (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {addresses.map((a) => (
                <label
                  key={a.id}
                  className={cn(
                    "cursor-pointer rounded-2xl border p-4 text-sm transition-colors",
                    selectedAddress === a.id
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-muted-foreground"
                  )}
                >
                  <input
                    type="radio"
                    name="address"
                    className="sr-only"
                    checked={selectedAddress === a.id}
                    onChange={() => setSelectedAddress(a.id)}
                  />
                  <p className="font-semibold">{a.fullName}</p>
                  <p className="mt-1 text-muted-foreground">
                    {a.line1}
                    {a.line2 && `, ${a.line2}`}, {a.city}, {a.state} {a.pincode}
                  </p>
                  <p className="mt-1 text-muted-foreground">{a.phone}</p>
                </label>
              ))}
              <label
                className={cn(
                  "flex cursor-pointer items-center justify-center rounded-2xl border border-dashed p-4 text-sm font-medium",
                  selectedAddress === "new"
                    ? "border-primary text-primary-strong"
                    : "border-border text-muted-foreground"
                )}
              >
                <input
                  type="radio"
                  name="address"
                  className="sr-only"
                  checked={selectedAddress === "new"}
                  onChange={() => setSelectedAddress("new")}
                />
                + New address
              </label>
            </div>
          )}

          {selectedAddress === "new" && (
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="fullName">{t("co.fullName")}</Label>
                <Input
                  id="fullName"
                  autoComplete="name"
                  value={address.fullName}
                  onChange={set("fullName")}
                  error={err("fullName")}
                />
              </div>
              <div>
                <Label htmlFor="phone">{t("co.mobile")}</Label>
                <Input
                  id="phone"
                  type="tel"
                  autoComplete="tel"
                  inputMode="numeric"
                  placeholder="10-digit mobile"
                  value={address.phone}
                  onChange={set("phone")}
                  error={err("phone")}
                />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="line1">{t("co.line1")}</Label>
                <Input
                  id="line1"
                  autoComplete="address-line1"
                  value={address.line1}
                  onChange={set("line1")}
                  error={err("line1")}
                />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="line2">{t("co.line2")}</Label>
                <Input id="line2" autoComplete="address-line2" value={address.line2} onChange={set("line2")} />
              </div>
              <div>
                <Label htmlFor="pincode">{t("co.pincode")}</Label>
                <Input
                  id="pincode"
                  autoComplete="postal-code"
                  inputMode="numeric"
                  maxLength={6}
                  value={address.pincode}
                  onChange={set("pincode")}
                  error={err("pincode")}
                />
              </div>
              <div>
                <Label htmlFor="city">{t("co.city")}</Label>
                <Input
                  id="city"
                  autoComplete="address-level2"
                  value={address.city}
                  onChange={set("city")}
                  error={err("city")}
                />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="state">{t("co.state")}</Label>
                <Select id="state" value={address.state} onChange={set("state")} error={err("state")}>
                  <option value="">{t("co.selectState")}</option>
                  {INDIAN_STATES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </Select>
              </div>
              <label className="flex items-center gap-2 text-sm text-muted-foreground sm:col-span-2">
                <input
                  type="checkbox"
                  checked={saveAddress}
                  onChange={(e) => setSaveAddress(e.target.checked)}
                  className="accent-primary"
                />
                {t("co.saveAddress")}
              </label>
            </div>
          )}
        </section>

        <section className="rounded-3xl border border-border bg-surface p-6">
          <h2 className="text-lg font-semibold">{t("co.payment")}</h2>
          <div role="radiogroup" aria-label="Payment method" className="mt-4 grid gap-3 sm:grid-cols-2">
            {(
              [
                {
                  id: "ONLINE",
                  icon: CreditCard,
                  title: t("co.payOnline"),
                  sub: t("co.payOnlineSub"),
                  disabled: mode === "disabled",
                },
                {
                  id: "COD",
                  icon: Banknote,
                  title: t("co.cod"),
                  sub:
                    codFee === null
                      ? t("co.codMax").replace("{amount}", formatPrice(site.cod.maxOrder))
                      : t("co.codSub").replace("{amount}", formatPrice(codFee)),
                  disabled: codFee === null,
                },
              ] as const
            ).map((m) => (
              <button
                key={m.id}
                type="button"
                role="radio"
                aria-checked={payMethod === m.id && !m.disabled}
                disabled={m.disabled}
                onClick={() => setPayMethod(m.id)}
                className={cn(
                  "flex cursor-pointer items-start gap-3 rounded-2xl border p-4 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-50",
                  payMethod === m.id && !m.disabled
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-foreground/40"
                )}
              >
                <m.icon className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <span>
                  <span className="block text-sm font-semibold">{m.title}</span>
                  <span className="block text-xs text-muted-foreground">{m.sub}</span>
                </span>
              </button>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-border bg-surface p-6">
          <Label htmlFor="notes" className="text-base font-semibold text-foreground">
            {t("co.notes")}
          </Label>
          <Textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            maxLength={500}
            placeholder={t("co.notesPh")}
            className="mt-2 min-h-[80px]"
          />
        </section>
      </div>

      <aside className="h-fit rounded-3xl border border-border bg-surface p-6 lg:sticky lg:top-28">
        <h2 className="text-lg font-semibold">{t("co.summary")}</h2>
        <ul className="mt-4 space-y-3">
          {items.map((i) => (
            <li key={i.id} className="flex gap-3 text-sm">
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-surface-2">
                <Image src={i.image} alt={i.name} fill sizes="56px" className="object-cover" />
                <span className="absolute top-0 right-0 flex h-5 min-w-5 items-center justify-center rounded-bl-lg bg-foreground px-1 text-[10px] font-bold text-background">
                  {i.quantity}
                </span>
              </div>
              <span className="flex-1 leading-tight">{loc(i.name, i.nameHi)}</span>
              <span className="font-medium">{formatPrice(i.price * i.quantity)}</span>
            </li>
          ))}
        </ul>

        <div className="mt-5 border-t border-border pt-5">
          {priced?.coupon ? (
            <div className="flex items-center justify-between rounded-xl bg-success/10 px-3 py-2 text-sm text-success">
              <span className="flex items-center gap-2 font-medium">
                <Tag className="h-4 w-4" />
                {priced.coupon.code} applied
              </span>
              <button
                onClick={() => {
                  setCoupon(undefined);
                  setCouponInput("");
                }}
                aria-label="Remove coupon"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                setCouponError(null);
                if (couponInput.trim()) setCoupon(couponInput.trim().toUpperCase());
              }}
            >
              <Input
                placeholder={t("co.coupon")}
                value={couponInput}
                onChange={(e) => setCouponInput(e.target.value)}
                className="h-10 uppercase"
              />
              <Button type="submit" variant="outline" className="h-10">
                {t("co.apply")}
              </Button>
            </form>
          )}
          {couponError && <p className="mt-2 text-xs text-destructive">{couponError}</p>}
        </div>

        <dl className={cn("mt-5 space-y-2 text-sm transition-opacity", quoting && "opacity-50")}>
          <Row label={t("cart.subtotal")} value={formatPrice(priced?.subtotal ?? 0)} />
          {!!priced?.discount && (
            <Row label={t("co.discount")} value={`−${formatPrice(priced.discount)}`} className="text-success" />
          )}
          <Row
            label={t("co.shipping")}
            value={priced ? (priced.shipping ? formatPrice(priced.shipping) : t("co.free")) : "—"}
          />
          {useCod && <Row label={t("co.codFee")} value={formatPrice(codFee)} />}
          <div className="flex justify-between border-t border-border pt-3 text-base font-bold">
            <dt>{t("co.total")}</dt>
            <dd>{formatPrice(payable)}</dd>
          </div>
        </dl>

        {priced?.problems.map((p) => (
          <p key={p} className="mt-3 flex gap-2 text-sm text-warning">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            {p}
          </p>
        ))}
        {formError && (
          <p className="mt-3 text-sm font-medium text-destructive" role="alert">
            {formError}
          </p>
        )}

        <Button
          variant="glow"
          size="lg"
          className="mt-5 w-full"
          onClick={onPay}
          isLoading={paying}
          disabled={!priced || quoting || (!useCod && mode === "disabled") || priced.lines.length === 0}
        >
          {useCod
            ? t("co.placeCod").replace("{amount}", formatPrice(payable))
            : mode === "test"
              ? "Place test order"
              : t("co.pay").replace("{amount}", priced ? formatPrice(payable) : "")}
        </Button>
        <p className="mt-3 text-center text-xs text-muted-foreground">
          {useCod ? t("co.codNote") : t("co.onlineNote")}
        </p>
      </aside>
    </div>
  );
}

function Row({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className={cn("flex justify-between", className)}>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}
