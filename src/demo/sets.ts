import type { CarouselSet } from "../ui/CylinderCarousel";

// base: "./" 빌드에서도 GitHub Pages 하위 경로 기준으로 풀리도록 BASE_URL을 붙인다
const BASE = import.meta.env.BASE_URL;

function makeSet(id: string, label: string, count: number): CarouselSet {
  const images = Array.from({ length: count }, (_, i) => `${BASE}images/${id}/${String(i + 1).padStart(2, "0")}.svg`);
  return { id, label, thumbnail: images[0], thumbnailAlt: `${label} 첫 번째 이미지`, images };
}

// 패널 수에 따른 배치 차이를 보이도록 장수를 다르게 둔다
export const SETS: CarouselSet[] = [makeSet("set-a", "Set A · 8장", 8), makeSet("set-b", "Set B · 10장", 10), makeSet("set-c", "Set C · 12장", 12)];
