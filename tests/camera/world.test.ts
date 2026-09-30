import { describe, expect, it } from "vitest";
import { createPath } from "../../src/camera/core/path";
import { distance } from "../../src/camera/core/vec3";
import { BANDS, alongTrack, headingY, layoutForeground, layoutScenery, railSegments, stationSpot } from "../../src/camera/core/world";

const straight = createPath(
  [
    [0, 0, 0],
    [10, 0, 0],
    [20, 0, 0],
  ],
  { tension: 0.5, arcLength: true },
);

describe("장면 배치", () => {
  it("같은 시드면 같은 배치다", () => {
    expect(layoutScenery(7)).toEqual(layoutScenery(7));
  });

  it("뒤쪽 소품은 자기 깊이 띠 안에 놓인다", () => {
    const zRange = { min: Math.min(...BANDS.map((b) => b.zMin)), max: Math.max(...BANDS.map((b) => b.zMax)) };
    const props = layoutScenery(7);
    expect(props.some((p) => p.kind === "hill")).toBe(true);
    props.forEach((p) => {
      expect(p.position[2]).toBeGreaterThanOrEqual(zRange.min);
      expect(p.position[2]).toBeLessThanOrEqual(zRange.max);
    });
  });

  it("전경 나무는 선로와 카메라 사이(선로에서 3.5~5)에 놓인다", () => {
    const props = layoutForeground(straight, 7);
    expect(props.length).toBeGreaterThan(0);
    props.forEach((p) => {
      const nearest = straight.getPointAt(Math.min(1, Math.max(0, p.position[0] / 20)));
      expect(distance(p.position, nearest)).toBeGreaterThanOrEqual(3.5 - 1e-6);
      expect(distance(p.position, nearest)).toBeLessThanOrEqual(5 + 1e-6);
      expect(p.position[2]).toBeGreaterThan(0); // 카메라 쪽(+z)
    });
  });

  it("침목은 일정 간격으로 선로 방향을 향해 놓인다", () => {
    const sleepers = alongTrack(straight, 5);
    expect(sleepers.map((s) => s.position[0])).toEqual([0, 5, 10, 15, 20].map((x) => expect.closeTo(x, 6)));
    sleepers.forEach((s) => expect(s.rotationY).toBeCloseTo(0, 6));
  });

  it("레일은 선로 양옆으로 선분 쌍을 만든다", () => {
    const segments = railSegments(straight, 0.5, 10);
    expect(segments).toHaveLength(10 * 2 * 2 * 3); // 구간 10 × 레일 2 × 끝점 2 × xyz
    expect(segments.slice(0, 3).map((v) => Math.round(v * 1e6) / 1e6)).toEqual([0, 0, -0.5]); // 첫 왼쪽 레일 점
  });

  it("역의 승강장과 집은 선로 뒤쪽(카메라 반대편)에 놓인다", () => {
    const spot = stationSpot(straight, 0.5);
    [10, 0, -1.8].forEach((v, i) => expect(spot.platform[i]).toBeCloseTo(v, 6));
    [10, 0, -6].forEach((v, i) => expect(spot.house[i]).toBeCloseTo(v, 6));
  });

  it("headingY는 로컬 +x가 접선을 향하게 하는 y축 회전이다", () => {
    expect(headingY([1, 0, 0])).toBeCloseTo(0, 12);
    expect(headingY([0, 0, -1])).toBeCloseTo(Math.PI / 2, 12);
  });
});
