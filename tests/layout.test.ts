import { describe, expect, it } from "vitest";
import { computePanelLayout } from "../src/core/layout";

const GAP_12 = (12 * Math.PI) / 180;

describe("computePanelLayout", () => {
  it("패널과 간격의 합이 원통 한 바퀴(2π)와 같다", () => {
    const { thetaLength, angles } = computePanelLayout(8, 12);
    expect((thetaLength + GAP_12) * 8).toBeCloseTo(Math.PI * 2);
    expect(angles).toHaveLength(8);
    expect(angles[0]).toBe(0);
    expect(angles[7] + thetaLength + GAP_12).toBeCloseTo(Math.PI * 2);
  });

  it("패널은 (패널 폭 + 간격)만큼 일정하게 떨어져 배치된다", () => {
    const { thetaLength, angles } = computePanelLayout(10, 12);
    for (let i = 1; i < angles.length; i++) {
      expect(angles[i] - angles[i - 1]).toBeCloseTo(thetaLength + GAP_12);
    }
  });

  it("12° 간격이면 29장까지만 패널 폭이 양수다", () => {
    expect(computePanelLayout(29, 12).thetaLength).toBeGreaterThan(0);
    expect(computePanelLayout(30, 12).thetaLength).toBeCloseTo(0);
  });

  it("패널이 없으면 빈 배치를 돌려준다", () => {
    expect(computePanelLayout(0, 12)).toEqual({ thetaLength: 0, angles: [] });
  });
});
