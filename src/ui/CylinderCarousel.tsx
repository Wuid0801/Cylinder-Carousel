import { Canvas } from "@react-three/fiber";
import { Suspense, useEffect, useState, type CSSProperties, type RefObject } from "react";
import type { CarouselInspect } from "../core/types";
import { ImageCarousel } from "../scene/ImageCarousel";
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
}

export function CylinderCarousel({
  sets,
  isMobile = false,
  touchAction = "none",
  loadingLabel = "Loading 3D images",
  inspectRef,
}: CylinderCarouselProps) {
  const [setIndex, setSetIndex] = useState(0);
  const [isSceneLoading, setIsSceneLoading] = useState(true);

  useEffect(() => {
    setIsSceneLoading(true);
  }, [setIndex]);

  // Hook 호출 이후에 조기 반환한다. Hook 앞에서 return하면 렌더마다 Hook 개수가 달라질 수 있다
  if (!sets.length) {
    return null;
  }

  const currentImages = sets[setIndex]?.images ?? [];

  return (
    <div className="cylinder_wrap">
      <div className="cylinder_canvas">
        <Canvas
          frameloop={isMobile ? "demand" : "always"}
          camera={{ position: [0, 0.2, 11], fov: 38 }}
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
            <ambientLight intensity={1.35} />
          ) : (
            <>
              <ambientLight intensity={1.2} />
              <directionalLight position={[5, 5, 8]} intensity={1.0} />
              <directionalLight position={[-5, 3, -5]} intensity={0.4} />
            </>
          )}

          <Suspense fallback={null}>
            <ImageCarousel
              key={setIndex}
              imageUrls={currentImages}
              cylinderRadius={5.5}
              imageHeight={5}
              autoRotateSpeed={0.2}
              gapDeg={12}
              isMobile={isMobile}
              onReady={() => setIsSceneLoading(false)}
              inspectRef={inspectRef}
            />
          </Suspense>
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
