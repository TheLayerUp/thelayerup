"use client";

import { useEffect, useState } from "react";
import { Bell, BellOff, BellRing } from "lucide-react";
import toast from "react-hot-toast";
import { removePushSubscription, savePushSubscription } from "@/server/actions/account";

const KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

function keyBytes(base64: string) {
  const pad = "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + pad).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

type State = "unsupported" | "loading" | "off" | "on" | "blocked";

/** "Notify me on this device" for order updates (web push). Hidden until VAPID keys are configured. */
export default function PushToggle({ compact = false }: { compact?: boolean }) {
  const [state, setState] = useState<State>("loading");

  useEffect(() => {
    // Browser capabilities are only knowable after mount.
    if (!KEY || !("serviceWorker" in navigator) || !("PushManager" in window)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setState("unsupported");
      return;
    }
    if (Notification.permission === "denied") {
      setState("blocked");
      return;
    }
    navigator.serviceWorker
      .getRegistration()
      .then((reg) => reg?.pushManager.getSubscription())
      .then((sub) => setState(sub ? "on" : "off"))
      .catch(() => setState("off"));
  }, []);

  if (state === "unsupported" || state === "loading") return null;

  const enable = async () => {
    setState("loading");
    try {
      const reg = await navigator.serviceWorker.register("/sw.js");
      const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(KEY!) });
      const { ok } = await savePushSubscription(sub.toJSON());
      setState(ok ? "on" : "off");
      if (ok) toast.success("We'll notify you when your order moves");
    } catch {
      setState(Notification.permission === "denied" ? "blocked" : "off");
    }
  };

  const disable = async () => {
    setState("loading");
    const reg = await navigator.serviceWorker.getRegistration();
    const sub = await reg?.pushManager.getSubscription();
    if (sub) {
      await removePushSubscription(sub.endpoint);
      await sub.unsubscribe();
    }
    setState("off");
  };

  if (state === "blocked") {
    return (
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <BellOff className="h-4 w-4" /> Notifications are blocked in your browser settings.
      </p>
    );
  }

  return (
    <button
      type="button"
      onClick={state === "on" ? disable : enable}
      className={
        compact
          ? "inline-flex cursor-pointer items-center gap-2 rounded-full border border-border bg-surface px-4 py-2 text-sm font-semibold hover:border-primary"
          : "flex w-full cursor-pointer items-center justify-between rounded-3xl border border-border bg-surface p-5 text-left hover:border-primary"
      }
    >
      <span className="flex items-center gap-3 font-semibold">
        {state === "on" ? <BellRing className="h-5 w-5 text-primary" /> : <Bell className="h-5 w-5 text-primary" />}
        {state === "on" ? "Order notifications on" : "Get order updates on this device"}
      </span>
      {!compact && <span className="text-sm text-muted-foreground">{state === "on" ? "Turn off" : "Turn on"}</span>}
    </button>
  );
}
