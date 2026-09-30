import { describe, expect, it } from "vitest";
import { EASINGS, EASING_NAMES, startTransition, stepTransition } from "../../src/camera/core/transition";
import type { CameraPose } from "../../src/camera/core/types";

const A: CameraPose = { position: [0, 0, 0], target: [0, 0, -1] };
const B: CameraPose = { position: [10, 0, 0], target: [10, 0, -1] };

function expectPose(actual: CameraPose, expected: CameraPose) {
  for (const key of ["position", "target"] as const) {
    actual[key].forEach((v, i) => expect(v).toBeCloseTo(expected[key][i], 9));
  }
}

describe("이징", () => {
  for (const name of EASING_NAMES) {
    it(`${name}: 0에서 0, 1에서 1`, () => {
      expect(EASINGS[name](0)).toBeCloseTo(0, 12);
      expect(EASINGS[name](1)).toBeCloseTo(1, 12);
    });
  }
});

describe("시점 전환", () => {
  it("경과 0이면 출발 자세, 지속 시간이 지나면 목표 자세에 도착하고 끝난다", () => {
    const tr = startTransition(A, 1, "easeOutBack");
    expectPose(stepTransition(tr, 0, B).pose, A);
    const end = stepTransition(tr, 1, B);
    expect(end.done).toBe(true);
    expectPose(end.pose, B);
  });

  it("도중에 끊고 새로 시작해도 첫 프레임 위치가 끊기 직전과 같다", () => {
    const before = stepTransition(startTransition(A, 1, "easeInOutCubic"), 0.4, B);
    const C: CameraPose = { position: [0, 10, 0], target: [0, 10, -1] };
    const restarted = stepTransition(startTransition(before.pose, 1, "easeInOutCubic"), 0, C);
    expectPose(restarted.pose, before.pose);
  });

  it("목표가 움직이면 매 프레임의 현재 목표를 향해 간다", () => {
    const half = stepTransition(startTransition(A, 1, "linear"), 0.5, B);
    expect(half.pose.position[0]).toBeCloseTo(5, 9);
    const moved: CameraPose = { position: [20, 0, 0], target: [20, 0, -1] };
    const end = stepTransition(half.next, 0.5, moved);
    expect(end.done).toBe(true);
    expectPose(end.pose, moved);
  });

  it("지속 시간이 0이면 즉시 목표 자세다", () => {
    const r = stepTransition(startTransition(A, 0, "linear"), 0, B);
    expect(r.done).toBe(true);
    expectPose(r.pose, B);
  });
});
