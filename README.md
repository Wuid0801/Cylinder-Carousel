# Cylinder Carousel

[![CI](https://github.com/Wuid0801/Cylinder-Carousel/actions/workflows/ci.yml/badge.svg)](https://github.com/Wuid0801/Cylinder-Carousel/actions/workflows/ci.yml)

이미지를 3D 원통 위에 곡면 패널로 배치하고, 드래그와 자동 회전으로 돌려 보는 캐러셀입니다 (React Three Fiber).

**데모:** https://wuid0801.github.io/Cylinder-Carousel/

- 드래그와 자동 회전이 하나의 회전 상태를 공유
- 처음 움직인 방향으로 축 잠금, 원통이 뒤집혀도 손가락과 같은 방향으로 회전
- 패널 사이 빈 공간에서도 드래그 (투명 hit sphere)
- 모바일에서 드래그가 끊기지 않도록 `touch-action` 직접 지정
- React·three에 의존하지 않는 core와 제스처 재생 시뮬레이션, Playwright 터치 E2E

---

## 해결한 문제

| | 문제 | 해결 |
|---|---|---|
| 회전 상태 | OrbitControls가 카메라를, 코드가 원통 `rotation.y`를 각각 돌려 조작이 어색했음 | 카메라 고정, 드래그와 자동 회전을 회전 값 하나에 누적 |
| 모바일 드래그 | OrbitControls를 제거하자 드래그가 중간에 끊김 | OrbitControls가 암묵적으로 설정하던 `touch-action: none`을 캔버스에 직접 지정 |

## 데모에서 확인하기

- 오른쪽 패널에 `rotation`, `axis`, `yawFlip`, `isDragging`, `pointercancel` 횟수가 실시간으로 표시됩니다.
- 세로로 크게 드래그해 90° 넘게 기울인 뒤 가로로 드래그해 보세요. `yawFlip`이 -1이 되어도 원통은 손가락과 같은 방향으로 돕니다.
- 모바일에서 touch-action을 `auto`로 바꾸고 캔버스를 쓸면 `pointercancel`이 올라가며 드래그가 끊깁니다.
- **값 바꿔 보기** 패널에서 반지름·이미지 높이·패널 간격·이미지 장수, 자동 회전 속도·드래그 감도·축 잠금 임계값, 시야각·카메라 거리·높이·전체 크기, 곡면 세그먼트·조명 세기를 슬라이더나 숫자로 바꿔 볼 수 있습니다. 간격 × 장수가 360° 이상이 되면 패널이 사라지는 세트를 경고로 알려 줍니다. 새로고침하면 기본값으로 돌아갑니다.

---

## 아키텍처

```text
 ┌──────────────────────────────────────────────────────────┐
 │ demo/   App · sets · TouchActionLab · DebugPanel         │
 │         ErrorBoundary · window.__cylinder (E2E 창구)      │
 └───────────────┬──────────────────────────────────────────┘
                 │ props (sets, isMobile, touchAction, inspectRef)
                 ▼
 ┌───────────────────────────────┐
 │ ui/  CylinderCarousel         │  Canvas · 로딩 오버레이 · 세트 내비
 └───────────────┬───────────────┘
                 ▼
 ┌───────────────────────────────┐
 │ scene/  ImageCarousel         │  ref · useFrame · window 리스너
 │         CurvedImagePanel      │  inspectRef에 { rotation, drag } 참조 등록
 └───────────────┬───────────────┘
                 ▼
 ┌───────────────────────────────┐
 │ core/  rotation · layout      │  React / three import 없음
 └───────────────────────────────┘
```

```text
pointerdown (패널 또는 투명 구체, 마우스는 좌클릭만)
  └─ pointer capture, 시작값 스냅샷, axis = null
window pointermove
  └─ dragMove: 6px 전엔 무시 → 축 잠금 → 시작값 + 이동량 × 0.01 × yawFlip(시작 x)
window pointerup / pointercancel
  └─ 드래그 종료
useFrame
  ├─ 드래그 중이 아니면 autoRotate (yawFlip(현재 x))
  └─ group.rotation ← 회전 상태   (three 객체에 쓰는 유일한 지점)
```

| 파일 | 역할 |
|---|---|
| [src/core/rotation.ts](src/core/rotation.ts) | 축 잠금, 좌우 보정, 드래그·자동 회전 계산 |
| [src/core/layout.ts](src/core/layout.ts) | 원통을 패널 + 간격으로 균등 분할 |
| [src/scene/ImageCarousel.tsx](src/scene/ImageCarousel.tsx) | 텍스처 로드, 패널 배치, pointer 입력, 매 프레임 회전 반영, hit sphere |
| [src/scene/CurvedImagePanel.tsx](src/scene/CurvedImagePanel.tsx) | 열린 원통의 부분 호로 곡면 패널 1장 |
| [src/ui/CylinderCarousel.tsx](src/ui/CylinderCarousel.tsx) | Canvas 설정, 세트 전환(`key` 리마운트), 로딩 오버레이 |
| [src/demo/](src/demo) | 데모, DebugPanel, touch-action 비교 |

---

## 설계 결정

### 왜 회전 상태가 하나인가

카메라(OrbitControls)와 원통을 각자 돌리면 드래그 방향과 자동 회전 방향이 서로 어긋납니다.
카메라를 고정하고 드래그와 자동 회전이 모두 같은 회전 값에 누적되게 했습니다. three 객체에 값을 쓰는 곳은 `useFrame` 한 곳뿐입니다.
매 프레임 바뀌는 값이라 React state가 아니라 ref에 두어 리렌더가 없습니다.

### 왜 드래그는 "시작값 + 누적 이동량"으로 계산하나

이벤트마다 이동량을 더하면 이벤트 개수와 순서에 따라 결과가 달라집니다.
pointerdown 시점의 회전값에 포인터의 누적 이동량을 곱해 매번 절대값으로 계산합니다.
그래서 최종 회전값은 중간 경로와 상관없이 마지막 위치로만 정해지고, 이를 property 테스트로 검증합니다.

### 왜 축을 잠그나

대각선으로 드래그하면 두 축이 함께 돌아 원통이 비틀립니다.
6px을 넘기 전까지는 무시하고, 처음 넘은 방향의 축으로 제스처가 끝날 때까지 고정합니다.

### 왜 좌우 보정을 "시작 시점의 x"로 판단하나

x축으로 90°를 넘게 기울면 원통 축이 뒤집혀 같은 방향 드래그가 반대로 돕니다. `cos(x) < 0`이면 방향을 반전합니다.
드래그는 시작 시점의 x로 판단해 제스처 도중 방향이 바뀌지 않게 하고, 자동 회전은 현재 x로 판단합니다.

### 왜 투명한 구체가 있나

패널 사이 빈 공간은 레이캐스트에 걸리지 않아 드래그를 시작할 수 없었습니다.
화면 전체를 덮는 투명 구체를 두었고, 카메라가 구 안쪽에 있어 `DoubleSide`가 필요합니다. `depthWrite: false`와 `renderOrder: -1`로 패널 렌더링에 영향을 주지 않습니다.

### 왜 `touch-action`을 직접 지정하나

브라우저는 터치가 스크롤로 판단되면 `pointercancel`을 보내고 이후 pointer 이벤트를 멈춥니다.
OrbitControls는 내부에서 `touch-action: none`을 설정하고 있었고, 라이브러리를 제거하면서 이 설정도 함께 사라졌습니다.
Chromium에서 측정해 보면 기본값(`auto`)에서는 페이지에 가로 스크롤이 없어도 **가로 드래그까지** 끊깁니다([측정](docs/touch-probe.md), CDP 터치 에뮬레이션 기준이며 다른 브라우저·실제 기기는 따로 측정하지 않았습니다).
`none`은 드래그가 끊기지 않는 대신 캔버스 위 페이지 스크롤을 막고, `pan-y`는 세로 스크롤을 살리는 대신 세로 회전을 포기합니다. 이 저장소는 `none`을 씁니다.

---

## 테스트

```bash
npm test      # core 단위 + 제스처 재생 시뮬레이션 (Vitest)
npm run e2e   # 빌드 후 Playwright (Chromium)
```

| 무엇을 | 어떻게 |
|---|---|
| 축 잠금, 좌우 보정, 시작값 기준 계산 | [tests/rotation.test.ts](tests/rotation.test.ts) |
| 기록된 제스처(대각선, 떨림, 뒤집힌 상태) 재생 | [tests/gesture-replay.test.ts](tests/gesture-replay.test.ts), [tests/fixtures/gestures.json](tests/fixtures/gestures.json) |
| 한 제스처에 한 축만 / 경로 무관성 | fast-check property 테스트 |
| 브라우저에서 드래그, hit sphere, 좌클릭만, 캔버스 밖 종료 | [e2e/drag.spec.ts](e2e/drag.spec.ts) |
| touch-action별 `pointercancel`·회전·스크롤 | [e2e/touch.spec.ts](e2e/touch.spec.ts) (CDP 터치 입력) |
| 세트 전환, 이미지 로드 실패 | [e2e/loading.spec.ts](e2e/loading.spec.ts), [e2e/error.spec.ts](e2e/error.spec.ts) |
| 화면에서 바꾼 드래그 감도·임계값이 실제 드래그에 반영되는지, 간격 경고, 기본값 복원 | [e2e/config.spec.ts](e2e/config.spec.ts), [tests/config.test.ts](tests/config.test.ts) |

touch-action E2E가 확인하는 동작:

| touch-action | 가로 스와이프 | 세로 스와이프 |
|---|---|---|
| `none` | 회전, 끊김 없음 | 회전, 끊김 없음, 페이지 스크롤 없음 |
| `pan-y` | 회전, 끊김 없음 | `pointercancel`로 끊기고 페이지 스크롤 |
| `auto` | `pointercancel`로 끊김 | `pointercancel`로 끊기고 페이지 스크롤, 이후 자동 회전 재개 |

CDP 터치 에뮬레이션이 실제로 `pointercancel`을 재현하는지는 [e2e/feasibility.spec.ts](e2e/feasibility.spec.ts)로 먼저 확인했고, 측정값은 [docs/touch-probe.md](docs/touch-probe.md)에 있습니다.

테스트가 실제로 결함을 잡는지는 핵심 코드를 일부러 망가뜨려 확인했습니다. 좌우 보정을 현재 x 기준으로 바꾸거나, 투명 구체를 빼거나, `touch-action` 지정을 지우거나, 세트 전환 `key`를 빼면 각각 해당 테스트가 실패합니다.

---

## Known limitations

- 이미지 로드 실패·WebGL 미지원 시 컴포넌트 자체에는 에러 경계가 없습니다. 데모는 바깥에서 ErrorBoundary로 감쌉니다.
- 간격 12°에서는 이미지를 29장까지만 배치할 수 있습니다 (`12 × 30 = 360`이면 패널 폭이 0).
- 두 번째 손가락이 닿으면 드래그 상태를 덮어씁니다. 멀티터치는 고려하지 않았습니다.
- 모바일은 `frameloop="demand"`지만 `useFrame`에서 매 프레임 `invalidate()`를 호출하므로, 자동 회전 중에는 사실상 연속 렌더링입니다.
- `touch-action: none`이라 캔버스 위에서는 페이지를 스크롤할 수 없습니다.
