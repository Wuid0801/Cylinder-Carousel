import { expect, type Page } from "@playwright/test";
import type { Axis } from "../src/core/types";
import type { TouchActionOption } from "../src/demo/TouchActionLab";

export interface Snapshot {
  x: number;
  y: number;
  axis: Axis | null;
  isDragging: boolean;
}

// 데모를 열고 (필요하면 touch-action을 바꾼 뒤) 새 캔버스의 텍스처 로드가 끝날 때까지 기다린다
export async function gotoReady(page: Page, touchAction: TouchActionOption = "none"): Promise<void> {
  await page.goto("/");
  if (touchAction !== "none") {
    await page.locator(`input[name="touch-action"][value="${touchAction}"]`).check();
  }
  await expect
    .poll(() => page.evaluate(() => document.querySelector<HTMLCanvasElement>(".cylinder_canvas canvas")?.style.touchAction))
    .toBe(touchAction);
  await expect(page.locator(".cylinder_loading_overlay")).toHaveCount(0, { timeout: 15_000 });
  await expect.poll(() => page.evaluate(() => window.__cylinder?.inspect.current != null)).toBe(true);
}

export function snapshot(page: Page): Promise<Snapshot> {
  return page.evaluate(() => {
    const inspect = window.__cylinder?.inspect.current;
    if (!inspect) throw new Error("carousel is not ready");
    return { x: inspect.rotation.x, y: inspect.rotation.y, axis: inspect.drag.axis, isDragging: inspect.drag.isDragging };
  });
}

export function cancelCount(page: Page): Promise<number> {
  return page.evaluate(() => window.__cylinder?.cancelCount() ?? -1);
}

export async function canvasBox(page: Page) {
  const box = await page.locator(".cylinder_canvas canvas").boundingBox();
  if (!box) throw new Error("canvas not found");
  // 정수 좌표를 써서 포인터 이동량이 정확히 의도한 값이 되게 한다
  return { ...box, cx: Math.round(box.x + box.width / 2), cy: Math.round(box.y + box.height / 2) };
}
