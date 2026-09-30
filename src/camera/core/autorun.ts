import { stepArrival, type ArrivalParams } from "./arrival";
import type { MotionState } from "./motion";

export interface AutoRunState {
  index: number; // 향하는(또는 정차 중인) 역
  dir: 1 | -1;
  dwell: number; // 남은 정차 시간 (0이면 달리는 중)
}

export interface AutoRunParams extends ArrivalParams {
  dwellTime: number;
}

// 역을 ①→②→③→②→① 순서로 오간다
export function nextStation(index: number, dir: 1 | -1, count: number): { index: number; dir: 1 | -1 } {
  if (count <= 1) return { index: 0, dir };
  const next = index + dir;
  if (next >= 0 && next < count) return { index: next, dir };
  const reversed = -dir as 1 | -1;
  return { index: index + reversed, dir: reversed };
}

// 트램 위치에서 가장 가까운 역을 첫 목표로 삼는다
export function startAutoRun(s: number, stationsS: number[]): AutoRunState {
  let best = 0;
  stationsS.forEach((target, i) => {
    if (Math.abs(target - s) < Math.abs(stationsS[best] - s)) best = i;
  });
  return { index: best, dir: 1, dwell: 0 };
}

export function stepAutoRun(motion: MotionState, auto: AutoRunState, stationsS: number[], params: AutoRunParams, dt: number): { motion: MotionState; auto: AutoRunState } {
  if (auto.dwell > 0) {
    const dwell = auto.dwell - dt;
    if (dwell > 0) return { motion: { s: motion.s, v: 0 }, auto: { ...auto, dwell } };
    const next = nextStation(auto.index, auto.dir, stationsS.length);
    return { motion: { s: motion.s, v: 0 }, auto: { ...next, dwell: 0 } };
  }

  const target = stationsS[auto.index];
  const moved = stepArrival(motion, target, params, dt);
  const arrived = moved.s === target && moved.v === 0;
  // 정차 시간이 0이어도 다음 프레임에 출발하도록 아주 작은 값으로 둔다
  return { motion: moved, auto: arrived ? { ...auto, dwell: Math.max(params.dwellTime, Number.EPSILON) } : auto };
}
