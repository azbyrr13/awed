import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// eventSchema3d.js — computeLayout()-ийн үр дүнг Three.js-ээр 3D болгож зурна.
//   const view = mountEventSchema3D(containerEl, layout);
//   view.update(newLayout);   // жагсаалт өөрчлөгдөхөд
//   view.resetCamera();       // анхны өнцөг рүү буцах
//   view.snapshot();          // PNG dataURL
//   view.dispose();           // компонент unmount хийхэд
// Координат: x = layout.x, y = өндөр, z = -layout.z (үзэгчид +z талд)


const V = (x, y, z) => new THREE.Vector3(x, y, -z);   // layout → three
const UP = new THREE.Vector3(0, 1, 0);

export function mountEventSchema3D(container, layout) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.domElement.style.display = 'block';
  renderer.domElement.style.width = '100%';
  renderer.domElement.style.height = '100%';
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#0b1220');
  scene.fog = new THREE.Fog('#0b1220', 40, 110);

  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 300);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.maxPolarAngle = Math.PI * 0.495;
  controls.minDistance = 3;
  controls.maxDistance = 80;

  scene.add(new THREE.HemisphereLight(0xc8d8ff, 0x1a1a24, 0.9));
  const sun = new THREE.DirectionalLight(0xffffff, 1.4);
  sun.position.set(-10, 18, 14);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -25, right: 25, top: 25, bottom: -25, near: 1, far: 80 });
  scene.add(sun);

  // газар
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.MeshStandardMaterial({ color: '#141b2b', roughness: 1 }));
  floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);
  const grid = new THREE.GridHelper(80, 80, 0x2a3550, 0x1c2438); grid.position.y = 0.002; scene.add(grid);

  let root = new THREE.Group(); scene.add(root);
  let current = layout;

  function size() {
    const w = container.clientWidth || 800, h = container.clientHeight || 500;
    renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
  }
  const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(size) : null;
  ro && ro.observe(container); size();

  function resetCamera() {
    const L = current;
    const span = Math.max(L.sideHalf * 2 + 2, 8);
    const H = Math.max(L.truss.on ? L.truss.top : L.ledTop, 3);
    const target = new THREE.Vector3(0, H * 0.45, -Math.max(L.SD, L.ledZ) * 0.5);
    camera.position.set(-span * 0.4, H * 0.7 + span * 0.22, span * 0.72 + 2);
    controls.target.copy(target); controls.update();
  }

  let boundsKey = '';
  function update(next) {
    current = next;
    const key = [next.sideHalf, next.truss.on ? next.truss.top : next.ledTop, next.SD].map(v => (+v).toFixed(1)).join('|');
    const moved = key !== boundsKey; boundsKey = key;
    disposeGroup(root); scene.remove(root);
    root = buildScene(next); scene.add(root);
    if (moved) resetCamera();   // хэмжээ өөрчлөгдсөн бол камерыг дахин тааруулна
  }

  let raf = 0, alive = true;
  const loop = () => { if (!alive) return; controls.update(); renderer.render(scene, camera); raf = requestAnimationFrame(loop); };

  update(layout); loop();

  return {
    update,
    resetCamera,
    snapshot: () => { renderer.render(scene, camera); return renderer.domElement.toDataURL('image/png'); },
    dispose() {
      alive = false; cancelAnimationFrame(raf); ro && ro.disconnect(); controls.dispose();
      disposeGroup(root); renderer.dispose(); renderer.domElement.remove();
    },
  };
}

function disposeGroup(g) {
  g.traverse(o => {
    if (o.geometry) o.geometry.dispose();
    if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => { m.map && m.map.dispose(); m.dispose(); });
  });
}

// ---------- материал, туслах ----------
const std = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.6, metalness: 0.1, ...o });
function box(w, h, d, mat, x, y, z, parent) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.copy(V(x, y + h / 2, z)); m.castShadow = true; m.receiveShadow = true; parent && parent.add(m); return m;
}
function cyl(r1, r2, h, mat, seg = 16) { const m = new THREE.Mesh(new THREE.CylinderGeometry(r1, r2, h, seg), mat); m.castShadow = true; return m; }
function between(mesh, a, b) { // y тэнхлэгтэй mesh-ийг a→b чиглэлд байрлуулна
  const d = new THREE.Vector3().subVectors(b, a); const len = d.length();
  mesh.position.copy(a).addScaledVector(d, 0.5);
  mesh.quaternion.setFromUnitVectors(UP, d.clone().normalize());
  return len;
}

// Гэрлийн туяа (конус) — head → target
function beam(group, from, to, color = '#ffd27a', radius = 0.6, opacity = 0.13) {
  const len = from.distanceTo(to);
  const geo = new THREE.CylinderGeometry(0.05, radius, len, 24, 1, true);
  const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
  const m = new THREE.Mesh(geo, mat);
  // CylinderGeometry: +y = дээд (нарийн) тал → from руу
  const d = new THREE.Vector3().subVectors(from, to);
  m.position.copy(to).addScaledVector(d, 0.5);
  m.quaternion.setFromUnitVectors(UP, d.normalize());
  group.add(m);
  const spot = new THREE.Mesh(new THREE.CircleGeometry(radius * 0.9, 24), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: opacity * 1.6, blending: THREE.AdditiveBlending, depthWrite: false }));
  spot.rotation.x = -Math.PI / 2; spot.position.set(to.x, to.y + 0.01, to.z); group.add(spot);
}

// Truss — 4 гол хоолой + диагональ сараалж
function trussBeam(group, a, b, size, missing) {
  const g = new THREE.Group();
  const len = a.distanceTo(b);
  const chordMat = missing ? std('#ef4444', { transparent: true, opacity: 0.55 }) : std('#c9ced6', { metalness: 0.8, roughness: 0.3 });
  const lace = new THREE.LineBasicMaterial({ color: missing ? '#f87171' : '#9aa3ad' });
  const h = size / 2;
  const corners = [[-h, -h], [h, -h], [h, h], [-h, h]];
  corners.forEach(([u, v]) => { const c = cyl(0.024, 0.024, len, chordMat, 8); c.position.set(u, len / 2, v); g.add(c); });
  const pts = []; const steps = Math.max(1, Math.round(len / size));
  for (let f = 0; f < 4; f++) {
    const [u1, v1] = corners[f], [u2, v2] = corners[(f + 1) % 4];
    for (let i = 0; i < steps; i++) {
      const y1 = i * len / steps, y2 = (i + 1) * len / steps;
      const [sa, sb] = i % 2 ? [[u1, v1], [u2, v2]] : [[u2, v2], [u1, v1]];
      pts.push(new THREE.Vector3(sa[0], y1, sa[1]), new THREE.Vector3(sb[0], y2, sb[1]));
    }
  }
  g.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(pts), lace));
  g.position.copy(a);
  g.quaternion.setFromUnitVectors(UP, new THREE.Vector3().subVectors(b, a).normalize());
  group.add(g);
}

// LED нүүрний текстур — cabinet тор
function ledTexture(sc, cabinet) {
  const pxPerM = 128;
  const cw = Math.max(64, Math.min(2048, Math.round(sc.w * pxPerM))), ch = Math.max(64, Math.min(2048, Math.round(sc.h * pxPerM)));
  const cv = document.createElement('canvas'); cv.width = cw; cv.height = ch;
  const x = cv.getContext('2d');
  const gr = x.createLinearGradient(0, 0, cw, ch);
  gr.addColorStop(0, '#5bb0f0'); gr.addColorStop(0.55, '#2f86d0'); gr.addColorStop(1, '#1b5fa6');
  x.fillStyle = gr; x.fillRect(0, 0, cw, ch);
  const sh = x.createLinearGradient(0, 0, 0, ch); sh.addColorStop(0, 'rgba(255,255,255,.25)'); sh.addColorStop(0.5, 'rgba(255,255,255,0)');
  x.fillStyle = sh; x.fillRect(0, 0, cw, ch);
  if (!sc.area) {
    x.strokeStyle = 'rgba(8,30,60,.55)'; x.lineWidth = Math.max(1, cw / sc.cols / 40);
    for (let c = 1; c < sc.cols; c++) { const px = c * cw / sc.cols; x.beginPath(); x.moveTo(px, 0); x.lineTo(px, ch); x.stroke(); }
    for (let r = 1; r < sc.rows; r++) { const py = r * ch / sc.rows; x.beginPath(); x.moveTo(0, py); x.lineTo(cw, py); x.stroke(); }
  }
  x.fillStyle = 'rgba(255,255,255,.92)'; x.textAlign = 'center'; x.textBaseline = 'middle';
  x.font = `bold ${Math.round(Math.min(cw, ch) * 0.12)}px Arial`;
  x.fillText(`${+sc.w.toFixed(2)} × ${+sc.h.toFixed(2)} м`, cw / 2, ch / 2);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  return t;
}

function movingHead(group, pos, target, hanging) {
  const g = new THREE.Group(); g.position.copy(pos); group.add(g);
  const dark = std('#23272e', { metalness: 0.4, roughness: 0.5 });
  const base = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.12, 0.28), dark); base.castShadow = true;
  base.position.y = hanging ? -0.06 : 0.06; g.add(base);
  const head = cyl(0.11, 0.13, 0.3, dark, 16);
  const hp = new THREE.Vector3(pos.x, pos.y + (hanging ? -0.32 : 0.32), pos.z);
  const dir = new THREE.Vector3().subVectors(target, hp).normalize();
  head.position.set(0, hanging ? -0.32 : 0.32, 0);
  head.quaternion.setFromUnitVectors(UP, dir.clone().negate());
  g.add(head);
  const lens = new THREE.Mesh(new THREE.CircleGeometry(0.1, 16), new THREE.MeshBasicMaterial({ color: '#ffe08a' }));
  lens.position.copy(head.position).addScaledVector(dir, 0.16);
  lens.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir); g.add(lens);
  return hp;
}

function speakerBox(group, w, h, d, x, y, z, coneR = 0.14) {
  const b = box(w, h, d, std('#15181d', { roughness: 0.85 }), x, y, z, group);
  const cone = new THREE.Mesh(new THREE.CircleGeometry(coneR, 20), std('#3a3f47', { roughness: 0.9 }));
  cone.position.set(x, y + h * 0.42, -z + d / 2 + 0.002); group.add(cone);
  return b;
}

// =====================================================================
function buildScene(L) {
  const G = new THREE.Group();
  const { K, SH, ts, truss, P } = L;
  const stageTarget = (x, frac = 0.4) => V(x, L.SH, Math.max(0.5, (L.SD || 2) * frac));

  // --- тайз ---
  if (L.nStage) {
    const top = std('#c8a96a', { roughness: 0.8 }), side = std('#2a2118', { roughness: 0.9 });
    L.cells.forEach(c => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(c.w - 0.02, SH, c.d - 0.02), [side, side, top, side, side, side]);
      m.position.copy(V(c.x + c.w / 2, SH / 2, c.z + c.d / 2)); m.castShadow = m.receiveShadow = true; G.add(m);
    });
  }

  // --- LED ---
  L.screens.forEach(sc => {
    const depth = 0.12;
    box(sc.w, sc.h, depth, std('#0d1117', { metalness: 0.5 }), sc.x, L.ledBottom, L.ledZ, G);
    const face = new THREE.Mesh(new THREE.PlaneGeometry(sc.w, sc.h), new THREE.MeshBasicMaterial({ map: ledTexture(sc, K.cabinet), toneMapped: false }));
    face.position.copy(V(sc.x, L.ledBottom + sc.h / 2, L.ledZ)); face.position.z += depth / 2 + 0.003; G.add(face);
    if (!truss.on && K.ledLift > 0) [sc.x - sc.w / 2 + 0.25, sc.x + sc.w / 2 - 0.25].forEach(lx => box(0.08, K.ledLift, 0.4, std('#4b5563'), lx, SH, L.ledZ, G));
  });

  // --- truss ---
  if (truss.on) {
    const zt = truss.z;
    [[truss.towerL, truss.missL], [truss.towerR, truss.missR]].forEach(([x, miss]) => {
      trussBeam(G, V(x, SH, zt), V(x, truss.top - ts, zt), ts, miss);
      box(ts * 2.2, 0.03, ts * 2.2, std('#374151', { metalness: 0.6 }), x, SH, zt, G);
      box(ts, ts, ts, std('#c9ced6', { metalness: 0.8, roughness: 0.3 }), x, truss.top - ts, zt, G);
    });
    const yS = truss.top - ts / 2;
    trussBeam(G, V(truss.towerL + ts / 2, yS, zt), V(truss.towerR - ts / 2, yS, zt), ts, truss.missSpan);
    // hoist + гинж
    L.screens.forEach(sc => [sc.x - sc.w / 4, sc.x + sc.w / 4].forEach(hx => {
      box(0.18, 0.22, 0.18, std('#b91c1c'), hx, truss.top - ts - 0.22, zt, G);
      const chain = cyl(0.012, 0.012, 1, std('#9ca3af', { metalness: 0.9 }), 6);
      chain.scale.y = between(chain, V(hx, truss.top - ts - 0.22, zt), V(hx, L.ledBottom + sc.h, L.ledZ));
      G.add(chain);
    }));
  }

  // --- хөдөлгөөнт гэрэл ---
  P.topLights.forEach((l, i) => {
    const pos = V(l.x, l.y, l.z);
    const tgt = l.hanging ? stageTarget(l.x * 0.6 + (i % 2 ? 0.6 : -0.6), 0.35) : V(l.x * 1.2, Math.max(L.ledTop, 4) + 4, -2);
    const hp = movingHead(G, pos, tgt, l.hanging);
    beam(G, hp, tgt, i % 3 === 0 ? '#9fd3ff' : i % 3 === 1 ? '#ffd27a' : '#e3a8ff', l.hanging ? 0.45 : 0.9, l.hanging ? 0.14 : 0.08);
  });

  // --- урд гэрэл ---
  P.frontLights.forEach(l => {
    const pos = V(l.x, l.y, l.z);
    if (l.kind === 'bar') {
      box(0.9, 0.08, 0.1, std('#23272e'), l.x, l.y, l.z, G);
      const strip = new THREE.Mesh(new THREE.PlaneGeometry(0.85, 0.05), new THREE.MeshBasicMaterial({ color: '#ffe08a' }));
      strip.position.copy(V(l.x, l.y + 0.06, l.z)); strip.position.z += 0.051; strip.rotation.x = -0.3; G.add(strip);
      beam(G, V(l.x, l.y + 0.08, l.z), V(l.x, L.ledBottom + (L.ledTop - L.ledBottom) * 0.3, L.ledZ - 0.1), '#ffcf70', 0.7, 0.06);
    } else {
      const tgt = L.screens.length ? V(l.x * 0.9, L.ledBottom + (L.ledTop - L.ledBottom) * 0.4, L.ledZ - 0.1) : V(l.x, 3, 3);
      const hp = movingHead(G, pos, tgt, false);
      beam(G, hp, tgt, '#ff9ad5', 0.55, 0.08);
    }
  });

  // --- follow spot ---
  P.follows.forEach(f => {
    const top = V(f.x, 1.6, f.z);
    [0, 1, 2].forEach(k => { const a = k * 2.09; const leg = cyl(0.015, 0.015, 1, std('#4b5563'), 6); leg.scale.y = between(leg, V(f.x + Math.cos(a) * 0.45, 0, f.z + Math.sin(a) * 0.45), V(f.x, 1.2, f.z)); G.add(leg); });
    const tgt = V(f.x * 0.25, SH + 1.4, Math.max(1, (L.SD || 2) * 0.45));
    const body = cyl(0.14, 0.16, 0.8, std('#1f2937', { metalness: 0.4 }), 16);
    between(body, top, top.clone().addScaledVector(new THREE.Vector3().subVectors(tgt, top).normalize(), 0.8)); body.scale.y = 1; G.add(body);
    beam(G, top.clone().addScaledVector(new THREE.Vector3().subVectors(tgt, top).normalize(), 0.8), tgt, '#fff1d0', 0.5, 0.07);
  });

  // --- дуу ---
  P.lineArrays.forEach(a => {
    box(1.0, 1.2, 0.8, std('#111418', { roughness: 0.9 }), a.x, 0, a.z, G);
    for (let k = 0; k < a.count; k++) {
      const m = speakerBox(G, 0.9, 0.34, 0.6, a.x, 1.22 + k * 0.38, a.z, 0.1);
      m.rotation.x = -0.03 * k;
    }
  });
  P.mains.forEach(m => {
    [0, 1, 2].forEach(k => { const a = k * 2.09 + 0.5; const leg = cyl(0.015, 0.015, 1, std('#4b5563'), 6); leg.scale.y = between(leg, V(m.x + Math.cos(a) * 0.45, 0, m.z + Math.sin(a) * 0.45), V(m.x, 0.8, m.z)); G.add(leg); });
    const pole = cyl(0.025, 0.025, 1.8, std('#4b5563', { metalness: 0.7 }), 8); pole.position.copy(V(m.x, 0.9, m.z)); G.add(pole);
    speakerBox(G, 0.5, 0.8, 0.4, m.x, 1.8, m.z, 0.15);
  });
  P.subs.forEach(sb => speakerBox(G, 1.1, 0.6, 0.7, sb.x, 0, sb.z, 0.22));
  P.monitors.forEach(m => {
    const w = box(0.6, 0.35, 0.45, std('#1b1f25', { roughness: 0.85 }), m.x, m.y, m.z, G);
    w.rotation.x = 0.45; w.position.y += 0.03;
  });
  P.mics.forEach(m => {
    const pole = cyl(0.012, 0.012, 1.5, std('#1f2937', { metalness: 0.7 }), 8); pole.position.copy(V(m.x, m.y + 0.75, m.z)); G.add(pole);
    const base = cyl(0.18, 0.2, 0.03, std('#1f2937', { metalness: 0.6 }), 16); base.position.copy(V(m.x, m.y + 0.015, m.z)); G.add(base);
    const mic = new THREE.Mesh(new THREE.SphereGeometry(0.035, 12, 12), std('#9ca3af', { metalness: 0.8 })); mic.position.copy(V(m.x, m.y + 1.55, m.z)); G.add(mic);
  });

  // --- MOKA ---
  P.sparks.forEach(sp => {
    box(0.4, 0.25, 0.4, std('#1f2937'), sp.x, sp.y, sp.z, G);
    const fountain = new THREE.Mesh(new THREE.ConeGeometry(0.35, 1.6, 20, 1, true),
      new THREE.MeshBasicMaterial({ color: '#ffb347', transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
    fountain.rotation.x = Math.PI; fountain.position.copy(V(sp.x, sp.y + 0.25 + 0.8, sp.z)); G.add(fountain);
  });
  P.smokes.forEach(sm => {
    box(0.5, 0.28, 0.35, std('#475569'), sm.x, sm.y, sm.z, G);
    const haze = std('#cbd5e1', { transparent: true, opacity: 0.18, depthWrite: false });
    [[0, 0.5, 0, 0.35], [0.3, 0.75, -0.1, 0.45], [-0.2, 0.95, 0.15, 0.5]].forEach(([dx, dy, dz, r]) => {
      const s = new THREE.Mesh(new THREE.SphereGeometry(r, 16, 12), haze); s.position.copy(V(sm.x + dx, sm.y + dy, sm.z + dz)); G.add(s);
    });
  });

  // --- хаалт ---
  if (P.barriers.length) {
    const gold = std('#d4a017', { metalness: 0.9, roughness: 0.25 });
    P.barriers.forEach(b => {
      const post = cyl(0.04, 0.04, 1.0, gold, 12); post.position.copy(V(b.x, 0.5, b.z)); G.add(post);
      const base = cyl(0.17, 0.19, 0.04, gold, 20); base.position.copy(V(b.x, 0.02, b.z)); G.add(base);
      const ball = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 12), gold); ball.position.copy(V(b.x, 1.03, b.z)); G.add(ball);
    });
    for (let i = 1; i < P.barriers.length; i++) {
      const a = P.barriers[i - 1], b = P.barriers[i];
      const curve = new THREE.CatmullRomCurve3([V(a.x, 0.92, a.z), V((a.x + b.x) / 2, 0.68, a.z), V(b.x, 0.92, b.z)]);
      G.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 16, 0.02, 6), std('#b91c1c', { roughness: 0.7 })));
    }
  }

  // --- цахилгаан ---
  P.power.forEach(pw => box(0.8, 1.0, 0.6, std('#16a34a', { metalness: 0.3 }), pw.x, 0, pw.z, G));

  return G;
}
