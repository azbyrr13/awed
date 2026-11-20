import React, { useEffect, useMemo, useRef, useState } from "react";
import { buildEventSchema } from "./eventSchema.js";

/* Нийт схем: үнийн саналын бүх бүтээгдэхүүнийг (LED, тайз, truss, гэрэл, дуу, MOKA, хаалт...) нэг схемд 3D / 2D-ээр харуулна. */
export default function EventSchema({ items = [], products = [] }) {
  const [mode, setMode] = useState("3d");
  const [copyLabel, setCopyLabel] = useState("Зураг хуулах");
  const [error3d, setError3d] = useState("");
  const canvasRef = useRef(null);
  const viewRef = useRef(null);

  // Үнийн саналын мөрөнд category байхгүй байж болох тул бүтээгдэхүүний жагсаалтаас нөхнө
  const schema = useMemo(() => {
    const byName = new Map(products.map((p) => [p.name, p.category]));
    const full = items.map((it) => ({
      ...it,
      category: it.category || byName.get(it.name) || "",
      measurement: it.measurement || (/module/i.test(it.name || "") && !/curved/i.test(it.name || "") ? "area" : "cabinet"),
    }));
    return buildEventSchema(full);
  }, [items, products]);

  const layout = schema.hasContent ? schema.layout : null;

  // three.js-ийг зөвхөн 3D горимд, хэрэгтэй үед нь ачаална (bundle-ийг жижиг байлгана)
  useEffect(() => {
    if (mode !== "3d" || !layout || !canvasRef.current) return;
    let cancelled = false;
    if (viewRef.current) {
      viewRef.current.update(layout);
      return;
    }
    import("./eventSchema3d.js")
      .then(({ mountEventSchema3D }) => {
        if (cancelled || !canvasRef.current) return;
        viewRef.current = mountEventSchema3D(canvasRef.current, layout);
        setError3d("");
      })
      .catch((e) => !cancelled && setError3d(e.message || String(e)));
    return () => {
      cancelled = true;
    };
  }, [mode, layout]);

  // 3D-ээс гарах эсвэл агуулга алга болоход WebGL-ийг чөлөөлнө
  useEffect(() => {
    if ((mode !== "3d" || !layout) && viewRef.current) {
      viewRef.current.dispose();
      viewRef.current = null;
    }
  }, [mode, layout]);
  useEffect(() => () => {
    viewRef.current?.dispose();
    viewRef.current = null;
  }, []);

  const copy3d = async () => {
    if (!viewRef.current) return;
    try {
      const blob = await (await fetch(viewRef.current.snapshot())).blob();
      await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
      setCopyLabel("Хуулагдлаа ✓");
    } catch {
      setCopyLabel("Хуулж чадсангүй");
    }
    setTimeout(() => setCopyLabel("Зураг хуулах"), 1500);
  };

  if (!schema.hasContent) return null;

  return (
    <div className="event-schema">
      <div className="event-schema-head">
        <strong>Нийт схем</strong>
        <span>Сонгосон бүх тоног төхөөрөмж угсарсан байдлаараа</span>
        <div className="event-schema-tabs quote-no-print">
          <button type="button" className={mode === "3d" ? "on" : ""} onClick={() => setMode("3d")}>3D</button>
          <button type="button" className={mode === "2d" ? "on" : ""} onClick={() => setMode("2d")}>2D</button>
        </div>
      </div>

      {schema.warnings.length > 0 && (
        <ul className="event-schema-warn">
          {schema.warnings.map((w, i) => <li key={i}>{w}</li>)}
        </ul>
      )}

      {mode === "3d" ? (
        <div className="event-schema-3d">
          {error3d ? (
            <p className="event-schema-3d-error">3D ачаалж чадсангүй: {error3d}</p>
          ) : (
            <div ref={canvasRef} className="event-schema-3d-canvas" />
          )}
          <div className="event-schema-3d-bar">
            <span>Хулганаар эргүүлэх · scroll-оор ойртуулах · баруун товчоор зөөх</span>
            <button type="button" onClick={() => viewRef.current?.resetCamera()}>↺ Анхны өнцөг</button>
            <button type="button" onClick={copy3d}>{copyLabel}</button>
          </div>
        </div>
      ) : (
        <div>
          <div className="event-schema-view">
            <span>Урдаас</span>
            <div dangerouslySetInnerHTML={{ __html: schema.front }} />
          </div>
          <div className="event-schema-view">
            <span>Дээрээс (план)</span>
            <div dangerouslySetInnerHTML={{ __html: schema.plan }} />
          </div>
        </div>
      )}

      <table className="event-schema-legend">
        <thead>
          <tr><th>Бүтээгдэхүүн</th><th>Тоо</th><th>Байрлал</th></tr>
        </thead>
        <tbody>
          {schema.rows.map((r, i) => (
            <tr key={i}>
              <td><i style={{ background: r.color }} />{r.name}</td>
              <td>{r.detail}</td>
              <td>{r.place}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
