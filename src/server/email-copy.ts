import "server-only";
import type { OrderStatus, ReturnStatus } from "@prisma/client";
import { site } from "@/config/site";
import { formatPrice } from "@/lib/utils";

// Customer email wording in English and Hindi. The language comes from the
// order (chosen at checkout) or the account (chosen at sign-up).

export type Locale = "en" | "hi";
export const asLocale = (v: string | null | undefined): Locale => (v === "hi" ? "hi" : "en");

const copy = {
  en: {
    orderSubject: (n: string) => `Order confirmed — ${n}`,
    orderTitle: "Order confirmed 🎉",
    orderThanks: "Thanks for your order! We're getting your prints ready.",
    orderCod: (total: number) =>
      `<strong>Cash on delivery:</strong> please keep ${formatPrice(total)} ready. We'll message you on WhatsApp to confirm before we print.`,
    order: "Order",
    shipping: "Shipping",
    free: "Free",
    discount: "Discount",
    codFee: "Cash on delivery fee",
    total: "Total",
    trackYour: "Track your order",
    trackOrder: (n: string) => `Track order ${n}`,
    status: {
      PROCESSING: [
        "Your order is being printed",
        "Good news — your order is on the print bed. We'll let you know as soon as it ships.",
      ],
      SHIPPED: ["Your order has shipped", "Your order is on its way! Use the tracking link below to follow it."],
      DELIVERED: [
        "Your order was delivered",
        "Your order has been delivered. We hope you love it — reply to this email if anything's not right.",
      ],
      CANCELLED: [
        "Your order was cancelled",
        "Your order has been cancelled. If you were charged, a refund is on its way to your original payment method.",
      ],
    } as Partial<Record<OrderStatus, [string, string]>>,
    resetSubject: `Reset your ${site.name} password`,
    resetTitle: "Reset your password",
    resetBody: "We received a request to reset your password. This link works for 1 hour.",
    resetCta: "Choose a new password",
    resetIgnore: "Didn't ask for this? You can ignore this email — your password won't change.",
    welcomeSubject: (pct: number) => `Your ${pct}% welcome discount`,
    welcomeText: (pct: number, max: number, code: string) =>
      `Thanks for joining ${site.name}! Use this code at checkout for ${pct}% off your first order (up to ${formatPrice(max)}):\n\n${code}\n\nValid for 60 days.`,
    startShopping: "Start shopping",
    rewardSubject: (amount: number) => `You earned ${formatPrice(amount)} off 🎉`,
    rewardText: (friend: string, amount: number, min: number, code: string) =>
      `${friend} just placed their first order with your referral code. Here's ${formatPrice(amount)} off your next order (min. ${formatPrice(min)}):\n\n${code}\n\nValid for 90 days.`,
    yourFriend: "Your friend",
    shopNow: "Shop now",
    returnSubject: (n: string) => `Update on your request for ${n}`,
    returnStatus: {
      APPROVED: "We've approved your request. We'll reprint the item or refund you — details below.",
      REJECTED:
        "We've reviewed your request and can't approve it this time. See the note below, and reply if you'd like to discuss.",
      REFUNDED:
        "Your refund has been issued to your original payment method. It usually shows up within 5–7 business days.",
    } as Partial<Record<ReturnStatus, string>>,
    viewOrder: "View order",
  },
  hi: {
    orderSubject: (n: string) => `ऑर्डर कन्फ़र्म हुआ — ${n}`,
    orderTitle: "ऑर्डर कन्फ़र्म हुआ 🎉",
    orderThanks: "आपके ऑर्डर के लिए धन्यवाद! हम आपके प्रिंट तैयार कर रहे हैं।",
    orderCod: (total: number) =>
      `<strong>कैश ऑन डिलीवरी:</strong> कृपया ${formatPrice(total)} तैयार रखें। प्रिंट शुरू करने से पहले हम WhatsApp पर कन्फ़र्म करेंगे।`,
    order: "ऑर्डर",
    shipping: "शिपिंग",
    free: "मुफ़्त",
    discount: "डिस्काउंट",
    codFee: "कैश ऑन डिलीवरी शुल्क",
    total: "कुल",
    trackYour: "अपना ऑर्डर ट्रैक करें",
    trackOrder: (n: string) => `ऑर्डर ${n} ट्रैक करें`,
    status: {
      PROCESSING: [
        "आपका ऑर्डर प्रिंट हो रहा है",
        "अच्छी ख़बर — आपका ऑर्डर प्रिंटर पर है। शिप होते ही हम आपको बताएँगे।",
      ],
      SHIPPED: ["आपका ऑर्डर शिप हो गया", "आपका ऑर्डर रास्ते में है! नीचे दिए लिंक से इसे ट्रैक करें।"],
      DELIVERED: [
        "आपका ऑर्डर डिलीवर हो गया",
        "आपका ऑर्डर डिलीवर हो गया है। उम्मीद है आपको पसंद आएगा — कुछ ठीक न हो तो इस ईमेल का जवाब दें।",
      ],
      CANCELLED: [
        "आपका ऑर्डर कैंसल हो गया",
        "आपका ऑर्डर कैंसल कर दिया गया है। अगर भुगतान हुआ था, तो रिफ़ंड आपके मूल भुगतान माध्यम पर भेजा जा रहा है।",
      ],
    } as Partial<Record<OrderStatus, [string, string]>>,
    resetSubject: `अपना ${site.name} पासवर्ड रीसेट करें`,
    resetTitle: "अपना पासवर्ड रीसेट करें",
    resetBody: "हमें आपका पासवर्ड रीसेट करने का अनुरोध मिला है। यह लिंक 1 घंटे तक काम करेगा।",
    resetCta: "नया पासवर्ड चुनें",
    resetIgnore: "आपने यह अनुरोध नहीं किया? इस ईमेल को अनदेखा करें — आपका पासवर्ड नहीं बदलेगा।",
    welcomeSubject: (pct: number) => `आपका ${pct}% वेलकम डिस्काउंट`,
    welcomeText: (pct: number, max: number, code: string) =>
      `${site.name} से जुड़ने के लिए धन्यवाद! पहले ऑर्डर पर ${pct}% छूट (अधिकतम ${formatPrice(max)}) के लिए चेकआउट पर यह कोड लगाएँ:\n\n${code}\n\n60 दिनों तक मान्य।`,
    startShopping: "शॉपिंग शुरू करें",
    rewardSubject: (amount: number) => `आपको ${formatPrice(amount)} की छूट मिली 🎉`,
    rewardText: (friend: string, amount: number, min: number, code: string) =>
      `${friend} ने आपके रेफ़रल कोड से अपना पहला ऑर्डर किया है। आपके अगले ऑर्डर पर ${formatPrice(amount)} की छूट (न्यूनतम ${formatPrice(min)}):\n\n${code}\n\n90 दिनों तक मान्य।`,
    yourFriend: "आपके दोस्त",
    shopNow: "अभी ख़रीदें",
    returnSubject: (n: string) => `${n} के अनुरोध पर अपडेट`,
    returnStatus: {
      APPROVED: "हमने आपका अनुरोध मंज़ूर कर लिया है। हम आइटम दोबारा प्रिंट करेंगे या रिफ़ंड करेंगे — विवरण नीचे है।",
      REJECTED: "हमने आपका अनुरोध देखा, पर इस बार इसे मंज़ूर नहीं कर सकते। नीचे नोट देखें, और बात करनी हो तो जवाब दें।",
      REFUNDED: "आपका रिफ़ंड मूल भुगतान माध्यम पर भेज दिया गया है। आमतौर पर यह 5–7 कामकाजी दिनों में दिखता है।",
    } as Partial<Record<ReturnStatus, string>>,
    viewOrder: "ऑर्डर देखें",
  },
} satisfies Record<Locale, unknown>;

export function emailCopy(locale: string | null | undefined) {
  return copy[asLocale(locale)];
}
