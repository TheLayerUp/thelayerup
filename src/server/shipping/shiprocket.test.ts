import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Contract tests for the Shiprocket integration: fetch is replaced with a fake
// Shiprocket that records requests and returns responses shaped like the
// documented API. A live run with a real account is still needed before launch.

type Call = { url: string; method: string; body: unknown; auth: string | null };

function fakeShiprocket(routes: Record<string, (body: unknown) => { status?: number; json: unknown }>) {
  const calls: Call[] = [];
  const fetchMock = vi.fn(async (input: string | URL, init: RequestInit = {}) => {
    const url = String(input);
    const body = init.body ? JSON.parse(String(init.body)) : undefined;
    const headers = new Headers(init.headers);
    calls.push({ url, method: init.method ?? "GET", body, auth: headers.get("Authorization") });
    const path = url.replace("https://apiv2.shiprocket.in/v1/external", "").split("?")[0];
    const route = routes[path];
    if (!route) return new Response("not found", { status: 404 });
    const { status = 200, json } = route(body);
    return new Response(JSON.stringify(json), { status, headers: { "Content-Type": "application/json" } });
  });
  vi.stubGlobal("fetch", fetchMock);
  return calls;
}

const login = () => ({ json: { token: "test-token" } });

const order = {
  orderNumber: "TLU-ABC123",
  createdAt: new Date("2026-10-31T10:15:00Z"),
  email: "buyer@example.com",
  paymentMethod: "COD",
  total: 1098,
  discount: 0,
  shipName: "Riya Sharma",
  shipPhone: "9840123456",
  shipLine1: "12 Test Street",
  shipLine2: "Anna Nagar",
  shipCity: "Chennai",
  shipState: "Tamil Nadu",
  shipPincode: "600040",
  items: [{ productName: "Moon Lamp Mini", productId: "prod_1", quantity: 1, priceAtPurchase: 999 }],
};

async function load() {
  vi.resetModules(); // fresh module = fresh token cache
  return import("./shiprocket");
}

beforeEach(() => {
  vi.stubEnv("SHIPROCKET_EMAIL", "ops@thelayerup.in");
  vi.stubEnv("SHIPROCKET_PASSWORD", "secret");
  vi.stubEnv("SHIPROCKET_PICKUP_PINCODE", "600001");
  vi.stubEnv("SHIPROCKET_PICKUP_LOCATION", "Studio");
  vi.stubEnv("SHIPROCKET_BOX_CM", "22x16x12");
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("shiprocketEnabled / estimateDelivery", () => {
  it("is off without credentials and never calls the API", async () => {
    vi.stubEnv("SHIPROCKET_EMAIL", "");
    const calls = fakeShiprocket({});
    const sr = await load();
    expect(sr.shiprocketEnabled()).toBe(false);
    expect(await sr.estimateDelivery("110001")).toBeNull();
    expect(calls).toHaveLength(0);
  });

  it("logs in, queries serviceability from the pickup pincode, and returns the fastest courier", async () => {
    const calls = fakeShiprocket({
      "/auth/login": login,
      "/courier/serviceability/": () => ({
        json: {
          data: {
            available_courier_companies: [
              { courier_name: "Delhivery", estimated_delivery_days: "5" },
              { courier_name: "Xpressbees", estimated_delivery_days: "3" },
            ],
          },
        },
      }),
    });
    const sr = await load();
    expect(await sr.estimateDelivery("110001", 0.5)).toEqual({ serviceable: true, transitDays: 3 });

    expect(calls[0]).toMatchObject({ method: "POST", body: { email: "ops@thelayerup.in", password: "secret" } });
    const q = new URL(calls[1].url).searchParams;
    expect(q.get("pickup_postcode")).toBe("600001");
    expect(q.get("delivery_postcode")).toBe("110001");
    expect(q.get("weight")).toBe("0.5");
    expect(calls[1].auth).toBe("Bearer test-token");
  });

  it("reports unserviceable pincodes, and falls back (null) when Shiprocket errors", async () => {
    fakeShiprocket({
      "/auth/login": login,
      "/courier/serviceability/": () => ({ json: { data: { available_courier_companies: [] } } }),
    });
    expect(await (await load()).estimateDelivery("999999")).toEqual({ serviceable: false });

    fakeShiprocket({ "/auth/login": () => ({ status: 401, json: { message: "Invalid credentials" } }) });
    expect(await (await load()).estimateDelivery("110001")).toBeNull();
  });

  it("reuses the login token across calls", async () => {
    const calls = fakeShiprocket({
      "/auth/login": login,
      "/courier/serviceability/": () => ({ json: { data: { available_courier_companies: [] } } }),
    });
    const sr = await load();
    await sr.estimateDelivery("110001");
    await sr.estimateDelivery("560001");
    expect(calls.filter((c) => c.url.endsWith("/auth/login"))).toHaveLength(1);
  });
});

describe("shipOrder", () => {
  it("creates the order with the right payload, then assigns an AWB", async () => {
    const calls = fakeShiprocket({
      "/auth/login": login,
      "/orders/create/adhoc": () => ({ json: { order_id: 4567, shipment_id: 8910, status: "NEW" } }),
      "/courier/assign/awb": () => ({
        json: {
          awb_assign_status: 1,
          response: { data: { awb_code: "SR123456789", courier_name: "Delhivery Surface" } },
        },
      }),
    });
    const sr = await load();
    const r = await sr.shipOrder(order, 330);

    expect(r).toEqual({ shipmentId: 8910, awbCode: "SR123456789", courierName: "Delhivery Surface" });

    const create = calls.find((c) => c.url.endsWith("/orders/create/adhoc"))!;
    expect(create.method).toBe("POST");
    expect(create.body).toMatchObject({
      order_id: "TLU-ABC123",
      order_date: "2026-10-31 15:45", // 10:15 UTC in India time
      pickup_location: "Studio",
      billing_customer_name: "Riya Sharma",
      billing_address: "12 Test Street, Anna Nagar",
      billing_city: "Chennai",
      billing_state: "Tamil Nadu",
      billing_pincode: "600040",
      billing_phone: "9840123456",
      billing_email: "buyer@example.com",
      shipping_is_billing: true,
      order_items: [{ name: "Moon Lamp Mini", sku: "prod_1", units: 1, selling_price: 999 }],
      payment_method: "COD",
      sub_total: 1098,
      weight: 0.33,
      length: 22,
      breadth: 16,
      height: 12,
    });

    const assign = calls.find((c) => c.url.endsWith("/courier/assign/awb"))!;
    expect(assign.body).toEqual({ shipment_id: 8910 });
  });

  it("sends prepaid orders as Prepaid and enforces a minimum weight", async () => {
    const calls = fakeShiprocket({
      "/auth/login": login,
      "/orders/create/adhoc": () => ({ json: { shipment_id: 1 } }),
      "/courier/assign/awb": () => ({ json: { awb_assign_status: 0, response: { data: {} } } }),
    });
    const r = await (await load()).shipOrder({ ...order, paymentMethod: "RAZORPAY" }, 20);
    const create = calls.find((c) => c.url.endsWith("/orders/create/adhoc"))!;
    expect(create.body).toMatchObject({ payment_method: "Prepaid", weight: 0.1 });
    // No courier assigned yet: the admin is told to pick one in the Shiprocket panel.
    expect(r).toEqual({ shipmentId: 1, awbCode: null, courierName: null });
  });

  it("surfaces Shiprocket's error message", async () => {
    fakeShiprocket({
      "/auth/login": login,
      "/orders/create/adhoc": () => ({ status: 422, json: { message: "Pickup location not found" } }),
    });
    await expect((await load()).shipOrder(order, 300)).rejects.toThrow(/Pickup location not found/);
  });
});

describe("trackingEvents", () => {
  it("maps courier scans, newest first as Shiprocket returns them", async () => {
    const calls = fakeShiprocket({
      "/auth/login": login,
      "/courier/track/awb/SR123456789": () => ({
        json: {
          tracking_data: {
            shipment_track_activities: [
              { date: "2026-11-02 14:05:00", activity: "Out for delivery", location: "Chennai_Hub" },
              { date: "2026-11-01 09:30:00", activity: "Picked up", location: "Chennai" },
            ],
          },
        },
      }),
    });
    expect(await (await load()).trackingEvents("SR123456789")).toEqual([
      { at: "2026-11-02 14:05:00", status: "Out for delivery", location: "Chennai_Hub" },
      { at: "2026-11-01 09:30:00", status: "Picked up", location: "Chennai" },
    ]);
    expect(calls[1].method).toBe("GET");
  });

  it("returns null (and the track page simply hides the timeline) when not configured", async () => {
    vi.stubEnv("SHIPROCKET_PASSWORD", "");
    fakeShiprocket({});
    expect(await (await load()).trackingEvents("SR1")).toBeNull();
  });
});
