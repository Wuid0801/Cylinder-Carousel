import { describe, expect, it } from "vitest";
import { nextStation, startAutoRun, stepAutoRun, type AutoRunState } from "../../src/camera/core/autorun";
import type { MotionState } from "../../src/camera/core/motion";

const STATIONS = [25, 68, 106];
const P = { maxSpeed: 5, accel: 6, brake: 4, dwellTime: 2 };
const DT = 1 / 60;

describe("자동 운행", () => {
  it("역을 ①→②→③→②→①→② 순서로 오간다", () => {
    const order: number[] = [];
    let state = { index: 0, dir: 1 as const as 1 | -1 };
    for (let i = 0; i < 5; i++) {
      state = nextStation(state.index, state.dir, 3);
      order.push(state.index);
    }
    expect(order).toEqual([1, 2, 1, 0, 1]);
  });

  it("트램 위치에서 가장 가까운 역을 첫 목표로 삼는다", () => {
    expect(startAutoRun(0, STATIONS).index).toBe(0);
    expect(startAutoRun(90, STATIONS).index).toBe(2);
  });

  it("역 중앙에 서서 정차 시간만큼 머문 뒤 다음 역으로 간다", () => {
    let motion: MotionState = { s: 0, v: 0 };
    let auto: AutoRunState = startAutoRun(0, STATIONS);
    const stops: { index: number; s: number }[] = [];
    let dwellFrames = 0;
    for (let i = 0; i < 90 / DT; i++) {
      const wasDwelling = auto.dwell > 0;
      ({ motion, auto } = stepAutoRun(motion, auto, STATIONS, P, DT));
      if (!wasDwelling && auto.dwell > 0) stops.push({ index: auto.index, s: motion.s });
      if (stops.length === 1 && auto.dwell > 0) dwellFrames++;
    }
    expect(stops.slice(0, 4).map((stop) => stop.index)).toEqual([0, 1, 2, 1]);
    stops.forEach((stop) => expect(stop.s).toBe(STATIONS[stop.index]));
    expect(dwellFrames * DT).toBeCloseTo(2, 1);
  });

  it("정차 시간이 0이어도 멈춰 있지 않고 다음 역으로 간다", () => {
    let motion: MotionState = { s: 25, v: 0 };
    let auto: AutoRunState = startAutoRun(25, STATIONS);
    for (let i = 0; i < 5 / DT; i++) ({ motion, auto } = stepAutoRun(motion, auto, STATIONS, { ...P, dwellTime: 0 }, DT));
    expect(auto.index).toBe(1);
    expect(motion.s).toBeGreaterThan(25);
  });
});
