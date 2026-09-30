import { DoubleSide, type Texture } from "three";

const CYLINDER_SEGMENTS = 128;

interface CurvedImagePanelProps {
  texture: Texture;
  radius: number;
  height: number;
  thetaLength: number;
}

// 열린 원통의 일부 호로 곡면 패널 1장을 그린다.
// thetaStart = -θ/2로 로컬 중앙에 맞추고, 원통 위 배치(회전)는 부모 group이 맡는다.
export function CurvedImagePanel({ texture, radius, height, thetaLength }: CurvedImagePanelProps) {
  return (
    <mesh>
      <cylinderGeometry
        args={[
          radius, // 원통 반지름 상단
          radius, // 원통 반지름 하단
          height, // 원통 높이
          CYLINDER_SEGMENTS,
          1, // 높이 세그먼트
          true, // 열림 여부
          -thetaLength / 2, // 시작 각도
          thetaLength, // 각도 길이
        ]}
      />
      <meshStandardMaterial map={texture} side={DoubleSide} />
    </mesh>
  );
}
