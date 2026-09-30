import { describe, expect, it } from "vitest";
import { autoRotate, dragMove, resolveAxis, yawFlip } from "../src/core/rotation";
import { startDrag } from "./helpers";

describe("resolveAxis", () => {
  it("두 축 모두 6px 미만이면 축을 정하지 않는다", () => {
    expect(resolveAxis(5, 5)).toBeNull();
    expect(resolveAxis(-5, 5)).toBeNull();
  });

  it("6px을 넘으면 더 크게 움직인 방향의 축으로 정한다", () => {
    expect(resolveAxis(6, 2)).toBe("y");
    expect(resolveAxis(-6, 2)).toBe("y");
    expect(resolveAxis(2, 6)).toBe("x");
  });

  it("가로·세로 이동량이 같으면 가로(y축 회전)를 우선한다", () => {
    expect(resolveAxis(6, 6)).toBe("y");
  });
});

describe("yawFlip", () => {
  it("원통이 뒤집히지 않았으면 1, 뒤집혔으면(cos(x) < 0) -1", () => {
    expect(yawFlip(0)).toBe(1);
    expect(yawFlip(Math.PI / 2)).toBe(1); // cos가 아주 작은 양수
    expect(yawFlip(Math.PI)).toBe(-1);
    expect(yawFlip(2)).toBe(-1);
  });
});

describe("dragMove", () => {
  it("임계값 미만의 이동은 무시한다", () => {
    const rotation = { x: 0, y: 0 };
    const drag = startDrag(rotation);
    dragMove(drag, rotation, 3, -4);
    expect(drag.axis).toBeNull();
    expect(rotation).toEqual({ x: 0, y: 0 });
  });

  it("가로로 움직이면 y축을 시작값 + 이동량 × 0.01로 회전시킨다", () => {
    const rotation = { x: 0, y: 1 };
    const drag = startDrag(rotation);
    dragMove(drag, rotation, 50, 3);
    expect(drag.axis).toBe("y");
    expect(rotation.y).toBeCloseTo(1.5);
    expect(rotation.x).toBe(0);
  });

  it("한 번 잠긴 축은 반대 방향으로 크게 움직여도 바뀌지 않는다", () => {
    const rotation = { x: 0, y: 0 };
    const drag = startDrag(rotation);
    dragMove(drag, rotation, 50, 3);
    dragMove(drag, rotation, 50, 200);
    expect(drag.axis).toBe("y");
    expect(rotation.x).toBe(0);
    expect(rotation.y).toBeCloseTo(0.5);
  });

  it("세로로 움직이면 x축을 회전시키고 좌우 보정은 하지 않는다", () => {
    const rotation = { x: Math.PI, y: 0 };
    const drag = startDrag(rotation);
    dragMove(drag, rotation, 0, 100);
    expect(drag.axis).toBe("x");
    expect(rotation.x).toBeCloseTo(Math.PI + 1);
  });

  it("뒤집힌 상태에서는 가로 드래그 방향을 반전한다", () => {
    const rotation = { x: Math.PI, y: 0 };
    const drag = startDrag(rotation);
    dragMove(drag, rotation, 100, 0);
    expect(rotation.y).toBeCloseTo(-1);
  });

  it("좌우 보정은 현재 x가 아니라 제스처 시작 시점의 x로 판단한다", () => {
    const rotation = { x: Math.PI, y: 0 };
    const drag = startDrag(rotation);
    dragMove(drag, rotation, 100, 0);
    rotation.x = 0; // 현재 x가 바뀌어도
    dragMove(drag, rotation, 100, 0);
    expect(rotation.y).toBeCloseTo(-1); // 시작 시점(뒤집힘) 기준 유지
  });
});

describe("autoRotate", () => {
  it("speed × delta만큼 y축을 누적 회전시킨다", () => {
    const rotation = { x: 0, y: 0 };
    autoRotate(rotation, 0.2, 0.5);
    expect(rotation.y).toBeCloseTo(0.1);
  });

  it("좌우 보정은 현재 x 기준으로 한다", () => {
    const rotation = { x: Math.PI, y: 0 };
    autoRotate(rotation, 0.2, 0.5);
    expect(rotation.y).toBeCloseTo(-0.1);
  });
});

describe("드래그 감도·축 잠금 임계값 조절", () => {
  it("임계값을 올리면 그보다 짧은 이동은 무시한다", () => {
    expect(resolveAxis(10, 0, 20)).toBeNull();
    expect(resolveAxis(20, 0, 20)).toBe("y");
  });

  it("드래그 감도를 2배로 하면 같은 이동에 2배 회전한다", () => {
    const rotation = { x: 0, y: 0 };
    const drag = startDrag(rotation);
    dragMove(drag, rotation, 50, 0, { rotateSpeed: 0.02, axisLockThreshold: 6 });
    expect(rotation.y).toBeCloseTo(1);
  });

  it("dragMove에 넘긴 임계값으로 축을 정한다", () => {
    const rotation = { x: 0, y: 0 };
    const drag = startDrag(rotation);
    dragMove(drag, rotation, 10, 0, { rotateSpeed: 0.01, axisLockThreshold: 20 });
    expect(drag.axis).toBeNull();
    expect(rotation.y).toBe(0);
  });
});
