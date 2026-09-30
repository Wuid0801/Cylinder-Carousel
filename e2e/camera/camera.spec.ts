import { expect, test } from "@playwright/test";

test("캐러셀과 카메라 플레이그라운드를 링크로 오간다", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "카메라 플레이그라운드" }).click();
  await expect(page).toHaveURL(/\/camera\/$/);
  await expect(page.getByRole("heading", { name: "Camera Playground" })).toBeVisible();
  await expect(page.locator("canvas")).toHaveCount(1);

  await page.getByRole("link", { name: "캐러셀" }).click();
  await expect(page.locator(".cylinder_canvas canvas")).toHaveCount(1);
});
