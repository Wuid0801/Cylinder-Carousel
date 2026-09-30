import type { Vec3 } from "./vec3";

export interface CameraPose {
  position: Vec3;
  target: Vec3; // 바라보는 지점 (lookAt)
}

export type CameraMode = "ride" | "follow";

// 상태 패널·E2E가 읽는 값. CameraDirector가 매 프레임 같은 객체의 필드를 갱신한다
export interface CameraInspect {
  mode: CameraMode;
  t: number; // 선로 진행도 0~1
  s: number; // 트램의 선로 위 거리
  v: number; // 트램 속도
  station: number | null; // 근접 시점으로 보고 있는 역 번호
  snap: number | null; // 트램이 서려는(추적: 손을 떼면 설, 탑승: 자동 운행이 향하는) 역 번호
  dwell: number; // 자동 운행의 남은 정차 시간 (0이면 달리는 중)
  tramNdcX: number; // 화면에서 트램의 가로 위치 (−1 왼쪽 끝 ~ 1 오른쪽 끝)
  actual: CameraPose;
  desired: CameraPose;
  transition: { active: boolean; progress: number };
}
