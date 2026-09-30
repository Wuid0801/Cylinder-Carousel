import { Canvas } from "@react-three/fiber";
import { Suspense, useEffect, useState, type CSSProperties, type RefObject } from "react";
import { DEFAULT_CONFIG, pickImages, type CarouselConfig } from "../core/config";
import type { CarouselInspect, ControlMode } from "../core/types";
import { CameraRig } from "../scene/CameraRig";
import { ImageCarousel } from "../scene/ImageCarousel";
import { LegacyImageCarousel } from "../scene/LegacyImageCarousel";
import { LegacyOrbitControls } from "../scene/LegacyOrbitControls";
import "./cylinder-carousel.css";

export interface CarouselSet {
  id: string;
  label: string;
  thumbnail: string;
  thumbnailAlt: string;
  images: string[];
}

interface CylinderCarouselProps {
  sets: CarouselSet[];
  isMobile?: boolean;
  touchAction?: CSSProperties["touchAction"];
  loadingLabel?: string;
  inspectRef?: RefObject<CarouselInspect | null>;
  config?: Partial<CarouselConfig>;
  controlMode?: ControlMode; // 비교용: orbit이면 수정 전 방식(물체 자동 회전 + 카메라 궤도 드래그)
}

export function CylinderCarousel({
  sets,
  isMobile = false,
  touchAction = "none",
  loadingLabel = "Loading 3D images",
  inspectRef,
  config,
  controlMode = "object",
}: CylinderCarouselProps) {
  const c = { ...DEFAULT_CONFIG, ...config };
  const [setIndex, setSetIndex] = useState(0);
  const [isSceneLoading, setIsSceneLoading] = useState(true);

  useEffect(() => {
    setIsSceneLoading(true);
  }, [setIndex]);

  // Hook 호출 이후에 조기 반환한다. Hook 앞에서 return하면 렌더마다 Hook 개수가 달라질 수 있다
  if (!sets.length) {
    return null;
  }

  const currentImages = pickImages(sets[setIndex]?.images ?? [], c.imageCount);

  return (
    <div className="cylinder_wrap">
      <div className="cylinder_canvas">
        <Canvas
          // 수정 전 방식은 invalidate()를 부르지 않으므로 모바일에서도 매 프레임 그린다
          frameloop={isMobile && controlMode === "object" ? "demand" : "always"}
          camera={{ position: [0, c.cameraHeight, c.cameraDistance], fov: c.fov }}
          gl={{
            antialias: true,
            powerPreference: isMobile ? "default" : "high-performance",
          }}
          onCreated={({ gl }) => {
            // OrbitControls가 암묵적으로 설정하던 값. 없으면 브라우저가 터치를 스크롤로 가져가며 pointercancel을 보낸다
            gl.domElement.style.touchAction = touchAction;
          }}
        >
          {isMobile ? (
            <ambientLight intensity={1.35 * c.lightScale} />
          ) : (
            <>
              <ambientLight intensity={1.2 * c.lightScale} />
              <directionalLight position={[5, 5, 8]} intensity={1.0 * c.lightScale} />
              <directionalLight position={[-5, 3, -5]} intensity={0.4 * c.lightScale} />
            </>
          )}
          <CameraRig fov={c.fov} height={c.cameraHeight} distance={c.cameraDistance} />

          <Suspense fallback={null}>
            {controlMode === "orbit" ? (
              <LegacyImageCarousel
                key={setIndex}
                imageUrls={currentImages}
                cylinderRadius={c.cylinderRadius}
                imageHeight={c.imageHeight}
                autoRotateSpeed={c.autoRotateSpeed}
                gapDeg={c.gapDeg}
                scale={c.scale}
                panelSegments={c.panelSegments}
                onReady={() => setIsSceneLoading(false)}
                inspectRef={inspectRef}
              />
            ) : (
              <ImageCarousel
                key={setIndex}
                imageUrls={currentImages}
                cylinderRadius={c.cylinderRadius}
                imageHeight={c.imageHeight}
                autoRotateSpeed={c.autoRotateSpeed}
                gapDeg={c.gapDeg}
                isMobile={isMobile}
                rotateSpeed={c.rotateSpeed}
                axisLockThreshold={c.axisLockThreshold}
                scale={c.scale}
                panelSegments={c.panelSegments}
                onReady={() => setIsSceneLoading(false)}
                inspectRef={inspectRef}
              />
            )}
          </Suspense>
          {controlMode === "orbit" ? <LegacyOrbitControls inspectRef={inspectRef} /> : null}
        </Canvas>
        {isSceneLoading ? (
          <div className="cylinder_loading_overlay" aria-live="polite" aria-label={loadingLabel}>
            <span className="cylinder_loading_spinner" aria-hidden="true" />
          </div>
        ) : null}
      </div>
      <div className="cylinder_nav">
        {sets.map((set, index) => (
          <div key={set.id} className="cylinder_nav_item">
            <span className="cylinder_nav_label">{set.label}</span>
            <button type="button" className={`cylinder_nav_btn ${setIndex === index ? "is_active" : ""}`} onClick={() => setSetIndex(index)}>
              <img src={set.thumbnail} alt={set.thumbnailAlt} className="cylinder_nav_thumb" loading="lazy" decoding="async" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
