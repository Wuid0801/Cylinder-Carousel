import { BoxGeometry, ConeGeometry, EdgesGeometry, SphereGeometry, type BufferGeometry } from "three";

export const PAPER = "#f2efe6"; // 배경·안개 색
export const INK = "#2b2b2b"; // 윤곽선 색

export type ShapeName = "tree" | "hill" | "house" | "roof" | "platform" | "sleeper" | "tram" | "tramRoof";

// 모든 도형은 바닥(y=0)에 서도록 옮겨 둔다
export const SHAPES: Record<ShapeName, BufferGeometry> = {
  tree: new ConeGeometry(1, 3, 7).translate(0, 1.5, 0),
  hill: new SphereGeometry(1, 20, 8, 0, Math.PI * 2, 0, Math.PI / 2),
  house: new BoxGeometry(3, 2, 2.5).translate(0, 1, 0),
  roof: new ConeGeometry(2.4, 1.2, 4).rotateY(Math.PI / 4).translate(0, 2.6, 0),
  platform: new BoxGeometry(6, 0.4, 2).translate(0, 0.2, 0),
  sleeper: new BoxGeometry(0.25, 0.08, 1.4),
  tram: new BoxGeometry(3.2, 1.4, 1.3).translate(0, 0.9, 0),
  tramRoof: new BoxGeometry(3.4, 0.2, 1.5).translate(0, 1.7, 0),
};

// 언덕(곡면)은 면 사이 각도가 작아 윤곽선이 촘촘해지므로 30° 이상 꺾인 모서리만 그린다
export const EDGES = Object.fromEntries(
  (Object.keys(SHAPES) as ShapeName[]).map((name) => [name, new EdgesGeometry(SHAPES[name], name === "hill" ? 30 : 1)]),
) as Record<ShapeName, EdgesGeometry>;
