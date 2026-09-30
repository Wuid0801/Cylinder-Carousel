import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { dragMove } from "../src/core/rotation";
import type { Axis } from "../src/core/types";
import fixtures from "./fixtures/gestures.json";
import { replay, startDrag, type Gesture } from "./helpers";

interface GestureFixture extends Gesture {
  name: string;
  expect: { axis: Axis | null; x: number; y: number };
}

describe("기록된 제스처 재생", () => {
  for (const fixture of fixtures as GestureFixture[]) {
    it(fixture.name, () => {
      const { axis, rotation } = replay(fixture);
      expect(axis).toBe(fixture.expect.axis);
      expect(rotation.x).toBeCloseTo(fixture.expect.x);
      expect(rotation.y).toBeCloseTo(fixture.expect.y);
    });
  }
});

const startArb = fc.record({
  x: fc.double({ min: -10, max: 10, noNaN: true }),
  y: fc.double({ min: -10, max: 10, noNaN: true }),
});
const movesArb = fc.array(fc.tuple(fc.integer({ min: -300, max: 300 }), fc.integer({ min: -300, max: 300 })), {
  minLength: 1,
  maxLength: 30,
});

describe("임의 제스처 property", () => {
  it("한 제스처 안에서는 x와 y 중 한 축만 바뀐다", () => {
    fc.assert(
      fc.property(startArb, movesArb, (start, moves) => {
        const { rotation } = replay({ start, moves, frames: 0 });
        const changedX = rotation.x !== start.x;
        const changedY = rotation.y !== start.y;
        return !(changedX && changedY);
      }),
    );
  });

  it("최종 회전값은 시작값·잠긴 축·마지막 이동량만으로 결정된다 (중간 경로와 무관)", () => {
    fc.assert(
      fc.property(startArb, movesArb, (start, moves) => {
        const full = replay({ start, moves, frames: 0 });
        if (!full.axis) return true;

        const [lastDx, lastDy] = moves[moves.length - 1];
        const direct = { ...start };
        dragMove({ ...startDrag(direct), axis: full.axis }, direct, lastDx, lastDy);
        return direct.x === full.rotation.x && direct.y === full.rotation.y;
      }),
    );
  });
});
