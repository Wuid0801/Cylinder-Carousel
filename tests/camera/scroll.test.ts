import { describe, expect, it } from "vitest";
import { progressToScroll, scrollToProgress } from "../../src/camera/core/scroll";

describe("스크롤 ↔ 진행도", () => {
  it("스크롤 가능한 범위를 0~1로 바꾸고 범위 밖은 자른다", () => {
    expect(scrollToProgress(0, 2000, 1000)).toBe(0);
    expect(scrollToProgress(500, 2000, 1000)).toBe(0.5);
    expect(scrollToProgress(1500, 2000, 1000)).toBe(1);
    expect(scrollToProgress(-50, 2000, 1000)).toBe(0);
    expect(scrollToProgress(100, 800, 1000)).toBe(0); // 스크롤할 수 없는 페이지
  });

  it("진행도를 스크롤 위치로 되돌린다", () => {
    expect(progressToScroll(0.5, 2000, 1000)).toBe(500);
    expect(progressToScroll(0.5, 800, 1000)).toBe(0);
  });
});
