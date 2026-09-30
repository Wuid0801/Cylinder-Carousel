import { expect, test, type Page } from "@playwright/test";
import type { TouchActionOption } from "../src/demo/TouchActionLab";
import { canvasBox, cancelCount, gotoReady, snapshot, type Snapshot } from "./helpers";
import { touchSwipe, type Point } from "./touch";

test.use({ hasTouch: true });

const HORIZONTAL: Point = { x: 200, y: 0 };
const VERTICAL: Point = { x: 0, y: -200 }; // 위로 스와이프 → 브라우저가 가져가면 페이지가 아래로 스크롤됨
const FULL_TURN = 1.5; // 200px × 0.01 = 2 rad. 끊기지 않았다면 이보다 크게 돈다
const CUT_OFF = 0.5; // 초반에 끊겼다면 이보다 작게 돈다

async function swipeOnCanvas(page: Page, touchAction: TouchActionOption, delta: Point) {
  await gotoReady(page, touchAction);
  const { cx, cy } = await canvasBox(page);
  const before = await snapshot(page);
  let during: Snapshot | undefined;
  await touchSwipe(page, { x: cx, y: cy }, delta, async () => {
    during = await snapshot(page);
  });
  await page.waitForTimeout(300); // 스크롤 반영 대기
  return {
    before,
    during: during!,
    cancel: await cancelCount(page),
    scrollY: await page.evaluate(() => window.scrollY),
  };
}

test.describe("touch-action: none (기본값)", () => {
  test("가로 스와이프는 끊기지 않고 y축을 회전시킨다", async ({ page }) => {
    const r = await swipeOnCanvas(page, "none", HORIZONTAL);
    expect(r.cancel).toBe(0);
    expect(r.during.isDragging).toBe(true);
    expect(Math.abs(r.during.y - r.before.y)).toBeGreaterThan(FULL_TURN);
    expect(r.scrollY).toBe(0);
  });

  test("세로 스와이프는 끊기지 않고 x축을 회전시키며 페이지는 스크롤되지 않는다", async ({ page }) => {
    const r = await swipeOnCanvas(page, "none", VERTICAL);
    expect(r.cancel).toBe(0);
    expect(r.during.isDragging).toBe(true);
    expect(Math.abs(r.during.x - r.before.x)).toBeGreaterThan(FULL_TURN);
    expect(r.scrollY).toBe(0);
  });
});

test.describe("touch-action: pan-y", () => {
  test("가로 스와이프는 회전시킨다", async ({ page }) => {
    const r = await swipeOnCanvas(page, "pan-y", HORIZONTAL);
    expect(r.cancel).toBe(0);
    expect(Math.abs(r.during.y - r.before.y)).toBeGreaterThan(FULL_TURN);
  });

  test("세로 스와이프는 페이지 스크롤로 넘어가고 드래그가 끊긴다", async ({ page }) => {
    const r = await swipeOnCanvas(page, "pan-y", VERTICAL);
    expect(r.cancel).toBeGreaterThan(0);
    expect(r.during.isDragging).toBe(false);
    expect(Math.abs(r.during.x - r.before.x)).toBeLessThan(CUT_OFF);
    expect(r.scrollY).toBeGreaterThan(0);
  });
});

test.describe("touch-action: auto (OrbitControls 제거 직후)", () => {
  test("가로 스와이프도 pointercancel로 끊긴다 (원래 증상)", async ({ page }) => {
    const r = await swipeOnCanvas(page, "auto", HORIZONTAL);
    expect(r.cancel).toBeGreaterThan(0);
    expect(r.during.isDragging).toBe(false);
    // 끊긴 뒤엔 자동 회전이 y축을 계속 돌리므로 CUT_OFF 대신 "끝까지 돌지 못했다"로 판단한다
    expect(Math.abs(r.during.y - r.before.y)).toBeLessThan(FULL_TURN);
  });

  test("세로 스와이프 중 pointercancel로 드래그가 끊기고, 이후 자동 회전이 재개된다", async ({ page }) => {
    const r = await swipeOnCanvas(page, "auto", VERTICAL);
    expect(r.cancel).toBeGreaterThan(0);
    expect(r.during.isDragging).toBe(false);
    expect(Math.abs(r.during.x - r.before.x)).toBeLessThan(CUT_OFF);
    expect(r.scrollY).toBeGreaterThan(0);

    // 드래그 중 상태로 멈추지 않고 자동 회전이 이어져야 한다
    const after = await snapshot(page);
    expect(after.isDragging).toBe(false);
    expect(after.y).not.toBe(r.during.y);
  });
});

test("선택한 touch-action이 새 캔버스에 적용되고 pointercancel 횟수가 초기화된다", async ({ page }) => {
  const r = await swipeOnCanvas(page, "auto", VERTICAL);
  expect(r.cancel).toBeGreaterThan(0);
  await page.evaluate(() => window.scrollTo(0, 0));

  for (const value of ["pan-y", "none"] as const) {
    await page.locator(`input[name="touch-action"][value="${value}"]`).check();
    await expect
      .poll(() => page.evaluate(() => document.querySelector<HTMLCanvasElement>(".cylinder_canvas canvas")?.style.touchAction))
      .toBe(value);
    expect(await cancelCount(page)).toBe(0);
  }
});
