import React, { useState } from "react";
import LedDimensionDiagram from "./LedDimensionDiagram.jsx";
import LedDimensionDiagram3D from "./LedDimensionDiagram3D.jsx";

/* 2D / 3D схемийн сонголттой хэсэг */
export default function LedDiagramPanel(props) {
  const [mode, setMode] = useState("3d");
  return (
    <div className="led-panel">
      <div className="led-panel-tabs">
        <button type="button" className={mode === "3d" ? "active" : ""} onClick={() => setMode("3d")}>3D</button>
        <button type="button" className={mode === "2d" ? "active" : ""} onClick={() => setMode("2d")}>2D</button>
      </div>
      {mode === "3d" ? <LedDimensionDiagram3D {...props} /> : <LedDimensionDiagram {...props} />}
    </div>
  );
}
