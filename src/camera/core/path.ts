import { add, distance, normalize, sub, type Vec3 } from "./vec3";

const ARC_SAMPLES = 200; // 호 길이 표의 구간 수 (three Curve.arcLengthDivisions와 같음)

export interface PathOptions {
  tension: number;
  arcLength: boolean; // true면 u를 "선로 위 거리 비율"로, false면 곡선 매개변수 그대로 쓴다
}

export interface Path {
  length: number;
  getPoint(t: number): Vec3; // 곡선 매개변수 t (0~1)
  getPointAt(u: number): Vec3;
  getTangentAt(u: number): Vec3; // 단위 벡터
}

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

// 양 끝 바깥의 가상 제어점: a를 기준으로 b의 반대쪽
const mirror = (a: Vec3, b: Vec3): Vec3 => add(a, sub(a, b));

// three CubicPoly.initCatmullRom과 같은 Hermite 계수
function catmullRom(x0: number, x1: number, x2: number, x3: number, tension: number, w: number): number {
  const t0 = tension * (x2 - x0);
  const t1 = tension * (x3 - x1);
  const c2 = -3 * x1 + 3 * x2 - 2 * t0 - t1;
  const c3 = 2 * x1 - 2 * x2 + t0 + t1;
  return x1 + t0 * w + c2 * w * w + c3 * w * w * w;
}

export function createPath(points: Vec3[], { tension, arcLength }: PathOptions): Path {
  if (points.length < 2) throw new Error("createPath: 제어점이 2개 이상 필요합니다");
  const n = points.length;

  const getPoint = (t: number): Vec3 => {
    const p = (n - 1) * clamp01(t);
    let i = Math.floor(p);
    let w = p - i;
    if (i >= n - 1) {
      i = n - 2;
      w = 1;
    }
    const p0 = i > 0 ? points[i - 1] : mirror(points[0], points[1]);
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = i + 2 < n ? points[i + 2] : mirror(points[n - 1], points[n - 2]);
    return [0, 1, 2].map((k) => catmullRom(p0[k], p1[k], p2[k], p3[k], tension, w)) as Vec3;
  };

  // 곡선 매개변수 기준으로 잘게 나눈 누적 거리 표
  const lengths = [0];
  let last = getPoint(0);
  for (let k = 1; k <= ARC_SAMPLES; k++) {
    const current = getPoint(k / ARC_SAMPLES);
    lengths.push(lengths[k - 1] + distance(current, last));
    last = current;
  }
  const total = lengths[ARC_SAMPLES];

  // u(거리 비율) → t(곡선 매개변수): 표에서 이분 탐색 후 구간 안은 선형 보간
  const uToT = (u: number): number => {
    const target = clamp01(u) * total;
    let lo = 0;
    let hi = ARC_SAMPLES;
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1;
      if (lengths[mid] <= target) lo = mid;
      else hi = mid;
    }
    const segment = lengths[hi] - lengths[lo];
    const fraction = segment > 0 ? (target - lengths[lo]) / segment : 0;
    return (lo + fraction) / ARC_SAMPLES;
  };

  const toT = (u: number) => (arcLength ? uToT(u) : clamp01(u));

  return {
    length: total,
    getPoint,
    getPointAt: (u) => getPoint(toT(u)),
    getTangentAt: (u) => {
      const t = toT(u);
      const d = 1e-4;
      return normalize(sub(getPoint(Math.min(1, t + d)), getPoint(Math.max(0, t - d))));
    },
  };
}
