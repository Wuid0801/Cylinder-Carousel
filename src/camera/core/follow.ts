import { lerp, type Vec3 } from "./vec3";

// 프레임 속도와 무관한 감쇠: 1초 동안 남은 거리가 e^(−λ)로 줄어든다.
// 프레임을 어떻게 나눠도 (1 − e^(−λ·dt))의 곱이 같아진다.
export function damp(current: Vec3, target: Vec3, lambda: number, dt: number): Vec3 {
  return lerp(current, target, 1 - Math.exp(-lambda * dt));
}

// 비교용: 프레임마다 고정 비율만큼 다가간다. 주사율이 높을수록 더 빨리 따라붙는다
export function dampFixed(current: Vec3, target: Vec3, ratio: number): Vec3 {
  return lerp(current, target, ratio);
}
