import { expect, test, type Page } from "@playwright/test";
import type { CameraInspect } from "../../src/camera/core/types";
import { STATIONS } from "../../src/camera/core/world";

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

// 경로 탑승의 자동 운행이 역에 설 때까지 기다린다 (처음엔 선로 시작에서 첫 역으로 간다)
async function waitForAutoStop(page: Page) {
  await expect.poll(async () => (await inspect(page)).dwell, { timeout: 20_000 }).toBeGreaterThan(0);
}

const dist = (a: number[], b: number[]) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

test("경로 탑승: 트램이 스스로 역 중앙에 섰다가 다시 출발한다", async ({ page }) => {
  await gotoCamera(page);
  await waitForAutoStop(page);
  const stopped = await inspect(page);
  const L = await pathLength(page);
  expect(stopped.v).toBe(0);
  expect(STATIONS.some((u) => Math.abs(u * L - stopped.s) < 1e-6)).toBe(true);

  await expect.poll(async () => Math.abs((await inspect(page)).v), { timeout: 5_000 }).toBeGreaterThan(0);
});

test("경로 탑승: 스크롤 가운데면 트램이 화면 중앙이고, 끝까지 옮겨도 화면 안에 있다", async ({ page }) => {
  await gotoCamera(page);
  await waitForAutoStop(page);
  await expect.poll(async () => Math.abs((await inspect(page)).tramNdcX)).toBeLessThan(0.15);

  for (const p of [0, 1]) {
    await scrollToProgress(page, p);
    await page.waitForTimeout(300);
    const x = (await inspect(page)).tramNdcX;
    expect(Math.abs(x)).toBeLessThan(1); // 화면 안
    expect(Math.abs(x)).toBeGreaterThan(0.5); // 실제로 가장자리 쪽으로 옮겨짐
  }
});

test("트램 추적: → 키를 누르고 있으면 가속하고, 카메라는 목표보다 뒤처져 따라온다", async ({ page }) => {
  await gotoCamera(page);
  await switchMode(page, "트램 추적");

  await page.keyboard.down("ArrowRight");
  await page.waitForTimeout(1000);
  const during = await inspect(page);
  await page.keyboard.up("ArrowRight");

  expect(during.v).toBeGreaterThan(0);
  expect(dist(during.actual.position, during.desired.position)).toBeGreaterThan(0.05); // 감쇠로 뒤처짐

  await page.waitForTimeout(500);
  expect((await inspect(page)).v).toBeLessThan(during.v); // 떼면 감속 (흡착 중에도 빨라지지 않음)
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
  // 키는 계속 눌려 있지만 입력이 풀렸으므로 마찰이나 역 흡착으로 멈춘다
  await expect.poll(async () => (await inspect(page)).v, { timeout: 8_000 }).toBe(0);
  await page.keyboard.up("ArrowRight");
});

test("트램 추적: 역 앞에서 손을 떼면 그 역 중앙에 정확히 서고, 설 역을 미리 알려 준다", async ({ page }) => {
  await gotoCamera(page);
  await waitForAutoStop(page);
  await switchMode(page, "트램 추적");
  await page.locator('input[type="number"][name="maxSpeed"]').fill("6"); // 흡착할 수 있는 속도로 제한

  const L = await pathLength(page);
  const start = (await inspect(page)).s;
  const nextIndex = STATIONS.findIndex((u) => u * L > start + 1); // 오른쪽 다음 역
  expect(nextIndex).toBeGreaterThanOrEqual(0);

  await page.keyboard.down("ArrowRight");
  // 손을 떼면 설 역. 예고가 켜지는 구간이 1초 남짓이라 짧은 간격으로 확인한다
  await expect.poll(async () => (await inspect(page)).snap, { timeout: 15_000, intervals: [50] }).toBe(nextIndex);
  await page.keyboard.up("ArrowRight");

  await expect.poll(async () => (await inspect(page)).v, { timeout: 8_000 }).toBe(0);
  const stopped = await inspect(page);
  expect(stopped.s).toBeCloseTo(STATIONS[nextIndex] * L, 6);
  expect(stopped.snap).toBe(nextIndex);
});

test("역에 서 있는 트램을 추적하면 근접 시점이 되고, 출발하면 풀린다", async ({ page }) => {
  await gotoCamera(page);
  await waitForAutoStop(page);
  await page.getByRole("button", { name: "트램 추적" }).click();
  await expect.poll(async () => (await inspect(page)).station).not.toBeNull();

  await page.keyboard.down("ArrowRight");
  await expect.poll(async () => (await inspect(page)).station).toBeNull();
  await page.keyboard.up("ArrowRight");
});

test("모드를 바꿔도 트램 위치가 그대로이고, 경로 탑승으로 돌아오면 트램이 화면 가운데 온다", async ({ page }) => {
  await gotoCamera(page);
  await waitForAutoStop(page);
  const before = (await inspect(page)).s;

  await switchMode(page, "트램 추적");
  expect((await inspect(page)).s).toBeCloseTo(before, 3);

  // 역 흡착 거리(10) 밖까지 가도록 충분히 누른다. 가까이서 멈추면 원래 역 중앙으로 돌아간다
  await page.keyboard.down("ArrowRight");
  await page.waitForTimeout(1500);
  await page.keyboard.up("ArrowRight");
  await expect.poll(async () => (await inspect(page)).v, { timeout: 8_000 }).toBe(0);
  expect((await inspect(page)).s).toBeGreaterThan(before + 10);

  await switchMode(page, "경로 탑승");
  await expect.poll(async () => Math.abs((await inspect(page)).tramNdcX)).toBeLessThan(0.15);
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
  [state.s, state.v, state.t, state.tramNdcX, ...state.actual.position, ...state.actual.target].forEach((v) => expect(Number.isFinite(v)).toBe(true));
  expect(state.s).toBeLessThanOrEqual(L);
});

test("트램 추적 중 방향키는 포커스된 슬라이더 값을 바꾸지 않고 트램만 움직인다", async ({ page }) => {
  await gotoCamera(page);
  await switchMode(page, "트램 추적");
  await page.locator('input[type="range"][name="tension"]').focus();
  await page.keyboard.down("ArrowRight");
  await page.waitForTimeout(500);
  const during = await inspect(page);
  await page.keyboard.up("ArrowRight");

  await expect(page.locator('input[type="number"][name="tension"]')).toHaveValue("0.5");
  expect(during.v).toBeGreaterThan(0);
});

test("역을 떠나는 전환이 끝나도 카메라가 멈칫하지 않고 감쇠 추적을 이어간다", async ({ page }) => {
  await gotoCamera(page);
  await waitForAutoStop(page);
  await page.getByRole("button", { name: "트램 추적" }).click();
  await expect.poll(async () => (await inspect(page)).station).not.toBeNull();
  await expect.poll(async () => (await inspect(page)).transition.active, { timeout: 5_000 }).toBe(false);

  await page.keyboard.down("ArrowRight");
  await expect.poll(async () => (await inspect(page)).transition.active).toBe(true);
  // 전환이 끝난 바로 그 프레임의 뒤처짐. 전환이 목표에 딱 붙은 채 끝나면 0에 가깝고, 이후 감쇠가 처음부터 다시 쌓이며 멈칫한다
  const lagAtEnd = await page.evaluate(
    () =>
      new Promise<number>((resolve) => {
        const tick = () => {
          const info = window.__camera!.inspect.current!;
          if (!info.transition.active) {
            const [a, b] = [info.actual.position, info.desired.position];
            resolve(Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]));
          } else requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }),
  );
  await page.keyboard.up("ArrowRight");
  expect(lagAtEnd).toBeGreaterThan(1);
});

test("역 근접 시점은 트램이 미끄러져 역 범위를 벗어나면 풀린다 (마찰 0)", async ({ page }) => {
  await gotoCamera(page);
  await waitForAutoStop(page);
  await switchMode(page, "트램 추적");
  for (const [name, value] of [["friction", "0"], ["snapRange", "0"], ["stopSpeed", "3"]]) {
    await page.locator(`input[type="number"][name="${name}"]`).fill(value);
  }
  await expect.poll(async () => (await inspect(page)).station).not.toBeNull();

  // 살짝 밀면 손을 뗀 뒤 다시 근접 시점으로 잠기지만, 마찰이 없어 계속 미끄러진다
  await page.keyboard.down("ArrowRight");
  await page.waitForTimeout(150);
  await page.keyboard.up("ArrowRight");
  await expect.poll(async () => (await inspect(page)).station, { timeout: 10_000 }).toBeNull();
  expect((await inspect(page)).v).toBeGreaterThan(0);
});

test("트램 추적: 누르기 영역은 마우스 오른쪽 버튼에 반응하지 않는다", async ({ page }) => {
  await gotoCamera(page);
  await waitForAutoStop(page);
  await switchMode(page, "트램 추적");
  const size = page.viewportSize()!;
  await page.mouse.move(Math.round(size.width * 0.6), Math.round(size.height * 0.8));
  await page.mouse.down({ button: "right" });
  await page.waitForTimeout(800);
  const during = await inspect(page);
  await page.mouse.up({ button: "right" });
  expect(during.v).toBe(0);
});

test.describe("동작 줄이기 설정", () => {
  test.use({ reducedMotion: "reduce" });

  test("트램 자동 운행을 멈추고 안내한다", async ({ page }) => {
    await gotoCamera(page);
    await expect(page.getByText("동작 줄이기")).toBeVisible();
    await page.waitForTimeout(2000);
    expect((await inspect(page)).s).toBe(0);
  });
});
