import { expect, test } from "@playwright/test";
import { canvasBox, gotoReady, snapshot } from "./helpers";

test.use({ reducedMotion: "reduce" });

test("동작 줄이기 설정이면 자동 회전을 멈추고 안내하며, 드래그는 그대로 된다", async ({ page }) => {
  await gotoReady(page);
  await expect(page.getByText("동작 줄이기")).toBeVisible();

  const before = await snapshot(page);
  await page.waitForTimeout(1000);
  expect((await snapshot(page)).y).toBe(before.y); // 자동 회전 없음

  const { cx, cy } = await canvasBox(page);
  await page.mouse.move(cx, cy);
  await page.mouse.down();
  await page.mouse.move(cx + 100, cy, { steps: 5 });
  const during = await snapshot(page);
  await page.mouse.up();
  expect(during.y).toBeCloseTo(before.y + 1, 3);
});
