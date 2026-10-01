import { expect, test } from "@playwright/test";

test("이미지를 하나라도 불러오지 못하면 캐러셀 대신 안내 문구를 보여준다", async ({ page }) => {
  await page.route("**/images/set-a/01.svg", (route) => route.fulfill({ status: 404, body: "" }));
  await page.goto("/");

  await expect(page.getByRole("alert")).toContainText("3D 화면을 표시할 수 없습니다");
  await expect(page.getByRole("heading", { name: "Cylinder Carousel" })).toBeVisible(); // 페이지 나머지는 유지
});

test("다시 시도를 누르면 이미지를 다시 불러와 캐러셀이 나타난다", async ({ page }) => {
  let fail = true;
  await page.route("**/images/set-a/01.svg", (route) => (fail ? route.fulfill({ status: 404, body: "" }) : route.continue()));
  await page.goto("/");
  await expect(page.getByRole("alert")).toBeVisible();

  fail = false; // 원인이 해소된 뒤
  await page.getByRole("button", { name: "다시 시도" }).click();
  await expect(page.getByRole("alert")).toHaveCount(0);
  await expect(page.locator(".cylinder_canvas canvas")).toHaveCount(1);
  await expect(page.locator(".cylinder_loading_overlay")).toHaveCount(0, { timeout: 15_000 });
});
