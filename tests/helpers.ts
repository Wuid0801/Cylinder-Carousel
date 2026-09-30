import { autoRotate, dragMove } from "../src/core/rotation";
import type { Axis, DragState, Rotation } from "../src/core/types";

// ImageCarousel.handlePointerDown의 스냅샷 부분만 흉내 낸다 (포인터 시작 좌표는 0, 0)
export function startDrag(rotation: Rotation): DragState {
  return {
    isDragging: true,
    pointerId: 1,
    startX: 0,
    startY: 0,
    startRotX: rotation.x,
    startRotY: rotation.y,
    axis: null,
  };
}

export interface Gesture {
  start: Rotation; // pointerdown 시점의 회전값
  moves: [number, number][]; // 포인터 시작점 기준 누적 이동량 (dx, dy)
  frames: number; // 손을 뗀 뒤 자동 회전을 진행할 프레임 수 (60fps)
}

const AUTO_ROTATE_SPEED = 0.2; // CylinderCarousel이 넘기는 값과 동일
const FRAME_DELTA = 1 / 60;

// 한 제스처를 재생한다. 이동 처리는 컴포넌트와 같은 dragMove를 호출한다
export function replay(gesture: Gesture): { axis: Axis | null; rotation: Rotation } {
  const rotation = { ...gesture.start };
  const drag = startDrag(rotation);
  for (const [dx, dy] of gesture.moves) dragMove(drag, rotation, dx, dy);
  const axis = drag.axis;

  // pointerup: ImageCarousel.onPointerUp과 같은 필드를 초기화
  drag.isDragging = false;
  drag.axis = null;
  drag.pointerId = null;

  for (let i = 0; i < gesture.frames; i++) autoRotate(rotation, AUTO_ROTATE_SPEED, FRAME_DELTA);
  return { axis, rotation };
}
