import { useFrame, useLoader, useThree, type ThreeEvent } from "@react-three/fiber";
import { useEffect, useMemo, useRef, type RefObject } from "react";
import { DoubleSide, SRGBColorSpace, TextureLoader, type Group } from "three";
import { computePanelLayout } from "../core/layout";
import { AXIS_LOCK_THRESHOLD, ROTATE_SPEED, autoRotate, dragMove, type DragParams } from "../core/rotation";
import type { CarouselInspect, DragState, Rotation } from "../core/types";
import { CurvedImagePanel } from "./CurvedImagePanel";

const SPHERE_SEGMENTS = 48;

export interface ImageCarouselProps {
  imageUrls: string[];
  cylinderRadius?: number;
  imageHeight?: number;
  autoRotateSpeed?: number;
  gapDeg?: number;
  isMobile?: boolean;
  rotateSpeed?: number;
  axisLockThreshold?: number;
  scale?: number;
  panelSegments?: number;
  onReady?: () => void;
  inspectRef?: RefObject<CarouselInspect | null>;
}

export function ImageCarousel({
  imageUrls,
  cylinderRadius = 5.5,
  imageHeight = 3.4,
  autoRotateSpeed = 0.35,
  gapDeg = 4,
  isMobile = false,
  rotateSpeed = ROTATE_SPEED,
  axisLockThreshold = AXIS_LOCK_THRESHOLD,
  scale = 0.55,
  panelSegments = 128,
  onReady,
  inspectRef,
}: ImageCarouselProps) {
  const groupRef = useRef<Group>(null);
  const textures = useLoader(TextureLoader, imageUrls);

  // 드래그와 자동 회전이 함께 누적되는 단일 회전 상태. 매 프레임 바뀌므로 state가 아니라 ref에 둔다
  const rotationRef = useRef<Rotation>({ x: 0, y: 0 });
  const { gl, invalidate } = useThree();
  const glRef = useRef(gl);
  glRef.current = gl;
  // window 리스너를 다시 등록하지 않고 화면에서 바꾼 최신 값을 읽도록 ref로 전달한다
  const dragParamsRef = useRef<DragParams>({ rotateSpeed, axisLockThreshold });
  dragParamsRef.current = { rotateSpeed, axisLockThreshold };

  const dragRef = useRef<DragState>({
    isDragging: false,
    pointerId: null,
    startX: 0,
    startY: 0,
    startRotX: 0,
    startRotY: 0,
    axis: null,
  });

  useEffect(() => {
    const maxAnisotropy = Math.min(8, gl.capabilities.getMaxAnisotropy?.() ?? 1);

    textures.forEach((texture) => {
      texture.colorSpace = SRGBColorSpace;
      texture.anisotropy = maxAnisotropy;
      texture.needsUpdate = true;
    });
  }, [textures, gl]);

  useEffect(() => {
    if (textures.length > 0) {
      onReady?.();
    }
  }, [textures, onReady]);

  useEffect(() => {
    if (isMobile) invalidate();
  }, [textures, isMobile, invalidate]);

  // 데모·E2E가 회전 상태를 읽을 수 있도록 객체 참조를 그대로 등록한다 (두 객체는 교체되지 않고 필드만 바뀜)
  useEffect(() => {
    if (!inspectRef) return;
    inspectRef.current = { rotation: rotationRef.current, drag: dragRef.current };
    return () => {
      inspectRef.current = null;
    };
  }, [inspectRef]);

  const panels = useMemo(() => {
    // 전체 원통을 count개의 패널로 채우되, 패널 사이에 작은 간격만 둔다
    const { thetaLength, angles } = computePanelLayout(textures.length, gapDeg);

    return textures.map((texture, index) => ({
      texture,
      rotation: [0, angles[index], 0] as [number, number, number],
      thetaLength,
    }));
  }, [textures, gapDeg]);

  useEffect(() => {
    const onPointerMove = (e: PointerEvent) => {
      const drag = dragRef.current;
      if (!drag.isDragging) return;

      dragMove(drag, rotationRef.current, e.clientX - drag.startX, e.clientY - drag.startY, dragParamsRef.current);

      if (isMobile) invalidate();
    };

    const onPointerUp = (e: PointerEvent) => {
      const drag = dragRef.current;
      if (!drag.isDragging) return;
      const id = e.pointerId ?? drag.pointerId;
      if (id != null) {
        try {
          glRef.current.domElement.releasePointerCapture(id);
        } catch {
          // 이미 해제된 pointer면 InvalidPointerId를 던지므로 무시한다
        }
      }
      drag.isDragging = false;
      drag.axis = null;
      drag.pointerId = null;
      if (isMobile) invalidate();
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);

    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
    };
  }, [invalidate, isMobile]);

  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    const ne = e.nativeEvent;
    if (ne.pointerType === "mouse" && ne.button !== 0) return;

    const drag = dragRef.current;
    drag.pointerId = ne.pointerId;
    try {
      gl.domElement.setPointerCapture(ne.pointerId);
    } catch {
      // capture할 수 없는 pointer면 무시한다 (이동·종료는 window 리스너가 계속 받는다)
    }

    drag.isDragging = true;
    drag.startX = e.clientX;
    drag.startY = e.clientY;
    drag.startRotX = rotationRef.current.x;
    drag.startRotY = rotationRef.current.y;
    drag.axis = null;
    if (isMobile) invalidate();
  };

  useFrame((_, delta) => {
    if (!groupRef.current) return;

    if (!dragRef.current.isDragging) {
      autoRotate(rotationRef.current, autoRotateSpeed, delta);
    }

    // three 객체에 회전을 쓰는 유일한 지점
    groupRef.current.rotation.x = rotationRef.current.x;
    groupRef.current.rotation.y = rotationRef.current.y;

    if (isMobile) {
      invalidate();
    }
  });

  return (
    <group scale={[scale, scale, scale]} onPointerDown={handlePointerDown}>
      {/* 패널 사이 빈 공간에서도 드래그를 시작할 수 있게 화면 전체를 덮는 투명 구체.
          카메라가 구 안쪽에 있으므로 DoubleSide가 필요하다 */}
      <mesh renderOrder={-1}>
        <sphereGeometry args={[80, SPHERE_SEGMENTS, SPHERE_SEGMENTS]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} side={DoubleSide} />
      </mesh>
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
