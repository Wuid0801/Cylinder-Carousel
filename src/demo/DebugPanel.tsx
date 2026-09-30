import { useEffect, useRef, type RefObject } from "react";
import { yawFlip } from "../core/rotation";
import type { CarouselInspect } from "../core/types";

interface DebugPanelProps {
  inspectRef: RefObject<CarouselInspect | null>;
  cancelCountRef: RefObject<number>;
}

// 회전 상태를 매 프레임 textContent로 직접 갱신한다. 캐러셀과 같은 이유로 React 리렌더를 거치지 않는다
export function DebugPanel({ inspectRef, cancelCountRef }: DebugPanelProps) {
  const outputRef = useRef<HTMLPreElement>(null);

  useEffect(() => {
    let frame = 0;
    const tick = () => {
      const inspect = inspectRef.current;
      if (outputRef.current) {
        outputRef.current.textContent = inspect
          ? [
              `rotation.x     ${inspect.rotation.x.toFixed(3)}`,
              `rotation.y     ${inspect.rotation.y.toFixed(3)}`,
              `yawFlip        ${yawFlip(inspect.rotation.x)}`,
              `isDragging     ${inspect.drag.isDragging}`,
              `axis           ${inspect.drag.axis ?? "-"}`,
              `pointercancel  ${cancelCountRef.current}`,
              // 수정 전 방식에서는 물체 대신 카메라가 돈다
              ...(inspect.camera ? [`camera 방위각  ${inspect.camera.azimuth.toFixed(3)}`, `camera 고도    ${inspect.camera.polar.toFixed(3)}`] : []),
            ].join("\n")
          : "loading…";
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [inspectRef, cancelCountRef]);

  return <pre ref={outputRef} className="debug_panel" aria-label="회전 상태" />;
}
