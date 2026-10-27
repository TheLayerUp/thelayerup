import { expect, test } from "@playwright/test";
import { ADMIN, fillAddress, login, pay, randomPassword, register, uniqueEmail } from "./helpers";

/**
 * The money path, end to end: a customer buys with a coupon, the admin ships
 * and delivers, the customer tracks it and leaves a verified review.
 */
test("purchase → fulfil → track → review", async ({ browser }) => {
  const email = uniqueEmail("buyer");
  const password = randomPassword();

  // Customer buys two items with a coupon.
  const customer = await (await browser.newContext()).newPage();
  await register(customer, { email, password, next: "/products/custom-name-keychain" });
  await customer.getByRole("button", { name: "Add to cart" }).click();
  await customer.goto("/products/ripple-bud-vase");
  await customer.getByRole("button", { name: "Buy now" }).click();

  await customer.waitForURL("**/checkout");
  await fillAddress(customer);
  await customer.getByPlaceholder("Coupon code").fill("WELCOME10");
  await customer.getByRole("button", { name: "Apply" }).click();
  await expect(customer.getByText("WELCOME10 applied")).toBeVisible();

  // ₹299 + ₹549 = ₹848 → 10% = ₹84 off → ₹764 + ₹79 shipping (below ₹999) = ₹843
  const summary = customer.locator("aside dl");
  await expect(summary).toContainText("₹848");
  await expect(summary).toContainText("−₹84");
  await expect(summary).toContainText("₹79");
  await expect(summary).toContainText("₹843");

  const orderNumber = await pay(customer);
  await expect(customer.getByText(/Your order is confirmed/)).toBeVisible();
  expect(await customer.evaluate(() => JSON.parse(localStorage.getItem("tlu-cart") ?? "{}").state?.items?.length)).toBe(
    0
  );

  await customer.goto("/account");
  await expect(customer.getByText(orderNumber)).toBeVisible();

  // Admin ships, then delivers.
  const admin = await (await browser.newContext()).newPage();
  await login(admin, ADMIN.email, ADMIN.password, "/admin/orders");
  await admin.waitForURL("**/admin/orders");
  await admin.getByRole("link", { name: orderNumber }).click();
  await admin.getByLabel("Status").selectOption("SHIPPED");
  await admin.getByLabel("Courier").fill("Delhivery");
  await admin.getByLabel("AWB / tracking number").fill("AWB-E2E-123");
  await admin.getByRole("button", { name: "Save" }).click();
  await expect(admin.getByText(/Order marked shipped/)).toBeVisible();
  await admin.getByLabel("Status").selectOption("DELIVERED");
  await admin.getByRole("button", { name: "Save" }).click();
  await expect(admin.getByText(/Order marked delivered/)).toBeVisible();

  // Guest tracking shows progress but not the address.
  const guest = await (await browser.newContext()).newPage();
  await guest.goto(`/track?order=${orderNumber}&email=${encodeURIComponent(email)}`);
  await expect(guest.getByText("AWB-E2E-123")).toBeVisible();
  await expect(guest.getByText("Anna Nagar")).toHaveCount(0);

  // Customer leaves a verified review.
  await customer.goto(`/account/orders/${orderNumber}`);
  await customer.getByRole("button", { name: "Write a review" }).first().click();
  await customer.getByRole("radio", { name: "5 stars" }).click();
  await customer.getByPlaceholder(/What did you like/).fill("Crisp print, lovely colour — exactly as pictured.");
  await customer.getByRole("button", { name: "Submit review" }).click();
  await expect(customer.getByText("Thanks for your review!")).toBeVisible();
});

test("a customer cannot open the admin area", async ({ page }) => {
  await register(page, { email: uniqueEmail("nosy"), password: randomPassword() });
  await page.goto("/admin");
  await expect(page.getByText("This page fell off the print bed.")).toBeVisible();
});
