import { describe, expect, it } from "vitest";
import { createRandom } from "../../src/camera/core/random";

const take = (random: () => number, n: number) => Array.from({ length: n }, () => random());

describe("createRandom", () => {
  it("같은 시드는 같은 수열을 만든다", () => {
    expect(take(createRandom(7), 10)).toEqual(take(createRandom(7), 10));
  });

  it("값은 [0, 1) 범위이고 시드가 다르면 수열이 다르다", () => {
    const values = take(createRandom(7), 1000);
    values.forEach((v) => {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    });
    expect(take(createRandom(8), 10)).not.toEqual(values.slice(0, 10));
  });
});
