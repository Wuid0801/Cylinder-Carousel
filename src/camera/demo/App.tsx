import { Canvas } from "@react-three/fiber";
import { useMemo } from "react";
import { ErrorBoundary } from "../../shared/ErrorBoundary";
import { DEFAULT_CAMERA_CONFIG } from "../core/config";
import { createPath } from "../core/path";
import { STATIONS, TRACK_POINTS } from "../core/world";
import { Tram } from "../scene/Tram";
import { World } from "../scene/World";

export function App() {
  const config = DEFAULT_CAMERA_CONFIG;
  const path = useMemo(() => createPath(TRACK_POINTS, { tension: config.tension, arcLength: config.arcLength }), [config.tension, config.arcLength]);

  return (
    <div className="cam">
      <ErrorBoundary>
        <Canvas className="cam_canvas" camera={{ position: [0, 25, 60], fov: 40, near: 0.1, far: 500 }} style={{ position: "fixed", inset: 0 }}>
          <World path={path} stations={STATIONS} fogNear={config.fogNear} fogFar={config.fogFar + 60} />
          <Tram ref={null} />
        </Canvas>
      </ErrorBoundary>
      <header className="cam_bar">
        <h1>Camera Playground</h1>
        <nav>
          <a href="../">캐러셀</a>
        </nav>
      </header>
    </div>
  );
}
