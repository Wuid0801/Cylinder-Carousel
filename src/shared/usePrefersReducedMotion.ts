import { useEffect, useState } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

// OS의 "동작 줄이기" 설정. 페이지를 연 채로 설정을 바꿔도 바로 반영한다
export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(() => window.matchMedia(QUERY).matches);

  useEffect(() => {
    const media = window.matchMedia(QUERY);
    const onChange = () => setReduced(media.matches);
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  return reduced;
}
