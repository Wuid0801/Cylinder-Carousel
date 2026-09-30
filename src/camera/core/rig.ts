import type { Path } from "./path";
import type { CameraPose } from "./types";
import { add, distance, scale } from "./vec3";
import { sideOf } from "./world";

export interface RigParams {
  side: number; // 선로에서 카메라 쪽(진행 방향 오른쪽)으로 떨어진 거리
  height: number;
  lookAhead: number; // 진행도 단위로 얼마나 앞 지점을 볼지
}

// 선로 u 지점의 옆·위에 서서 u + lookAhead 지점을 보는 자세. 두 모드가 같은 함수를 쓴다
export function besidePose(path: Path, u: number, { side, height, lookAhead }: RigParams): CameraPose {
  const base = path.getPointAt(u);
  const tangent = path.getTangentAt(u);
  const position = add(add(base, scale(sideOf(tangent), side)), [0, height, 0]);
  let target = path.getPointAt(Math.min(1, u + lookAhead));
  // 위치와 시선이 겹치면 lookAt이 방향을 정할 수 없으므로 진행 방향을 본다
  if (distance(position, target) < 1e-6) target = add(position, tangent);
  return { position, target };
}

// 선로까지 거리 side에서 화면 가로 절반이 덮는 선로 길이 (tan(가로 시야/2) = 화면비 × tan(세로 시야/2))
export function visibleHalfWidth(side: number, fovDeg: number, aspect: number): number {
  return side * Math.tan((fovDeg * Math.PI) / 360) * aspect;
}

// 경로 탑승 카메라가 설 선로 위치. 스크롤 p(0~1)를 트램 기준 앞뒤 범위로 바꾼다.
// 카메라가 보는 지점은 (카메라 위치 + 앞보기 거리)이므로 p = 0.5면 트램이 화면 중앙, 0·1이면 가로 범위의 margin 지점에 온다
export function rideCameraS(tramS: number, p: number, lookAheadDistance: number, halfWidth: number, margin: number): number {
  return tramS - lookAheadDistance + (p - 0.5) * 2 * halfWidth * margin;
}
