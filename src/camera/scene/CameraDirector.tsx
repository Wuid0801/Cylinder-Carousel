import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef, type RefObject } from "react";
import { PerspectiveCamera, type Group } from "three";
import { FIXED_DAMP_RATIO, type CameraConfig } from "../core/config";
import { damp, dampFixed } from "../core/follow";
import { stepMotion, type MotionState } from "../core/motion";
import type { Path } from "../core/path";
import { besidePose } from "../core/rig";
import { startTransition, stepTransition, type Transition } from "../core/transition";
import type { CameraInspect, CameraMode, CameraPose } from "../core/types";
import { headingY } from "../core/world";

const MAX_DT = 0.1; // 탭 전환 뒤 첫 프레임의 긴 dt로 순간이동하는 것을 막는다

interface CameraDirectorProps {
  path: Path;
  stations: number[];
  mode: CameraMode;
  config: CameraConfig;
  inputRef: RefObject<-1 | 0 | 1>;
  scrollRef: RefObject<number>;
  tramRef: RefObject<Group | null>;
  inspectRef?: RefObject<CameraInspect | null>;
}

// 카메라와 트램에 값을 쓰는 유일한 곳
export function CameraDirector({ path, stations, mode, config, inputRef, scrollRef, tramRef, inspectRef }: CameraDirectorProps) {
  const camera = useThree((state) => state.camera);

  const motionRef = useRef<MotionState>({ s: 0, v: 0 });
  const actualRef = useRef<CameraPose | null>(null);
  const transitionRef = useRef<Transition | null>(null);
  const stationRef = useRef<number | null>(null);
  const modeRef = useRef<CameraMode>(mode);
  const infoRef = useRef<CameraInspect>({
    mode,
    t: 0,
    s: 0,
    v: 0,
    station: null,
    actual: { position: [0, 0, 0], target: [0, 0, -1] },
    desired: { position: [0, 0, 0], target: [0, 0, -1] },
    transition: { active: false, progress: 1 },
  });

  useEffect(() => {
    if (!inspectRef) return;
    const own = infoRef.current;
    inspectRef.current = own;
    return () => {
      // 다른 인스턴스가 이미 등록했다면 지우지 않는다
      if (inspectRef.current === own) inspectRef.current = null;
    };
  }, [inspectRef]);

  const rig = (u: number) => besidePose(path, u, { side: config.side, height: config.height, lookAhead: config.lookAhead });
  // 역 근접 시점: 옆 거리·높이를 절반으로 줄여 역 지점을 바라본다
  const closeup = (u: number) => besidePose(path, u, { side: config.side / 2, height: config.height / 2, lookAhead: 0 });
  const beginTransition = (from: CameraPose | null) => {
    if (from) transitionRef.current = startTransition(from, config.transitionDuration, config.easing);
  };

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, MAX_DT);
    const L = path.length;
    const input = inputRef.current;
    const prev = actualRef.current;

    // 모드가 바뀐 첫 프레임: 선로 위 위치를 이어받고 현재 자세에서 새 모드로 전환을 시작한다
    if (modeRef.current !== mode) {
      if (mode === "follow") motionRef.current = { s: scrollRef.current * L, v: 0 };
      beginTransition(prev);
      stationRef.current = null;
      modeRef.current = mode;
    }

    let t: number;
    let desired: CameraPose;
    let actual: CameraPose;

    if (mode === "ride") {
      t = scrollRef.current;
      desired = rig(t);
      actual = desired; // 보간: 진행도가 정한 자세를 그대로 쓴다
    } else {
      motionRef.current = stepMotion(motionRef.current, input, config, dt, L);
      const { s, v } = motionRef.current;
      t = s / L;

      const near = stations.findIndex((u) => Math.abs(u * L - s) <= config.stationRange);
      if (stationRef.current === null && near >= 0 && input === 0 && Math.abs(v) < config.stopSpeed) {
        stationRef.current = near;
        beginTransition(prev);
      } else if (stationRef.current !== null && (input !== 0 || Math.abs(v) >= config.stopSpeed)) {
        stationRef.current = null;
        beginTransition(prev);
      }

      if (stationRef.current !== null) {
        desired = closeup(stations[stationRef.current]);
        actual = desired;
      } else {
        desired = rig(t);
        const from = prev ?? desired;
        // 감쇠: 목표 자세를 매 프레임 쫓아간다
        actual =
          config.dampMode === "exp"
            ? { position: damp(from.position, desired.position, config.damping, dt), target: damp(from.target, desired.target, config.damping, dt) }
            : { position: dampFixed(from.position, desired.position, FIXED_DAMP_RATIO), target: dampFixed(from.target, desired.target, FIXED_DAMP_RATIO) };
      }
    }

    // 전환 중이면 모드 계산 결과보다 우선한다. 끝나면 추적은 현재 자세에서 감쇠가 이어져 튀지 않는다
    const tr = transitionRef.current;
    if (tr) {
      const step = stepTransition(tr, dt, desired);
      actual = step.pose;
      transitionRef.current = step.done ? null : step.next;
    }

    actualRef.current = actual;
    camera.position.set(...actual.position);
    camera.lookAt(...actual.target);
    if (camera instanceof PerspectiveCamera && camera.fov !== config.fov) {
      camera.fov = config.fov;
      camera.updateProjectionMatrix();
    }

    const tram = tramRef.current;
    if (tram) {
      const u = motionRef.current.s / L;
      tram.position.set(...path.getPointAt(u));
      tram.rotation.y = headingY(path.getTangentAt(u));
    }

    const info = infoRef.current;
    const current = transitionRef.current;
    info.mode = mode;
    info.t = t;
    info.s = motionRef.current.s;
    info.v = motionRef.current.v;
    info.station = stationRef.current;
    info.actual = actual;
    info.desired = desired;
    info.transition.active = current !== null;
    info.transition.progress = current ? Math.min(1, current.elapsed / Math.max(current.duration, 1e-6)) : 1;
  });

  return null;
}
