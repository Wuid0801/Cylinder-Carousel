import { expect, test, type Page } from "@playwright/test";
import type { CameraInspect } from "../../src/camera/core/types";

test("캐러셀과 카메라 플레이그라운드를 링크로 오간다", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "카메라 플레이그라운드" }).click();
  await expect(page).toHaveURL(/\/camera\/$/);
  await expect(page.getByRole("heading", { name: "Camera Playground" })).toBeVisible();
  await expect(page.locator("canvas")).toHaveCount(1);

  await page.getByRole("link", { name: "캐러셀" }).click();
  await expect(page.locator(".cylinder_canvas canvas")).toHaveCount(1);
});

async function gotoCamera(page: Page) {
  await page.goto("/camera/");
  await expect.poll(() => page.evaluate(() => window.__camera?.inspect.current != null)).toBe(true);
}

function inspect(page: Page): Promise<CameraInspect> {
  return page.evaluate(() => {
    const current = window.__camera?.inspect.current;
    if (!current) throw new Error("camera is not ready");
    return structuredClone(current);
  });
}

const pathLength = (page: Page) => page.evaluate(() => window.__camera!.pathLength());

async function scrollToProgress(page: Page, t: number) {
  await page.evaluate((p) => window.scrollTo(0, (document.documentElement.scrollHeight - window.innerHeight) * p), t);
}

async function switchMode(page: Page, name: "경로 탑승" | "트램 추적") {
  await page.getByRole("button", { name }).click();
  await expect.poll(async () => (await inspect(page)).transition.active, { timeout: 5_000 }).toBe(false);
}

const dist = (a: number[], b: number[]) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

test("경로 탑승: 스크롤 위치가 선로 진행도가 된다", async ({ page }) => {
  await gotoCamera(page);
  await scrollToProgress(page, 0.5);
  await expect.poll(async () => (await inspect(page)).t).toBeCloseTo(0.5, 2);
});

test("트램 추적: → 키를 누르고 있으면 가속하고, 카메라는 목표보다 뒤처져 따라온다", async ({ page }) => {
  await gotoCamera(page);
  await switchMode(page, "트램 추적");

  await page.keyboard.down("ArrowRight");
  await page.waitForTimeout(1000);
  const during = await inspect(page);
  await page.keyboard.up("ArrowRight");

  expect(during.v).toBeGreaterThan(0);
  expect(during.s).toBeGreaterThan(0);
  expect(dist(during.actual.position, during.desired.position)).toBeGreaterThan(0.05); // 감쇠로 뒤처짐

  await page.waitForTimeout(500);
  expect((await inspect(page)).v).toBeLessThan(during.v); // 떼면 감속
});

test("트램 추적: 화면 오른쪽을 누르고 있어도 앞으로 간다", async ({ page }) => {
  await gotoCamera(page);
  await switchMode(page, "트램 추적");
  const size = page.viewportSize()!;
  await page.mouse.move(Math.round(size.width * 0.6), Math.round(size.height * 0.8));
  await page.mouse.down();
  await page.waitForTimeout(800);
  const during = await inspect(page);
  await page.mouse.up();
  expect(during.v).toBeGreaterThan(0);
});

test("창이 포커스를 잃으면 입력이 풀린다", async ({ page }) => {
  await gotoCamera(page);
  await switchMode(page, "트램 추적");
  await page.keyboard.down("ArrowRight");
  await page.waitForTimeout(300);
  await page.evaluate(() => window.dispatchEvent(new Event("blur")));
  await page.waitForTimeout(1500);
  const after = await inspect(page);
  await page.keyboard.up("ArrowRight");
  expect(after.v).toBeLessThan(1); // 계속 가속했다면 최고 속도(10) 근처
});

test("역 근처에서 멈추면 근접 시점으로 전환하고, 출발하면 풀린다", async ({ page }) => {
  await gotoCamera(page);
  await scrollToProgress(page, 0.2); // 첫 역
  await expect.poll(async () => (await inspect(page)).t).toBeCloseTo(0.2, 2);
  await page.getByRole("button", { name: "트램 추적" }).click();
  await expect.poll(async () => (await inspect(page)).station).toBe(0);

  await page.keyboard.down("ArrowRight");
  await expect.poll(async () => (await inspect(page)).station).toBeNull();
  await page.keyboard.up("ArrowRight");
});

test("모드를 바꿔도 선로 위 위치를 이어받는다", async ({ page }) => {
  await gotoCamera(page);
  await scrollToProgress(page, 0.3);
  await expect.poll(async () => (await inspect(page)).t).toBeCloseTo(0.3, 2);

  await switchMode(page, "트램 추적");
  const L = await pathLength(page);
  expect((await inspect(page)).s / L).toBeCloseTo(0.3, 2);

  await page.keyboard.down("ArrowRight");
  await page.waitForTimeout(600);
  await page.keyboard.up("ArrowRight");
  await expect.poll(async () => Math.abs((await inspect(page)).v)).toBe(0);
  const u = (await inspect(page)).s / L;

  await switchMode(page, "경로 탑승");
  expect((await inspect(page)).t).toBeCloseTo(u, 2);
});

test("값 조절: 높이를 올리면 카메라 목표 자세가 올라가고, 기본값으로 되돌릴 수 있다", async ({ page }) => {
  await gotoCamera(page);
  await page.locator('input[type="number"][name="height"]').fill("10");
  await expect.poll(async () => (await inspect(page)).desired.position[1]).toBeGreaterThan(9);

  await page.getByRole("button", { name: "기본값으로" }).click();
  await expect(page.locator('input[type="number"][name="height"]')).toHaveValue("2");
  await expect.poll(async () => (await inspect(page)).desired.position[1]).toBeLessThan(4);
});

test("장력·호 길이 보정을 바꿔 선로가 다시 만들어져도 상태가 유한하다", async ({ page }) => {
  await gotoCamera(page);
  await switchMode(page, "트램 추적");
  await page.keyboard.down("ArrowRight");
  await page.waitForTimeout(800);
  await page.locator('input[type="number"][name="tension"]').fill("0.1");
  await page.locator('input[name="arcLength"]').uncheck();
  await page.waitForTimeout(300);
  await page.keyboard.up("ArrowRight");

  const state = await inspect(page);
  const L = await pathLength(page);
  [state.s, state.v, state.t, ...state.actual.position, ...state.actual.target].forEach((v) => expect(Number.isFinite(v)).toBe(true));
  expect(state.s).toBeLessThanOrEqual(L);
});
