import { expect, test } from "@playwright/test";

test("이미지를 하나라도 불러오지 못하면 캐러셀 대신 안내 문구를 보여준다", async ({ page }) => {
  await page.route("**/images/set-a/01.svg", (route) => route.fulfill({ status: 404, body: "" }));
  await page.goto("/");

  await expect(page.getByRole("alert")).toContainText("3D 화면을 표시할 수 없습니다");
  await expect(page.getByRole("heading", { name: "Cylinder Carousel" })).toBeVisible(); // 페이지 나머지는 유지
});
