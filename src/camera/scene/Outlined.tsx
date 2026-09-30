import type { Vec3 } from "../core/vec3";
import { EDGES, INK, SHAPES, type ShapeName } from "./shapes";

interface OutlinedProps {
  shape: ShapeName;
  color: string;
  position: Vec3;
  rotationY?: number;
  scale?: number;
}

// 회색조 면 + 검은 윤곽선
export function Outlined({ shape, color, position, rotationY = 0, scale = 1 }: OutlinedProps) {
  return (
    <group position={position} rotation={[0, rotationY, 0]} scale={scale}>
      <mesh geometry={SHAPES[shape]}>
        <meshLambertMaterial color={color} />
      </mesh>
      <lineSegments geometry={EDGES[shape]}>
        <lineBasicMaterial color={INK} />
      </lineSegments>
    </group>
  );
}
