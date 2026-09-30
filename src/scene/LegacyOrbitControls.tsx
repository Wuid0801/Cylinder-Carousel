import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef, type RefObject } from "react";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import type { CarouselInspect } from "../core/types";

// 수정 전 방식의 드래그: 캔버스 전체에서 포인터를 받아 카메라를 원점 둘레로 궤도 이동시킨다.
// 설정은 수정 전 코드와 같고(줌·패닝 끔), 감쇠는 당시 쓰던 drei OrbitControls의 기본값(켜짐)에 맞췄다.
export function LegacyOrbitControls({ inspectRef }: { inspectRef?: RefObject<CarouselInspect | null> }) {
  const camera = useThree((state) => state.camera);
  const gl = useThree((state) => state.gl);
  const controlsRef = useRef<OrbitControls | null>(null);

  useEffect(() => {
    // 연결될 때 캔버스에 touch-action: none을 넣고, dispose되면 지운다
    const controls = new OrbitControls(camera, gl.domElement);
    controls.enableZoom = false;
    controls.enablePan = false;
    controls.enableRotate = true;
    controls.enableDamping = true;
    controlsRef.current = controls;
    return () => {
      controls.dispose();
      controlsRef.current = null;
    };
  }, [camera, gl]);

  useFrame(() => {
    const controls = controlsRef.current;
    if (!controls) return;
    controls.update(); // 감쇠는 매 프레임 update해야 진행된다
    const inspect = inspectRef?.current;
    if (inspect) inspect.camera = { azimuth: controls.getAzimuthalAngle(), polar: controls.getPolarAngle() };
  });

  return null;
}
