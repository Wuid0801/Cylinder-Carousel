export interface MotionState {
  s: number; // 선로 위 거리
  v: number; // 속도 (앞 +, 뒤 −)
}

export interface MotionParams {
  accel: number;
  maxSpeed: number;
  friction: number;
}

// 누르고 있으면 그 방향으로 가속, 떼면 마찰로 감속한다. 감속은 0에서 멈추고 반대로 넘어가지 않는다.
// 선로 양 끝에서는 그 방향 속도를 0으로 만든다.
export function stepMotion(state: MotionState, input: -1 | 0 | 1, params: MotionParams, dt: number, length: number): MotionState {
  let v = state.v;
  if (input !== 0) {
    v += input * params.accel * dt;
  } else {
    const decel = params.friction * dt;
    v = Math.abs(v) <= decel ? 0 : v - Math.sign(v) * decel;
  }
  v = Math.min(params.maxSpeed, Math.max(-params.maxSpeed, v));

  let s = state.s + v * dt;
  if (s <= 0) {
    s = 0;
    if (v < 0) v = 0;
  } else if (s >= length) {
    s = length;
    if (v > 0) v = 0;
  }
  return { s, v };
}
