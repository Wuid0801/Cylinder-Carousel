# CDP 터치 에뮬레이션 측정 (feasibility.spec.ts)

- 환경: Playwright 1.63 · Chromium Headless Shell 153 (Desktop Chrome + hasTouch) · Windows 11 로컬
- 방법: 400px 영역에 CDP로 200px 스와이프(10단계), 300ms 후 측정

| touch-action | 방향 | pointerdown | pointermove | pointercancel | scrollY |
|---|---|---|---|---|---|
| none | horizontal | 1 | 10 | 0 | 0 |
| none | vertical | 1 | 10 | 0 | 0 |
| pan-y | horizontal | 1 | 10 | 0 | 0 |
| pan-y | vertical | 1 | 1 | 1 | 194 |
| auto | horizontal | 1 | 1 | 1 | 0 |
| auto | vertical | 1 | 1 | 1 | 195 |

읽는 법:

- 브라우저가 터치를 가져가면 `pointermove` 1번 뒤 `pointercancel`이 오고, 이후 pointer 이벤트가 멈춥니다.
- `auto`에서는 **가로 스와이프도 끊깁니다.** 페이지에 가로 스크롤이 없어도 브라우저가 제스처를 가져갑니다. OrbitControls를 제거한 뒤 가로 드래그가 끊기던 원래 증상과 같습니다.
- `pan-y`는 세로만 브라우저에 넘기므로 가로 회전은 유지됩니다.
