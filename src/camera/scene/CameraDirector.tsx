import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef, type RefObject } from "react";
import { PerspectiveCamera, Vector3, type Group } from "three";
import { pickSnapStation, stepSnap } from "../core/arrival";
import { startAutoRun, stepAutoRun, type AutoRunState } from "../core/autorun";
import { FIXED_DAMP_RATIO, type CameraConfig } from "../core/config";
import { damp, dampFixed } from "../core/follow";
import { stepMotion, type MotionState } from "../core/motion";
import type { Path } from "../core/path";
import { besidePose, rideCameraS, visibleHalfWidth } from "../core/rig";
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
  onSnapChange?: (station: number | null) => void; // 강조할 역이 바뀔 때만 호출된다
}

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

// 카메라와 트램에 값을 쓰는 유일한 곳
export function CameraDirector({ path, stations, mode, config, inputRef, scrollRef, tramRef, inspectRef, onSnapChange }: CameraDirectorProps) {
  const camera = useThree((state) => state.camera);
  const size = useThree((state) => state.size);

  const motionRef = useRef<MotionState>({ s: 0, v: 0 });
  const actualRef = useRef<CameraPose | null>(null);
  const transitionRef = useRef<Transition | null>(null);
  const stationRef = useRef<number | null>(null);
  // 감쇠 추적 자세. 전환 중에도 계속 갱신해 전환의 목표로 쓰므로, 전환이 끝나도 추적 속도가 끊기지 않는다
  const followRef = useRef<CameraPose | null>(null);
  const autoRef = useRef<AutoRunState | null>(null); // 경로 탑승 자동 운행
  const snapRef = useRef<number | null>(null); // 트램 추적에서 손을 뗀 뒤 흡착 중인 역
  const highlightRef = useRef<number | null>(null);
  const modeRef = useRef<CameraMode>(mode);
  const ndc = useRef(new Vector3());
  const infoRef = useRef<CameraInspect>({
    mode,
    t: 0,
    s: 0,
    v: 0,
    station: null,
    snap: null,
    dwell: 0,
    tramNdcX: 0,
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
    if (!from) return;
    transitionRef.current = startTransition(from, config.transitionDuration, config.easing);
    followRef.current = from; // 추적은 전환이 시작된 자세에서부터 쌓는다
  };

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, MAX_DT);
    const L = path.length;
    const stationsS = stations.map((u) => u * L);
    const input = inputRef.current;
    const prev = actualRef.current;

    // 모드가 바뀐 첫 프레임: 트램은 그 자리에 두고, 현재 자세에서 새 모드로 전환을 시작한다
    if (modeRef.current !== mode) {
      beginTransition(prev);
      stationRef.current = null;
      snapRef.current = null;
      autoRef.current = null;
      modeRef.current = mode;
    }

    let t: number;
    let desired: CameraPose;
    let actual: CameraPose;
    let highlight: number | null;

    if (mode === "ride") {
      // 트램은 역을 오가며 스스로 달린다
      if (!autoRef.current) autoRef.current = startAutoRun(motionRef.current.s, stationsS);
      const run = stepAutoRun(
        motionRef.current,
        autoRef.current,
        stationsS,
        { maxSpeed: config.autoSpeed, accel: config.accel, brake: config.brake, dwellTime: config.dwellTime },
        dt,
      );
      motionRef.current = run.motion;
      autoRef.current = run.auto;
      highlight = run.auto.index;

      // 카메라는 트램이 화면 안에 있는 범위에서만 스크롤로 앞뒤로 움직인다 (보간: 트램에 딱 붙어 이동)
      const halfWidth = visibleHalfWidth(config.side, config.fov, size.width / Math.max(1, size.height));
      const cameraS = rideCameraS(motionRef.current.s, scrollRef.current, config.lookAhead * L, halfWidth, config.rideMargin);
      t = clamp01(cameraS / L);
      desired = rig(t);
      actual = desired;
    } else {
      // 손을 떼면 진행 방향 앞쪽의 역 중앙에 선다. 누르고 있는 동안에는 역을 그냥 지나간다
      if (input !== 0) snapRef.current = null;
      else if (snapRef.current === null) snapRef.current = pickSnapStation(motionRef.current, stationsS, config.brake, config.snapRange);

      motionRef.current =
        snapRef.current !== null
          ? stepSnap(motionRef.current, stationsS[snapRef.current], config, dt)
          : stepMotion(motionRef.current, input, config, dt, L);
      const { s, v } = motionRef.current;
      t = s / L;
      // 누르고 있는 동안에는 "지금 손을 떼면 설 역"을 미리 보여 준다
      highlight = input !== 0 ? pickSnapStation(motionRef.current, stationsS, config.brake, config.snapRange) : snapRef.current;

      const near = stationsS.findIndex((x) => Math.abs(x - s) <= config.stationRange);
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
        const from = followRef.current ?? prev ?? desired;
        // 감쇠: 목표 자세를 매 프레임 쫓아간다
        actual =
          config.dampMode === "exp"
            ? { position: damp(from.position, desired.position, config.damping, dt), target: damp(from.target, desired.target, config.damping, dt) }
            : { position: dampFixed(from.position, desired.position, FIXED_DAMP_RATIO), target: dampFixed(from.target, desired.target, FIXED_DAMP_RATIO) };
        followRef.current = actual;
      }
    }

    // 전환 중이면 모드 계산 결과(actual)를 목표로 보간한다. 추적에서는 감쇠 자세를 향하므로 끝나는 순간 그대로 이어진다
    const tr = transitionRef.current;
    if (tr) {
      const step = stepTransition(tr, dt, actual);
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

    const u = motionRef.current.s / L;
    const tramPosition = path.getPointAt(u);
    const tram = tramRef.current;
    if (tram) {
      tram.position.set(...tramPosition);
      tram.rotation.y = headingY(path.getTangentAt(u));
    }

    if (highlightRef.current !== highlight) {
      highlightRef.current = highlight;
      onSnapChange?.(highlight);
    }

    camera.updateMatrixWorld();
    const info = infoRef.current;
    const current = transitionRef.current;
    info.mode = mode;
    info.t = t;
    info.s = motionRef.current.s;
    info.v = motionRef.current.v;
    info.station = stationRef.current;
    info.snap = highlight;
    info.dwell = mode === "ride" && autoRef.current ? autoRef.current.dwell : 0;
    info.tramNdcX = ndc.current.set(...tramPosition).project(camera).x;
    info.actual = actual;
    info.desired = desired;
    info.transition.active = current !== null;
    info.transition.progress = current ? Math.min(1, current.elapsed / Math.max(current.duration, 1e-6)) : 1;
  });

  return null;
}
