# Cylinder Carousel

[![CI](https://github.com/Wuid0801/Cylinder-Carousel/actions/workflows/ci.yml/badge.svg)](https://github.com/Wuid0801/Cylinder-Carousel/actions/workflows/ci.yml)

이미지를 3D 원통에 둘러 배치하고 드래그·자동 회전으로 돌려 보는 캐러셀입니다 (React Three Fiber).

**데모:** [캐러셀](https://wuid0801.github.io/Cylinder-Carousel/) · [Camera Playground](https://wuid0801.github.io/Cylinder-Carousel/camera/)

## 해결한 문제

| 문제 | 원인 | 해결 |
|---|---|---|
| 드래그와 자동 회전이 어색하게 섞임 | 자동 회전은 **원통**이, 드래그는 OrbitControls가 **카메라**를 돌림 (회전 주체가 둘) | 카메라를 고정하고 드래그·자동 회전을 원통의 회전 값 하나에 누적 |
| 모바일에서 드래그가 끊김 | OrbitControls가 넣어 주던 `touch-action: none`이 제거와 함께 사라짐 | 캔버스에 `touch-action: none`을 직접 지정 |

데모의 **조작 방식 비교**에서 "수정 전"을 고르면 원래 구조를 그대로 재현합니다.

## 데모에서 해볼 것

- **수정 전 / 수정 후**: 위로 드래그한 뒤 자동 회전이 도는 축, 조명, 손을 뗀 뒤 미끄러짐을 비교
- **touch-action**: 휴대폰이나 개발자 도구의 기기 툴바에서 `none` · `pan-y` · `auto`를 바꿔 가며 드래그 (마우스로는 차이 없음)
- **값 바꿔 보기**: 반지름, 간격, 장수, 회전 속도, 드래그 감도, 카메라 등을 슬라이더로 조절
- **동작 줄이기**: OS의 "동작 줄이기" 설정을 켜면 자동 회전·자동 운행이 멈춥니다 (드래그는 그대로)

## 설계 포인트

- **회전 상태는 하나**: 드래그와 자동 회전이 같은 ref에 누적되고, three 객체에 쓰는 곳은 `useFrame` 한 곳뿐
- **드래그 = 시작값 + 누적 이동량**: 이벤트마다 더하지 않아 결과가 경로와 무관 (property 테스트로 검증)
- **축 잠금**: 처음 6px을 넘은 방향의 축만 회전해 대각선 드래그에도 비틀리지 않음
- **뒤집힘 보정**: 90° 넘게 기울면(`cos(x) < 0`) 좌우 방향을 반전. 드래그는 시작 시점 기준이라 도중에 방향이 바뀌지 않음
- **투명 구체**: OrbitControls는 캔버스 전체에서 이벤트를 받았지만, 원통을 돌리는 방식은 레이캐스트가 물체에 맞아야 이벤트가 옴. 패널 사이 빈 공간에서도 드래그되도록 화면을 덮는 투명 구체를 둠

```text
src/
├─ core/    회전·배치 계산 (React·three 없음)
├─ scene/   ImageCarousel · CurvedImagePanel · Legacy*(수정 전 재현)
├─ ui/      CylinderCarousel
├─ demo/    데모 페이지
├─ shared/  두 페이지 공용 UI
└─ camera/  Camera Playground
```

<details>
<summary><b>Camera Playground · 테스트 </b> (펼치기)</summary>

### Camera Playground

흑백 풍경 속 선로를 달리는 트램으로 카메라 연출을 비교합니다.

| 모드 | 조작 | 카메라 |
|---|---|---|
| 경로 탑승 | 스크롤 (트램은 역을 오가며 자동 운행) | 트램에 **딱 붙어** 이동 (보간). 트램이 화면 안에 있는 범위에서만 앞뒤로 움직임 |
| 트램 추적 | 화면 좌·우 누르기, ← → 키 | 트램을 **늦게 쫓아감** (감쇠). 역 앞에서 손을 떼면 역 중앙에 정확히 섬 |

- 곡선은 Catmull-Rom을 직접 구현하고 three `CatmullRomCurve3`와 결과를 대조
- 감쇠는 `1 − e^(−λ·dt)`로 프레임 속도와 무관 (30fps와 144fps 결과가 같음을 테스트)
- 역 정차는 남은 거리에서 설 수 있는 속도 `√(2·제동력·d)`를 따라가 목표를 넘지 않고 멈춤

### 테스트

```bash
npm test      # 단위 테스트 (Vitest)
npm run e2e   # 빌드 후 브라우저 테스트 (Playwright, Chromium)
```

- 단위: 회전·축 잠금·배치 계산, 제스처 재생 시뮬레이션, 카메라 곡선·감쇠·정차
- 브라우저: 드래그, 투명 구체, 수정 전 방식 재현, touch-action별 `pointercancel` ([측정](docs/touch-probe.md)), 세트 전환, 두 모드 카메라 동작
- 핵심 코드를 일부러 망가뜨려 해당 테스트가 실패하는지도 확인

### 한계

- 간격 12°에서는 이미지를 29장까지만 배치 가능
- 멀티터치는 고려하지 않음
- `touch-action: none`이라 캔버스 위에서는 페이지 스크롤 불가
- Camera Playground 경로 탑승에서 스크롤을 맨 위로 올리면 트램이 오른쪽 끝으로 가는데, 데스크톱에서는 값 조절 패널에 가려짐 (패널을 접으면 보임)

</details>
