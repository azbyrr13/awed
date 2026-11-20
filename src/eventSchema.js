// eventSchema.js — LED Mongolia: үнийн саналын бүх бүтээгдэхүүнийг нэг нийтлэг схем болгоно.
const SCHEMA_CONFIG = {
  cabinet: 0.5,        // LED cabinet хэмжээ (м)
  stageModuleW: 2,     // Stage Module 1x2m — өргөн тал (м)
  stageModuleD: 1,     // гүн тал (м)
  stageHeight: 1.0,    // тайзны өндөр (м)
  trussPieceLen: 2,    // Truss 1 ширхэгийн урт (м)  ← өөрсдийнхөөрөө тохируулна
  trussSize: 0.3,      // truss хөндлөн огтлол (м)
  trussGap: 0.3,       // LED-ээс truss хөл хүртэлх зай (м)
  trussClear: 0.5,     // LED-ийн дээд ирмэгээс truss хүртэл (м)
  ledLift: 0.3,        // LED-ийн доод ирмэг тайзнаас дээш (м)
  screenGap: 0.6,      // хэд хэдэн дэлгэцийн хоорондын зай (м)
};

// ---------- бүтээгдэхүүнийг төрөлд ангилах ----------
export function classifyProduct(name = '', category = '') {
  const n = name.toLowerCase();
  if (category === 'LED дэлгэц') return 'led';
  if (n.includes('stage module')) return 'stage';
  if (n.includes('truss')) return 'truss';
  if (n.includes('barrier')) return 'barrier';
  if (category === 'Гэрэл') {
    if (/beam|blender|strobe/.test(n)) return 'lightTop';
    if (/follow/.test(n)) return 'followSpot';
    return 'lightFront';
  }
  if (category === 'Дуу, микрофоны төхөөрөмж') {
    if (/line array/.test(n)) return 'lineArray';
    if (/sub/.test(n)) return 'sub';
    if (/stand/.test(n)) return 'micStand';
    if (/shure/.test(n)) return 'wireless';
    if (/monitor/.test(n) && !/high-power/.test(n)) return 'monitor';
    return 'mainSpeaker';
  }
  if (/spark/.test(n)) return 'spark';
  if (/smoke/.test(n)) return 'smoke';
  if (/power/.test(n)) return 'power';
  return 'other';
}

export const TYPE_INFO = {
  led:        { label: 'LED дэлгэц',              place: 'Тайзны ар талд',                 color: '#2f86d0' },
  stage:      { label: 'Тайз',                    place: 'Тайзны тавцан',                  color: '#c8a96a' },
  truss:      { label: 'Truss',                   place: 'LED-ийг тойрсон каркас',         color: '#9ca3af' },
  lightTop:   { label: 'Хөдөлгөөнт гэрэл',        place: 'Дээд truss дээр',                color: '#f59e0b' },
  lightFront: { label: 'Wash / PAR гэрэл',        place: 'Тайзны урд ирмэг',               color: '#facc15' },
  followSpot: { label: 'Follow spot',             place: 'Үзэгчдийн ард (FOH)',            color: '#fb923c' },
  lineArray:  { label: 'Line array',              place: 'Тайзны 2 талд',                  color: '#111827' },
  mainSpeaker:{ label: 'Үндсэн чанга яригч',      place: 'Тайзны 2 талд, тавиур дээр',     color: '#374151' },
  sub:        { label: 'Сабвуфер',                place: 'Тайзны урд, газар',              color: '#1f2937' },
  monitor:    { label: 'Монитор',                 place: 'Тайзан дээр, урд ирмэг',         color: '#4b5563' },
  micStand:   { label: 'Микрофоны суурь',         place: 'Тайзан дээр',                    color: '#6b7280' },
  wireless:   { label: 'Утасгүй микрофон',        place: 'FOH / дууны пульт',              color: '#7c3aed' },
  spark:      { label: 'Spark machine',           place: 'Тайзны урд ирмэг',               color: '#ef4444' },
  smoke:      { label: 'Smoke machine',           place: 'Тайзны ар буланд',               color: '#94a3b8' },
  barrier:    { label: 'Хаалтын багана',          place: 'Тайзны урд, үзэгчдийн шугам',    color: '#d4a017' },
  power:      { label: 'Цахилгаан',               place: 'Тайзны ард (backstage)',         color: '#16a34a' },
  other:      { label: 'Бусад',                   place: 'Жагсаалтад',                     color: '#64748b' },
};

const fx = (n, d = 2) => String(+(+n).toFixed(d));
const spread = (n, a, b) => Array.from({ length: n }, (_, i) => a + (i + 0.5) * (b - a) / n);
const splitLR = n => [Math.ceil(n / 2), Math.floor(n / 2)];
const sides = (n, fn) => { const out = []; splitLR(n).forEach((c, side) => { for (let k = 0; k < c; k++) out.push(fn(side ? 1 : -1, k)); }); return out; };

// =====================================================================
// LAYOUT — бүх байрлалын тооцоо (2D, 3D хоёулаа үүнийг ашиглана)
// =====================================================================
export function computeLayout(items = [], config = {}) {
  const K = { ...SCHEMA_CONFIG, ...config };
  const typed = items.map(it => ({ ...it, type: classifyProduct(it.name, it.category), qty: Math.max(0, Math.round(Number(it.quantity) || 0)) }));
  const q = t => typed.filter(i => i.type === t).reduce((s, i) => s + i.qty, 0);
  const warnings = [];

  // --- LED дэлгэцүүд ---
  const screens = [];
  typed.filter(i => i.type === 'led').forEach(it => {
    let w = Number(it.width) || 0, h = Number(it.height) || 0;
    if (!(w > 0 && h > 0)) return;
    const area = it.measurement === 'area';
    if (!area) { w = Math.ceil(w / K.cabinet - 1e-9) * K.cabinet; h = Math.ceil(h / K.cabinet - 1e-9) * K.cabinet; }
    for (let k = 0; k < Math.max(1, it.qty || 1); k++)
      screens.push({ name: it.name, w, h, area, cols: area ? 0 : Math.round(w / K.cabinet), rows: area ? 0 : Math.round(h / K.cabinet) });
  });
  screens.sort((a, b) => b.w * b.h - a.w * a.h);
  let ledL = 0, ledR = 0, ledH = 0;
  screens.forEach((s, i) => {
    if (i === 0) { s.x = 0; ledL = -s.w / 2; ledR = s.w / 2; }
    else if (i % 2) { s.x = ledR + K.screenGap + s.w / 2; ledR = s.x + s.w / 2; }
    else { s.x = ledL - K.screenGap - s.w / 2; ledL = s.x - s.w / 2; }
    ledH = Math.max(ledH, s.h);
  });
  const ledW = ledR - ledL, ledCx = (ledL + ledR) / 2;

  // --- Тайз ---
  const nStage = q('stage');
  let stageCols = 0, stageRows = 0, stageW = 0, stageD = 0;
  const cells = [];
  if (nStage > 0) {
    const ideal = Math.round(Math.sqrt(nStage * K.stageModuleW * K.stageModuleD * 1.6) / K.stageModuleW);
    stageCols = Math.min(nStage, Math.max(1, Math.ceil(ledW / K.stageModuleW - 1e-9), ideal));
    stageRows = Math.ceil(nStage / stageCols);
    stageW = stageCols * K.stageModuleW; stageD = stageRows * K.stageModuleD;
    for (let r = 0, left = nStage; r < stageRows; r++) {
      const inRow = Math.min(stageCols, left); left -= inRow;
      const x0 = -inRow * K.stageModuleW / 2;
      for (let c = 0; c < inRow; c++) cells.push({ x: x0 + c * K.stageModuleW, z: stageD - (r + 1) * K.stageModuleD, w: K.stageModuleW, d: K.stageModuleD });
    }
    const lastRow = nStage - (stageRows - 1) * stageCols;
    if (lastRow < stageCols) warnings.push(`Тайзны модуль ${nStage} ш: ${stageCols}×${stageRows - 1} бүтэн эгнээ + урд ${lastRow} ш. Бүтэн тэгш өнцөгт болгоход ${stageCols * stageRows - nStage} ш нэмэх хэрэгтэй.`);
    if (ledW > stageW + 1e-6) warnings.push(`LED (${fx(ledW)} м) тайзнаас (${fx(stageW)} м) өргөн байна.`);
  }
  const SH = nStage > 0 ? K.stageHeight : 0;
  const SD = nStage > 0 ? stageD : 0;

  const ledBottom = SH + (screens.length ? K.ledLift : 0);
  const ledTop = ledBottom + ledH;
  const ledZ = nStage > 0 ? Math.max(0.4, SD - 0.6) : 0.6;

  // --- Truss (goalpost) ---
  const nTruss = q('truss');
  const ts = K.trussSize;
  const truss = { on: false };
  if (nTruss > 0 && screens.length) {
    const towerL = ledL - K.trussGap - ts / 2, towerR = ledR + K.trussGap + ts / 2;
    const top = ledTop + K.trussClear + ts;
    const towerLen = top - ts - SH;
    const spanLen = (towerR - towerL) - ts;
    const towerPcs = Math.ceil(towerLen / K.trussPieceLen - 1e-9);
    const spanPcs = Math.ceil(spanLen / K.trussPieceLen - 1e-9);
    const need = 2 * towerPcs + spanPcs;
    let pcs = 0; const miss = n => { const bad = pcs + n > nTruss; pcs += n; return bad; };
    Object.assign(truss, { on: true, towerL, towerR, top, towerLen, spanLen, towerPcs, spanPcs, need, have: nTruss, z: ledZ + 0.25,
      missing: Math.max(0, need - nTruss), extra: Math.max(0, nTruss - need), missL: miss(towerPcs), missR: miss(towerPcs), missSpan: miss(spanPcs) });
    if (truss.missing) warnings.push(`Truss дутуу: LED-ийг тойруулахад ${need} ш (${K.trussPieceLen} м-ээр) хэрэгтэй, ${nTruss} ш сонгосон. ${truss.missing} ш нэмнэ үү (схемд улаанаар).`);
  } else if (nTruss > 0) {
    warnings.push('Truss сонгосон ч LED дэлгэц байхгүй тул каркасын байрлалыг тодорхойлох боломжгүй.');
  }

  // --- Хажуугийн хил ---
  const coreHalf = Math.max(nStage ? stageW / 2 : 0, truss.on ? Math.max(-truss.towerL, truss.towerR) + ts / 2 : 0, screens.length ? Math.max(-ledL, ledR) : 0, 2);
  const nLA = q('lineArray'), nMain = q('mainSpeaker');
  const laX = coreHalf + 0.9;
  const mainX = coreHalf + 0.9 + (nLA ? 1.3 : 0);
  const sideHalf = Math.max(coreHalf, nMain ? mainX + 0.6 + (Math.ceil(nMain / 2) - 1) * 0.7 : 0, nLA ? laX + 0.6 : 0);

  const n = { top: q('lightTop'), front: q('lightFront'), follow: q('followSpot'), la: nLA, main: nMain, sub: q('sub'), mon: q('monitor'),
    mic: q('micStand'), spark: q('spark'), smoke: q('smoke'), barrier: q('barrier'), power: q('power'), wireless: q('wireless') };
  const stageOrLed = nStage ? stageW : Math.max(ledW, 4);
  const frontSpan = stageOrLed * 0.85;

  // --- Байрлалууд ---
  const P = {};
  P.topLights = !n.top ? [] : truss.on
    ? spread(n.top, truss.towerL + ts / 2, truss.towerR - ts / 2).map(x => ({ x, y: truss.top - ts, z: truss.z, hanging: true }))
    : spread(n.top, -(nStage ? stageW : ledW || 6) / 2, (nStage ? stageW : ledW || 6) / 2).map(x => ({ x, y: SH, z: Math.max(0.3, ledZ - 0.5), hanging: false }));
  const frontKinds = []; typed.filter(i => i.type === 'lightFront').forEach(i => { for (let k = 0; k < i.qty; k++) frontKinds.push(/bar/i.test(i.name) ? 'bar' : 'par'); });
  P.frontLights = spread(n.front, -frontSpan / 2, frontSpan / 2).map((x, i) => ({ x, y: SH, z: nStage ? 0.3 : -0.4, kind: frontKinds[i] }));
  P.monitors = nStage ? spread(n.mon, -stageW * 0.35, stageW * 0.35).map(x => ({ x, y: SH, z: 0.55 })) : [];
  if (n.mon && !nStage) P.monitors = spread(n.mon, -2, 2).map(x => ({ x, y: 0, z: -0.3 }));
  P.mics = spread(n.mic, -stageOrLed * 0.3, stageOrLed * 0.3).map(x => ({ x, y: SH, z: nStage ? 1.3 : -0.2 }));
  P.sparks = spread(n.spark, -frontSpan / 2 + 0.3, frontSpan / 2 - 0.3).map(x => ({ x, y: SH, z: nStage ? 0.15 : -0.6 }));
  P.smokes = sides(n.smoke, (sd, k) => ({ x: sd * ((nStage ? stageW / 2 : Math.max(ledW / 2, 2)) - 0.5 - k * 0.7), y: SH, z: Math.max(0.3, ledZ - 0.6) }));
  P.lineArrays = splitLR(n.la).map((count, side) => ({ x: (side ? 1 : -1) * laX, z: -0.2, count, side: side ? 1 : -1 })).filter(a => a.count);
  P.mains = sides(n.main, (sd, k) => ({ x: sd * (mainX + k * 0.7), z: -0.4 }));
  P.subs = sides(n.sub, (sd, k) => ({ x: sd * Math.max(1, (nStage ? stageW / 2 : 3) - 0.6 - k * 1.2), z: -0.6 }));
  const bw = Math.max(nStage ? stageW : 6, 4) + 1;
  P.barriers = n.barrier === 1 ? [{ x: 0, z: -2.4 }] : Array.from({ length: n.barrier }, (_, i) => ({ x: -bw / 2 + i * bw / (n.barrier - 1), z: -2.4 }));
  P.follows = spread(n.follow, -3, 3).map(x => ({ x, z: -7 }));
  P.power = n.power ? [{ x: ledCx + Math.min(2, ledW / 2), z: Math.max(SD, ledZ) + 1.2 }] : [];

  const hasContent = !!(screens.length || nStage || typed.some(i => i.qty > 0 && i.type !== 'other'));
  return { K, typed, warnings, hasContent, screens, ledL, ledR, ledW, ledH, ledCx, ledBottom, ledTop, ledZ,
    nStage, stageCols, stageRows, stageW, stageD, cells, SH, SD, ts, truss, coreHalf, sideHalf, laX, mainX, frontSpan, n, P };
}

// =====================================================================
// 2D SVG
// =====================================================================
const R = (x, y, w, h, a = '') => `<rect x="${x}" y="${y}" width="${Math.max(0, w)}" height="${Math.max(0, h)}" ${a}/>`;
const L = (x1, y1, x2, y2, a = '') => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" ${a}/>`;
const T = (x, y, t, a = '') => `<text x="${x}" y="${y}" ${a}>${t}</text>`;
const C = (cx, cy, r, a = '') => `<circle cx="${cx}" cy="${cy}" r="${r}" ${a}/>`;
const Pg = (pts, a = '') => `<polygon points="${pts.map(p => p.join(',')).join(' ')}" ${a}/>`;

function trussShape(x, y, w, h, missing = false) {
  const stroke = missing ? '#dc2626' : '#6b7280';
  let s = R(x, y, w, h, `fill="${missing ? '#fee2e2' : '#eef0f3'}" stroke="${stroke}" stroke-width="1.4"${missing ? ' stroke-dasharray="5 3"' : ''}`);
  const pts = [];
  if (w >= h) { const n = Math.max(1, Math.round(w / h)), st = w / n; for (let i = 0; i <= n; i++) pts.push(`${x + i * st},${i % 2 ? y : y + h}`); }
  else { const n = Math.max(1, Math.round(h / w)), st = h / n; for (let i = 0; i <= n; i++) pts.push(`${i % 2 ? x : x + w},${y + i * st}`); }
  return s + `<polyline points="${pts.join(' ')}" fill="none" stroke="${missing ? '#f87171' : '#9ca3af'}" stroke-width="1"/>`;
}
function dimH(x1, x2, y, label) {
  return `<g stroke="#0f5a8f" stroke-width="1">${L(x1, y, x2, y)}${L(x1, y - 5, x1, y + 5)}${L(x2, y - 5, x2, y + 5)}</g>` +
    T((x1 + x2) / 2, y - 6, label, 'text-anchor="middle" font-size="12" fill="#0f5a8f" font-weight="700"');
}
function dimV(x, y1, y2, label) {
  const cy = (y1 + y2) / 2;
  return `<g stroke="#0f5a8f" stroke-width="1">${L(x, y1, x, y2)}${L(x - 5, y1, x + 5, y1)}${L(x - 5, y2, x + 5, y2)}</g>` +
    T(x - 6, cy, label, `text-anchor="middle" font-size="12" fill="#0f5a8f" font-weight="700" transform="rotate(-90 ${x - 6} ${cy})"`);
}

export function buildEventSchema(items = [], config = {}) {
  const Lt = computeLayout(items, config);
  const { K, screens, ledL, ledR, ledW, ledCx, ledBottom, ledTop, ledZ, nStage, stageCols, stageW, stageD, cells, SH, SD, ts, truss, sideHalf, n, P } = Lt;

  // ================= FRONT VIEW =================
  const worldW = sideHalf * 2 + 2.4;
  const xmin = -worldW / 2;
  const laH = n.la ? Math.ceil(n.la / 2) * 0.4 : 0;
  const Hmax = Math.max(truss.on ? truss.top : 0, ledTop, n.la ? 1.6 + laH : 0, n.main ? 2.6 : 0, SH + 2.2, 3) + 0.9;
  const W = 1000, pad = 40, bottomSpace = 70;
  const s = (W - 2 * pad) / worldW;
  const FH = Math.round(Hmax * s + pad + bottomSpace);
  const X = m => pad + (m - xmin) * s;
  const Y = h => pad + (Hmax - h) * s;
  let g = '';

  g += L(X(xmin), Y(0), X(-xmin), Y(0), 'stroke="#374151" stroke-width="2"');
  for (let x = xmin; x < -xmin; x += 0.5) g += L(X(x), Y(0) + 1, X(x) - 8, Y(0) + 9, 'stroke="#cbd5e1" stroke-width="1"');

  if (truss.on) {
    [[truss.towerL, truss.missL], [truss.towerR, truss.missR]].forEach(([cx, miss]) => {
      g += trussShape(X(cx - ts / 2), Y(truss.top - ts), ts * s, truss.towerLen * s, miss);
      g += R(X(cx - ts), Y(SH) - 4, ts * 2 * s, 4, 'fill="#4b5563"');
      g += R(X(cx - ts / 2), Y(truss.top), ts * s, ts * s, 'fill="#c9ced6" stroke="#6b7280" stroke-width="1.4"');
    });
    g += trussShape(X(truss.towerL + ts / 2), Y(truss.top), truss.spanLen * s, ts * s, truss.missSpan);
  }
  P.topLights.filter(l => l.hanging).forEach(l => {
    const t0 = l.y - 0.3;
    g += `<polygon points="${X(l.x - 0.08)},${Y(t0)} ${X(l.x + 0.08)},${Y(t0)} ${X(l.x + 0.7)},${Y(SH)} ${X(l.x - 0.7)},${Y(SH)}" fill="#ffd54a" opacity="0.10"/>`;
  });

  if (nStage) {
    g += R(X(-stageW / 2), Y(SH), stageW * s, SH * s, 'fill="#ead9b5" stroke="#8a6d3b" stroke-width="1.5"');
    g += R(X(-stageW / 2), Y(SH), stageW * s, Math.min(6, SH * s), 'fill="#5b4a2e"');
    for (let c = 1; c < stageCols; c++) { const x = X(-stageW / 2 + c * K.stageModuleW); g += L(x, Y(SH) + 6, x, Y(0), 'stroke="#b39b6c" stroke-width="1"'); }
    g += T(X(0), Y(SH / 2) + 5, `ТАЙЗ  ${fx(stageW)} × ${fx(stageD)} м`, 'text-anchor="middle" font-size="13" font-weight="700" fill="#6b5326" letter-spacing="1"');
  }

  screens.forEach(sc => {
    const x0 = sc.x - sc.w / 2;
    g += R(X(x0), Y(ledBottom + sc.h), sc.w * s, sc.h * s, 'fill="#1b5fa6" stroke="#0b2f55" stroke-width="1.5"');
    g += R(X(x0), Y(ledBottom + sc.h), sc.w * s, sc.h * s * 0.45, 'fill="#ffffff" opacity="0.12"');
    if (!sc.area) {
      for (let c = 1; c < sc.cols; c++) { const x = X(x0 + c * K.cabinet); g += L(x, Y(ledBottom + sc.h), x, Y(ledBottom), 'stroke="#0b2f55" stroke-width="0.6" opacity="0.7"'); }
      for (let r = 1; r < sc.rows; r++) { const y = Y(ledBottom + r * K.cabinet); g += L(X(x0), y, X(x0 + sc.w), y, 'stroke="#0b2f55" stroke-width="0.6" opacity="0.7"'); }
    }
    if (!truss.on && K.ledLift > 0) [x0 + 0.25, x0 + sc.w - 0.25].forEach(lx => { g += R(X(lx) - 3, Y(ledBottom), 6, K.ledLift * s, 'fill="#4b5563"'); });
    const my = Y(ledBottom + sc.h / 2);
    g += T(X(sc.x), my - 3, `${fx(sc.w)} × ${fx(sc.h)} м`, `text-anchor="middle" font-size="${sc.w * s > 120 ? 14 : 11}" font-weight="700" fill="#fff"`);
    if (!sc.area && sc.w * s > 120) g += T(X(sc.x), my + 15, `${sc.cols}×${sc.rows} = ${sc.cols * sc.rows} cabinet`, 'text-anchor="middle" font-size="11" fill="#cfe5fa"');
  });
  if (truss.on) screens.forEach(sc => [sc.x - sc.w / 4, sc.x + sc.w / 4].forEach(hx => {
    g += L(X(hx), Y(truss.top - ts), X(hx), Y(ledBottom + sc.h), 'stroke="#b91c1c" stroke-width="1.4" stroke-dasharray="4 3"');
    g += R(X(hx) - 5, Y(truss.top - ts) + 2, 10, 10, 'rx="2" fill="#b91c1c"');
  }));

  const head = (cx, cy, down) => { const w = 0.32 * s, h = 0.26 * s;
    return R(cx - w / 2, down ? cy : cy - h, w, h, 'rx="2" fill="#2b2f36" stroke="#111" stroke-width="0.8"') +
      C(cx, down ? cy + h * 0.62 : cy - h * 0.38, Math.max(2, 0.09 * s), 'fill="#ffd54a" stroke="#a37f00" stroke-width="0.6"'); };
  P.topLights.forEach(l => { g += head(X(l.x), Y(l.y), l.hanging); });
  P.frontLights.forEach(l => {
    const cx = X(l.x);
    g += l.kind === 'bar'
      ? R(cx - 0.45 * s, Y(l.y) - 0.1 * s, 0.9 * s, 0.1 * s, 'rx="2" fill="#2b2f36"') + R(cx - 0.4 * s, Y(l.y) - 0.085 * s, 0.8 * s, 0.05 * s, 'fill="#ffd54a"')
      : head(cx, Y(l.y), false);
  });
  P.monitors.forEach(m => { const w = 0.6 * s, h = 0.35 * s, x = X(m.x), y = Y(m.y);
    g += Pg([[x - w / 2, y], [x + w / 2, y], [x + w / 2 - 0.12 * s, y - h], [x - w / 2, y - h * 0.55]], 'fill="#374151" stroke="#111" stroke-width="0.8"'); });
  P.mics.forEach(m => { g += L(X(m.x), Y(m.y), X(m.x), Y(m.y + 1.5), 'stroke="#374151" stroke-width="2"') + L(X(m.x - 0.25), Y(m.y), X(m.x + 0.25), Y(m.y), 'stroke="#374151" stroke-width="2"') + C(X(m.x), Y(m.y + 1.55), Math.max(2, 0.06 * s), 'fill="#111"'); });
  P.sparks.forEach(sp => { const x = X(sp.x), y = Y(sp.y);
    g += R(x - 0.2 * s, y - 0.25 * s, 0.4 * s, 0.25 * s, 'rx="2" fill="#1f2937"');
    for (let k = -2; k <= 2; k++) g += L(x, y - 0.25 * s, x + k * 0.12 * s, y - 1.3 * s, 'stroke="#f97316" stroke-width="1.2" opacity="0.8"'); });
  P.smokes.forEach(sm => { const x = X(sm.x), y = Y(sm.y);
    g += R(x - 0.25 * s, y - 0.25 * s, 0.5 * s, 0.25 * s, 'rx="2" fill="#475569"') + C(x, y - 0.45 * s, 0.22 * s, 'fill="#cbd5e1" opacity="0.6"') + C(x + 0.2 * s, y - 0.6 * s, 0.18 * s, 'fill="#cbd5e1" opacity="0.45"'); });
  P.lineArrays.forEach(a => {
    g += R(X(a.x) - 0.5 * s, Y(1.2), 1.0 * s, 1.2 * s, 'fill="#1f2937"');
    for (let k = 0; k < a.count; k++) g += R(X(a.x) - 0.45 * s - k * 0.02 * s * a.side, Y(1.2 + (k + 1) * 0.4), 0.9 * s, 0.36 * s, 'rx="2" fill="#111827" stroke="#4b5563" stroke-width="0.8"');
  });
  P.mains.forEach(m => { const cx = m.x;
    g += L(X(cx), Y(0), X(cx), Y(1.8), 'stroke="#4b5563" stroke-width="2"') + L(X(cx - 0.45), Y(0), X(cx), Y(0.7), 'stroke="#4b5563" stroke-width="1.5"') + L(X(cx + 0.45), Y(0), X(cx), Y(0.7), 'stroke="#4b5563" stroke-width="1.5"');
    g += R(X(cx) - 0.25 * s, Y(2.6), 0.5 * s, 0.8 * s, 'rx="3" fill="#1f2937"') + C(X(cx), Y(2.0), 0.15 * s, 'fill="#4b5563"') + C(X(cx), Y(2.4), 0.07 * s, 'fill="#4b5563"'); });
  P.subs.forEach(sb => { g += R(X(sb.x) - 0.55 * s, Y(0.6), 1.1 * s, 0.6 * s, 'rx="2" fill="#111827" stroke="#374151" stroke-width="0.8"') + C(X(sb.x), Y(0.3), 0.2 * s, 'fill="#374151"'); });
  if (P.barriers.length) {
    const xs = P.barriers.map(b => b.x);
    g += '<g opacity="0.75">';
    if (xs.length > 1) g += `<path d="M${xs.map((x, i) => `${i ? 'Q' + X((xs[i - 1] + x) / 2) + ',' + Y(0.7) + ' ' : ''}${X(x)},${Y(0.9)}`).join(' ')}" fill="none" stroke="#b91c1c" stroke-width="1.5"/>`;
    xs.forEach(x => { g += R(X(x) - 2, Y(1.0), 4, 1.0 * s, 'fill="#d4a017"') + R(X(x) - 0.15 * s, Y(0) - 3, 0.3 * s, 3, 'fill="#a87f10"'); });
    g += '</g>';
  }

  if (nStage) { g += dimH(X(-stageW / 2), X(stageW / 2), Y(0) + 32, `Тайз ${fx(stageW)} м`); g += dimV(X(-stageW / 2) - 18, Y(SH), Y(0), `${fx(SH)} м`); }
  else if (screens.length) g += dimH(X(ledL), X(ledR), Y(0) + 32, `LED ${fx(ledW)} м`);
  if (truss.on) { g += dimH(X(truss.towerL - ts / 2), X(truss.towerR + ts / 2), Y(truss.top) - 16, `Каркас ${fx(truss.towerR - truss.towerL + ts)} м`); g += dimV(X(-xmin) - 14, Y(truss.top), Y(0), `Нийт ${fx(truss.top)} м`); }
  else if (screens.length) g += dimV(X(-xmin) - 14, Y(ledTop), Y(0), `Нийт ${fx(ledTop)} м`);

  const style = `<style>text{font-family:Arial,system-ui,sans-serif}</style>`;
  const front = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${FH}" role="img" aria-label="Нийт схем — урдаас">${style}${R(0, 0, W, FH, 'fill="#fff"')}${g}</svg>`;

  // ================= PLAN VIEW =================
  const zmax = Math.max(SD, ledZ) + (n.power ? 2.2 : 1.2);
  const zmin = n.follow ? -8 : n.barrier ? -3.6 : -2.4;
  const PH = Math.round((zmax - zmin) * s + 2 * pad);
  const PY = z => pad + (zmax - z) * s;
  let p = '';
  if (nStage) {
    cells.forEach(c => { p += R(X(c.x), PY(c.z + c.d), c.w * s, c.d * s, 'fill="#f3e7cc" stroke="#b39b6c" stroke-width="1"'); });
    p += T(X(0), PY(SD / 2) + 5, `ТАЙЗ — ${nStage} модуль`, 'text-anchor="middle" font-size="13" font-weight="700" fill="#8a6d3b"');
  }
  if (truss.on) {
    p += trussShape(X(truss.towerL + ts / 2), PY(truss.z) - ts * s / 2, truss.spanLen * s, ts * s, truss.missing > 0);
    [truss.towerL, truss.towerR].forEach(cx => {
      p += R(X(cx - ts), PY(truss.z) - ts * s, ts * 2 * s, ts * 2 * s, 'fill="none" stroke="#4b5563" stroke-dasharray="3 2"');
      p += R(X(cx - ts / 2), PY(truss.z) - ts * s / 2, ts * s, ts * s, 'fill="#c9ced6" stroke="#374151" stroke-width="1.5"');
    });
  }
  screens.forEach(sc => { p += R(X(sc.x - sc.w / 2), PY(ledZ) - 3, sc.w * s, 6, 'fill="#1b5fa6"'); });
  if (screens.length) p += T(X(ledCx), PY(ledZ) - 8, 'LED', 'text-anchor="middle" font-size="12" font-weight="700" fill="#0f5a8f"');
  const dot = (x, z, color, r = Math.max(4, 0.14 * s)) => C(X(x), PY(z), r, `fill="${color}" stroke="#00000055" stroke-width="1"`);
  const box = (x, z, w, d, color) => R(X(x - w / 2), PY(z + d / 2), w * s, d * s, `rx="2" fill="${color}"`);
  P.topLights.forEach(l => { p += dot(l.x, l.hanging ? l.z - 0.45 : l.z, TYPE_INFO.lightTop.color); });
  P.frontLights.forEach(l => { p += dot(l.x, l.z, TYPE_INFO.lightFront.color); });
  P.monitors.forEach(m => { p += box(m.x, m.z, 0.6, 0.4, '#4b5563'); });
  P.mics.forEach(m => { p += C(X(m.x), PY(m.z), 4, 'fill="#111"'); });
  P.sparks.forEach(sp => { p += dot(sp.x, sp.z, TYPE_INFO.spark.color, 5); });
  P.smokes.forEach(sm => { p += box(sm.x, sm.z, 0.5, 0.35, '#94a3b8'); });
  P.lineArrays.forEach(a => { p += box(a.x, a.z, 1.0, 0.8, '#111827'); });
  P.mains.forEach(m => { p += box(m.x, m.z, 0.5, 0.45, '#374151'); });
  P.subs.forEach(sb => { p += box(sb.x, sb.z, 1.1, 0.7, '#1f2937'); });
  if (P.barriers.length) {
    if (P.barriers.length > 1) p += L(X(P.barriers[0].x), PY(-2.4), X(P.barriers[P.barriers.length - 1].x), PY(-2.4), 'stroke="#b91c1c" stroke-width="2"');
    P.barriers.forEach(b => { p += dot(b.x, b.z, TYPE_INFO.barrier.color, 5); });
  }
  P.follows.forEach(f => { p += dot(f.x, f.z, TYPE_INFO.followSpot.color, 6); p += L(X(f.x), PY(f.z), X(f.x * 0.3), PY(Math.max(1, SD / 2)), 'stroke="#fb923c" stroke-width="1" stroke-dasharray="3 3" opacity="0.6"'); });
  if (n.follow) p += T(X(0), PY(-7) + 22, 'FOH', 'text-anchor="middle" font-size="11" fill="#9ca3af"');
  P.power.forEach(pw => { p += box(pw.x, pw.z, 0.8, 0.6, '#16a34a'); p += T(X(pw.x), PY(pw.z) + 4, 'PWR', 'text-anchor="middle" font-size="10" fill="#fff" font-weight="700"'); });
  p += T(X(0), PY(n.barrier ? -3.2 : -1.6), 'ҮЗЭГЧИД ↓', 'text-anchor="middle" font-size="13" font-weight="700" fill="#9ca3af" letter-spacing="2"');
  if (nStage) p += dimV(X(-stageW / 2) - 18, PY(SD), PY(0), `${fx(SD)} м`);
  const plan = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${PH}" role="img" aria-label="Нийт схем — дээрээс">${style}${R(0, 0, W, PH, 'fill="#fff"')}${p}</svg>`;

  // ================= жагсаалт =================
  const rows = Lt.typed.filter(i => i.qty > 0).map(i => {
    let detail = `${i.qty} ш`;
    if (i.type === 'led' && Number(i.width) > 0) detail = `${i.qty} дэлгэц · ${fx(i.width)}×${fx(i.height)} м`;
    if (i.type === 'truss' && truss.on) detail = `${i.qty} ш × ${K.trussPieceLen} м (хэрэгтэй ${truss.need} ш)`;
    return { name: i.name, category: i.category, type: i.type, typeLabel: TYPE_INFO[i.type].label, place: TYPE_INFO[i.type].place, color: TYPE_INFO[i.type].color, detail };
  });

  return { hasContent: Lt.hasContent, front, plan, rows, warnings: Lt.warnings, layout: Lt, stats: { ledW, stageW, stageD, truss } };
}

