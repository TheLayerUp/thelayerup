import { expect, test } from "@playwright/test";

test.describe("storefront", () => {
  test("home page shows categories and bestsellers @mobile", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: /level up/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Shop by category" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Bestsellers right now" })).toBeVisible();
  });

  test("catalog filters by category and search", async ({ page }) => {
    await page.goto("/products");
    await page.getByRole("button", { name: "Lamps & Lighting" }).click();
    await expect(page).toHaveURL(/category=lamps/);
    await expect(page.getByText("Moon Lamp Mini")).toBeVisible();
    await expect(page.getByText("Geometric Facet Planter")).toHaveCount(0);

    await page.goto("/products?q=keychain");
    await expect(page.getByText("Custom Name Keychain")).toBeVisible();
  });

  test("product page has price, JSON-LD and add to cart", async ({ page }) => {
    await page.goto("/products/bluma-wave-desk-lamp");
    await expect(page.getByRole("heading", { level: 1, name: "Bluma Wave Desk Lamp" })).toBeVisible();
    const jsonLd = await page.locator('script[type="application/ld+json"]').first().textContent();
    expect(JSON.parse(jsonLd!)).toMatchObject({ "@type": "Product", offers: { priceCurrency: "INR", price: 1499 } });

    await page.getByRole("button", { name: "Increase quantity" }).click();
    await page.getByRole("button", { name: "Add to cart" }).click();
    const drawer = page.getByRole("dialog", { name: "Shopping cart" });
    await expect(drawer).toBeVisible();
    await expect(drawer.getByText("₹2,998")).toBeVisible(); // 2 × ₹1,499
    await expect(drawer.getByText(/unlocked free shipping/i)).toBeVisible();

    await drawer.getByRole("button", { name: "Remove Bluma Wave Desk Lamp" }).click();
    await expect(drawer.getByText("Your cart is empty")).toBeVisible();
  });

  test("unknown product shows the 404 page", async ({ page }) => {
    await page.goto("/products/does-not-exist");
    await expect(page.getByText("This page fell off the print bed.")).toBeVisible();
  });

  test("security headers are set", async ({ request }) => {
    const res = await request.get("/");
    expect(res.headers()["strict-transport-security"]).toContain("max-age=");
    expect(res.headers()["x-frame-options"]).toBe("SAMEORIGIN");
    expect(res.headers()["x-powered-by"]).toBeUndefined();
  });

  test("checkout requires sign-in", async ({ page }) => {
    await page.goto("/checkout");
    await expect(page).toHaveURL(/\/login\?callbackUrl=%2Fcheckout/);
  });
});
