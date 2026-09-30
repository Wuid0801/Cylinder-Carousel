import { expect, test, type Page } from "@playwright/test";
import { canvasBox, gotoReady } from "./helpers";

// 수정 전 방식(물체 자동 회전 + OrbitControls 카메라 궤도 드래그)으로 바꾸고 준비될 때까지 기다린다
async function gotoOrbitMode(page: Page) {
  await gotoReady(page);
  await page.locator('input[name="control-mode"][value="orbit"]').check();
  await expect(page.locator(".cylinder_loading_overlay")).toHaveCount(0, { timeout: 15_000 });
  await expect.poll(() => page.evaluate(() => window.__cylinder?.inspect.current?.camera != null)).toBe(true);
}

function orbitState(page: Page) {
  return page.evaluate(() => {
    const inspect = window.__cylinder!.inspect.current!;
    return { azimuth: inspect.camera!.azimuth, polar: inspect.camera!.polar, rotationX: inspect.rotation.x, isDragging: inspect.drag.isDragging };
  });
}

test("수정 전 방식: 드래그하면 물체가 아니라 카메라가 궤도를 돈다", async ({ page }) => {
  await gotoOrbitMode(page);
  const { cx, cy } = await canvasBox(page);
  const before = await orbitState(page);

  await page.mouse.move(cx, cy);
  await page.mouse.down();
  await page.mouse.move(cx + 150, cy - 80, { steps: 10 });
  const during = await orbitState(page);
  await page.mouse.up();

  expect(during.azimuth).not.toBeCloseTo(before.azimuth, 2); // 카메라가 옆으로 돌았다
  expect(during.polar).not.toBeCloseTo(before.polar, 2); // 카메라가 위아래로도 움직였다
  expect(during.rotationX).toBe(0); // 물체는 기울지 않는다
  expect(during.isDragging).toBe(false); // 물체 드래그는 없다
});

test("수정 전 방식: 패널이 없는 빈 공간에서도 드래그된다 (캔버스 전체에서 이벤트를 받음)", async ({ page }) => {
  await gotoOrbitMode(page);
  const box = await canvasBox(page);
  const y = Math.round(box.y + box.height * 0.1);
  const before = await orbitState(page);

  await page.mouse.move(box.cx, y);
  await page.mouse.down();
  await page.mouse.move(box.cx + 150, y, { steps: 10 });
  await page.mouse.up();

  expect((await orbitState(page)).azimuth).not.toBeCloseTo(before.azimuth, 2);
});

test("수정 전 방식: 손을 뗀 뒤에도 카메라가 잠시 더 돈다 (감쇠)", async ({ page }) => {
  await gotoOrbitMode(page);
  const { cx, cy } = await canvasBox(page);

  await page.mouse.move(cx, cy);
  await page.mouse.down();
  await page.mouse.move(cx + 150, cy, { steps: 5 });
  await page.mouse.up();
  const released = await orbitState(page);
  await page.waitForTimeout(300);

  expect((await orbitState(page)).azimuth).not.toBeCloseTo(released.azimuth, 3);
});
