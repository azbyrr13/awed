import React, { useEffect, useRef, useState } from "react";

/**
 * 360° эргэдэг бүтээгдэхүүний зураг.
 * dir: frame-үүдийн хавтас (/images/.../f000.webp, f001.webp ...)
 * count: нийт frame-ийн тоо
 * Хулганаар/хуруугаар чирж эргүүлнэ, ← → товчоор бас болно.
 */
export default function Product360({ dir, count, ext = "webp", alt = "", speed = 60 }) {
  const [frame, setFrame] = useState(0);
  const [loaded, setLoaded] = useState(0);
  const [playing, setPlaying] = useState(true);
  const drag = useRef(null);
  const box = useRef(null);

  const src = (i) => `${dir}/f${String(i).padStart(3, "0")}.${ext}`;

  // Бүх frame-ийг түрүүлж ачаална
  useEffect(() => {
    let cancelled = false;
    let n = 0;
    setLoaded(0);
    for (let i = 0; i < count; i++) {
      const im = new Image();
      im.onload = im.onerror = () => {
        if (!cancelled) setLoaded(++n);
      };
      im.src = src(i);
    }
    return () => {
      cancelled = true;
    };
  }, [dir, count]);

  // Автоматаар эргэх
  useEffect(() => {
    if (!playing || loaded < count) return;
    const t = setInterval(() => setFrame((f) => (f + 1) % count), speed);
    return () => clearInterval(t);
  }, [playing, loaded, count, speed]);

  const wrap = (n) => ((n % count) + count) % count;

  const onPointerDown = (e) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { x: e.clientX, start: frame };
    setPlaying(false);
  };
  const onPointerMove = (e) => {
    if (!drag.current) return;
    const w = box.current?.clientWidth || 600;
    const dx = e.clientX - drag.current.x;
    setFrame(wrap(drag.current.start - Math.round((dx / w) * count)));
  };
  const onPointerUp = () => {
    drag.current = null;
  };
  const onKeyDown = (e) => {
    if (e.key === "ArrowLeft") { setPlaying(false); setFrame((f) => wrap(f + 1)); }
    if (e.key === "ArrowRight") { setPlaying(false); setFrame((f) => wrap(f - 1)); }
  };

  const ready = loaded >= count;

  return (
    <div className="p360">
      <div
        className="p360-stage"
        ref={box}
        tabIndex={0}
        role="img"
        aria-label={`${alt} — 360° харагдац`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onKeyDown={onKeyDown}
      >
        <img src={src(frame)} alt={alt} draggable={false} />
      </div>
      <div className="p360-bar">
        <button type="button" onClick={() => setPlaying((p) => !p)} disabled={!ready}>
          {playing ? "❚❚ Зогсоох" : "▶ Эргүүлэх"}
        </button>
        <span>{ready ? "Чирж эргүүлнэ · 360°" : `Ачаалж байна ${Math.round((loaded / count) * 100)}%`}</span>
      </div>
    </div>
  );
}
