import type { Page } from "@playwright/test";

export interface Point {
  x: number;
  y: number;
}

const STEPS = 10;

// page.touchscreen은 tap만 지원하므로 스와이프는 CDP로 실제 터치 입력을 보낸다.
// beforeEnd는 손가락을 떼기 직전(드래그 중) 상태를 읽을 때 쓴다.
export async function touchSwipe(page: Page, from: Point, delta: Point, beforeEnd?: () => Promise<void>): Promise<void> {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: from.x, y: from.y }] });
  for (let i = 1; i <= STEPS; i++) {
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [{ x: from.x + (delta.x * i) / STEPS, y: from.y + (delta.y * i) / STEPS }],
    });
  }
  await beforeEnd?.();
  await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await cdp.detach();
}
