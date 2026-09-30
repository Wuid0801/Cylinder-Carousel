import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { CylinderCarousel } from "../src/ui/CylinderCarousel";

describe("CylinderCarousel", () => {
  it("세트가 없으면 아무것도 렌더하지 않는다", () => {
    expect(renderToString(<CylinderCarousel sets={[]} />)).toBe("");
  });
});
