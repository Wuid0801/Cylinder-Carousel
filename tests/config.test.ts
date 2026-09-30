import { describe, expect, it } from "vitest";
import { DEFAULT_CONFIG, pickImages } from "../src/core/config";

describe("DEFAULT_CONFIG", () => {
  it("기본값은 조절 기능을 넣기 전의 고정값과 같다", () => {
    expect(DEFAULT_CONFIG).toEqual({
      cylinderRadius: 5.5,
      imageHeight: 5,
      gapDeg: 12,
      imageCount: null,
      autoRotateSpeed: 0.2,
      rotateSpeed: 0.01,
      axisLockThreshold: 6,
      fov: 38,
      cameraDistance: 11,
      cameraHeight: 0.2,
      scale: 0.55,
      panelSegments: 128,
      lightScale: 1,
    });
  });
});

describe("pickImages", () => {
  const images = ["a", "b", "c"];

  it("장수를 지정하지 않으면 세트 이미지를 그대로 쓴다", () => {
    expect(pickImages(images, null)).toBe(images);
  });

  it("세트보다 많으면 처음부터 반복한다", () => {
    expect(pickImages(images, 7)).toEqual(["a", "b", "c", "a", "b", "c", "a"]);
  });

  it("세트보다 적으면 앞에서부터 자른다", () => {
    expect(pickImages(images, 2)).toEqual(["a", "b"]);
  });

  it("세트가 비어 있으면 빈 배열을 돌려준다", () => {
    expect(pickImages([], 5)).toEqual([]);
  });
});
