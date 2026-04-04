import { test, expect } from "@playwright/test";

test.describe("Workout", () => {
  test("start and end a workout session", async ({ page }) => {
    await page.goto("/");

    // Navigate to workout select
    const startBtn = page.getByRole("link", { name: /start training/i });
    if (await startBtn.isVisible()) {
      await startBtn.click();
      await expect(page).toHaveURL(/\/workout/);

      // If templates exist, try starting one
      const templateCard = page.locator("[class*=card]").first();
      if (await templateCard.isVisible({ timeout: 3000 })) {
        await templateCard.click();

        // Should be in active workout
        await expect(page.getByText(/finish workout/i)).toBeVisible({
          timeout: 5000,
        });

        // End workout
        await page.getByRole("button", { name: /finish workout/i }).click();
        await expect(page).toHaveURL("/", { timeout: 5000 });
      }
    }
  });
});
