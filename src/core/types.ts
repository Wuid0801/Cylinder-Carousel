export type Axis = "x" | "y";

export interface Rotation {
  x: number;
  y: number;
}

// 한 번의 드래그 제스처 상태. pointerdown 시점의 값을 스냅샷으로 들고 있다
export interface DragState {
  isDragging: boolean;
  pointerId: number | null;
  startX: number;
  startY: number;
  startRotX: number;
  startRotY: number;
  axis: Axis | null;
}

// 데모·E2E가 회전 상태를 읽기 위한 참조 묶음 (복사본이 아니라 컴포넌트가 쓰는 객체 그 자체)
export interface CarouselInspect {
  rotation: Rotation;
  drag: DragState;
  camera?: { azimuth: number; polar: number }; // 수정 전 방식(카메라 궤도)에서만: 카메라 방위각·고도 (rad)
}

// object: 카메라 고정 + 물체 회전 (현재) / orbit: 물체 자동 회전 + OrbitControls 카메라 궤도 드래그 (수정 전)
export type ControlMode = "object" | "orbit";
