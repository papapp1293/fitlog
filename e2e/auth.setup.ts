import { test as setup, expect } from "@playwright/test";

const TEST_EMAIL = process.env.TEST_EMAIL ?? "test@example.com";
const TEST_PASSWORD = process.env.TEST_PASSWORD ?? "password123";

setup("authenticate", async ({ page }) => {
  await page.goto("/login");
  await page.getByPlaceholder("Email").fill(TEST_EMAIL);
  await page.getByPlaceholder("Password").fill(TEST_PASSWORD);
  await page.getByRole("button", { name: /sign in/i }).click();

  // Wait for redirect to home
  await expect(page).toHaveURL("/", { timeout: 10000 });

  // Save auth state
  await page.context().storageState({ path: "e2e/.auth/user.json" });
});
