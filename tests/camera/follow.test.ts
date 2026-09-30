import { describe, expect, it } from "vitest";
import { damp, dampFixed } from "../../src/camera/core/follow";
import type { Vec3 } from "../../src/camera/core/vec3";

const TARGET: Vec3 = [10, 0, 0];

// 1초를 fps 프레임으로 나눠 흘린다
function runOneSecond(fps: number, step: (current: Vec3, dt: number) => Vec3): Vec3 {
  let p: Vec3 = [0, 0, 0];
  for (let i = 0; i < fps; i++) p = step(p, 1 / fps);
  return p;
}

describe("damp", () => {
  it("프레임 속도와 무관하다: 30fps와 144fps로 1초를 흘린 결과가 같다", () => {
    const at30 = runOneSecond(30, (p, dt) => damp(p, TARGET, 3, dt));
    const at144 = runOneSecond(144, (p, dt) => damp(p, TARGET, 3, dt));
    expect(at30[0]).toBeCloseTo(at144[0], 9);
    expect(at30[0]).toBeCloseTo(10 * (1 - Math.exp(-3)), 9);
  });

  it("dampFixed(프레임마다 고정 비율)는 프레임 속도에 따라 결과가 달라진다", () => {
    const at30 = runOneSecond(30, (p) => dampFixed(p, TARGET, 0.05));
    const at144 = runOneSecond(144, (p) => dampFixed(p, TARGET, 0.05));
    expect(Math.abs(at30[0] - at144[0])).toBeGreaterThan(1);
  });

  it("λ가 클수록 더 빨리 다가간다", () => {
    expect(damp([0, 0, 0], TARGET, 6, 0.1)[0]).toBeGreaterThan(damp([0, 0, 0], TARGET, 3, 0.1)[0]);
  });
});
