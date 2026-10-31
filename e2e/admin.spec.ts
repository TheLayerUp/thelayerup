import { expect, test } from "@playwright/test";
import { ADMIN, login } from "./helpers";

test.describe("admin", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, ADMIN.email, ADMIN.password, "/admin");
    await page.waitForURL("**/admin");
  });

  test("dashboard shows KPIs and the revenue chart", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
    await expect(page.getByText("Revenue today")).toBeVisible();
    await expect(page.getByText(/Daily revenue · last 14 days/)).toBeVisible();
  });

  test("product form rejects images from unsupported hosts", async ({ page }) => {
    await page.goto("/admin/products/new");
    await page.getByLabel("Name", { exact: true }).fill("Bad Image Product");
    await page.getByLabel("Category").selectOption({ index: 1 });
    await page.getByLabel("Description", { exact: true }).fill("Checks that unsupported image hosts are refused.");
    await page.getByLabel("Price (₹)", { exact: true }).fill("499");
    await page.getByLabel(/Image URLs/).fill("https://evil.example.com/x.png");
    await page.getByRole("button", { name: "Create product" }).click();
    await expect(page.getByText(/Unsupported image link/)).toBeVisible();
  });

  test("coupon list shows seeded coupons", async ({ page }) => {
    await page.goto("/admin/coupons");
    await expect(page.getByRole("cell", { name: "WELCOME10" })).toBeVisible();
    await expect(page.getByRole("cell", { name: "FLAT150" })).toBeVisible();
  });
});
