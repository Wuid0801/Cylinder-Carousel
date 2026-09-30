import { useEffect, useMemo } from "react";
import { BufferGeometry, Float32BufferAttribute } from "three";
import type { Path } from "../core/path";
import { alongTrack, layoutForeground, layoutScenery, railSegments, stationSpot } from "../core/world";
import { Outlined } from "./Outlined";
import { INK, PAPER } from "./shapes";

const SCENERY_SEED = 7;

const COLORS = {
  tree: "#7a7a72",
  hill: "#b9b4a8",
  house: "#9a968c",
  roof: "#5c5a55",
  platform: "#a8a499",
  sleeper: "#6e6a62",
  ground: "#e9e4d6",
};

interface WorldProps {
  path: Path;
  stations: number[];
  fogNear: number;
  fogFar: number;
}

export function World({ path, stations, fogNear, fogFar }: WorldProps) {
  const scenery = useMemo(() => layoutScenery(SCENERY_SEED), []);
  const foreground = useMemo(() => layoutForeground(path, SCENERY_SEED), [path]);
  const sleepers = useMemo(() => alongTrack(path, 1.5), [path]);
  const spots = useMemo(() => stations.map((u) => stationSpot(path, u)), [path, stations]);
  const rails = useMemo(() => {
    const geometry = new BufferGeometry();
    geometry.setAttribute("position", new Float32BufferAttribute(railSegments(path, 0.5, 300), 3));
    return geometry;
  }, [path]);

  // 선로가 다시 만들어지면(장력·호 길이 보정 변경) 이전 레일 geometry를 GPU에서 해제한다
  useEffect(() => () => rails.dispose(), [rails]);

  return (
    <>
      <color attach="background" args={[PAPER]} />
      <fog attach="fog" args={[PAPER, fogNear, fogFar]} />
      <ambientLight intensity={0.9} />
      <directionalLight position={[10, 20, 10]} intensity={0.8} />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]}>
        <planeGeometry args={[400, 400]} />
        <meshLambertMaterial color={COLORS.ground} />
      </mesh>

      <lineSegments geometry={rails}>
        <lineBasicMaterial color={INK} />
      </lineSegments>
      {sleepers.map((s, i) => (
        <Outlined key={i} shape="sleeper" color={COLORS.sleeper} position={s.position} rotationY={s.rotationY} />
      ))}

      {spots.map((spot, i) => (
        <group key={i}>
          <Outlined shape="platform" color={COLORS.platform} position={spot.platform} rotationY={spot.rotationY} />
          <Outlined shape="house" color={COLORS.house} position={spot.house} rotationY={spot.rotationY} />
          <Outlined shape="roof" color={COLORS.roof} position={spot.house} rotationY={spot.rotationY} />
        </group>
      ))}

      {[...scenery, ...foreground].map((prop, i) => (
        <Outlined key={i} shape={prop.kind} color={COLORS[prop.kind]} position={prop.position} scale={prop.scale} />
      ))}
    </>
  );
}
