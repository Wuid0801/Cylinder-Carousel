import type { ControlMode } from "../core/types";

const OPTIONS: { value: ControlMode; label: string; hint: string }[] = [
  { value: "object", label: "수정 후", hint: "카메라는 고정하고 물체만 돌립니다. 드래그와 자동 회전이 같은 회전 값을 씁니다." },
  {
    value: "orbit",
    label: "수정 전",
    hint: "물체는 스스로 돌고, 드래그는 OrbitControls가 카메라를 궤도로 움직입니다. 위로 드래그한 뒤 자동 회전과 조명, 손을 뗀 뒤 미끄러짐을 비교해 보세요.",
  },
];

interface ControlModeLabProps {
  value: ControlMode;
  onChange: (next: ControlMode) => void;
}

export function ControlModeLab({ value, onChange }: ControlModeLabProps) {
  return (
    <fieldset className="lab">
      <legend>조작 방식 비교</legend>
      {OPTIONS.map((option) => (
        <label key={option.value}>
          <input type="radio" name="control-mode" value={option.value} checked={value === option.value} onChange={() => onChange(option.value)} />
          <strong>{option.label}</strong>
          <span>{option.hint}</span>
        </label>
      ))}
    </fieldset>
  );
}
