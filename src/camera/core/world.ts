import type { Path } from "./path";
import { createRandom } from "./random";
import { add, cross, normalize, scale, type Vec3 } from "./vec3";

// 완만한 S자 선로 (x −60 → 60, 약간의 높낮이). 길이 약 120
export const TRACK_POINTS: Vec3[] = [
  [-60, 0, 0],
  [-43, 0.3, -4],
  [-26, 0.8, 2],
  [-9, 0.5, -3],
  [8, 0, 1],
  [25, 0.6, -4],
  [42, 1, 0],
  [60, 0.4, -2],
];

export const STATIONS = [0.2, 0.55, 0.85]; // 역 위치 (진행도)

const UP: Vec3 = [0, 1, 0];

// 진행 방향 오른쪽 = 카메라가 서는 쪽 (+x로 달리면 +z)
export function sideOf(tangent: Vec3): Vec3 {
  return normalize(cross(tangent, UP));
}

// 로컬 +x가 접선을 향하도록 하는 y축 회전
export function headingY(tangent: Vec3): number {
  return Math.atan2(-tangent[2], tangent[0]);
}

export type PropKind = "tree" | "hill";

export interface Prop {
  kind: PropKind;
  position: Vec3;
  scale: number;
}

export interface Band {
  kind: PropKind;
  zMin: number;
  zMax: number;
  spacing: number;
  scaleMin: number;
  scaleMax: number;
}

// 선로(z −4~2) 뒤쪽의 세 깊이 띠. 멀수록 크고 드문드문하며, 안개에 더 옅어진다
export const BANDS: Band[] = [
  { kind: "tree", zMin: -14, zMax: -10, spacing: 4, scaleMin: 0.8, scaleMax: 1.4 },
  { kind: "tree", zMin: -30, zMax: -18, spacing: 5, scaleMin: 1.2, scaleMax: 2 },
  { kind: "hill", zMin: -75, zMax: -45, spacing: 22, scaleMin: 8, scaleMax: 14 },
];

const X_MIN = -75;
const X_MAX = 75;

export function layoutScenery(seed: number): Prop[] {
  const random = createRandom(seed);
  const between = (a: number, b: number) => a + (b - a) * random();
  const props: Prop[] = [];
  for (const band of BANDS) {
    for (let x = X_MIN; x <= X_MAX; x += band.spacing) {
      props.push({
        kind: band.kind,
        position: [x + between(-0.4, 0.4) * band.spacing, 0, between(band.zMin, band.zMax)],
        scale: between(band.scaleMin, band.scaleMax),
      });
    }
  }
  return props;
}

const FOREGROUND_SPACING = 14;

// 선로와 카메라 사이의 작은 나무. 카메라 바로 앞을 빠르게 지나가 시차를 크게 만든다.
// 선로가 휘어도 카메라와 부딪히지 않도록 선로 기준으로 놓는다
export function layoutForeground(path: Path, seed: number): Prop[] {
  const random = createRandom(seed + 1);
  const count = Math.floor(path.length / FOREGROUND_SPACING);
  return Array.from({ length: count }, (_, i) => {
    const u = (i + 0.5) / count;
    const base = path.getPointAt(u);
    const offset = 3.5 + 1.5 * random();
    return { kind: "tree" as const, position: add(base, scale(sideOf(path.getTangentAt(u)), offset)), scale: 0.4 + 0.3 * random() };
  });
}

export interface Placement {
  position: Vec3;
  rotationY: number;
}

// spacing 간격으로 선로 위 자리와 방향 (침목 배치에 사용)
export function alongTrack(path: Path, spacing: number): Placement[] {
  const count = Math.floor(path.length / spacing + 1e-9);
  return Array.from({ length: count + 1 }, (_, i) => {
    const u = Math.min(1, (i * spacing) / path.length);
    return { position: path.getPointAt(u), rotationY: headingY(path.getTangentAt(u)) };
  });
}

// 레일 두 줄을 LineSegments용 좌표 배열로 만든다: [왼쪽 선분, 오른쪽 선분] × samples
export function railSegments(path: Path, gauge: number, samples: number): number[] {
  const result: number[] = [];
  let prev: [Vec3, Vec3] | null = null;
  for (let i = 0; i <= samples; i++) {
    const u = i / samples;
    const base = path.getPointAt(u);
    const side = sideOf(path.getTangentAt(u));
    const left = add(base, scale(side, -gauge));
    const right = add(base, scale(side, gauge));
    if (prev) result.push(...prev[0], ...left, ...prev[1], ...right);
    prev = [left, right];
  }
  return result;
}

// 역: 선로 뒤쪽(카메라 반대편)에 승강장, 그 뒤에 집
export function stationSpot(path: Path, u: number): { platform: Vec3; house: Vec3; rotationY: number } {
  const base = path.getPointAt(u);
  const tangent = path.getTangentAt(u);
  const back = scale(sideOf(tangent), -1);
  return { platform: add(base, scale(back, 1.8)), house: add(base, scale(back, 6)), rotationY: headingY(tangent) };
}
