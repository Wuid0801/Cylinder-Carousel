import { describe, expect, it } from "vitest";
import { add, cross, distance, length, lerp, normalize, scale, sub } from "../../src/camera/core/vec3";

describe("vec3", () => {
  it("더하기·빼기·스칼라 곱", () => {
    expect(add([1, 2, 3], [4, 5, 6])).toEqual([5, 7, 9]);
    expect(sub([4, 5, 6], [1, 2, 3])).toEqual([3, 3, 3]);
    expect(scale([1, -2, 3], 2)).toEqual([2, -4, 6]);
  });

  it("길이·거리·정규화 (길이 0이면 0 벡터)", () => {
    expect(length([3, 4, 0])).toBe(5);
    expect(distance([1, 1, 1], [1, 4, 5])).toBe(5);
    expect(normalize([0, 0, 5])).toEqual([0, 0, 1]);
    expect(normalize([0, 0, 0])).toEqual([0, 0, 0]);
  });

  it("외적: x × y = z", () => {
    expect(cross([1, 0, 0], [0, 1, 0])).toEqual([0, 0, 1]);
  });

  it("lerp는 t=0에서 a, t=1에서 b, 중간은 선형", () => {
    expect(lerp([0, 0, 0], [10, 20, 30], 0)).toEqual([0, 0, 0]);
    expect(lerp([0, 0, 0], [10, 20, 30], 1)).toEqual([10, 20, 30]);
    expect(lerp([0, 0, 0], [10, 20, 30], 0.5)).toEqual([5, 10, 15]);
  });
});
