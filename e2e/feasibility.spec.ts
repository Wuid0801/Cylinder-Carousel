import { expect, test } from "@playwright/test";
import { touchSwipe, type Point } from "./touch";

test.use({ hasTouch: true });

interface ProbeResult {
  down: number;
  move: number;
  cancel: number;
}

// 캐러셀 없이 touch-action만 다른 영역에서 pointer 이벤트를 센다. 아래 3000px 여백은 페이지를 스크롤 가능하게 만든다.
const probePage = (touchAction: string) => `<!doctype html>
<html><head><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0">
  <div id="target" style="touch-action:${touchAction};height:400px;background:#335"></div>
  <div style="height:3000px"></div>
  <script>
    window.probe = { down: 0, move: 0, cancel: 0 };
    const target = document.getElementById("target");
    target.addEventListener("pointerdown", () => window.probe.down++);
    target.addEventListener("pointermove", () => window.probe.move++);
    target.addEventListener("pointercancel", () => window.probe.cancel++);
  </script>
</body></html>`;

const DIRECTIONS: [string, Point][] = [
  ["horizontal", { x: 200, y: 0 }],
  ["vertical", { x: 0, y: -200 }], // 위로 스와이프 → 브라우저가 가져가면 페이지가 아래로 스크롤됨
];

for (const touchAction of ["none", "pan-y", "auto"]) {
  for (const [direction, delta] of DIRECTIONS) {
    test(`touch-action: ${touchAction} × ${direction}`, async ({ page }) => {
      await page.setContent(probePage(touchAction));
      await touchSwipe(page, { x: 200, y: 300 }, delta);
      await page.waitForTimeout(300); // 스크롤 반영 대기
      const result = await page.evaluate(() => ({
        ...(window as unknown as { probe: ProbeResult }).probe,
        scrollY: window.scrollY,
      }));
      console.log(`[probe] ${touchAction} × ${direction}: ${JSON.stringify(result)}`);

      if (touchAction === "none") expect(result.cancel).toBe(0);
      if (touchAction === "auto" && direction === "vertical") expect(result.cancel).toBeGreaterThan(0);
    });
  }
}
