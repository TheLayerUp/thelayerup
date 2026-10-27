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
