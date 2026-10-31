import "server-only";

const SHIPROCKET_BASE_URL = "https://apiv2.shiprocket.in/v1/external";

let cachedToken: string | null = null;
let tokenExpiry: number = 0;

async function getToken(): Promise<string> {
  if (cachedToken && Date.now() < tokenExpiry) {
    return cachedToken;
  }

  const response = await fetch(`${SHIPROCKET_BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: process.env.SHIPROCKET_EMAIL,
      password: process.env.SHIPROCKET_PASSWORD,
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to authenticate with Shiprocket");
  }

  const data = await response.json();
  cachedToken = data.token;
  tokenExpiry = Date.now() + 9 * 24 * 60 * 60 * 1000; // 9 days
  return cachedToken!;
}

async function shiprocketFetch(endpoint: string, options: RequestInit = {}) {
  const token = await getToken();
  const response = await fetch(`${SHIPROCKET_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Shiprocket API error: ${error}`);
  }

  return response.json();
}

export async function checkServiceability(
  pickupPincode: string,
  deliveryPincode: string,
  weight: number,
  cod: boolean = false
) {
  return shiprocketFetch(
    `/courier/serviceability/?pickup_postcode=${pickupPincode}&delivery_postcode=${deliveryPincode}&weight=${weight}&cod=${cod ? 1 : 0}`
  );
}

export async function createShipment(orderData: {
  orderId: string;
  orderDate: string;
  pickupLocation: string;
  billingName: string;
  billingAddress: string;
  billingCity: string;
  billingState: string;
  billingPincode: string;
  billingPhone: string;
  billingEmail: string;
  shippingIsBilling: boolean;
  orderItems: Array<{
    name: string;
    sku: string;
    units: number;
    sellingPrice: number;
  }>;
  paymentMethod: "Prepaid" | "COD";
  subTotal: number;
  weight: number;
  length: number;
  breadth: number;
  height: number;
}) {
  return shiprocketFetch("/orders/create/adhoc", {
    method: "POST",
    body: JSON.stringify({
      order_id: orderData.orderId,
      order_date: orderData.orderDate,
      pickup_location: orderData.pickupLocation,
      billing_customer_name: orderData.billingName,
      billing_address: orderData.billingAddress,
      billing_city: orderData.billingCity,
      billing_state: orderData.billingState,
      billing_pincode: orderData.billingPincode,
      billing_phone: orderData.billingPhone,
      billing_email: orderData.billingEmail,
      shipping_is_billing: orderData.shippingIsBilling,
      order_items: orderData.orderItems.map((item) => ({
        name: item.name,
        sku: item.sku,
        units: item.units,
        selling_price: item.sellingPrice,
      })),
      payment_method: orderData.paymentMethod,
      sub_total: orderData.subTotal,
      weight: orderData.weight,
      length: orderData.length,
      breadth: orderData.breadth,
      height: orderData.height,
    }),
  });
}

export async function trackShipment(awbCode: string) {
  return shiprocketFetch(`/courier/track/awb/${awbCode}`);
}

export async function generateLabel(shipmentId: number) {
  return shiprocketFetch("/courier/generate/label", {
    method: "POST",
    body: JSON.stringify({ shipment_id: [shipmentId] }),
  });
}

/** True once the Shiprocket account and pickup pincode are configured. */
export function shiprocketEnabled() {
  return Boolean(
    process.env.SHIPROCKET_EMAIL && process.env.SHIPROCKET_PASSWORD && process.env.SHIPROCKET_PICKUP_PINCODE
  );
}

type Courier = { courier_name: string; estimated_delivery_days?: string | number; etd?: string; rate?: number };

/**
 * Fastest courier ETA to a pincode, or null when Shiprocket isn't configured
 * or can't answer (callers then fall back to the standard promise).
 */
export async function estimateDelivery(pincode: string, weightKg = 0.5) {
  if (!shiprocketEnabled()) return null;
  try {
    const res = await checkServiceability(process.env.SHIPROCKET_PICKUP_PINCODE!, pincode, weightKg);
    const couriers: Courier[] = res?.data?.available_courier_companies ?? [];
    if (couriers.length === 0) return { serviceable: false as const };
    const days = couriers.map((c) => Number(c.estimated_delivery_days)).filter((d) => Number.isFinite(d) && d > 0);
    return { serviceable: true as const, transitDays: days.length ? Math.min(...days) : null };
  } catch (err) {
    console.error("[shiprocket] serviceability", err);
    return null;
  }
}

export async function assignAwb(shipmentId: number) {
  return shiprocketFetch("/courier/assign/awb", {
    method: "POST",
    body: JSON.stringify({ shipment_id: shipmentId }),
  });
}

/** "YYYY-MM-DD HH:mm" in India time, the format Shiprocket expects for order_date. */
function istDateTime(d: Date) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(d)
      .map((x) => [x.type, x.value])
  );
  return `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}`;
}

type ShippableOrder = {
  orderNumber: string;
  createdAt: Date;
  email: string;
  paymentMethod: string;
  total: number;
  discount: number;
  shipName: string;
  shipPhone: string;
  shipLine1: string;
  shipLine2: string | null;
  shipCity: string;
  shipState: string;
  shipPincode: string;
  items: { productName: string; productId: string | null; quantity: number; priceAtPurchase: number }[];
};

/**
 * Creates the Shiprocket order and asks Shiprocket to pick a courier + AWB.
 * Package size defaults to a small box; set SHIPROCKET_BOX_CM (e.g. "20x15x10").
 */
export async function shipOrder(order: ShippableOrder, weightGrams: number) {
  const [length, breadth, height] = (process.env.SHIPROCKET_BOX_CM ?? "20x15x10").split("x").map(Number);
  const created = await createShipment({
    orderId: order.orderNumber,
    orderDate: istDateTime(order.createdAt),
    pickupLocation: process.env.SHIPROCKET_PICKUP_LOCATION || "Primary",
    billingName: order.shipName,
    billingAddress: [order.shipLine1, order.shipLine2].filter(Boolean).join(", "),
    billingCity: order.shipCity,
    billingState: order.shipState,
    billingPincode: order.shipPincode,
    billingPhone: order.shipPhone,
    billingEmail: order.email,
    shippingIsBilling: true,
    orderItems: order.items.map((i, n) => ({
      name: i.productName,
      sku: i.productId ?? `item-${n + 1}`,
      units: i.quantity,
      sellingPrice: i.priceAtPurchase,
    })),
    paymentMethod: order.paymentMethod === "COD" ? "COD" : "Prepaid",
    subTotal: order.total,
    weight: Math.max(0.1, weightGrams / 1000),
    length,
    breadth,
    height,
  });
  const shipmentId: number = created.shipment_id;
  const awb = await assignAwb(shipmentId);
  const data = awb?.response?.data ?? {};
  return {
    shipmentId,
    awbCode: (data.awb_code as string | undefined) ?? null,
    courierName: (data.courier_name as string | undefined) ?? null,
  };
}

export type TrackingEvent = { at: string; status: string; location: string };

/** Courier scan history, newest first, or null if unavailable. */
export async function trackingEvents(awb: string): Promise<TrackingEvent[] | null> {
  if (!shiprocketEnabled()) return null;
  try {
    const res = await trackShipment(awb);
    const acts: { date: string; activity: string; location: string }[] =
      res?.tracking_data?.shipment_track_activities ?? [];
    return acts.map((a) => ({ at: a.date, status: a.activity, location: a.location }));
  } catch (err) {
    console.error("[shiprocket] tracking", err);
    return null;
  }
}
