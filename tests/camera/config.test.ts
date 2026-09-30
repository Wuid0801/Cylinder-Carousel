import { describe, expect, it } from "vitest";
import { DEFAULT_CAMERA_CONFIG, FIXED_DAMP_RATIO } from "../../src/camera/core/config";

describe("DEFAULT_CAMERA_CONFIG", () => {
  it("스펙 §6의 기본값과 같다", () => {
    expect(DEFAULT_CAMERA_CONFIG).toEqual({
      side: 14,
      height: 2,
      lookAhead: 0.02,
      fov: 40,
      accel: 6,
      maxSpeed: 10,
      friction: 3,
      brake: 4,
      damping: 3,
      dampMode: "exp",
      transitionDuration: 1.2,
      easing: "easeInOutCubic",
      stopSpeed: 0.3,
      stationRange: 3,
      snapRange: 10,
      autoSpeed: 5,
      dwellTime: 2,
      rideMargin: 0.8,
      tension: 0.5,
      arcLength: true,
      fogNear: 20,
      fogFar: 90,
    });
    expect(FIXED_DAMP_RATIO).toBe(0.05);
  });
});
