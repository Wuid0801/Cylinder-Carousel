import { useThree } from "@react-three/fiber";
import { useEffect } from "react";
import { PerspectiveCamera } from "three";

interface CameraRigProps {
  fov: number;
  height: number;
  distance: number;
}

// Canvas의 camera prop은 처음 생성할 때만 적용되므로, 화면에서 바꾼 값은 여기서 기존 카메라에 반영한다
export function CameraRig({ fov, height, distance }: CameraRigProps) {
  const camera = useThree((state) => state.camera);
  const invalidate = useThree((state) => state.invalidate);

  useEffect(() => {
    camera.position.set(0, height, distance);
    camera.lookAt(0, 0, 0); // R3F가 기본 카메라를 만들 때와 같은 방향
    if (camera instanceof PerspectiveCamera) {
      camera.fov = fov;
      camera.updateProjectionMatrix();
    }
    invalidate();
  }, [camera, fov, height, distance, invalidate]);

  return null;
}
