import type { MotionState } from "./motion";

export interface ArrivalParams {
  maxSpeed: number;
  accel: number;
  brake: number; // 제동력 (감속 한도)
}

const ARRIVE_DISTANCE = 0.01;
const ARRIVE_SPEED = 0.05;
// 계획은 제동력의 80%로 세운다. 남은 20%로 프레임 단위 오차를 따라잡아, 마지막 걸음에 속도가 뚝 끊기지 않게 한다
const PLAN_BRAKE_RATIO = 0.8;

// 목표 위치에 정확히 멈추는 제어기.
// 남은 거리 d에서 제동력으로 멈출 수 있는 최대 속도 √(2·제동력·d)를 목표 속도로 두고,
// 현재 속도를 그쪽으로 바꾸되 빨라질 때는 가속 한도, 느려질 때는 제동 한도를 넘지 않는다.
export function stepArrival(state: MotionState, target: number, { maxSpeed, accel, brake }: ArrivalParams, dt: number): MotionState {
  const d = target - state.s;
  if (Math.abs(d) < ARRIVE_DISTANCE && Math.abs(state.v) < ARRIVE_SPEED) return { s: target, v: 0 };

  const desired = Math.sign(d) * Math.min(maxSpeed, Math.sqrt(2 * brake * PLAN_BRAKE_RATIO * Math.abs(d)));
  const speedingUp = Math.abs(desired) > Math.abs(state.v) && (state.v === 0 || Math.sign(desired) === Math.sign(state.v));
  const limit = (speedingUp ? accel : brake) * dt;
  const v = state.v + Math.max(-limit, Math.min(limit, desired - state.v));
  const s = state.s + v * dt;

  // 이번 걸음에 목표에 닿거나 지나치면 목표에 세운다
  if (d !== 0 && Math.sign(target - s) !== Math.sign(d)) return { s: target, v: 0 };
  return { s, v };
}

// 지금 손을 떼면 target에 멈출 수 있는가: 흡착 거리 안, 진행 방향 앞쪽, 제동력 안에서 설 수 있는 속도
export function canStopAt(state: MotionState, target: number, brake: number, range: number): boolean {
  const d = target - state.s;
  if (Math.abs(d) > range) return false;
  if (Math.abs(state.v) < ARRIVE_SPEED) return true; // 거의 서 있으면 앞뒤 상관없이 중앙으로 맞춘다
  if (Math.sign(d) !== Math.sign(state.v)) return false; // 이미 지나친 역으로는 되돌아가지 않는다
  return (state.v * state.v) / (2 * Math.abs(d)) <= brake;
}

// 흡착할 수 있는 역 중 가장 가까운 역의 번호
export function pickSnapStation(state: MotionState, stationsS: number[], brake: number, range: number): number | null {
  let best: number | null = null;
  stationsS.forEach((target, i) => {
    if (!canStopAt(state, target, brake, range)) return;
    if (best === null || Math.abs(target - state.s) < Math.abs(stationsS[best] - state.s)) best = i;
  });
  return best;
}

const SNAP_CREEP_SPEED = 1.5; // 거의 서 있을 때 역 중앙까지 다가가는 느린 속도

// 손을 뗀 뒤의 역 흡착: 빨라지지 않고(마찰만큼은 줄어든다) 필요할 때만 제동해 역 중앙에 선다
export function stepSnap(state: MotionState, target: number, { accel, brake, friction }: { accel: number; brake: number; friction: number }, dt: number): MotionState {
  const cap = Math.max(Math.abs(state.v) - friction * dt, SNAP_CREEP_SPEED);
  return stepArrival(state, target, { maxSpeed: cap, accel, brake }, dt);
}
