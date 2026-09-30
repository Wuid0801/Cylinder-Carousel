import { expect, test, type Page } from "@playwright/test";
import { canvasBox, gotoReady, snapshot } from "./helpers";

function configInput(page: Page, key: string) {
  return page.locator(`input[type="number"][name="${key}"]`);
}

async function setConfig(page: Page, key: string, value: number) {
  await configInput(page, key).fill(String(value));
}

test.beforeEach(async ({ page }) => {
  await gotoReady(page);
});

test("드래그 감도를 2배로 올리면 같은 드래그에 2배 회전한다", async ({ page }) => {
  await setConfig(page, "rotateSpeed", 0.02);
  const { cx, cy } = await canvasBox(page);
  await page.mouse.move(cx, cy);
  await page.mouse.down();
  const before = await snapshot(page);
  await page.mouse.move(cx + 120, cy + 10, { steps: 8 });
  const during = await snapshot(page);
  await page.mouse.up();

  expect(during.axis).toBe("y");
  expect(during.y).toBeCloseTo(before.y + 2.4, 3);
});

test("축 잠금 임계값을 올리면 짧은 드래그로는 축이 정해지지 않는다", async ({ page }) => {
  await setConfig(page, "axisLockThreshold", 20);
  const { cx, cy } = await canvasBox(page);
  await page.mouse.move(cx, cy);
  await page.mouse.down();
  await page.mouse.move(cx + 10, cy);
  const short = await snapshot(page);
  await page.mouse.move(cx + 30, cy);
  const long = await snapshot(page);
  await page.mouse.up();

  expect(short.axis).toBeNull();
  expect(long.axis).toBe("y");
});

test("간격 × 장수가 360° 이상인 세트가 있으면 경고한다", async ({ page }) => {
  const warning = page.locator(".config_warning");
  await expect(warning).toHaveCount(0);

  await setConfig(page, "gapDeg", 30); // Set C 12장 × 30° = 360°, Set B 10장 × 30° = 300°
  await expect(warning).toContainText("Set C");
  await expect(warning).not.toContainText("Set B");
});

test("기본값으로 버튼은 바꾼 값을 모두 되돌린다", async ({ page }) => {
  await setConfig(page, "rotateSpeed", 0.02);
  await setConfig(page, "gapDeg", 30);
  await page.getByRole("button", { name: "기본값으로" }).click();

  await expect(configInput(page, "rotateSpeed")).toHaveValue("0.01");
  await expect(configInput(page, "gapDeg")).toHaveValue("12");
  await expect(page.locator(".config_warning")).toHaveCount(0);
});
