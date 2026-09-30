// 스크롤 가능한 범위(문서 높이 − 화면 높이)를 진행도 0~1로 바꾼다
export function scrollToProgress(scrollY: number, scrollHeight: number, viewportHeight: number): number {
  const max = scrollHeight - viewportHeight;
  if (max <= 0) return 0;
  return Math.min(1, Math.max(0, scrollY / max));
}

export function progressToScroll(t: number, scrollHeight: number, viewportHeight: number): number {
  return t * Math.max(0, scrollHeight - viewportHeight);
}
