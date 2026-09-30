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
  brake: number; // 목표 지점에 설 때 쓰는 제동력
  // 추적
  damping: number;
  dampMode: "exp" | "fixed";
  // 시점 전환
  transitionDuration: number;
  easing: EasingName;
  stopSpeed: number;
  stationRange: number;
  // 역 흡착 · 자동 운행
  snapRange: number; // 트램 추적에서 손을 떼면 이 거리 안의 앞쪽 역 중앙에 선다
  autoSpeed: number; // 경로 탑승 자동 운행의 최고 속도
  dwellTime: number; // 자동 운행 정차 시간 (초)
  rideMargin: number; // 경로 탑승 카메라가 트램 기준으로 움직일 수 있는 화면 가로 범위의 비율
  // 선로
  tension: number;
  arcLength: boolean;
  // 화면
  fogNear: number;
  fogFar: number;
}

export const DEFAULT_CAMERA_CONFIG: CameraConfig = {
  side: 14,
  height: 2,
  lookAhead: 0.02,
  fov: 40,
  accel: 6,
  maxSpeed: 10,
  friction: 3,
  brake: 4,
  damping: 3,
  dampMode: "exp",
  transitionDuration: 1.2,
  easing: "easeInOutCubic",
  stopSpeed: 0.3,
  stationRange: 3,
  snapRange: 10,
  autoSpeed: 5,
  dwellTime: 2,
  rideMargin: 0.8,
  tension: 0.5,
  arcLength: true,
  fogNear: 20,
  fogFar: 90,
};

export const FIXED_DAMP_RATIO = 0.05; // "고정 비율" 감쇠 방식이 프레임마다 다가가는 비율
