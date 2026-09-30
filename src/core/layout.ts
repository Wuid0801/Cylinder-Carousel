const DEG = Math.PI / 180;

export interface PanelLayout {
  thetaLength: number; // 패널 1장이 차지하는 각도 (rad)
  angles: number[]; // 패널별 배치 각도 (rad)
}

// 원통 전체(2π)를 count개의 패널 + 패널 사이 간격으로 균등 분할한다.
// gapDeg × count >= 360이면 thetaLength가 0 이하가 되므로 이미지 개수는 호출하는 쪽에서 맞춘다.
export function computePanelLayout(count: number, gapDeg: number): PanelLayout {
  if (count <= 0) return { thetaLength: 0, angles: [] };
  const gap = gapDeg * DEG;
  const thetaLength = (Math.PI * 2 - gap * count) / count;
  const angles = Array.from({ length: count }, (_, i) => i * (thetaLength + gap));
  return { thetaLength, angles };
}
