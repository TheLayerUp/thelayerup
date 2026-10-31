import "server-only";
import webpush from "web-push";
import { prisma } from "@/server/db";

const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const privateKey = process.env.VAPID_PRIVATE_KEY;

export const pushEnabled = Boolean(publicKey && privateKey);

if (pushEnabled) {
  webpush.setVapidDetails(process.env.VAPID_SUBJECT || "mailto:hello@thelayerup.in", publicKey!, privateKey!);
}

/** Sends a notification to every device the user enabled. Never throws. */
export async function sendPush(userId: string, payload: { title: string; body: string; url: string }) {
  if (!pushEnabled) return;
  const subs = await prisma.pushSubscription.findMany({ where: { userId } });
  await Promise.all(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          JSON.stringify(payload),
          { TTL: 60 * 60 * 24 }
        );
      } catch (err) {
        const code = (err as { statusCode?: number }).statusCode;
        // The browser unsubscribed or the subscription expired.
        if (code === 404 || code === 410) await prisma.pushSubscription.delete({ where: { id: s.id } }).catch(() => {});
        else console.error("[push]", err);
      }
    })
  );
}
