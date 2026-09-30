import { expect, test } from "@playwright/test";
import { canvasBox, gotoReady, snapshot } from "./helpers";

test.beforeEach(async ({ page }) => {
  await gotoReady(page);
});

test("세트를 바꿨다가 캐시된 세트로 돌아와도 로딩 오버레이가 사라진다", async ({ page }) => {
  const nav = page.locator(".cylinder_nav_btn");
  const overlay = page.locator(".cylinder_loading_overlay");

  await nav.nth(1).click();
  await page.waitForTimeout(1000); // 오버레이가 나타날 시간을 준 뒤, 사라지는지 본다 (남아 있으면 멈춘 것)
  await expect(overlay).toHaveCount(0);

  await nav.nth(0).click(); // set-a 텍스처는 useLoader 캐시에 있어 곧바로 준비된다
  await page.waitForTimeout(1000);
  await expect(overlay).toHaveCount(0);
});

test("기울인 상태에서 세트를 바꾸면 새 세트는 기울기 0에서 시작한다", async ({ page }) => {
  const { cx, cy } = await canvasBox(page);
  await page.mouse.move(cx, cy);
  await page.mouse.down();
  await page.mouse.move(cx, cy + 80, { steps: 5 });
  await page.mouse.up();
  expect((await snapshot(page)).x).toBeCloseTo(0.8, 3);

  await page.locator(".cylinder_nav_btn").nth(1).click();
  await expect.poll(() => page.evaluate(() => window.__cylinder?.inspect.current?.rotation.x)).toBe(0);
});
