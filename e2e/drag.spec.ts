import { expect, test } from "@playwright/test";
import { canvasBox, gotoReady, snapshot } from "./helpers";

// 회전값은 드래그 중(자동 회전이 멈춘 상태)에 읽어 자동 회전의 간섭을 피한다
test.beforeEach(async ({ page }) => {
  await gotoReady(page);
});

test("가로 드래그는 y축만 시작값 + 이동량 × 0.01만큼 회전시킨다", async ({ page }) => {
  const { cx, cy } = await canvasBox(page);
  await page.mouse.move(cx, cy);
  await page.mouse.down();
  const before = await snapshot(page);
  await page.mouse.move(cx + 120, cy + 10, { steps: 8 });
  const during = await snapshot(page);
  await page.mouse.up();

  expect(during.isDragging).toBe(true);
  expect(during.axis).toBe("y");
  expect(during.x).toBe(before.x);
  expect(during.y).toBeCloseTo(before.y + 1.2, 3);
});

test("대각선 드래그는 처음 6px을 넘은 방향의 축만 회전시킨다", async ({ page }) => {
  const { cx, cy } = await canvasBox(page);
  await page.mouse.move(cx, cy);
  await page.mouse.down();
  const before = await snapshot(page);
  await page.mouse.move(cx + 3, cy + 7); // 세로가 먼저 6px을 넘음 → x축 잠금
  await page.mouse.move(cx + 60, cy + 40); // 이후 가로가 더 커져도 x축 유지
  const during = await snapshot(page);
  await page.mouse.up();

  expect(during.axis).toBe("x");
  expect(during.y).toBe(before.y);
  expect(during.x).toBeCloseTo(before.x + 0.4, 3);
});

test("패널이 없는 빈 공간에서 시작해도 드래그된다 (투명 hit sphere)", async ({ page }) => {
  const box = await canvasBox(page);
  // 캔버스 상단 10% 지점: 패널(높이 5 × scale 0.55)은 세로 중앙 부근에만 그려지므로 여기엔 투명 구체만 있다
  const x = box.cx;
  const y = Math.round(box.y + box.height * 0.1);
  await page.mouse.move(x, y);
  await page.mouse.down();
  const before = await snapshot(page);
  await page.mouse.move(x + 100, y, { steps: 5 });
  const during = await snapshot(page);
  await page.mouse.up();

  expect(during.isDragging).toBe(true);
  expect(during.y).toBeCloseTo(before.y + 1.0, 3);
});

test("마우스 오른쪽 버튼은 드래그를 시작하지 않는다", async ({ page }) => {
  const { cx, cy } = await canvasBox(page);
  await page.mouse.move(cx, cy);
  await page.mouse.down({ button: "right" });
  const during = await snapshot(page);
  await page.mouse.up({ button: "right" });

  expect(during.isDragging).toBe(false);
});

test("캔버스 밖에서 버튼을 놓아도 드래그가 끝난다", async ({ page }) => {
  const box = await canvasBox(page);
  await page.mouse.move(box.cx, box.cy);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width + 30, box.cy, { steps: 5 }); // 오른쪽 사이드 패널 위
  expect((await snapshot(page)).isDragging).toBe(true);
  await page.mouse.up();
  const after = await snapshot(page);

  expect(after.isDragging).toBe(false);
  expect(after.axis).toBeNull();
});
