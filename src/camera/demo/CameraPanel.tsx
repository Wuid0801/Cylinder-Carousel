import { useEffect, useRef, useState, type RefObject } from "react";
import { NumberField } from "../../shared/NumberField";
import { DEFAULT_CAMERA_CONFIG, type CameraConfig } from "../core/config";
import { EASING_NAMES, type EasingName } from "../core/transition";
import type { CameraInspect } from "../core/types";
import { distance } from "../core/vec3";

type NumericKey = { [K in keyof CameraConfig]: CameraConfig[K] extends number ? K : never }[keyof CameraConfig];

interface Field {
  key: NumericKey;
  label: string;
  min: number;
  max: number;
  step: number;
}

const GROUPS: { title: string; fields: Field[]; extra?: "dampMode" | "easing" | "arcLength" }[] = [
  {
    title: "카메라 배치 (두 모드 공통)",
    fields: [
      { key: "side", label: "옆 거리", min: 0, max: 20, step: 0.5 },
      { key: "height", label: "높이", min: 0, max: 15, step: 0.5 },
      { key: "lookAhead", label: "앞보기 (진행도)", min: 0, max: 0.2, step: 0.005 },
      { key: "fov", label: "시야각 (°)", min: 15, max: 90, step: 1 },
    ],
  },
  {
    title: "트램 움직임",
    fields: [
      { key: "accel", label: "가속", min: 0.5, max: 20, step: 0.5 },
      { key: "maxSpeed", label: "최고 속도", min: 1, max: 30, step: 0.5 },
      { key: "friction", label: "마찰", min: 0, max: 20, step: 0.5 },
      { key: "brake", label: "제동력 (역에 설 때)", min: 0.5, max: 20, step: 0.5 },
    ],
  },
  {
    title: "역 흡착 · 자동 운행",
    fields: [
      { key: "snapRange", label: "역 흡착 거리 (트램 추적)", min: 0, max: 30, step: 1 },
      { key: "autoSpeed", label: "자동 운행 속도 (경로 탑승)", min: 0.5, max: 20, step: 0.5 },
      { key: "dwellTime", label: "정차 시간 (초)", min: 0, max: 10, step: 0.5 },
      { key: "rideMargin", label: "카메라 범위 (화면 가로 대비)", min: 0, max: 1, step: 0.05 },
    ],
  },
  {
    title: "추적 (감쇠)",
    fields: [{ key: "damping", label: "감쇠 λ (클수록 바짝 붙음)", min: 0.1, max: 20, step: 0.1 }],
    extra: "dampMode",
  },
  {
    title: "시점 전환",
    fields: [
      { key: "transitionDuration", label: "지속 시간 (초)", min: 0, max: 5, step: 0.1 },
      { key: "stopSpeed", label: "정차 판정 속도", min: 0, max: 3, step: 0.05 },
      { key: "stationRange", label: "역 판정 거리", min: 0.5, max: 10, step: 0.5 },
    ],
    extra: "easing",
  },
  {
    title: "선로",
    fields: [{ key: "tension", label: "장력", min: 0, max: 1, step: 0.05 }],
    extra: "arcLength",
  },
  {
    title: "화면",
    fields: [
      { key: "fogNear", label: "안개 시작", min: 0, max: 100, step: 1 },
      { key: "fogFar", label: "안개 끝", min: 10, max: 300, step: 5 },
    ],
  },
];

interface CameraPanelProps {
  config: CameraConfig;
  onChange: (next: CameraConfig) => void;
  inspectRef: RefObject<CameraInspect | null>;
  pathLength: number;
}

export function CameraPanel({ config, onChange, inspectRef, pathLength }: CameraPanelProps) {
  const [open, setOpen] = useState(() => !window.matchMedia("(max-width: 800px)").matches);
  const statusRef = useRef<HTMLPreElement>(null);
  const set = <K extends keyof CameraConfig>(key: K, value: CameraConfig[K]) => onChange({ ...config, [key]: value });

  // 상태는 매 프레임 textContent로 직접 갱신한다 (React 리렌더 없음)
  useEffect(() => {
    let frame = 0;
    const tick = () => {
      const info = inspectRef.current;
      if (statusRef.current) {
        statusRef.current.textContent = info
          ? [
              `mode        ${info.mode}`,
              `t           ${info.t.toFixed(3)}`,
              `s / L       ${info.s.toFixed(1)} / ${pathLength.toFixed(1)}`,
              `v           ${info.v.toFixed(2)}`,
              `station     ${info.station ?? "-"}`,
              `snap        ${info.snap ?? "-"}`,
              `dwell       ${info.dwell > 0 ? info.dwell.toFixed(1) : "-"}`,
              `tram x      ${info.tramNdcX.toFixed(2)}`,
              `transition  ${info.transition.active ? `${Math.round(info.transition.progress * 100)}%` : "-"}`,
              `lag         ${distance(info.actual.position, info.desired.position).toFixed(2)}`,
            ].join("\n")
          : "loading…";
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [inspectRef, pathLength]);

  return (
    <details className="cam_panel" open={open} onToggle={(e) => setOpen(e.currentTarget.open)}>
      <summary>상태 · 값 바꿔 보기</summary>
      <pre ref={statusRef} className="cam_status" aria-label="카메라 상태" />

      {GROUPS.map((group) => (
        <div key={group.title} className="cam_group">
          <h3>{group.title}</h3>
          {group.fields.map((field) => (
            <label key={field.key} className="cam_field">
              <span>{field.label}</span>
              <NumberField name={field.key} value={config[field.key]} min={field.min} max={field.max} step={field.step} onChange={(v) => set(field.key, v)} />
            </label>
          ))}

          {group.extra === "dampMode" ? (
            <label className="cam_field">
              <span>감쇠 방식</span>
              <select name="dampMode" value={config.dampMode} onChange={(e) => set("dampMode", e.target.value as CameraConfig["dampMode"])}>
                <option value="exp">dt 반영 (1 − e^(−λ·dt))</option>
                <option value="fixed">프레임마다 고정 비율 (주사율에 따라 달라짐)</option>
              </select>
            </label>
          ) : null}

          {group.extra === "easing" ? (
            <label className="cam_field">
              <span>속도 변화 방식</span>
              <select name="easing" value={config.easing} onChange={(e) => set("easing", e.target.value as EasingName)}>
                {EASING_NAMES.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          {group.extra === "arcLength" ? (
            <label className="cam_field">
              <span>
                <input type="checkbox" name="arcLength" checked={config.arcLength} onChange={(e) => set("arcLength", e.target.checked)} /> 호 길이 보정 (끄면 굽은 곳에서 속도가 변함)
              </span>
            </label>
          ) : null}
        </div>
      ))}

      <button type="button" className="cam_reset" onClick={() => onChange(DEFAULT_CAMERA_CONFIG)}>
        기본값으로
      </button>
    </details>
  );
}
