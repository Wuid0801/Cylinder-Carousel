import { describe, expect, it } from "vitest";
import { createPath } from "../../src/camera/core/path";
import { besidePose } from "../../src/camera/core/rig";
import type { Vec3 } from "../../src/camera/core/vec3";

// 고르게 놓인 일직선 제어점 → 곡선도 x축 위 직선
const straight = createPath(
  [
    [0, 0, 0],
    [10, 0, 0],
    [20, 0, 0],
  ],
  { tension: 0.5, arcLength: true },
);

const expectVec = (a: Vec3, b: Vec3) => a.forEach((v, i) => expect(v).toBeCloseTo(b[i], 6));

describe("besidePose", () => {
  it("진행 방향 오른쪽(+z)·위에 서서 조금 앞 지점을 본다", () => {
    const pose = besidePose(straight, 0.5, { side: 8, height: 2, lookAhead: 0.1 });
    expectVec(pose.position, [10, 2, 8]);
    expectVec(pose.target, [12, 0, 0]);
  });

  it("앞보기 지점은 선로 끝을 넘지 않는다", () => {
    expectVec(besidePose(straight, 0.95, { side: 8, height: 2, lookAhead: 0.2 }).target, [20, 0, 0]);
  });

  it("위치와 시선이 겹치면(옆 거리·높이 0, 선로 끝) NaN 없이 접선 방향을 본다", () => {
    const pose = besidePose(straight, 1, { side: 0, height: 0, lookAhead: 0.1 });
    expectVec(pose.position, [20, 0, 0]);
    expectVec(pose.target, [21, 0, 0]);
    [...pose.position, ...pose.target].forEach((v) => expect(Number.isFinite(v)).toBe(true));
  });
});
