/**
 * Procedural anatomy fitted to the baked body mesh (height 1.75 m, feet at y=0,
 * facing +z, figure's left = +x). Every builder returns a world-space
 * BufferGeometry so organs can be merged and rendered with one material each.
 */
import * as THREE from "three";
import { SimplexNoise } from "three/examples/jsm/math/SimplexNoise.js";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import type { OrganId } from "@/lib/data/types";

/* deterministic noise so every client renders the same anatomy */
function mulberry32(seed: number) {
  return {
    random() {
      seed |= 0;
      seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    },
  };
}
const noise = new SimplexNoise(mulberry32(7));

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

function place(g: THREE.BufferGeometry, pos: THREE.Vector3, scale = V(1, 1, 1), rot = new THREE.Euler()) {
  const m = new THREE.Matrix4().compose(pos, new THREE.Quaternion().setFromEuler(rot), scale);
  g.applyMatrix4(m);
  return g;
}

function deformSphere(seg: number, fn: (v: THREE.Vector3) => void) {
  const g = new THREE.SphereGeometry(1, seg, Math.round(seg * 0.75));
  const p = g.attributes.position;
  const v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    fn(v);
    p.setXYZ(i, v.x, v.y, v.z);
  }
  g.computeVertexNormals();
  return g;
}

function mirrorX(g: THREE.BufferGeometry) {
  const m = g.clone();
  m.applyMatrix4(new THREE.Matrix4().makeScale(-1, 1, 1));
  // flip winding so normals stay outward
  const idx = m.index;
  if (idx) {
    for (let i = 0; i < idx.count; i += 3) {
      const a = idx.getX(i + 1);
      idx.setX(i + 1, idx.getX(i + 2));
      idx.setX(i + 2, a);
    }
  }
  m.computeVertexNormals();
  return m;
}

/** Tube whose radius varies along the path. */
function tube(points: THREE.Vector3[], radius: number, segs = 120, radial = 10, profile: (u: number) => number = () => 1, closed = false) {
  const curve = new THREE.CatmullRomCurve3(points, closed, "catmullrom", 0.5);
  const g = new THREE.TubeGeometry(curve, segs, radius, radial, closed);
  const p = g.attributes.position;
  const c = new THREE.Vector3();
  const v = new THREE.Vector3();
  for (let i = 0; i <= segs; i++) {
    const u = i / segs;
    curve.getPointAt(u, c);
    const f = profile(u);
    for (let j = 0; j <= radial; j++) {
      const k = i * (radial + 1) + j;
      v.fromBufferAttribute(p, k).sub(c).multiplyScalar(f).add(c);
      p.setXYZ(k, v.x, v.y, v.z);
    }
  }
  g.computeVertexNormals();
  return g;
}

/** Long bone between two joints: shaft with flared epiphyses. */
function longBone(a: THREE.Vector3, b: THREE.Vector3, r: number) {
  const len = a.distanceTo(b);
  const pts: THREE.Vector2[] = [];
  const N = 24;
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const flare = Math.pow(Math.abs(t - 0.5) * 2, 6) * 0.9;
    const edge = Math.min(t, 1 - t);
    const cap = edge < 0.04 ? Math.sin((edge / 0.04) * (Math.PI / 2)) : 1;
    pts.push(new THREE.Vector2(r * (1 + flare) * cap, t * len));
  }
  const g = new THREE.LatheGeometry(pts, 16);
  const q = new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), b.clone().sub(a).normalize());
  g.applyMatrix4(new THREE.Matrix4().compose(a, q, V(1, 1, 1)));
  return g;
}

/* ------------------------------------------------------------------ */
/* Organs                                                              */
/* ------------------------------------------------------------------ */
function brain() {
  const cortex = deformSphere(128, (v) => {
    const n1 = noise.noise3d(v.x * 3.2, v.y * 3.2, v.z * 3.2);
    const n2 = noise.noise3d(v.x * 7, v.y * 7, v.z * 7);
    const ridged = 1 - Math.abs(n1) * 2;
    let r = 1 + 0.045 * ridged + 0.02 * n2;
    r -= Math.exp(-(v.x * v.x) / 0.006) * 0.14 * THREE.MathUtils.smoothstep(v.y, -0.4, 0.2); // longitudinal fissure
    v.multiplyScalar(r);
    if (v.y < -0.45) v.y = -0.45 + (v.y + 0.45) * 0.35;
    if (v.z > 0.5 && v.y < 0) v.y *= 0.8; // frontal lobe base
  });
  place(cortex, V(0, 1.662, 0.005), V(0.066, 0.056, 0.084));
  const cerebellum = deformSphere(48, (v) => {
    v.multiplyScalar(1 + 0.03 * Math.sin(v.y * 40));
  });
  place(cerebellum, V(0, 1.615, -0.05), V(0.048, 0.024, 0.032));
  const stem = tube([V(0, 1.625, -0.01), V(0, 1.585, -0.018), V(0, 1.55, -0.02)], 0.011, 16, 10);
  return mergeGeometries([cortex, cerebellum, stem])!;
}

function heart() {
  const g = deformSphere(64, (v) => {
    const t = (v.y + 1) / 2; // 0 = apex, 1 = base
    v.x *= 0.72 + 0.32 * t;
    v.z *= 0.68 + 0.3 * t;
    if (v.y < 0) v.y *= 1.35;
    v.multiplyScalar(1 + 0.04 * noise.noise3d(v.x * 3, v.y * 3, v.z * 3));
    // interventricular groove
    v.multiplyScalar(1 - Math.exp(-Math.pow(v.x - v.z * 0.3, 2) / 0.01) * 0.05);
  });
  place(g, V(0.028, 1.262, 0.058), V(0.042, 0.046, 0.036), new THREE.Euler(0.35, 0.3, 0.55));
  const atria = deformSphere(32, () => {});
  place(atria, V(0.008, 1.3, 0.04), V(0.034, 0.022, 0.028));
  return mergeGeometries([g, atria])!;
}

function lungs() {
  const right = deformSphere(80, (v) => {
    // medial side is +x for this lung (figure's right lung sits at -x)
    if (v.x > 0.25) v.x = 0.25 + (v.x - 0.25) * 0.3;
    const top = THREE.MathUtils.smoothstep(v.y, 0.2, 1);
    v.x *= 1 - top * 0.35;
    v.z *= 1 - top * 0.3;
    if (v.y < -0.55) v.y = -0.55 + (v.y + 0.55) * 0.25; // diaphragm dome
    v.y += Math.max(0, -v.y - 0.4) * (v.x * v.x) * 0.6;
    v.multiplyScalar(1 + 0.025 * noise.noise3d(v.x * 4, v.y * 4, v.z * 4));
    // oblique fissure
    const fissure = Math.exp(-Math.pow(v.y + v.z * 0.6 - 0.05, 2) / 0.004);
    v.multiplyScalar(1 - fissure * 0.035);
  });
  const left = mirrorX(right);
  // cardiac notch on the left lung (medial, lower, anterior)
  const p = left.attributes.position;
  const v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    const d = v.distanceTo(V(-0.45, -0.35, 0.55));
    if (d < 0.6) v.x += (0.6 - d) * 0.55;
    p.setXYZ(i, v.x, v.y, v.z);
  }
  left.computeVertexNormals();
  place(right, V(-0.07, 1.305, 0.012), V(0.056, 0.102, 0.066));
  place(left, V(0.07, 1.305, 0.012), V(0.054, 0.098, 0.064));
  const trachea = tube([V(0, 1.47, 0.03), V(0, 1.42, 0.025), V(0, 1.38, 0.018)], 0.008, 20, 10, (u) => 1 + 0.15 * Math.sin(u * 60));
  const bronchi = [1, -1].map((s) => tube([V(0, 1.382, 0.018), V(0.022 * s, 1.36, 0.016), V(0.04 * s, 1.335, 0.014)], 0.0055, 16, 8));
  return mergeGeometries([right, left, trachea, ...bronchi])!;
}

function liver() {
  const g = deformSphere(64, (v) => {
    const t = (v.x + 1) / 2; // 0 = figure right (thick), 1 = left lobe tip
    v.y *= 0.25 + 0.75 * (1 - t);
    v.z *= 0.55 + 0.45 * (1 - t);
    if (v.y < -0.05) v.y = -0.05 + (v.y + 0.05) * 0.45;
    v.multiplyScalar(1 + 0.03 * noise.noise3d(v.x * 2.5, v.y * 2.5, v.z * 2.5));
  });
  return place(g, V(-0.03, 1.17, 0.035), V(0.088, 0.06, 0.062), new THREE.Euler(0, 0, 0.12));
}

function stomach() {
  return tube(
    [V(0.022, 1.225, 0.03), V(0.05, 1.205, 0.04), V(0.07, 1.17, 0.05), V(0.068, 1.13, 0.06), V(0.04, 1.11, 0.065), V(0.005, 1.118, 0.06), V(-0.015, 1.13, 0.055)],
    0.022,
    80,
    16,
    (u) => 0.45 + Math.sin(Math.min(u * 1.35, 1) * Math.PI) * 0.75
  );
}

function kidneys() {
  const k = deformSphere(48, (v) => {
    const hilum = Math.exp(-(v.y * v.y) / 0.12) * Math.max(0, v.x) * 0.38;
    v.x -= hilum;
  });
  const r = place(k.clone(), V(-0.052, 1.075, -0.052), V(0.024, 0.044, 0.02), new THREE.Euler(0, 0.4, -0.18));
  const l = place(mirrorX(k), V(0.054, 1.085, -0.052), V(0.024, 0.044, 0.02), new THREE.Euler(0, -0.4, 0.18));
  const ureters = [-1, 1].map((s) => tube([V(0.045 * s, 1.07, -0.04), V(0.04 * s, 0.98, -0.02), V(0.03 * s, 0.9, 0.03), V(0.012 * s, 0.875, 0.05)], 0.0022, 40, 6));
  const bladder = place(deformSphere(24, () => {}), V(0, 0.875, 0.055), V(0.03, 0.022, 0.025));
  return mergeGeometries([r, l, ...ureters, bladder])!;
}

function intestines() {
  const pts: THREE.Vector3[] = [];
  const rows = 6;
  for (let r = 0; r < rows; r++) {
    const y = 1.065 - r * 0.026;
    for (let i = 0; i <= 14; i++) {
      const t = r % 2 === 0 ? i / 14 : 1 - i / 14;
      const k = r * 15 + i;
      pts.push(V(-0.055 + t * 0.11 + Math.sin(k * 1.7) * 0.008, y + Math.cos(k * 2.3) * 0.009, 0.055 + Math.sin(k * 0.9) * 0.022));
    }
  }
  const small = tube(pts, 0.0075, 900, 8);
  const colon = tube(
    [V(-0.068, 0.93, 0.04), V(-0.075, 1.0, 0.04), V(-0.072, 1.085, 0.045), V(-0.02, 1.1, 0.065), V(0.03, 1.098, 0.065), V(0.074, 1.09, 0.045), V(0.078, 1.0, 0.035), V(0.07, 0.94, 0.04), V(0.03, 0.91, 0.05), V(0.005, 0.895, 0.02)],
    0.0135,
    240,
    12,
    (u) => 1 + 0.16 * Math.abs(Math.sin(u * 70))
  );
  return mergeGeometries([small, colon])!;
}

function thyroid() {
  const lobe = deformSphere(20, () => {});
  return mergeGeometries([
    place(lobe.clone(), V(-0.013, 1.462, 0.028), V(0.009, 0.017, 0.008)),
    place(lobe.clone(), V(0.013, 1.462, 0.028), V(0.009, 0.017, 0.008)),
    place(lobe.clone(), V(0, 1.456, 0.034), V(0.01, 0.004, 0.004)),
  ])!;
}

function innerEar() {
  const parts: THREE.BufferGeometry[] = [];
  for (const s of [-1, 1]) {
    const spiral: THREE.Vector3[] = [];
    for (let i = 0; i <= 40; i++) {
      const a = (i / 40) * Math.PI * 5;
      const r = 0.009 * (1 - i / 50);
      spiral.push(V(0.066 * s + Math.cos(a) * r * 0.4, 1.618 + Math.sin(a) * r, 0.006 + Math.cos(a) * r));
    }
    parts.push(tube(spiral, 0.0018, 80, 6));
    for (let c = 0; c < 3; c++) {
      const ring = new THREE.TorusGeometry(0.0065, 0.0012, 6, 24);
      place(ring, V(0.07 * s, 1.628, -0.006), V(1, 1, 1), new THREE.Euler((c * Math.PI) / 2, c === 2 ? Math.PI / 2 : 0, 0));
      parts.push(ring);
    }
  }
  return mergeGeometries(parts)!;
}

export const LIMBS = {
  hip: (s: number) => V(0.09 * s, 0.875, -0.012),
  knee: (s: number) => V(0.162 * s, 0.49, -0.006),
  ankle: (s: number) => V(0.226 * s, 0.085, -0.042),
  shoulder: (s: number) => V(0.2 * s, 1.385, -0.035),
  elbow: (s: number) => V(0.358 * s, 1.192, -0.004),
  wrist: (s: number) => V(0.443 * s, 1.108, 0.145),
  handTip: (s: number) => V(0.505 * s, 1.0, 0.255),
};

function femurs() {
  return mergeGeometries([1, -1].map((s) => longBone(LIMBS.hip(s), LIMBS.knee(s), 0.0105)))!;
}

function calcanei() {
  const c = deformSphere(20, (v) => v.multiplyScalar(1 + 0.08 * noise.noise3d(v.x * 3, v.y * 3, v.z * 3)));
  return mergeGeometries([1, -1].map((s) => place(c.clone(), V(0.226 * s, 0.032, -0.062), V(0.017, 0.015, 0.028))))!;
}

function wristBand() {
  const g = new THREE.TorusGeometry(0.03, 0.0055, 10, 48);
  g.scale(1, 0.75, 1);
  const dir = LIMBS.wrist(1).sub(LIMBS.elbow(1)).normalize();
  const a = LIMBS.wrist(1).addScaledVector(dir, -0.025);
  const q = new THREE.Quaternion().setFromUnitVectors(V(0, 0, 1), dir);
  g.applyMatrix4(new THREE.Matrix4().compose(a, q, V(1, 1, 1)));
  return g;
}

export function buildOrgans(): Record<OrganId, THREE.BufferGeometry> {
  return {
    brain: brain(),
    "inner-ear": innerEar(),
    thyroid: thyroid(),
    lungs: lungs(),
    heart: heart(),
    liver: liver(),
    stomach: stomach(),
    kidneys: kidneys(),
    intestine: intestines(),
    wrist: wristBand(),
    femur: femurs(),
    calcaneus: calcanei(),
  };
}

/* ------------------------------------------------------------------ */
/* Skeleton (excluding femurs and calcanei, which are inspectable)    */
/* ------------------------------------------------------------------ */
export function buildSkeleton() {
  const parts: THREE.BufferGeometry[] = [];

  // spine with lordosis / kyphosis
  const spine = new THREE.CatmullRomCurve3([V(0, 0.9, -0.06), V(0, 0.99, -0.085), V(0, 1.1, -0.075), V(0, 1.25, -0.085), V(0, 1.38, -0.065), V(0, 1.47, -0.03), V(0, 1.55, -0.02)]);
  const N = 26;
  for (let i = 0; i < N; i++) {
    const t = i / (N - 1);
    const p = spine.getPointAt(t);
    const tan = spine.getTangentAt(t);
    const lumbar = 1 - t;
    const body = new THREE.CylinderGeometry(0.01 + lumbar * 0.006, 0.01 + lumbar * 0.006, 0.012, 12);
    const q = new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), tan);
    body.applyMatrix4(new THREE.Matrix4().compose(p, q, V(1, 1, 0.85)));
    parts.push(body);
    const process = new THREE.BoxGeometry(0.004, 0.006, 0.018);
    process.applyMatrix4(new THREE.Matrix4().compose(p.clone().add(V(0, -0.003, -0.016)), q, V(1, 1, 1)));
    parts.push(process);
  }

  // rib cage
  for (let i = 0; i < 11; i++) {
    const y = 1.405 - i * 0.027;
    const w = 0.07 + Math.sin(Math.min(i / 7, 1) * Math.PI * 0.5) * 0.05;
    const front = i < 7 ? 0.105 + i * 0.004 : 0.09 - (i - 7) * 0.025;
    for (const s of [-1, 1]) {
      const pts = [V(0.012 * s, y, -0.072), V(w * 0.55 * s, y + 0.004, -0.088), V(w * s, y - 0.012, -0.03), V(w * 0.95 * s, y - 0.03, 0.04), V(w * 0.55 * s, y - 0.045, front)];
      if (i < 7) pts.push(V(0.02 * s, y - 0.05, front + 0.012));
      parts.push(tube(pts, 0.0032, 40, 6));
    }
  }
  // sternum
  parts.push(tube([V(0, 1.395, 0.105), V(0, 1.32, 0.125), V(0, 1.235, 0.13)], 0.009, 16, 8, (u) => (u < 0.2 ? 1.3 : 0.9)));
  // clavicles + scapulae
  for (const s of [-1, 1]) {
    parts.push(tube([V(0.018 * s, 1.425, 0.085), V(0.08 * s, 1.44, 0.065), V(0.19 * s, 1.425, -0.02)], 0.0045, 24, 6));
    parts.push(tube([V(0.16 * s, 1.43, -0.04), V(0.1 * s, 1.41, -0.085), V(0.07 * s, 1.33, -0.09), V(0.12 * s, 1.3, -0.075), V(0.16 * s, 1.43, -0.04)], 0.003, 40, 6));
  }
  // pelvis
  for (const s of [-1, 1]) {
    parts.push(tube([V(0.015 * s, 0.97, -0.08), V(0.07 * s, 1.0, -0.075), V(0.12 * s, 1.0, -0.02), V(0.12 * s, 0.975, 0.045), V(0.085 * s, 0.93, 0.06)], 0.0055, 40, 8));
    parts.push(tube([V(0.085 * s, 0.93, 0.06), V(0.05 * s, 0.875, 0.07), V(0.006 * s, 0.86, 0.075)], 0.006, 20, 8));
    parts.push(tube([V(0.015 * s, 0.97, -0.08), V(0.05 * s, 0.9, -0.03), V(0.07 * s, 0.875, 0.01), V(0.05 * s, 0.86, 0.06)], 0.005, 30, 8));
  }
  // skull (thin shell) + mandible
  const skull = new THREE.SphereGeometry(1, 40, 30);
  place(skull, V(0, 1.648, 0.012), V(0.076, 0.088, 0.104));
  parts.push(skull);
  parts.push(tube([V(-0.058, 1.62, -0.01), V(-0.055, 1.565, 0.02), V(-0.03, 1.545, 0.075), V(0, 1.54, 0.095), V(0.03, 1.545, 0.075), V(0.055, 1.565, 0.02), V(0.058, 1.62, -0.01)], 0.005, 60, 8));

  // limbs
  for (const s of [-1, 1]) {
    parts.push(longBone(LIMBS.shoulder(s), LIMBS.elbow(s), 0.0085));
    parts.push(longBone(LIMBS.elbow(s).add(V(0.004 * s, 0, 0.006)), LIMBS.wrist(s).add(V(0, 0, 0.008)), 0.005));
    parts.push(longBone(LIMBS.elbow(s).add(V(-0.004 * s, 0, -0.006)), LIMBS.wrist(s).add(V(0, 0, -0.008)), 0.0045));
    parts.push(longBone(LIMBS.knee(s).add(V(0, -0.02, 0)), LIMBS.ankle(s), 0.0095));
    parts.push(longBone(LIMBS.knee(s).add(V(0.018 * s, -0.03, -0.012)), LIMBS.ankle(s).add(V(0.016 * s, 0.01, -0.01)), 0.004));
    // knee cap
    parts.push(place(new THREE.SphereGeometry(1, 12, 10), LIMBS.knee(s).add(V(0, 0, 0.04)), V(0.016, 0.02, 0.008)));
    // foot rays (metatarsals + phalanges)
    for (let t = 0; t < 5; t++) {
      const x = 0.226 * s + (t - 1.5) * 0.012 * s;
      parts.push(longBone(V(0.226 * s, 0.045, -0.03), V(x, 0.014, 0.115 - Math.abs(t - 1) * 0.012), 0.0028));
    }
    // hand rays fanning from the wrist toward the fingertips
    {
      const w = LIMBS.wrist(s);
      const dir = LIMBS.handTip(s).sub(w);
      const side = new THREE.Vector3().crossVectors(dir, V(0, 1, 0)).normalize();
      for (let t = 0; t < 5; t++) {
        const spread = (t - 2) * 0.011;
        const reach = 1 - Math.abs(t - 2) * 0.09 - (t === 0 ? 0.25 : 0);
        parts.push(longBone(w.clone().addScaledVector(side, spread * 0.4), w.clone().addScaledVector(dir, reach).addScaledVector(side, spread), 0.0022));
      }
    }
  }
  return mergeGeometries(parts.map((g) => (g.index ? g.toNonIndexed() : g)))!;
}

/* ------------------------------------------------------------------ */
/* Vessels                                                             */
/* ------------------------------------------------------------------ */
export function buildVessels() {
  const parts: THREE.BufferGeometry[] = [
    // aortic arch + descending aorta
    tube([V(0.02, 1.29, 0.06), V(0.018, 1.345, 0.05), V(0.0, 1.365, 0.0), V(-0.004, 1.33, -0.045), V(0.0, 1.2, -0.05), V(0.0, 1.0, -0.04), V(0.0, 0.94, -0.02)], 0.0065, 120, 8),
    // vena cava
    tube([V(-0.018, 1.29, 0.04), V(-0.02, 1.2, -0.01), V(-0.018, 1.0, -0.03), V(-0.012, 0.94, -0.015)], 0.006, 80, 8),
  ];
  for (const s of [-1, 1]) {
    parts.push(tube([V(0.003 * s, 0.94, -0.02), V(0.05 * s, 0.9, 0.0), LIMBS.hip(s).add(V(0.0, -0.02, 0.03)), LIMBS.knee(s).add(V(-0.01 * s, 0.02, -0.025)), LIMBS.ankle(s).add(V(0, 0.03, 0.01))], 0.0035, 120, 6));
    parts.push(tube([V(0.006 * s, 1.36, 0.02), V(0.022 * s, 1.43, 0.02), V(0.03 * s, 1.52, 0.02), V(0.035 * s, 1.58, 0.0)], 0.003, 40, 6));
    parts.push(tube([V(0.01 * s, 1.36, 0.01), V(0.12 * s, 1.41, 0.0), LIMBS.elbow(s).add(V(0, 0, 0.02)), LIMBS.wrist(s).add(V(0, 0, 0.012))], 0.0026, 80, 6));
  }
  return mergeGeometries(parts)!;
}
