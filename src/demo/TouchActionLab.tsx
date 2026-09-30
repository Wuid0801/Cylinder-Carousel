export type TouchActionOption = "none" | "pan-y" | "auto";

const OPTIONS: { value: TouchActionOption; hint: string }[] = [
  { value: "none", hint: "기본값. 가로·세로 모두 회전하고, 캔버스 위에서는 페이지가 스크롤되지 않습니다." },
  { value: "pan-y", hint: "세로 스와이프는 페이지 스크롤로 넘기고 가로만 회전합니다." },
  { value: "auto", hint: "OrbitControls를 제거한 직후 상태. 브라우저가 스크롤로 판단하면 pointercancel로 드래그가 끊깁니다." },
];

interface TouchActionLabProps {
  value: TouchActionOption;
  onChange: (next: TouchActionOption) => void;
}

export function TouchActionLab({ value, onChange }: TouchActionLabProps) {
  return (
    <fieldset className="lab">
      <legend>touch-action 비교 (모바일)</legend>
      {OPTIONS.map((option) => (
        <label key={option.value}>
          <input type="radio" name="touch-action" value={option.value} checked={value === option.value} onChange={() => onChange(option.value)} />
          <code>{option.value}</code>
          <span>{option.hint}</span>
        </label>
      ))}
    </fieldset>
  );
}
