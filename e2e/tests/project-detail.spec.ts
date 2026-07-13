import { test, expect } from "@playwright/test";

test("navigates from card to detail page", async ({ page }) => {
  await page.goto("/");
  await page.locator("a[href^='/projects/']").first().click();
  await expect(page).toHaveURL(/\/projects\/weather-app$/);
  await expect(page.locator("h1")).toHaveText("Weather App");
});

test("software project shows live/repo links, art project does not", async ({ page }) => {
  await page.goto("/projects/weather-app");
  await expect(page.getByRole("link", { name: "Live site" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Repository" })).toBeVisible();

  await page.goto("/projects/sunset-study");
  await expect(page.getByRole("link", { name: "Live site" })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Repository" })).toHaveCount(0);
});

test("survives a hard refresh on a client-side route (SPA fallback)", async ({ page }) => {
  await page.goto("/projects/weather-app");
  await expect(page.locator("h1")).toHaveText("Weather App");

  await page.reload();
  await expect(page.locator("h1")).toHaveText("Weather App");
});

test("unknown project id shows a not-found state, not a crash", async ({ page }) => {
  const response = await page.goto("/projects/does-not-exist");
  // SPA fallback always returns 200 with index.html; the 404 is an API-level concern
  // handled client-side by the ProjectDetail component's error state.
  expect(response?.status()).toBe(200);
  await expect(page.getByText(/not found/i)).toBeVisible();
});
