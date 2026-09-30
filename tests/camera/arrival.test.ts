import { describe, expect, it } from "vitest";
import { canStopAt, pickSnapStation, stepArrival } from "../../src/camera/core/arrival";
import type { MotionState } from "../../src/camera/core/motion";

const P = { maxSpeed: 5, accel: 6, brake: 4 };
const DT = 1 / 60;

// 목표까지 달리며 매 걸음을 기록한다
function drive(start: MotionState, target: number, seconds: number): MotionState[] {
  const steps: MotionState[] = [start];
  for (let i = 0; i < seconds / DT; i++) steps.push(stepArrival(steps[steps.length - 1], target, P, DT));
  return steps;
}

describe("stepArrival", () => {
  it("멈춰 있던 트램이 목표에 정확히 도착해 선다", () => {
    const steps = drive({ s: 0, v: 0 }, 20, 20);
    expect(steps[steps.length - 1]).toEqual({ s: 20, v: 0 });
  });

  it("목표를 지나치지 않고, 최고 속도와 가속·제동 한도를 지킨다 (정지 걸음은 눈에 띄지 않을 만큼 느린 속도에서만)", () => {
    const steps = drive({ s: 0, v: 0 }, 20, 20);
    steps.forEach((step, i) => {
      expect(step.s).toBeLessThanOrEqual(20);
      expect(Math.abs(step.v)).toBeLessThanOrEqual(P.maxSpeed + 1e-9);
      if (i === 0) return;
      const jump = Math.abs(step.v - steps[i - 1].v);
      const isStopStep = step.v === 0 && steps[i - 1].v !== 0;
      if (isStopStep) expect(Math.abs(steps[i - 1].v)).toBeLessThan(0.2);
      else expect(jump).toBeLessThanOrEqual(Math.max(P.accel, P.brake) * DT + 1e-9);
    });
  });

  it("목표가 뒤쪽이면 뒤로 가서 선다", () => {
    const steps = drive({ s: 30, v: 0 }, 20, 20);
    expect(steps[steps.length - 1]).toEqual({ s: 20, v: 0 });
    steps.forEach((step) => expect(step.s).toBeGreaterThanOrEqual(20));
  });

  it("달리던 속도에서 제동해 목표에 선다", () => {
    const steps = drive({ s: 0, v: 5 }, 8, 10);
    expect(steps[steps.length - 1]).toEqual({ s: 8, v: 0 });
  });

  it("이미 목표에 서 있으면 그대로다", () => {
    expect(stepArrival({ s: 20, v: 0 }, 20, P, DT)).toEqual({ s: 20, v: 0 });
  });
});

describe("역 흡착 판정", () => {
  it("진행 방향 앞쪽이고 제동력 안에서 멈출 수 있으면 흡착한다", () => {
    expect(canStopAt({ s: 0, v: 6 }, 8, 4, 10)).toBe(true); // 36 / 16 = 2.25 ≤ 4
  });

  it("너무 빠르면 흡착하지 않는다", () => {
    expect(canStopAt({ s: 0, v: 10 }, 8, 4, 10)).toBe(false); // 100 / 16 = 6.25 > 4
  });

  it("이미 지나친 역으로는 되돌아가지 않는다", () => {
    expect(canStopAt({ s: 10, v: 3 }, 8, 4, 10)).toBe(false);
  });

  it("거의 서 있으면 앞뒤 상관없이 흡착한다", () => {
    expect(canStopAt({ s: 10, v: 0 }, 8, 4, 10)).toBe(true);
  });

  it("흡착 거리 밖이면 흡착하지 않는다", () => {
    expect(canStopAt({ s: 0, v: 1 }, 20, 4, 10)).toBe(false);
  });

  it("흡착할 수 있는 역 중 가장 가까운 역을 고른다", () => {
    expect(pickSnapStation({ s: 50, v: 2 }, [25, 55, 58], 4, 10)).toBe(1);
    expect(pickSnapStation({ s: 50, v: 2 }, [25, 80], 4, 10)).toBeNull();
  });
});
