import { useFrame, useLoader } from "@react-three/fiber";
import { useEffect, useMemo, useRef, type RefObject } from "react";
import { SRGBColorSpace, TextureLoader, type Group } from "three";
import { computePanelLayout } from "../core/layout";
import type { CarouselInspect, DragState, Rotation } from "../core/types";
import { CurvedImagePanel } from "./CurvedImagePanel";

interface LegacyImageCarouselProps {
  imageUrls: string[];
  cylinderRadius: number;
  imageHeight: number;
  autoRotateSpeed: number;
  gapDeg: number;
  scale: number;
  panelSegments: number;
  onReady?: () => void;
  inspectRef?: RefObject<CarouselInspect | null>;
}

// 비교용으로 재현한 수정 전 방식. 물체는 스스로 y축으로만 돌고, 드래그는 LegacyOrbitControls가 카메라를 움직여 처리한다.
// 그래서 회전 주체가 둘(물체의 자동 회전, 카메라의 궤도)이다.
export function LegacyImageCarousel({ imageUrls, cylinderRadius, imageHeight, autoRotateSpeed, gapDeg, scale, panelSegments, onReady, inspectRef }: LegacyImageCarouselProps) {
  const groupRef = useRef<Group>(null);
  const textures = useLoader(TextureLoader, imageUrls);
  const rotationRef = useRef<Rotation>({ x: 0, y: 0 });
  // 이 방식에는 물체 드래그가 없다. 상태 패널이 같은 모양으로 읽을 수 있게 빈 상태만 둔다
  const dragRef = useRef<DragState>({ isDragging: false, pointerId: null, startX: 0, startY: 0, startRotX: 0, startRotY: 0, axis: null });

  useEffect(() => {
    textures.forEach((texture) => {
      texture.colorSpace = SRGBColorSpace;
      texture.needsUpdate = true;
    });
  }, [textures]);

  useEffect(() => {
    if (textures.length > 0) onReady?.();
  }, [textures, onReady]);

  useEffect(() => {
    if (!inspectRef) return;
    const own: CarouselInspect = { rotation: rotationRef.current, drag: dragRef.current };
    inspectRef.current = own;
    return () => {
      if (inspectRef.current === own) inspectRef.current = null;
    };
  }, [inspectRef]);

  const panels = useMemo(() => {
    const { thetaLength, angles } = computePanelLayout(textures.length, gapDeg);
    return textures.map((texture, index) => ({ texture, rotation: [0, angles[index], 0] as [number, number, number], thetaLength }));
  }, [textures, gapDeg]);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    rotationRef.current.y += autoRotateSpeed * delta;
    groupRef.current.rotation.y = rotationRef.current.y;
  });

  return (
    <group scale={[scale, scale, scale]}>
      <group ref={groupRef}>
        {panels.map((panel, index) => (
          <group key={index} rotation={panel.rotation}>
            <CurvedImagePanel texture={panel.texture} radius={cylinderRadius} height={imageHeight} thetaLength={panel.thetaLength} segments={panelSegments} />
          </group>
        ))}
      </group>
    </group>
  );
}
