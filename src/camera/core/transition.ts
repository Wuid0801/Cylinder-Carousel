import type { CameraPose } from "./types";
import { lerp } from "./vec3";

export type EasingName = "linear" | "easeInOutCubic" | "easeOutQuad" | "easeOutBack";

export const EASINGS: Record<EasingName, (x: number) => number> = {
  linear: (x) => x,
  easeInOutCubic: (x) => (x < 0.5 ? 4 * x ** 3 : 1 - (-2 * x + 2) ** 3 / 2),
  easeOutQuad: (x) => 1 - (1 - x) * (1 - x),
  // 목표를 살짝 지나쳤다 돌아온다
  easeOutBack: (x) => {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * (x - 1) ** 3 + c1 * (x - 1) ** 2;
  },
};

export const EASING_NAMES = Object.keys(EASINGS) as EasingName[];

// 목표는 저장하지 않는다. 트램처럼 움직이는 목표를 매 프레임 넘겨받아 그쪽으로 보간한다
export interface Transition {
  from: CameraPose;
  elapsed: number;
  duration: number;
  easing: EasingName;
}

export function startTransition(from: CameraPose, duration: number, easing: EasingName): Transition {
  return { from, elapsed: 0, duration, easing };
}

export function stepTransition(tr: Transition, dt: number, to: CameraPose): { pose: CameraPose; done: boolean; next: Transition } {
  const next = { ...tr, elapsed: tr.elapsed + dt };
  const x = next.duration <= 0 ? 1 : Math.min(1, next.elapsed / next.duration);
  const k = EASINGS[next.easing](x);
  return {
    pose: { position: lerp(tr.from.position, to.position, k), target: lerp(tr.from.target, to.target, k) },
    done: x >= 1,
    next,
  };
}
