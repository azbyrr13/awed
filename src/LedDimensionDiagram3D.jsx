import React, { useRef, useState } from "react";

/* LED дэлгэцийн 3D схем: CSS 3D, нэмэлт сан шаардахгүй. Чирж эргүүлнэ. */
export default function LedDimensionDiagram3D({ width, height, quantity = 1, measurement = "cabinet", curved = false, curveAngle = 90, cube = false }) {
  const w = Math.max(0, Number(width) || 0);
  const h = Math.max(0, Number(height) || 0);
  const [rot, setRot] = useState({ x: -16, y: -32 });
  const [dragging, setDragging] = useState(false);
  const drag = useRef(null);
  if (!w || !h) return null;

  const cols = measurement === "cabinet" ? Math.ceil(w / 0.5) : Math.max(1, Math.ceil(w));
  const rows = measurement === "cabinet" ? Math.ceil(h / 0.5) : Math.max(1, Math.ceil(h));

  const thC = (Math.min(180, Math.max(10, Number(curveAngle) || 90)) * Math.PI) / 180;
  const visW = curved ? (2 * w * Math.sin(thC / 2)) / thC : w; // муруй үед харагдах хорд өргөн
  const scale = (curved ? 300 : cube ? 170 : 240) / Math.max(visW, h); // px / метр
  const W = Math.max(24, w * scale);
  const H = Math.max(24, h * scale);
  const D = Math.min(40, Math.max(8, 0.1 * scale)); // ~10 см зузаан
  const cellW = W / cols;
  const cellH = H / rows;
  const showGrid = measurement === "cabinet" && cellW >= 4 && cellH >= 4;

  const screen = "linear-gradient(135deg,#2b8be0,#0c3866)";
  const frontBg = showGrid
    ? `linear-gradient(to right, rgba(255,255,255,.4) 1px, transparent 1px) 0 0 / ${cellW}px 100%, linear-gradient(to bottom, rgba(255,255,255,.4) 1px, transparent 1px) 0 0 / 100% ${cellH}px, ${screen}`
    : screen;
  const backBg = showGrid
    ? `linear-gradient(to right, rgba(255,255,255,.12) 1px, transparent 1px) 0 0 / ${cellW}px 100%, linear-gradient(to bottom, rgba(255,255,255,.12) 1px, transparent 1px) 0 0 / 100% ${cellH}px, #2a2f35`
    : "#2a2f35";

  /* Муруй (нумарсан) дэлгэц: босоо хэсгүүдийг нум дагуу байрлуулна. Өргөн = нумын урт. */
  const deg = Math.min(180, Math.max(10, Number(curveAngle) || 90));
  const th = (deg * Math.PI) / 180;
  const nStrips = Math.min(Math.max(cols, 8), 60);
  const stripW = W / nStrips;
  const Rpx = W / th;
  const sagPx = Rpx * (1 - Math.cos(th / 2));
  const strips = curved
    ? Array.from({ length: nStrips }, (_, i) => {
        const a = -th / 2 + ((i + 0.5) / nStrips) * th;
        return { i, a, x: Rpx * Math.sin(a), z: Rpx * (1 - Math.cos(a)) - sagPx / 2 };
      })
    : [];
  const stripBg = (i) =>
    measurement === "cabinet" && nStrips === cols && cellH >= 4
      ? `linear-gradient(to right, rgba(255,255,255,.45) 1px, transparent 1px) 0 0 / 100% 100%, linear-gradient(to bottom, rgba(255,255,255,.4) 1px, transparent 1px) 0 0 / 100% ${cellH}px, ${screen}`
      : `linear-gradient(to bottom, rgba(255,255,255,.35) 1px, transparent 1px) 0 0 / 100% ${cellH}px, ${screen}`;

  /* Cube: суурь нь дөрвөлжин (гүн = өргөн). 4 тал + дээд тал LED, доод тал хар. */
  const gridBg = (cw, ch, base, a = 0.4) =>
    cw >= 4 && ch >= 4 && measurement === "cabinet"
      ? `linear-gradient(to right, rgba(255,255,255,${a}) 1px, transparent 1px) 0 0 / ${cw}px 100%, linear-gradient(to bottom, rgba(255,255,255,${a}) 1px, transparent 1px) 0 0 / 100% ${ch}px, ${base}`
      : base;
  const dots = "radial-gradient(circle, rgba(255,255,255,.55) 0 0.8px, transparent 1.3px) 0 0 / 4px 4px";
  const ledBg = `${dots}, ${gridBg(cellW, cellH, "linear-gradient(135deg,#1e78d0,#082f5c)", 0.5)}`;
  const innerBg = gridBg(cellW, cellH, "#1b1f24", 0.08);
  const qtyN = Number(quantity) || 1;
  const cubeCab = 4 * cols * rows * qtyN;

  const onPointerDown = (e) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { x: e.clientX, y: e.clientY, rx: rot.x, ry: rot.y, mouse: e.pointerType === "mouse" };
    setDragging(true);
  };
  const onPointerMove = (e) => {
    const d = drag.current;
    if (!d) return;
    const ry = d.ry + (e.clientX - d.x) * 0.5;
    const rx = d.mouse ? Math.max(-85, Math.min(85, d.rx - (e.clientY - d.y) * 0.5)) : d.rx;
    setRot({ x: rx, y: ry });
  };
  const onPointerUp = () => {
    drag.current = null;
    setDragging(false);
  };

  const face = { position: "absolute", backfaceVisibility: "hidden" };
  const side = "#1b1f24";

  return (
    <div className="led3d">
      <div className="led-diagram-caption">
        <strong>{cube ? "Cube дэлгэцийн 3D схем" : curved ? "Муруй дэлгэцийн 3D схем" : "Дэлгэцийн 3D схем"}</strong>
        <span>{cube ? `${w} × ${w} × ${h} м` : `${w} м${curved ? ` (нум · ${deg}°)` : ""} × ${h} м`} · {quantity} дэлгэц</span>
      </div>

      <div
        className="led3d-stage"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        role="img"
        aria-label={`${w} метр өргөн, ${h} метр өндөр LED дэлгэцийн 3D схем`}
      >
        <div
          className="led3d-box"
          style={{
            width: W,
            height: H,
            transform: `rotateX(${rot.x}deg) rotateY(${rot.y}deg)`,
            transition: dragging ? "none" : "transform .45s ease",
          }}
        >
          {cube ? (
            <>
              {/* Дээд тал нээлттэй, голдоо хоосон. Гадна тал нь LED, дотор тал нь хар. */}
              {[
                `translateZ(${W / 2}px)`,
                `rotateY(180deg) translateZ(${W / 2}px)`,
                `rotateY(90deg) translateZ(${W / 2}px)`,
                `rotateY(-90deg) translateZ(${W / 2}px)`,
              ].map((tf, i) => (
                <React.Fragment key={i}>
                  <div style={{ ...face, width: W, height: H, background: ledBg, transform: tf, boxShadow: "inset 0 0 0 2px rgba(8,24,44,.65)" }} />
                  <div style={{ ...face, width: W, height: H, background: innerBg, transform: `${tf} rotateY(180deg)` }} />
                </React.Fragment>
              ))}
              <div style={{ ...face, width: W, height: W, top: (H - W) / 2, background: "#0d1013", transform: `rotateX(90deg) translateZ(${-H / 2}px)` }} />
            </>
          ) : curved ? (
            strips.map(({ i, a, x, z }) => (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: (W - stripW) / 2,
                  top: 0,
                  width: stripW + 0.6,
                  height: H,
                  transformStyle: "preserve-3d",
                  transform: `translate3d(${x}px, 0, ${z}px) rotateY(${(-a * 180) / Math.PI}deg)`,
                }}
              >
                <div style={{ ...face, width: "100%", height: "100%", background: stripBg(i) }} />
                <div style={{ ...face, width: "100%", height: "100%", background: "#2a2f35", transform: "rotateY(180deg)" }} />
              </div>
            ))
          ) : (
            <>
          <div style={{ ...face, width: W, height: H, background: frontBg, transform: `translateZ(${D / 2}px)` }} />
          <div style={{ ...face, width: W, height: H, background: backBg, transform: `rotateY(180deg) translateZ(${D / 2}px)` }} />
          <div style={{ ...face, width: D, height: H, left: (W - D) / 2, background: side, transform: `rotateY(90deg) translateZ(${W / 2}px)` }} />
          <div style={{ ...face, width: D, height: H, left: (W - D) / 2, background: side, transform: `rotateY(-90deg) translateZ(${W / 2}px)` }} />
          <div style={{ ...face, width: W, height: D, top: (H - D) / 2, background: side, transform: `rotateX(90deg) translateZ(${H / 2}px)` }} />
          <div style={{ ...face, width: W, height: D, top: (H - D) / 2, background: side, transform: `rotateX(-90deg) translateZ(${H / 2}px)` }} />
            </>
          )}
        </div>
      </div>

      <div className="led3d-bar">
        <div className="led3d-views">
          <button type="button" onClick={() => setRot({ x: 0, y: 0 })}>Урд</button>
          <button type="button" onClick={() => setRot({ x: 0, y: -90 })}>Хажуу</button>
          <button type="button" onClick={() => setRot({ x: 0, y: 180 })}>Ар</button>
          <button type="button" onClick={() => setRot({ x: -16, y: -32 })}>↺</button>
        </div>
        <span>{cube ? `${cubeCab} cabinet (4 тал ${cols}×${rows}, дээд нээлттэй)` : measurement === "cabinet" ? `${cols} × ${rows} = ${cols * rows * (Number(quantity) || 1)} cabinet` : `${(w * h * (Number(quantity) || 1)).toFixed(2)} м²`}</span>
      </div>
    </div>
  );
}