import { mkdirSync, writeFileSync } from "node:fs";

// 데모용 번호 플레이스홀더 이미지를 만든다
const SETS = [
  ["set-a", 8, 210],
  ["set-b", 10, 150],
  ["set-c", 12, 30],
]; // [폴더, 장수, 색상 hue]

for (const [id, count, hue] of SETS) {
  mkdirSync(`public/images/${id}`, { recursive: true });
  for (let i = 1; i <= count; i++) {
    const n = String(i).padStart(2, "0");
    const lightness = Math.round(28 + (i * 36) / count);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="1000" viewBox="0 0 640 1000">
  <rect width="640" height="1000" fill="hsl(${hue}, 55%, ${lightness}%)"/>
  <text x="320" y="580" font-family="sans-serif" font-size="280" font-weight="700" fill="#fff" text-anchor="middle">${n}</text>
  <text x="320" y="900" font-family="sans-serif" font-size="48" fill="#fff" fill-opacity="0.8" text-anchor="middle">${id}</text>
</svg>
`;
    writeFileSync(`public/images/${id}/${n}.svg`, svg);
  }
}
