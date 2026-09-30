import { describe, expect, it } from "vitest";
import { stepMotion, type MotionState } from "../../src/camera/core/motion";

const P = { accel: 6, maxSpeed: 10, friction: 3 };

describe("stepMotion", () => {
  it("누르고 있으면 가속하되 최고 속도를 넘지 않는다", () => {
    let state: MotionState = { s: 0, v: 0 };
    for (let i = 0; i < 300; i++) state = stepMotion(state, 1, P, 1 / 60, 1000);
    expect(state.v).toBe(10);
    expect(state.s).toBeGreaterThan(0);
  });

  it("떼면 마찰로 감속해 0에서 멈추고 반대로 가지 않는다", () => {
    let state: MotionState = { s: 100, v: 5 };
    for (let i = 0; i < 300; i++) {
      state = stepMotion(state, 0, P, 1 / 60, 1000);
      expect(state.v).toBeGreaterThanOrEqual(0);
    }
    expect(state.v).toBe(0);
  });

  it("왼쪽 입력은 뒤로 간다", () => {
    const state = stepMotion({ s: 10, v: 0 }, -1, P, 0.5, 100);
    expect(state.v).toBe(-3);
    expect(state.s).toBeCloseTo(8.5);
  });

  it("선로 끝에서 멈춘다", () => {
    expect(stepMotion({ s: 99.9, v: 10 }, 1, P, 0.1, 100)).toEqual({ s: 100, v: 0 });
  });

  it("선로 시작에서 더 뒤로 가지 않는다", () => {
    expect(stepMotion({ s: 0.05, v: -10 }, -1, P, 0.1, 100)).toEqual({ s: 0, v: 0 });
  });

  it("dt가 0이면 변하지 않는다", () => {
    expect(stepMotion({ s: 5, v: 2 }, 1, P, 0, 100)).toEqual({ s: 5, v: 2 });
  });
});
