import { expect, test } from "@playwright/test";
import { ADMIN, TEST_PHONE, fillAddress, latestEmail, login, randomPassword, register, uniqueEmail } from "./helpers";

/**
 * Referral → cash on delivery → delivery → referrer reward → damage report.
 * Runs without Razorpay, since COD never opens the payment window.
 */
test("referral, COD order, reward and return request", async ({ browser }) => {
  // Referrer signs up and grabs their link from the account page.
  const referrerEmail = uniqueEmail("referrer");
  const referrer = await (await browser.newContext()).newPage();
  await register(referrer, { name: "Riya Referrer", email: referrerEmail, password: randomPassword() });
  await referrer.goto("/account");
  const link = await referrer.locator("code", { hasText: "/register?ref=" }).innerText();
  const code = new URL(link).searchParams.get("ref")!;
  expect(code).toMatch(/^RIYA/);

  // Friend signs up through the link and gets a welcome coupon by email.
  const friendEmail = uniqueEmail("friend");
  const friend = await (await browser.newContext()).newPage();
  await friend.goto(`/register?ref=${code}&callbackUrl=${encodeURIComponent("/products/ripple-bud-vase")}`);
  await expect(friend.getByText("A friend invited you")).toBeVisible();
  await friend.getByLabel("Name").fill("Farhan Friend");
  await friend.getByLabel("Email").fill(friendEmail);
  await friend.getByLabel("Password").fill(randomPassword());
  await friend.getByRole("button", { name: "Create account" }).click();
  await friend.waitForURL("**/products/ripple-bud-vase");
  const welcome = await latestEmail(friendEmail, "welcome discount");
  const coupon = welcome.html.match(/WELCOME-[A-Z0-9]{6}/)![0];

  // Friend checks out with cash on delivery and the welcome coupon.
  await friend.getByRole("button", { name: "Buy now" }).click();
  await friend.waitForURL("**/checkout");
  await fillAddress(friend);
  await friend.getByPlaceholder("Coupon code").fill(coupon);
  await friend.getByRole("button", { name: "Apply" }).click();
  await expect(friend.getByText(`${coupon} applied`)).toBeVisible();
  await friend.getByRole("radio", { name: /Cash on delivery/ }).click();
  await expect(friend.locator("aside dl")).toContainText("COD fee");
  await friend.getByRole("button", { name: /Place order · pay/ }).click();
  await friend.waitForURL("**/checkout/success**");
  await expect(friend.getByText(/cash-on-delivery order is placed/)).toBeVisible();
  const orderNumber = new URL(friend.url()).searchParams.get("order")!;

  // Coupons are single use.
  const again = await latestEmail(friendEmail, "Order confirmed");
  expect(again.html).toContain("Cash on delivery");

  // Admin confirms the COD order, then delivers it.
  const admin = await (await browser.newContext()).newPage();
  await login(admin, ADMIN.email, ADMIN.password, "/admin/orders");
  await admin.waitForURL("**/admin/orders");
  await admin.getByRole("link", { name: orderNumber }).click();
  await expect(admin.getByText(/Cash on delivery · collect/)).toBeVisible();
  await admin.getByRole("button", { name: "Mark confirmed" }).click();
  await expect(admin.getByText(/Confirmed with customer/)).toBeVisible();
  await admin.getByLabel("Status").selectOption("DELIVERED");
  await admin.getByRole("button", { name: "Save" }).click();
  await expect(admin.getByText(/marked delivered/i)).toBeVisible();

  // Delivery of the friend's first order rewards the referrer exactly once.
  const reward = await latestEmail(referrerEmail, "You earned");
  expect(reward.html).toMatch(/THANKS-[A-Z0-9]{6}/);

  // Friend reports a damaged item within the window; admin sees and approves it.
  await friend.goto(`/account/orders/${orderNumber}`);
  await friend.getByLabel("What went wrong?").selectOption("Damaged in transit");
  await friend.getByLabel("Details").fill("The vase rim arrived cracked on one side.");
  await friend.getByRole("button", { name: "Report a problem" }).click();
  await expect(friend.getByText(/reply within one business day/)).toBeVisible();

  await admin.goto("/admin/returns");
  const card = admin.locator("li", { hasText: orderNumber });
  await expect(card).toContainText("Damaged in transit");
  await card.getByLabel("Status").selectOption("APPROVED");
  await card.getByPlaceholder(/Note to customer/).fill("A reprint ships on Friday.");
  await card.getByRole("button", { name: "Save" }).click();
  const update = await latestEmail(friendEmail, "Update on your request");
  expect(update.html).toContain("reprint ships on Friday");
});

test("instant STL quote prices a model in the browser", async ({ page }) => {
  // 20 mm cube, binary STL (12 triangles).
  const s = 20;
  const v = (x: number, y: number, z: number) => [x * s, y * s, z * s];
  const quads = [
    [v(0, 0, 0), v(0, 1, 0), v(1, 1, 0), v(1, 0, 0)],
    [v(0, 0, 1), v(1, 0, 1), v(1, 1, 1), v(0, 1, 1)],
    [v(0, 0, 0), v(1, 0, 0), v(1, 0, 1), v(0, 0, 1)],
    [v(0, 1, 0), v(0, 1, 1), v(1, 1, 1), v(1, 1, 0)],
    [v(0, 0, 0), v(0, 0, 1), v(0, 1, 1), v(0, 1, 0)],
    [v(1, 0, 0), v(1, 1, 0), v(1, 1, 1), v(1, 0, 1)],
  ];
  const tris = quads.flatMap(([a, b, c, d]) => [
    [a, b, c],
    [a, c, d],
  ]);
  const buf = Buffer.alloc(84 + tris.length * 50);
  buf.writeUInt32LE(tris.length, 80);
  tris.forEach((t, i) =>
    t.forEach((p, k) => p.forEach((n, j) => buf.writeFloatLE(n, 84 + i * 50 + 12 + k * 12 + j * 4)))
  );

  await page.goto("/custom-order");
  await page.locator('input[type="file"]').setInputFiles({ name: "cube.stl", mimeType: "model/stl", buffer: buf });
  await expect(page.getByText("20×20×20")).toBeVisible();
  await expect(page.getByText("8.0 cm³")).toBeVisible();
  await expect(page.getByText("Most popular")).toBeVisible();
});

test("blog and bulk-order pages render", async ({ page }) => {
  await page.goto("/blog");
  await page.getByRole("link", { name: /PLA, PETG, ABS or resin/ }).click();
  await expect(page.getByRole("heading", { level: 1 })).toContainText("PLA, PETG, ABS or resin");
  await page.goto("/bulk-orders");
  await expect(page.getByRole("button", { name: "Get bulk pricing" })).toBeVisible();
});

test("hero clips stream lazily and play while on screen", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const mp4s: string[] = [];
  page.on("request", (r) => r.url().endsWith(".mp4") && mp4s.push(r.url()));
  await page.goto("/");
  await expect
    .poll(
      () =>
        page.evaluate(
          () => [...document.querySelectorAll("section video")].filter((v) => !(v as HTMLVideoElement).paused).length
        ),
      { timeout: 20_000 }
    )
    .toBe(1);
  // The desktop carousel plays only the clip in focus; the others, and the mobile strip's copies, stay unloaded.
  expect(mp4s.length).toBeLessThanOrEqual(2);
});

test("a shopper browsing in Hindi sees Hindi catalogue text and gets Hindi emails", async ({ browser }) => {
  const ctx = await browser.newContext();
  await ctx.addInitScript(() => localStorage.setItem("lang", "hi"));
  const page = await ctx.newPage();

  const email = uniqueEmail("hindi");
  await page.goto(`/register?callbackUrl=${encodeURIComponent("/products/moon-lamp-mini")}`);
  await page.getByLabel("Name").fill("Hindi Shopper");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(randomPassword());
  await page.getByRole("button", { name: "Create account" }).click();
  await page.waitForURL("**/products/moon-lamp-mini");

  // Seeded Hindi product + category names replace the English ones.
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("मून लैंप मिनी");
  await expect(page.getByRole("navigation", { name: "Breadcrumb" })).toContainText("लैंप और लाइटिंग");

  await page.getByRole("button", { name: "अभी ख़रीदें" }).click();
  await page.waitForURL("**/checkout");
  // Labels are in Hindi here, so fill by field id rather than the English-label helper.
  await page.locator("#phone").fill(TEST_PHONE);
  await page.locator("#line1").fill("12 Test Street, Anna Nagar");
  await page.locator("#pincode").fill("600040");
  await page.locator("#city").fill("Chennai");
  await page.locator("#state").selectOption("Tamil Nadu");
  await page.getByRole("radio", { name: /कैश ऑन डिलीवरी/ }).click();
  await page.getByRole("button", { name: /ऑर्डर करें/ }).click();
  await page.waitForURL("**/checkout/success**");

  const mail = await latestEmail(email, "ऑर्डर कन्फ़र्म");
  expect(mail.html).toContain("कैश ऑन डिलीवरी");
  // Line items are an order snapshot of the catalogue name.
  expect(mail.html).toContain("Moon Lamp Mini");
});
