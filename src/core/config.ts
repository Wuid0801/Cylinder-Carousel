import { AXIS_LOCK_THRESHOLD, ROTATE_SPEED } from "./rotation";

// 화면에서 조절할 수 있는 값 전체. 기본값은 조절 기능을 넣기 전의 고정값과 같다
export interface CarouselConfig {
  cylinderRadius: number;
  imageHeight: number;
  gapDeg: number;
  imageCount: number | null; // null이면 세트의 이미지 장수를 그대로 쓴다
  autoRotateSpeed: number;
  rotateSpeed: number;
  axisLockThreshold: number;
  fov: number;
  cameraDistance: number;
  cameraHeight: number;
  scale: number;
  panelSegments: number;
  lightScale: number; // 조명 세기 배율
}

export const DEFAULT_CONFIG: CarouselConfig = {
  cylinderRadius: 5.5,
  imageHeight: 5,
  gapDeg: 12,
  imageCount: null,
  autoRotateSpeed: 0.2,
  rotateSpeed: ROTATE_SPEED,
  axisLockThreshold: AXIS_LOCK_THRESHOLD,
  fov: 38,
  cameraDistance: 11,
  cameraHeight: 0.2,
  scale: 0.55,
  panelSegments: 128,
  lightScale: 1,
};

// 세트 이미지를 count장으로 맞춘다. 모자라면 처음부터 반복하고, 넘치면 앞에서부터 자른다
export function pickImages(images: string[], count: number | null): string[] {
  if (count === null) return images;
  if (images.length === 0) return [];
  return Array.from({ length: count }, (_, i) => images[i % images.length]);
}
