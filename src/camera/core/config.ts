import type { EasingName } from "./transition";

export interface CameraConfig {
  // 카메라 배치 (두 모드 공통)
  side: number;
  height: number;
  lookAhead: number;
  fov: number;
  // 트램 움직임
  accel: number;
  maxSpeed: number;
  friction: number;
  // 추적
  damping: number;
  dampMode: "exp" | "fixed";
  // 시점 전환
  transitionDuration: number;
  easing: EasingName;
  stopSpeed: number;
  stationRange: number;
  // 선로
  tension: number;
  arcLength: boolean;
  // 화면
  fogNear: number;
  fogFar: number;
}

export const DEFAULT_CAMERA_CONFIG: CameraConfig = {
  side: 8,
  height: 2.5,
  lookAhead: 0.02,
  fov: 40,
  accel: 6,
  maxSpeed: 10,
  friction: 3,
  damping: 3,
  dampMode: "exp",
  transitionDuration: 1.2,
  easing: "easeInOutCubic",
  stopSpeed: 0.3,
  stationRange: 3,
  tension: 0.5,
  arcLength: true,
  fogNear: 20,
  fogFar: 90,
};

export const FIXED_DAMP_RATIO = 0.05; // "고정 비율" 감쇠 방식이 프레임마다 다가가는 비율
