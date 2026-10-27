import { expect, test } from "@playwright/test";
import { latestEmail, login, randomPassword, register, resetRateLimits, uniqueEmail } from "./helpers";

test.describe("accounts", () => {
  test("password reset: link works once, old password stops working", async ({ browser }) => {
    test.skip(Boolean(process.env.RESEND_API_KEY), "needs the dev outbox (RESEND_API_KEY unset)");
    const email = uniqueEmail("reset");
    const oldPassword = randomPassword();
    const newPassword = randomPassword();

    await register(await (await browser.newContext()).newPage(), { email, password: oldPassword });

    const page = await (await browser.newContext()).newPage();
    await page.goto("/forgot-password");
    await page.getByLabel("Email").fill(email);
    await page.getByRole("button", { name: "Send reset link" }).click();
    await expect(page.getByText(/If an account exists/)).toBeVisible();

    const mail = await latestEmail(email, "Reset your");
    const link = new URL(mail.html.match(/href="([^"]*reset-password[^"]*)"/)![1].replace(/&(amp|#38);/g, "&"));
    await page.goto(link.pathname + link.search);
    await page.getByLabel("New password").fill(newPassword);
    await page.getByRole("button", { name: "Set new password" }).click();
    await page.waitForURL("**/account");

    // Single use
    await page.goto(link.pathname + link.search);
    await page.getByLabel("New password").fill(randomPassword());
    await page.getByRole("button", { name: "Set new password" }).click();
    await expect(page.getByText(/invalid or has expired/)).toBeVisible();

    const fresh = await (await browser.newContext()).newPage();
    await login(fresh, email, oldPassword);
    await expect(fresh.getByText("Incorrect email or password.")).toBeVisible();
  });

  test("unknown emails get the same reset response (no enumeration)", async ({ page }) => {
    await page.goto("/forgot-password");
    await page.getByLabel("Email").fill(uniqueEmail("ghost"));
    await page.getByRole("button", { name: "Send reset link" }).click();
    await expect(page.getByText(/If an account exists/)).toBeVisible();
  });

  test("repeated failed logins are rate limited", async ({ page }) => {
    const email = uniqueEmail("brute");
    let limited = false;
    for (let i = 0; i < 12 && !limited; i++) {
      await login(page, email, `wrong-${i}`);
      await expect(page.getByText(/Incorrect email or password|Too many attempts/)).toBeVisible();
      limited = await page.getByText(/Too many attempts/).isVisible();
    }
    expect(limited).toBe(true);
    // Free the shared localhost IP budget for the specs that follow.
    await resetRateLimits();
  });
});
