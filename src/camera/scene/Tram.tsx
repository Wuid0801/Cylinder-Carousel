import type { Ref } from "react";
import type { Group } from "three";
import { Outlined } from "./Outlined";

// 위치와 방향은 CameraDirector가 ref로 매 프레임 쓴다
export function Tram({ ref }: { ref: Ref<Group> }) {
  return (
    <group ref={ref}>
      <Outlined shape="tram" color="#8d8a82" position={[0, 0, 0]} />
      <Outlined shape="tramRoof" color="#5c5a55" position={[0, 0, 0]} />
    </group>
  );
}
