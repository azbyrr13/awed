import React, { useId } from "react";

/* LED дэлгэцийн 2D схем: бодит харьцаа, cabinet-ийн тор, хэмжээсийн шугам, тоо хэмжээ */
const CAB = 0.5; // нэг cabinet = 50 × 50 см
const fmt = (n) => Number(n.toFixed(2)).toString();

export default function LedDimensionDiagram({ width, height, quantity = 1, measurement = "cabinet", curved = false, curveAngle = 90, cube = false }) {
  const uid = useId().replace(/:/g, "");
  const w = Math.max(0, Number(width) || 0);
  const h = Math.max(0, Number(height) || 0);
  if (!w || !h) return null;
  if (cube) return <CubeDiagram2D w={w} h={h} quantity={quantity} measurement={measurement} uid={uid} />;
  if (curved) return <CurvedDiagram2D w={w} h={h} quantity={quantity} measurement={measurement} angle={curveAngle} uid={uid} />;

  const qty = Number(quantity) || 1;
  const isCab = measurement === "cabinet";
  const cols = isCab ? Math.ceil(w / CAB) : Math.max(1, Math.ceil(w));
  const rows = isCab ? Math.ceil(h / CAB) : Math.max(1, Math.ceil(h));
  // cabinet горимд нүд нь дөрвөлжин байхаар cabinet-д таарсан бодит хэмжээгээр зурна
  const aw = isCab ? cols * CAB : w;
  const ah = isCab ? rows * CAB : h;
  const adjusted = isCab && (Math.abs(aw - w) > 1e-6 || Math.abs(ah - h) > 1e-6);

  const VW = 800, VH = 540;
  const maxW = 560, maxH = 320;
  const s = Math.min(maxW / aw, maxH / ah);
  const dw = aw * s, dh = ah * s;
  const x0 = (VW - dw) / 2 + 14;
  const y0 = 92 + (maxH - dh) / 2;
  const cw = dw / cols, ch = dh / rows;

  const diag = Math.sqrt(w * w + h * h);
  const area = w * h;
  const ratio = w / h;
  const totalCab = cols * rows * qty;

  // Тор (grid) шугамууд — нэг path-ээр хөнгөн зурна
  let grid = "";
  for (let i = 1; i < cols; i++) grid += `M${x0 + i * cw},${y0}V${y0 + dh}`;
  for (let j = 1; j < rows; j++) grid += `M${x0},${y0 + j * ch}H${x0 + dw}`;

  const showColNums = isCab && cols <= 24 && cw >= 14;
  const showRowNums = isCab && rows <= 16 && ch >= 14;
  const showCabLabel = isCab && cw >= 10 && ch >= 10;

  const dimY = y0 - 30;
  const dimX = x0 - 46;
  const label = { fontFamily: "Arial, sans-serif", fontWeight: 700, fontSize: 15, fill: "#0f5a8f" };
  const tiny = { fontFamily: "Arial, sans-serif", fontSize: 10, fill: "#5b7790" };

  const chip = (t, v) => (
    <div style={{ flex: "1 1 120px", minWidth: 110, padding: "8px 10px", border: "1px solid #cfe2f3", borderRadius: 10, background: "#fff", textAlign: "center" }}>
      <div style={{ fontSize: 10.5, letterSpacing: ".04em", textTransform: "uppercase", color: "#6b869c" }}>{t}</div>
      <div style={{ fontSize: 15, fontWeight: 700, color: "#17324b", marginTop: 2 }}>{v}</div>
    </div>
  );

  return (
    <div className="led-dimension-diagram">
      <div className="led-diagram-caption">
        <strong>Дэлгэцийн хэмжээний схем</strong>
        <span>{fmt(w)} м × {fmt(h)} м · {qty} дэлгэц</span>
      </div>

      <svg viewBox={`0 0 ${VW} ${VH}`} role="img" aria-label={`${fmt(w)} метр өргөн, ${fmt(h)} метр өндөр LED дэлгэцийн схем`} style={{ WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>
        <defs>
          <linearGradient id={`scr${uid}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#5bb0f0" />
            <stop offset="0.55" stopColor="#2f86d0" />
            <stop offset="1" stopColor="#1b5fa6" />
          </linearGradient>
          <linearGradient id={`shine${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#fff" stopOpacity=".28" />
            <stop offset="0.5" stopColor="#fff" stopOpacity="0" />
          </linearGradient>
          <pattern id={`bg${uid}`} width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M20 0H0V20" fill="none" stroke="#dbe8f4" strokeWidth=".6" />
          </pattern>
          <marker id={`arr${uid}`} markerWidth="9" markerHeight="9" refX="4.5" refY="4.5" orient="auto-start-reverse">
            <path d="M0,1 L8,4.5 L0,8 Z" fill="#0f5a8f" />
          </marker>
          <filter id={`sh${uid}`} x="-5%" y="-5%" width="110%" height="115%">
            <feDropShadow dx="0" dy="4" stdDeviation="5" floodColor="#0b2f50" floodOpacity=".28" />
          </filter>
        </defs>

        {/* Зургийн дэвсгэр */}
        <rect x="0" y="0" width={VW} height={VH} rx="10" fill="#f4f9ff" />
        <rect x="0" y="0" width={VW} height={VH} rx="10" fill={`url(#bg${uid})`} />

        {/* Өргөний хэмжээс */}
        <line x1={x0} y1={y0 - 6} x2={x0} y2={dimY - 8} stroke="#7fa8c9" strokeWidth="1" />
        <line x1={x0 + dw} y1={y0 - 6} x2={x0 + dw} y2={dimY - 8} stroke="#7fa8c9" strokeWidth="1" />
        <line x1={x0} y1={dimY} x2={x0 + dw} y2={dimY} stroke="#0f5a8f" strokeWidth="1.8" markerStart={`url(#arr${uid})`} markerEnd={`url(#arr${uid})`} />
        <rect x={x0 + dw / 2 - 62} y={dimY - 13} width="124" height="26" rx="13" fill="#fff" stroke="#0f5a8f" strokeWidth="1.2" />
        <text x={x0 + dw / 2} y={dimY + 5.5} textAnchor="middle" style={label}>{fmt(w)} м</text>

        {/* Өндрийн хэмжээс */}
        <line x1={x0 - 6} y1={y0} x2={dimX - 8} y2={y0} stroke="#7fa8c9" strokeWidth="1" />
        <line x1={x0 - 6} y1={y0 + dh} x2={dimX - 8} y2={y0 + dh} stroke="#7fa8c9" strokeWidth="1" />
        <line x1={dimX} y1={y0} x2={dimX} y2={y0 + dh} stroke="#0f5a8f" strokeWidth="1.8" markerStart={`url(#arr${uid})`} markerEnd={`url(#arr${uid})`} />
        <g transform={`translate(${dimX} ${y0 + dh / 2}) rotate(-90)`}>
          <rect x="-62" y="-13" width="124" height="26" rx="13" fill="#fff" stroke="#0f5a8f" strokeWidth="1.2" />
          <text x="0" y="5.5" textAnchor="middle" style={label}>{fmt(h)} м</text>
        </g>

        {/* Дэлгэц */}
        <g filter={`url(#sh${uid})`}>
          <rect x={x0} y={y0} width={dw} height={dh} fill={`url(#scr${uid})`} />
        </g>
        {isCab && <path d={grid} stroke="#ffffff" strokeOpacity=".55" strokeWidth={cw < 8 ? 0.5 : 1} fill="none" />}
        {!isCab && <path d={grid} stroke="#ffffff" strokeOpacity=".35" strokeWidth="1" strokeDasharray="4 4" fill="none" />}
        <rect x={x0} y={y0} width={dw} height={dh} fill={`url(#shine${uid})`} />
        <rect x={x0} y={y0} width={dw} height={dh} fill="none" stroke="#0d3f6b" strokeWidth="2.5" />

        {/* Багана / мөрийн дугаар */}
        {showColNums && Array.from({ length: cols }, (_, i) => (
          <text key={`c${i}`} x={x0 + i * cw + cw / 2} y={y0 + 13} textAnchor="middle" style={{ ...tiny, fill: "#fff", fillOpacity: 0.85 }}>{i + 1}</text>
        ))}
        {showRowNums && Array.from({ length: rows }, (_, j) => (
          <text key={`r${j}`} x={x0 - 8} y={y0 + j * ch + ch / 2 + 3.5} textAnchor="end" style={tiny}>{j + 1}</text>
        ))}

        {/* Нэг cabinet-ийн жишээ */}
        {showCabLabel && (
          <g>
            <rect x={x0 + dw - cw} y={y0 + dh - ch} width={cw} height={ch} fill="#ffb020" fillOpacity=".55" stroke="#ff8a00" strokeWidth="2" />
            <line x1={x0 + dw - cw / 2} y1={y0 + dh} x2={x0 + dw - cw / 2} y2={y0 + dh + 18} stroke="#ff8a00" strokeWidth="1.5" />
            <text x={x0 + dw - cw / 2} y={y0 + dh + 32} textAnchor="middle" style={{ ...tiny, fontSize: 11.5, fontWeight: 700, fill: "#c76a00" }}>1 cabinet = 50 × 50 см</text>
          </g>
        )}

        {/* Доод хураангуй */}
        <text x={VW / 2} y={VH - 62} textAnchor="middle" style={{ fontFamily: "Arial, sans-serif", fontWeight: 700, fontSize: 15, fill: "#17324b" }}>
          {isCab ? `${cols} багана × ${rows} мөр = ${cols * rows} cabinet${qty > 1 ? ` · нийт ${totalCab} cabinet (${qty} дэлгэц)` : ""}` : `${fmt(area * qty)} м²${qty > 1 ? ` (${qty} дэлгэц)` : ""}`}
        </text>
        {adjusted && (
          <text x={VW / 2} y={VH - 42} textAnchor="middle" style={tiny}>Cabinet-д тааруулсан бодит хэмжээ: {fmt(aw)} м × {fmt(ah)} м</text>
        )}
      </svg>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
        {chip("Талбай", `${fmt(area)} м²`)}
        {chip("Диагональ", `${fmt(diag)} м`)}
        {chip("Харьцаа", ratio >= 1 ? `${fmt(ratio)} : 1` : `1 : ${fmt(1 / ratio)}`)}
        {isCab ? chip("Cabinet", `${cols * rows * qty} ш`) : chip("Нийт талбай", `${fmt(area * qty)} м²`)}
      </div>

      <small style={{ display: "block", marginTop: 8 }}>
        {isCab ? "Нэг cabinet: 50 × 50 см · Хэмжээг бүхэл cabinet-д тааруулан дээш тоймлов" : "Module LED · м²-аар тооцно"}
      </small>
    </div>
  );
}

/* ───────── Муруй (нумарсан) дэлгэц: дээрээс харсан план + урдаас харсан зураг ───────── */
function CurvedDiagram2D({ w, h, quantity, measurement, angle, uid }) {
  const qty = Number(quantity) || 1;
  const isCab = measurement === "cabinet";
  const deg = Math.min(180, Math.max(10, Number(angle) || 90));
  const th = (deg * Math.PI) / 180;
  const R = w / th;                       // муруйн радиус (м) — өргөн = нумын урт
  const chord = 2 * R * Math.sin(th / 2); // хоёр үзүүрийн хоорондох шулуун зай
  const sag = R * (1 - Math.cos(th / 2)); // гүн (төв ба үзүүрийн зөрүү)
  const cols = isCab ? Math.ceil(w / CAB) : Math.max(1, Math.ceil(w));
  const rows = isCab ? Math.ceil(h / CAB) : Math.max(1, Math.ceil(h));
  const n = Math.min(Math.max(cols, 4), 48);

  const VW = 800, VH = 560;
  const label = { fontFamily: "Arial, sans-serif", fontWeight: 700, fontSize: 14, fill: "#0f5a8f" };
  const tiny = { fontFamily: "Arial, sans-serif", fontSize: 11, fill: "#5b7790" };
  const title = { fontFamily: "Arial, sans-serif", fontWeight: 700, fontSize: 13, fill: "#17324b" };

  /* ПЛАН (дээрээс): үзэгчид доод талд, дэлгэцийн хотгор тал үзэгч рүү харна */
  const sp = Math.min(520 / chord, 150 / Math.max(sag, 0.05));
  const cx = VW / 2, yTop = 70;
  const pt = (a) => [cx + R * sp * Math.sin(a), yTop + R * sp * (1 - Math.cos(a))];
  const steps = 60;
  let arc = "";
  for (let i = 0; i <= steps; i++) {
    const [x, y] = pt(-th / 2 + (i / steps) * th);
    arc += `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`;
  }
  const [lx, ly] = pt(-th / 2), [rx, ry] = pt(th / 2);
  const ticks = Array.from({ length: n + 1 }, (_, i) => {
    const a = -th / 2 + (i / n) * th;
    const [x, y] = pt(a);
    const nx = -Math.sin(a), ny = Math.cos(a); // төв рүү (үзэгч тал руу) чиглэсэн нормаль
    return [x - nx * 7, y - ny * 7, x + nx * 7, y + ny * 7];
  });
  const yDim = ry + 30;

  /* УРД ТАЛААС: хэсгүүдийн бодит проекц (cos-оор нягтарна) */
  const sf = Math.min(480 / chord, 140 / h);
  const fw = chord * sf, fh = h * sf;
  const fx0 = (VW - fw) / 2 + 20, fy0 = 336 + (140 - fh) / 2;
  const xs = Array.from({ length: n + 1 }, (_, i) => fx0 + fw / 2 + R * sf * Math.sin(-th / 2 + (i / n) * th));
  const hl = isCab || rows > 1 ? Array.from({ length: Math.min(rows - 1, 60) }, (_, j) => fy0 + ((j + 1) * fh) / rows) : [];

  const chip = (t, v) => (
    <div style={{ flex: "1 1 110px", minWidth: 100, padding: "8px 10px", border: "1px solid #cfe2f3", borderRadius: 10, background: "#fff", textAlign: "center" }}>
      <div style={{ fontSize: 10.5, letterSpacing: ".04em", textTransform: "uppercase", color: "#6b869c" }}>{t}</div>
      <div style={{ fontSize: 15, fontWeight: 700, color: "#17324b", marginTop: 2 }}>{v}</div>
    </div>
  );

  return (
    <div className="led-dimension-diagram">
      <div className="led-diagram-caption">
        <strong>Муруй дэлгэцийн схем</strong>
        <span>{fmt(w)} м (нум) × {fmt(h)} м · {deg}° · {qty} дэлгэц</span>
      </div>

      <svg viewBox={`0 0 ${VW} ${VH}`} role="img" aria-label={`${fmt(w)} метр нумын урт, ${fmt(h)} метр өндөр муруй LED дэлгэцийн схем`} style={{ WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>
        <defs>
          <pattern id={`cbg${uid}`} width="20" height="20" patternUnits="userSpaceOnUse"><path d="M20 0H0V20" fill="none" stroke="#dbe8f4" strokeWidth=".6" /></pattern>
          <linearGradient id={`cscr${uid}`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#5bb0f0" /><stop offset="0.55" stopColor="#2f86d0" /><stop offset="1" stopColor="#1b5fa6" /></linearGradient>
          <marker id={`carr${uid}`} markerWidth="9" markerHeight="9" refX="4.5" refY="4.5" orient="auto-start-reverse"><path d="M0,1 L8,4.5 L0,8 Z" fill="#0f5a8f" /></marker>
        </defs>
        <rect width={VW} height={VH} rx="10" fill="#f4f9ff" />
        <rect width={VW} height={VH} rx="10" fill={`url(#cbg${uid})`} />

        {/* ПЛАН */}
        <text x="24" y="30" style={title}>Дээрээс харсан (план)</text>
        <path d={arc} fill="none" stroke="#0d3f6b" strokeWidth="14" strokeLinecap="butt" />
        <path d={arc} fill="none" stroke={`url(#cscr${uid})`} strokeWidth="10" strokeLinecap="butt" />
        {ticks.map((t, i) => <line key={i} x1={t[0]} y1={t[1]} x2={t[2]} y2={t[3]} stroke="#fff" strokeOpacity=".6" strokeWidth="1" />)}
        <text x={cx} y={yTop - 16} textAnchor="middle" style={tiny}>дэлгэцийн ар тал</text>
        <text x={cx} y={yTop + R * sp * (1 - Math.cos(0)) + sag * sp + 58} textAnchor="middle" style={{ ...tiny, fill: "#8aa3b8" }}>▼ үзэгч</text>

        {/* Хорда */}
        <line x1={lx} y1={ly + 8} x2={lx} y2={yDim + 6} stroke="#7fa8c9" />
        <line x1={rx} y1={ry + 8} x2={rx} y2={yDim + 6} stroke="#7fa8c9" />
        <line x1={lx} y1={yDim} x2={rx} y2={yDim} stroke="#0f5a8f" strokeWidth="1.6" markerStart={`url(#carr${uid})`} markerEnd={`url(#carr${uid})`} />
        <rect x={cx - 70} y={yDim - 12} width="140" height="24" rx="12" fill="#fff" stroke="#0f5a8f" />
        <text x={cx} y={yDim + 5} textAnchor="middle" style={label}>хорд {fmt(chord)} м</text>
        {/* Гүн */}
        <line x1={rx + 22} y1={yTop} x2={rx + 22} y2={ry} stroke="#0f5a8f" strokeWidth="1.6" markerStart={`url(#carr${uid})`} markerEnd={`url(#carr${uid})`} />
        <line x1={cx} y1={yTop} x2={rx + 28} y2={yTop} stroke="#7fa8c9" strokeDasharray="3 3" />
        <line x1={rx + 6} y1={ry} x2={rx + 28} y2={ry} stroke="#7fa8c9" />
        <text x={rx + 32} y={(yTop + ry) / 2 + 4} style={label}>гүн {fmt(sag)} м</text>

        {/* УРД ТАЛААС */}
        <text x="24" y="326" style={title}>Урдаас харсан</text>
        <rect x={fx0} y={fy0} width={fw} height={fh} fill={`url(#cscr${uid})`} stroke="#0d3f6b" strokeWidth="2.5" />
        {xs.slice(1, -1).map((x, i) => <line key={`v${i}`} x1={x} y1={fy0} x2={x} y2={fy0 + fh} stroke="#fff" strokeOpacity=".55" />)}
        {hl.map((y, j) => <line key={`h${j}`} x1={fx0} y1={y} x2={fx0 + fw} y2={y} stroke="#fff" strokeOpacity=".4" />)}
        <line x1={fx0 - 26} y1={fy0} x2={fx0 - 26} y2={fy0 + fh} stroke="#0f5a8f" strokeWidth="1.6" markerStart={`url(#carr${uid})`} markerEnd={`url(#carr${uid})`} />
        <g transform={`translate(${fx0 - 26} ${fy0 + fh / 2}) rotate(-90)`}><rect x="-40" y="-12" width="80" height="24" rx="12" fill="#fff" stroke="#0f5a8f" /><text y="5" textAnchor="middle" style={label}>{fmt(h)} м</text></g>
        <line x1={fx0} y1={fy0 + fh + 18} x2={fx0 + fw} y2={fy0 + fh + 18} stroke="#0f5a8f" strokeWidth="1.6" markerStart={`url(#carr${uid})`} markerEnd={`url(#carr${uid})`} />
        <rect x={fx0 + fw / 2 - 60} y={fy0 + fh + 6} width="120" height="24" rx="12" fill="#fff" stroke="#0f5a8f" />
        <text x={fx0 + fw / 2} y={fy0 + fh + 23} textAnchor="middle" style={label}>{fmt(chord)} м</text>

        <text x={VW / 2} y={VH - 14} textAnchor="middle" style={{ fontFamily: "Arial, sans-serif", fontWeight: 700, fontSize: 14, fill: "#17324b" }}>
          {isCab ? `${cols} багана × ${rows} мөр = ${cols * rows * qty} cabinet` : `${fmt(w * h * qty)} м²`}
        </text>
      </svg>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
        {chip("Нумын урт", `${fmt(w)} м`)}
        {chip("Өнцөг", `${deg}°`)}
        {chip("Радиус", `${fmt(R)} м`)}
        {chip("Талбай", `${fmt(w * h * qty)} м²`)}
      </div>
      <small style={{ display: "block", marginTop: 8 }}>Өргөнийг нумын урт гэж авч, {deg}° муруйлтаар зурав · Бодит муруйлтыг төслийн дагуу баталгаажуулна</small>
    </div>
  );
}

/* ───────── Cube дэлгэц: дэлгэмэл (net) зураг — 4 тал + дээд тал ───────── */
function CubeDiagram2D({ w, h, quantity, measurement, uid }) {
  const qty = Number(quantity) || 1;
  const isCab = measurement === "cabinet";
  const cols = isCab ? Math.ceil(w / CAB) : Math.max(1, Math.ceil(w));
  const rows = isCab ? Math.ceil(h / CAB) : Math.max(1, Math.ceil(h));
  const VW = 800, VH = 560;
  const label = { fontFamily: "Arial, sans-serif", fontWeight: 700, fontSize: 14, fill: "#0f5a8f" };
  const name = { fontFamily: "Arial, sans-serif", fontWeight: 700, fontSize: 12, fill: "#fff", fillOpacity: 0.9 };

  const s = Math.min(640 / (4 * w), 340 / h);
  const fw = w * s, fh = h * s;
  const x0 = (VW - 4 * fw) / 2 + 14;
  const y0 = 120 + (340 - fh) / 2;              // 4 тал нэг эгнээнд
  const faces = [["Зүүн", 0], ["Урд", 1], ["Баруун", 2], ["Ар", 3]];
  const gridPath = (x, y, ww, hh, c, r) => {
    let d = "";
    for (let i = 1; i < c; i++) d += `M${x + (i * ww) / c},${y}V${y + hh}`;
    for (let j = 1; j < r; j++) d += `M${x},${y + (j * hh) / r}H${x + ww}`;
    return d;
  };
  const gw = (c, ww) => (ww / c < 8 ? 0.5 : 1);
  const dimY = y0 + fh + 28;
  const totalCab = 4 * cols * rows * qty;
  const areaAll = 4 * w * h * qty;

  const chip = (t, v) => (
    <div style={{ flex: "1 1 110px", minWidth: 100, padding: "8px 10px", border: "1px solid #cfe2f3", borderRadius: 10, background: "#fff", textAlign: "center" }}>
      <div style={{ fontSize: 10.5, letterSpacing: ".04em", textTransform: "uppercase", color: "#6b869c" }}>{t}</div>
      <div style={{ fontSize: 15, fontWeight: 700, color: "#17324b", marginTop: 2 }}>{v}</div>
    </div>
  );

  return (
    <div className="led-dimension-diagram">
      <div className="led-diagram-caption">
        <strong>Cube дэлгэцийн схем</strong>
        <span>{fmt(w)} × {fmt(w)} × {fmt(h)} м · {qty} дэлгэц</span>
      </div>
      <svg viewBox={`0 0 ${VW} ${VH}`} role="img" aria-label={`${fmt(w)} x ${fmt(w)} x ${fmt(h)} метрийн Cube LED дэлгэцийн дэлгэмэл схем`} style={{ WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>
        <defs>
          <pattern id={`kbg${uid}`} width="20" height="20" patternUnits="userSpaceOnUse"><path d="M20 0H0V20" fill="none" stroke="#dbe8f4" strokeWidth=".6" /></pattern>
          <linearGradient id={`kside${uid}`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#5bb0f0" /><stop offset="1" stopColor="#1b5fa6" /></linearGradient>
          <linearGradient id={`ktop${uid}`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#7cc2f7" /><stop offset="1" stopColor="#2f86d0" /></linearGradient>
          <marker id={`karr${uid}`} markerWidth="9" markerHeight="9" refX="4.5" refY="4.5" orient="auto-start-reverse"><path d="M0,1 L8,4.5 L0,8 Z" fill="#0f5a8f" /></marker>
        </defs>
        <rect width={VW} height={VH} rx="10" fill="#f4f9ff" />
        <rect width={VW} height={VH} rx="10" fill={`url(#kbg${uid})`} />

        {/* 4 тал */}
        {faces.map(([t, i]) => (
          <g key={t}>
            <rect x={x0 + i * fw} y={y0} width={fw} height={fh} fill={`url(#kside${uid})`} stroke="#0d3f6b" strokeWidth="2.5" />
            {isCab && <path d={gridPath(x0 + i * fw, y0, fw, fh, cols, rows)} stroke="#fff" strokeOpacity=".55" strokeWidth={gw(cols, fw)} fill="none" />}
            <text x={x0 + i * fw + fw / 2} y={y0 + fh / 2 + 4} textAnchor="middle" style={name}>{t}</text>
          </g>
        ))}

        {/* Өндөр */}
        <line x1={x0 - 26} y1={y0} x2={x0 - 26} y2={y0 + fh} stroke="#0f5a8f" strokeWidth="1.6" markerStart={`url(#karr${uid})`} markerEnd={`url(#karr${uid})`} />
        <g transform={`translate(${x0 - 26} ${y0 + fh / 2}) rotate(-90)`}><rect x="-40" y="-12" width="80" height="24" rx="12" fill="#fff" stroke="#0f5a8f" /><text y="5" textAnchor="middle" style={label}>{fmt(h)} м</text></g>
        {/* Нэг талын өргөн */}
        <line x1={x0} y1={dimY - 8} x2={x0} y2={y0 + fh + 4} stroke="#7fa8c9" />
        <line x1={x0 + fw} y1={dimY - 8} x2={x0 + fw} y2={y0 + fh + 4} stroke="#7fa8c9" />
        <line x1={x0} y1={dimY} x2={x0 + fw} y2={dimY} stroke="#0f5a8f" strokeWidth="1.6" markerStart={`url(#karr${uid})`} markerEnd={`url(#karr${uid})`} />
        <rect x={x0 + fw / 2 - 40} y={dimY - 12} width="80" height="24" rx="12" fill="#fff" stroke="#0f5a8f" />
        <text x={x0 + fw / 2} y={dimY + 5} textAnchor="middle" style={label}>{fmt(w)} м</text>

        <text x={VW / 2} y={VH - 14} textAnchor="middle" style={{ fontFamily: "Arial, sans-serif", fontWeight: 700, fontSize: 14, fill: "#17324b" }}>
          {isCab ? `4 тал ${cols}×${rows} = ${totalCab} cabinet` : `${fmt(areaAll)} м²`}
        </text>
      </svg>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
        {chip("Нэг тал", `${fmt(w)} × ${fmt(h)} м`)}
        {chip("Дээд тал", "нээлттэй")}
        {chip("LED талбай", `${fmt(areaAll)} м²`)}
        {isCab ? chip("Cabinet", `${totalCab} ш`) : chip("Дэлгэц", `${qty} ш`)}
      </div>
      <small style={{ display: "block", marginTop: 8 }}>Суурь нь дөрвөлжин (гүн = өргөн) · 4 тал LED, дээд тал нээлттэй (голдоо хоосон)</small>
    </div>
  );
}