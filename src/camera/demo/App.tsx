import { Canvas } from "@react-three/fiber";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { Group } from "three";
import { ErrorBoundary } from "../../shared/ErrorBoundary";
import { DEFAULT_CAMERA_CONFIG, type CameraConfig } from "../core/config";
import { createPath } from "../core/path";
import { progressToScroll, scrollToProgress } from "../core/scroll";
import type { CameraInspect, CameraMode } from "../core/types";
import { STATIONS, TRACK_POINTS } from "../core/world";
import { CameraDirector } from "../scene/CameraDirector";
import { Tram } from "../scene/Tram";
import { World } from "../scene/World";
import { CameraPanel } from "./CameraPanel";

type Direction = -1 | 0 | 1;

// E2E(Playwright)가 카메라 상태를 읽는 창구
declare global {
  interface Window {
    __camera?: {
      inspect: { current: CameraInspect | null };
      pathLength: () => number;
    };
  }
}

const HINTS: Record<CameraMode, string> = {
  ride: "트램이 역을 오가며 스스로 달립니다. 스크롤하면 트램이 화면 안에 있는 범위에서 카메라가 앞뒤로 움직입니다 (보간: 트램에 딱 붙어 이동)",
  follow: "화면 오른쪽·왼쪽을 누르고 있거나 → ← 키로 트램을 움직이세요. 카메라는 뒤따라옵니다 (감쇠). 역 앞에서 손을 떼면 노란 승강장 역 중앙에 섭니다",
};

export function App() {
  const [mode, setMode] = useState<CameraMode>("ride");
  const [config, setConfig] = useState<CameraConfig>(DEFAULT_CAMERA_CONFIG);
  const [snapStation, setSnapStation] = useState<number | null>(null); // 승강장을 강조할 역
  const path = useMemo(() => createPath(TRACK_POINTS, { tension: config.tension, arcLength: config.arcLength }), [config.tension, config.arcLength]);

  const inspectRef = useRef<CameraInspect | null>(null);
  const tramRef = useRef<Group>(null);
  const inputRef = useRef<Direction>(0);
  const keyDirRef = useRef<Direction>(0);
  const pointerDirRef = useRef<Direction>(0);
  const scrollRef = useRef(0.5);
  const centerScrollRef = useRef(true); // 경로 탑승에 들어올 때 스크롤을 가운데(트램이 화면 중앙)로 맞춘다
  const modeRef = useRef(mode);
  modeRef.current = mode;
  const pathRef = useRef(path);
  pathRef.current = path;

  useEffect(() => {
    window.__camera = { inspect: inspectRef, pathLength: () => pathRef.current.length };
  }, []);

  // 스크롤 → 진행도. 트램 추적 모드에서는 페이지를 잠가 두므로 무시한다
  useEffect(() => {
    const onScroll = () => {
      if (modeRef.current !== "ride") return;
      scrollRef.current = scrollToProgress(window.scrollY, document.documentElement.scrollHeight, window.innerHeight);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // 방향키. 창이 포커스를 잃으면 keyup을 못 받으므로 눌린 상태를 풀어 트램이 계속 가속하지 않게 한다
  useEffect(() => {
    const sync = () => {
      inputRef.current = pointerDirRef.current || keyDirRef.current;
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") keyDirRef.current = 1;
      else if (e.key === "ArrowLeft") keyDirRef.current = -1;
      else return;
      // 트램 추적 중에는 방향키가 트램 전용이다. 포커스된 슬라이더·선택 상자의 값이 함께 바뀌지 않게 막는다
      if (modeRef.current === "follow") e.preventDefault();
      sync();
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if ((e.key === "ArrowRight" && keyDirRef.current === 1) || (e.key === "ArrowLeft" && keyDirRef.current === -1)) {
        keyDirRef.current = 0;
        sync();
      }
    };
    const onBlur = () => {
      keyDirRef.current = 0;
      pointerDirRef.current = 0;
      sync();
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onBlur);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
    };
  }, []);

  const setPointerDir = (dir: Direction) => {
    pointerDirRef.current = dir;
    inputRef.current = dir || keyDirRef.current;
  };

  const switchMode = (next: CameraMode) => {
    if (next === mode) return;
    if (next === "ride") {
      scrollRef.current = 0.5;
      centerScrollRef.current = true;
    }
    setPointerDir(0);
    setMode(next);
  };

  // 트램 추적 모드에서는 페이지를 잠그고, 경로 탑승에 들어오면(처음 열 때 포함) 스크롤을 가운데로 맞춘다
  useLayoutEffect(() => {
    document.documentElement.style.overflow = mode === "follow" ? "hidden" : "";
    if (mode === "ride" && centerScrollRef.current) {
      window.scrollTo(0, progressToScroll(0.5, document.documentElement.scrollHeight, window.innerHeight));
      scrollRef.current = 0.5;
      centerScrollRef.current = false;
    }
  }, [mode]);

  return (
    <div className="cam">
      <ErrorBoundary>
        <Canvas className="cam_canvas" camera={{ fov: config.fov, near: 0.1, far: 500 }} style={{ position: "fixed", inset: 0 }}>
          <World path={path} stations={STATIONS} highlight={snapStation} fogNear={config.fogNear} fogFar={config.fogFar} />
          <Tram ref={tramRef} />
          <CameraDirector
            path={path}
            stations={STATIONS}
            mode={mode}
            config={config}
            inputRef={inputRef}
            scrollRef={scrollRef}
            tramRef={tramRef}
            inspectRef={inspectRef}
            onSnapChange={setSnapStation}
          />
        </Canvas>
      </ErrorBoundary>

      <header className="cam_bar">
        <h1>Camera Playground</h1>
        <nav>
          <a href="../">캐러셀</a>
        </nav>
        <div className="cam_modes" role="group" aria-label="모드">
          <button type="button" aria-pressed={mode === "ride"} onClick={() => switchMode("ride")}>
            경로 탑승
          </button>
          <button type="button" aria-pressed={mode === "follow"} onClick={() => switchMode("follow")}>
            트램 추적
          </button>
        </div>
      </header>

      <p className="cam_hint">{HINTS[mode]}</p>

      {mode === "follow" ? (
        <div className="cam_hold">
          {([-1, 1] as const).map((dir) => (
            <div
              key={dir}
              className="cam_hold_zone"
              data-dir={dir}
              onPointerDown={(e) => {
                e.currentTarget.setPointerCapture(e.pointerId);
                setPointerDir(dir);
              }}
              onPointerUp={() => setPointerDir(0)}
              onPointerCancel={() => setPointerDir(0)}
            />
          ))}
        </div>
      ) : null}

      <div className="cam_scroll" aria-hidden="true" />
      <CameraPanel config={config} onChange={setConfig} inspectRef={inspectRef} pathLength={path.length} />
    </div>
  );
}
