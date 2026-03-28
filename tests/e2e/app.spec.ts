import { expect, test } from "@playwright/test";

test("loads the BillPilot shell and switches flows", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText(/BillPilot AI/i)).toBeVisible();
  await expect(page.getByRole("tab", { name: /plan care/i })).toBeVisible();
  await expect(page.getByRole("heading", { name: /find treatment costs/i })).toBeVisible();
  await page.getByRole("tab", { name: /review bill/i }).click();
  await expect(page.getByRole("heading", { name: /review an itemized bill/i })).toBeVisible();
});
