import { test, expect } from "@playwright/test";

test.describe("Exercises", () => {
  test("page loads and shows exercise list", async ({ page }) => {
    await page.goto("/exercises");
    await expect(page.getByText("Exercises")).toBeVisible();
  });

  test("create and delete an exercise", async ({ page }) => {
    await page.goto("/exercises");

    // Open create dialog
    await page.getByRole("button", { name: /new exercise/i }).click();
    await expect(page.getByText("Create Exercise")).toBeVisible();

    // Fill form
    const name = `Test Exercise ${Date.now()}`;
    await page.getByPlaceholder("e.g. Bench Press").fill(name);
    await page.getByRole("button", { name: /create exercise/i }).click();

    // Verify created
    await expect(page.getByText(name)).toBeVisible({ timeout: 5000 });

    // Search
    await page.getByPlaceholder("Search exercises...").fill(name);
    await expect(page.getByText(name)).toBeVisible();

    // Delete
    const row = page.locator("div", { hasText: name }).first();
    await row.getByRole("button").filter({ has: page.locator("svg") }).last().click();
    await expect(page.getByText(name)).not.toBeVisible({ timeout: 5000 });
  });

  test("navigate to exercise history", async ({ page }) => {
    await page.goto("/exercises");

    // If exercises exist, click chart icon on first one
    const chartButton = page.locator('a[href*="/history"]').first();
    if (await chartButton.isVisible()) {
      await chartButton.click();
      await expect(page.getByText(/history|no history/i)).toBeVisible({
        timeout: 5000,
      });
    }
  });
});
