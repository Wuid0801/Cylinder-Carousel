import { CatmullRomCurve3, Vector3 } from "three";
import { describe, expect, it } from "vitest";
import { createPath, type Path } from "../../src/camera/core/path";
import { distance, length, type Vec3 } from "../../src/camera/core/vec3";

// 제어점 간격이 고르지 않아 곡선 매개변수 속도가 크게 달라지는 선로 (각 구간이 x 방향으로 단조)
const UNEVEN: Vec3[] = [
  [0, 0, 0],
  [5, 0, 1],
  [20, 0, -2],
  [26, 0, 2],
  [40, 0, 0],
];

const threeCurve = (points: Vec3[], tension: number) =>
  new CatmullRomCurve3(points.map((p) => new Vector3(...p)), false, "catmullrom", tension);

// 같은 u 간격으로 100걸음 걸었을 때 한 걸음 거리의 (최대 − 최소) / 평균
function stepSpread(path: Path): number {
  const steps: number[] = [];
  let prev = path.getPointAt(0);
  for (let i = 1; i <= 100; i++) {
    const p = path.getPointAt(i / 100);
    steps.push(distance(p, prev));
    prev = p;
  }
  const mean = steps.reduce((a, b) => a + b, 0) / steps.length;
  return (Math.max(...steps) - Math.min(...steps)) / mean;
}

describe("createPath", () => {
  it("제어점을 지난다", () => {
    const path = createPath(UNEVEN, { tension: 0.5, arcLength: false });
    UNEVEN.forEach((point, i) => {
      const p = path.getPoint(i / (UNEVEN.length - 1));
      p.forEach((v, k) => expect(v).toBeCloseTo(point[k], 10));
    });
  });

  for (const tension of [0.5, 0.2]) {
    it(`three CatmullRomCurve3(catmullrom, tension ${tension})와 같은 점을 돌려준다`, () => {
      const path = createPath(UNEVEN, { tension, arcLength: false });
      const curve = threeCurve(UNEVEN, tension);
      for (let k = 0; k <= 40; k++) {
        const ours = path.getPoint(k / 40);
        const theirs = curve.getPoint(k / 40);
        expect(ours[0]).toBeCloseTo(theirs.x, 9);
        expect(ours[1]).toBeCloseTo(theirs.y, 9);
        expect(ours[2]).toBeCloseTo(theirs.z, 9);
      }
    });
  }

  it("전체 길이가 three getLength()와 같다", () => {
    const path = createPath(UNEVEN, { tension: 0.5, arcLength: true });
    expect(path.length).toBeCloseTo(threeCurve(UNEVEN, 0.5).getLength(), 6);
  });

  it("호 길이 보정을 켜면 같은 u 간격의 이동 거리가 일정하고, 끄면 크게 달라진다", () => {
    const on = createPath(UNEVEN, { tension: 0.5, arcLength: true });
    const off = createPath(UNEVEN, { tension: 0.5, arcLength: false });
    expect(stepSpread(on)).toBeLessThan(0.02); // ±1%
    expect(stepSpread(off)).toBeGreaterThan(0.3);
  });

  it("접선은 진행 방향의 단위 벡터다", () => {
    const straight = createPath(
      [
        [0, 0, 0],
        [10, 0, 0],
        [20, 0, 0],
      ],
      { tension: 0.5, arcLength: true },
    );
    const tangent = straight.getTangentAt(0.5);
    expect(length(tangent)).toBeCloseTo(1, 9);
    expect(tangent[0]).toBeCloseTo(1, 9);
  });

  it("제어점이 2개 미만이면 에러를 던진다", () => {
    expect(() => createPath([[0, 0, 0]], { tension: 0.5, arcLength: true })).toThrow();
  });
});
