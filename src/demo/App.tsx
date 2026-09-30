import { useEffect, useRef, useState } from "react";
import { DEFAULT_CONFIG, type CarouselConfig } from "../core/config";
import type { CarouselInspect, ControlMode } from "../core/types";
import { CylinderCarousel } from "../ui/CylinderCarousel";
import { ConfigPanel } from "./ConfigPanel";
import { ControlModeLab } from "./ControlModeLab";
import { DebugPanel } from "./DebugPanel";
import { ErrorBoundary } from "../shared/ErrorBoundary";
import { SETS } from "./sets";
import { TouchActionLab, type TouchActionOption } from "./TouchActionLab";

// E2E(Playwright)가 회전 상태와 pointercancel 횟수를 읽는 창구
declare global {
  interface Window {
    __cylinder?: {
      inspect: { current: CarouselInspect | null };
      cancelCount: () => number;
    };
  }
}

export function App() {
  const inspectRef = useRef<CarouselInspect | null>(null);
  const cancelCountRef = useRef(0);
  const [touchAction, setTouchAction] = useState<TouchActionOption>("none");
  const [controlMode, setControlMode] = useState<ControlMode>("object");
  const [config, setConfig] = useState<CarouselConfig>(DEFAULT_CONFIG);
  const [isMobile] = useState(() => window.matchMedia("(pointer: coarse)").matches);

  useEffect(() => {
    window.__cylinder = { inspect: inspectRef, cancelCount: () => cancelCountRef.current };
  }, []);

  const changeTouchAction = (next: TouchActionOption) => {
    cancelCountRef.current = 0;
    setTouchAction(next);
  };

  return (
    <main className="demo">
      <header className="demo_header">
        <h1>Cylinder Carousel</h1>
        <p>드래그와 자동 회전이 하나의 회전 상태를 공유하는 3D 원통 이미지 캐러셀입니다. 가로·세로로 드래그해 보세요.</p>
        <p className="demo_links">
          <a href="./camera/">카메라 플레이그라운드 →</a>
        </p>
      </header>

      <section className="demo_stage">
        <ErrorBoundary>
          {/* pointercancel은 버블링되므로 감싼 div에서 센다 (컴포넌트 수정 없음) */}
          <div
            className="demo_carousel"
            onPointerCancel={() => {
              cancelCountRef.current += 1;
            }}
          >
            {/* touch-action은 Canvas 생성 시 한 번만 적용되므로 값이 바뀌면 리마운트한다 */}
            <CylinderCarousel
              key={`${touchAction}-${controlMode}`}
              sets={SETS}
              isMobile={isMobile}
              touchAction={touchAction}
              inspectRef={inspectRef}
              config={config}
              controlMode={controlMode}
            />
          </div>
        </ErrorBoundary>
        <aside className="demo_side">
          <ControlModeLab value={controlMode} onChange={setControlMode} />
          <TouchActionLab value={touchAction} onChange={changeTouchAction} />
          <DebugPanel inspectRef={inspectRef} cancelCountRef={cancelCountRef} />
          <ConfigPanel config={config} onChange={setConfig} sets={SETS} />
        </aside>
      </section>

      <section className="demo_notes">
        <h2>무엇을 확인할 수 있나</h2>
        <h3>1. 회전 상태는 한 곳에서</h3>
        <p>
          드래그와 자동 회전은 같은 회전 값에 누적됩니다. 드래그는 처음 6px을 넘은 방향의 축으로 잠기고, 원통이 90° 넘게 기울면 좌우 방향이 반전되어도 손가락과 같은
          방향으로 돕니다. 오른쪽 패널의 <code>axis</code>, <code>yawFlip</code>으로 확인해 보세요.
        </p>
        <h3>2. touch-action과 모바일 드래그</h3>
        <p>
          모바일에서 <code>auto</code>로 바꾸고 캔버스를 쓸어 보면 브라우저가 터치를 스크롤로 가져가며 <code>pointercancel</code>이 올라가고 드래그가 끊깁니다.
          <code>none</code>에서는 끊기지 않는 대신 캔버스 위에서 페이지가 스크롤되지 않습니다.
        </p>
        <p>이 아래 여백은 스크롤 비교를 위한 공간입니다.</p>
      </section>
    </main>
  );
}
