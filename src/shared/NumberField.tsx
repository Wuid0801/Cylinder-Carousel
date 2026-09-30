import { useEffect, useState } from "react";
import "./number-field.css";

interface NumberFieldProps {
  name: string;
  value: number;
  min: number;
  max: number;
  step: number;
  disabled?: boolean;
  onChange: (value: number) => void;
}

// 슬라이더와 숫자 입력을 함께 둔다. 숫자 입력은 "0." 같은 입력 중간 상태를 막지 않도록 문자열로 들고 있다
export function NumberField({ name, value, min, max, step, disabled, onChange }: NumberFieldProps) {
  const [text, setText] = useState(String(value));

  useEffect(() => {
    // 슬라이더·기본값 버튼처럼 밖에서 값이 바뀌면 입력칸도 맞춘다
    setText((current) => (Number(current) === value ? current : String(value)));
  }, [value]);

  const commit = (next: string) => {
    setText(next);
    const parsed = Number(next);
    if (next.trim() !== "" && Number.isFinite(parsed)) onChange(parsed);
  };

  return (
    <span className="config_inputs">
      <input type="range" name={name} min={min} max={max} step={step} value={value} disabled={disabled} onChange={(e) => onChange(Number(e.target.value))} />
      <input type="number" name={name} min={min} max={max} step={step} value={text} disabled={disabled} onChange={(e) => commit(e.target.value)} />
    </span>
  );
}
