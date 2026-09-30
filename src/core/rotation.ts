import type { Axis, DragState, Rotation } from "./types";

export const ROTATE_SPEED = 0.01; // 포인터 1px당 회전량 (rad)
export const AXIS_LOCK_THRESHOLD = 6; // 축을 정하기 전까지 무시하는 이동 거리 (px)

export interface DragParams {
  rotateSpeed: number;
  axisLockThreshold: number;
}

const DEFAULT_DRAG_PARAMS: DragParams = { rotateSpeed: ROTATE_SPEED, axisLockThreshold: AXIS_LOCK_THRESHOLD };

// 임계값을 넘기 전엔 null, 넘으면 더 크게 움직인 방향의 축 (동률은 가로 우선)
export function resolveAxis(dx: number, dy: number, threshold = AXIS_LOCK_THRESHOLD): Axis | null {
  if (Math.abs(dx) < threshold && Math.abs(dy) < threshold) return null;
  return Math.abs(dx) >= Math.abs(dy) ? "y" : "x";
}

// x축으로 90°를 넘게 기울면 원통 축이 뒤집혀 같은 방향 드래그가 반대로 돈다. 이때 -1로 보정한다
export function yawFlip(rotX: number): 1 | -1 {
  return Math.cos(rotX) < 0 ? -1 : 1;
}

// pointermove 한 번의 처리. 이벤트마다 더하지 않고 제스처 시작값 + 누적 이동량으로 절대 계산한다.
// 좌우 보정은 시작 시점의 x로 고정해 드래그 도중 방향이 바뀌지 않게 한다.
export function dragMove(drag: DragState, rotation: Rotation, dx: number, dy: number, params: DragParams = DEFAULT_DRAG_PARAMS): void {
  if (!drag.axis) {
    const axis = resolveAxis(dx, dy, params.axisLockThreshold);
    if (!axis) return;
    drag.axis = axis;
  }

  if (drag.axis === "y") {
    rotation.y = drag.startRotY + dx * params.rotateSpeed * yawFlip(drag.startRotX);
  } else {
    rotation.x = drag.startRotX + dy * params.rotateSpeed;
  }
}

// 드래그 중이 아닐 때 매 프레임 호출한다. 좌우 보정은 현재 x 기준
export function autoRotate(rotation: Rotation, speed: number, delta: number): void {
  rotation.y += speed * delta * yawFlip(rotation.x);
}
