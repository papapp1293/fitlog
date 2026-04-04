import { test, expect } from "@playwright/test";

test.describe("Profile", () => {
  test("page loads with user info", async ({ page }) => {
    await page.goto("/profile");
    await expect(page.getByText("Profile")).toBeVisible();
    await expect(page.getByText(/sign out/i)).toBeVisible();
  });

  test("log and delete bodyweight entry", async ({ page }) => {
    await page.goto("/profile");

    // Wait for bodyweight section
    await expect(page.getByText("Bodyweight")).toBeVisible({ timeout: 5000 });

    // Log weight
    const input = page.getByPlaceholder(/weight/i);
    await input.fill("175.5");
    await page.getByRole("button", { name: /log/i }).click();

    // Verify entry appears
    await expect(page.getByText("175.5 lbs")).toBeVisible({ timeout: 5000 });

    // Delete entry
    const entry = page.locator("div", { hasText: "175.5 lbs" }).first();
    await entry.getByRole("button").click();
    await expect(page.getByText("175.5 lbs")).not.toBeVisible({ timeout: 5000 });
  });
});
