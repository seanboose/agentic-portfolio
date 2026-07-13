import { test, expect } from "@playwright/test";

test("renders project cards from the API", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("a[href^='/projects/']")).toHaveCount(2);
  await expect(page.locator("h3")).toHaveText(["Weather App", "Sunset Study"]);
});

test("has no console errors on load", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  expect(errors).toEqual([]);
});

test("filter tabs narrow the grid by project type", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: "Software" }).click();
  await expect(page.locator("h3")).toHaveText(["Weather App"]);

  await page.getByRole("button", { name: "Art" }).click();
  await expect(page.locator("h3")).toHaveText(["Sunset Study"]);

  await page.getByRole("button", { name: "All" }).click();
  await expect(page.locator("h3")).toHaveText(["Weather App", "Sunset Study"]);
});
