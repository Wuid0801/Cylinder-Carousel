import { DEFAULT_CONFIG, type CarouselConfig } from "../core/config";
import { computePanelLayout } from "../core/layout";
import { NumberField } from "../shared/NumberField";

type NumericKey = Exclude<keyof CarouselConfig, "imageCount">;

interface Field {
  key: NumericKey;
  label: string;
  min: number;
  max: number;
  step: number;
}

const GROUPS: { title: string; fields: Field[] }[] = [
  {
    title: "원통 형태",
    fields: [
      { key: "cylinderRadius", label: "반지름", min: 2, max: 10, step: 0.1 },
      { key: "imageHeight", label: "이미지 높이", min: 1, max: 10, step: 0.1 },
      { key: "gapDeg", label: "패널 간격 (°)", min: 0, max: 30, step: 1 },
    ],
  },
  {
    title: "움직임",
    fields: [
      { key: "autoRotateSpeed", label: "자동 회전 속도 (rad/s)", min: 0, max: 2, step: 0.05 },
      { key: "rotateSpeed", label: "드래그 감도 (rad/px)", min: 0.001, max: 0.05, step: 0.001 },
      { key: "axisLockThreshold", label: "축 잠금 임계값 (px)", min: 0, max: 40, step: 1 },
    ],
  },
  {
    title: "카메라·화면",
    fields: [
      { key: "fov", label: "시야각 (°)", min: 15, max: 90, step: 1 },
      { key: "cameraDistance", label: "카메라 거리", min: 4, max: 30, step: 0.5 },
      { key: "cameraHeight", label: "카메라 높이", min: -5, max: 5, step: 0.1 },
      { key: "scale", label: "전체 크기", min: 0.2, max: 1.5, step: 0.05 },
    ],
  },
  {
    title: "렌더 품질",
    fields: [
      { key: "panelSegments", label: "패널 곡면 세그먼트", min: 4, max: 256, step: 4 },
      { key: "lightScale", label: "조명 세기 배율", min: 0, max: 3, step: 0.1 },
    ],
  },
];

const IMAGE_COUNT_MIN = 3;
const IMAGE_COUNT_MAX = 40;
const IMAGE_COUNT_INITIAL = 12;

interface ConfigPanelProps {
  config: CarouselConfig;
  onChange: (next: CarouselConfig) => void;
  sets: { label: string; images: string[] }[];
}

export function ConfigPanel({ config, onChange, sets }: ConfigPanelProps) {
  const set = <K extends keyof CarouselConfig>(key: K, value: CarouselConfig[K]) => onChange({ ...config, [key]: value });

  // 간격 × 장수가 360° 이상이면 패널 폭이 0 이하가 되어 사라진다. 값을 막지 않고 알려만 준다
  const brokenSets = sets.filter((s) => computePanelLayout(config.imageCount ?? s.images.length, config.gapDeg).thetaLength <= 0);

  return (
    <fieldset className="config">
      <legend>값 바꿔 보기</legend>

      {GROUPS.map((group) => (
        <div key={group.title} className="config_group">
          <h3>{group.title}</h3>
          {group.fields.map((field) => (
            <label key={field.key} className="config_field">
              <span>{field.label}</span>
              <NumberField name={field.key} value={config[field.key]} min={field.min} max={field.max} step={field.step} onChange={(v) => set(field.key, v)} />
            </label>
          ))}
          {group.title === "원통 형태" ? (
            <div className="config_field">
              <label className="config_check">
                <input type="checkbox" name="imageCountAuto" checked={config.imageCount === null} onChange={(e) => set("imageCount", e.target.checked ? null : IMAGE_COUNT_INITIAL)} />
                <span>이미지 장수: 세트 원래 장수</span>
              </label>
              <NumberField
                name="imageCount"
                value={config.imageCount ?? IMAGE_COUNT_INITIAL}
                min={IMAGE_COUNT_MIN}
                max={IMAGE_COUNT_MAX}
                step={1}
                disabled={config.imageCount === null}
                onChange={(v) => set("imageCount", Math.round(v))}
              />
            </div>
          ) : null}
        </div>
      ))}

      {brokenSets.length > 0 ? (
        <p className="config_warning" role="status">
          패널 폭이 0 이하가 되어 패널이 보이지 않습니다: {brokenSets.map((s) => s.label).join(", ")} (간격 × 장수 ≥ 360°)
        </p>
      ) : null}

      <button type="button" className="config_reset" onClick={() => onChange(DEFAULT_CONFIG)}>
        기본값으로
      </button>
    </fieldset>
  );
}
