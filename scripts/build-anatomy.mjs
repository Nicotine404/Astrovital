/**
 * Builds public/models/anatomy.bin and src/lib/data/anatomy.generated.json from
 * the BodyParts3D STL collection.
 *
 * Source data: BodyParts3D, (c) The Database Center for Life Science, licensed
 * under CC Attribution-Share Alike 2.1 Japan. STL conversion by K. M. Moerman
 * (https://github.com/Kevin-Mattheus-Moerman/BodyParts3D). The generated model
 * files are derivatives and carry the same CC BY-SA 2.1 JP licence.
 *
 * Usage:
 *   node scripts/build-anatomy.mjs <path-to>/BodyParts3D/assets/BodyParts3D_data
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { MeshoptSimplifier } from "meshoptimizer";

const DATA = process.argv[2];
if (!DATA) throw new Error("usage: node scripts/build-anatomy.mjs <BodyParts3D_data dir>");
const OUT_BIN = "public/models/anatomy.bin";
const OUT_JSON = "src/features/health-monitoring/presentation/components/interactive-body/anatomy.generated.json";

/* ---------------------------------------------------------------- */
/* Catalogue                                                         */
/* ---------------------------------------------------------------- */
const names = new Map();
for (const line of fs.readFileSync(path.join(DATA, "parts_list_e.txt"), "utf8").split("\n").slice(1)) {
  const [id, name] = line.replace(/"/g, "").split("\t");
  if (id && name && fs.existsSync(path.join(DATA, "stl", `${id}.stl`))) names.set(id, name.trim());
}
const composite = new Map();
for (const line of fs.readFileSync(path.join(DATA, "composite_parts.txt"), "utf8").split("\n").slice(1)) {
  const [c, , p] = line.replace(/"/g, "").split("\t");
  if (!c || !p) continue;
  if (!composite.has(c)) composite.set(c, []);
  composite.get(c).push(p);
}
const NOT_BONE = /muscle|ligament|tendon|artery|vein|nerve|membrane|joint|flexor|extensor|abductor|adductor|interosse|lumbrical|opponens| head of|pronator|supinator|retinaculum/i;
const byName = (re, exclude = NOT_BONE) => [...names].filter(([, n]) => re.test(n) && !exclude?.test(n)).map(([id]) => id);
const byComposite = (id, exclude) => (composite.get(id) ?? []).filter((p) => names.has(p) && !(exclude && exclude.test(names.get(p))));
const ids = (...list) => list.filter((id) => names.has(id));

const OPTIC = /optic|geniculate/i;
const GROUPS = [
  { id: "skin", budget: 95000, parts: ids("FMA7163") },
  { id: "brain", budget: 110000, parts: byComposite("FMA50801", OPTIC) },
  { id: "eyes", budget: 9000, side: true, parts: ids("FMA12513", "FMA50875", "FMA50878", "FMA62045", "FMA62382", "FMA67936") },
  { id: "thyroid", budget: 6000, parts: ids("FMA55099", "FMA52749") },
  { id: "lungs", budget: 52000, side: true, parts: ids("FMA7383", "FMA7371", "FMA7337", "FMA7333", "FMA7370", "FMA7394", "FMA7409") },
  { id: "heart", budget: 70000, parts: byComposite("FMA7088") },
  {
    id: "vessels",
    budget: 45000,
    anchorParts: ["FMA3768", "FMA3736"],
    parts: byName(
      /^(ascending aorta|arch of aorta|descending aorta|superior vena cava|inferior vena cava|pulmonary artery|pulmonary vein|brachiocephalic artery, nsn|(right|left) brachiocephalic vein|(right|left) common carotid artery|(right|left) subclavian (artery|vein)|(right|left) (common|external|internal) iliac (artery|vein))$/,
      null
    ),
  },
  { id: "liver", budget: 13000, anchorParts: ["FMA7197"], parts: ids("FMA7197", "FMA7202") },
  { id: "stomach", budget: 8000, anchorParts: ["FMA7148"], parts: ids("FMA7148", "FMA7131") },
  { id: "spleen", budget: 4000, parts: ids("FMA7196") },
  { id: "pancreas", budget: 5000, parts: ids("FMA7198nsn", "FMA10419") },
  { id: "kidneys", budget: 13000, anchorParts: ["FMA7205"], parts: ids("FMA7204", "FMA7205", "FMA15571", "FMA15572", "FMA15900", "FMA15629", "FMA15630") },
  { id: "intestine", budget: 48000, parts: [...new Set([...ids("FMA7206", "FMA7207", "FMA7208", "FMA14543nsn", "FMA14544", "FMA14542"), ...byComposite("FMA7201")])] },
  { id: "skull", budget: 48000, parts: byName(/^((right|left) )?(frontal|parietal|occipital|temporal|sphenoid|zygomatic|nasal|lacrimal|palatine) bone$|^ethmoid$|^vomer$|maxilla$|^mandible$/) },
  { id: "spine", budget: 46000, parts: byName(/vertebra$|^atlas$|^axis$|^sacrum$|^coccyx$|^intervertebral disk of/) },
  { id: "ribcage", budget: 40000, parts: [...new Set([...byComposite("FMA7480"), ...ids("BP24", "BP28")])] },
  { id: "shoulder", budget: 14000, side: true, parts: byName(/^(right|left) (clavicle|scapula)$/) },
  { id: "humerus", budget: 8000, side: true, parts: byName(/^(right|left) humerus$/) },
  { id: "forearm", budget: 7000, side: true, parts: byName(/^(right|left) (radius|ulna)$/) },
  { id: "hand", budget: 16000, side: true, parts: byName(/^(right|left) (scaphoid|lunate|triquetral|pisiform|trapezium|trapezoid|capitate|hamate)$|metacarpal bone$|phalanx of (right|left) (thumb|.* finger)$/) },
  { id: "pelvis", budget: 10000, side: false, parts: byName(/^(right|left) hip bone$/) },
  { id: "femur", budget: 9000, side: true, parts: byName(/^(right|left) femur$/) },
  { id: "tibia", budget: 9000, side: true, parts: byName(/^(right|left) (tibia|fibula|patella)$/) },
  { id: "calcaneus", budget: 15000, side: true, parts: byName(/^(right|left) (talus|calcaneus)$|navicular bone of (right|left) foot|^(right|left) cuboid bone$|cuneiform bone$|metatarsal bone$|phalanx of (right|left) .*toe$/) },
];

/* ---------------------------------------------------------------- */
/* Geometry helpers                                                  */
/* ---------------------------------------------------------------- */
// BodyParts3D: millimetres, Z up, +X = patient's left, -Y = anterior.
// App space: metres, Y up, +X = patient's left, +Z = anterior, feet at 0, height 1.75.
const Z_MIN = -14.2;
const Y_CENTER = -90;
const SCALE = 1.75 / 1656.6;
const toApp = (x, y, z) => [x * SCALE, (z - Z_MIN) * SCALE, -(y - Y_CENTER) * SCALE];

function readStl(id) {
  const b = fs.readFileSync(path.join(DATA, "stl", `${id}.stl`));
  const n = b.readUInt32LE(80);
  const map = new Map();
  const pos = [];
  const idx = new Uint32Array(n * 3);
  for (let t = 0; t < n; t++) {
    const o = 84 + t * 50 + 12;
    for (let v = 0; v < 3; v++) {
      const x = b.readFloatLE(o + v * 12), y = b.readFloatLE(o + v * 12 + 4), z = b.readFloatLE(o + v * 12 + 8);
      const key = `${x.toFixed(3)},${y.toFixed(3)},${z.toFixed(3)}`;
      let k = map.get(key);
      if (k === undefined) {
        k = pos.length / 3;
        map.set(key, k);
        pos.push(...toApp(x, y, z));
      }
      idx[t * 3 + v] = k;
    }
  }
  return { pos: new Float32Array(pos), idx, tris: n };
}

function simplify(mesh, targetTris) {
  if (mesh.tris <= targetTris) return mesh;
  let [out] = MeshoptSimplifier.simplify(mesh.idx, mesh.pos, 3, targetTris * 3, 0.05, []);
  if (out.length / 3 > targetTris * 1.5) [out] = MeshoptSimplifier.simplifySloppy(mesh.idx, mesh.pos, 3, null, targetTris * 3, 0.05);
  // compact vertices
  const remap = new Map();
  const pos = [];
  const idx = new Uint32Array(out.length);
  for (let i = 0; i < out.length; i++) {
    let k = remap.get(out[i]);
    if (k === undefined) {
      k = pos.length / 3;
      remap.set(out[i], k);
      pos.push(mesh.pos[out[i] * 3], mesh.pos[out[i] * 3 + 1], mesh.pos[out[i] * 3 + 2]);
    }
    idx[i] = k;
  }
  return { pos: new Float32Array(pos), idx, tris: idx.length / 3 };
}

/** Drop zero-area / repeated-index triangles (they yield zero normals -> NaN shading). */
function dropDegenerate(mesh) {
  const keep = [];
  const p = mesh.pos;
  for (let t = 0; t < mesh.idx.length; t += 3) {
    const a = mesh.idx[t], b = mesh.idx[t + 1], c = mesh.idx[t + 2];
    if (a === b || b === c || a === c) continue;
    const ux = p[b * 3] - p[a * 3], uy = p[b * 3 + 1] - p[a * 3 + 1], uz = p[b * 3 + 2] - p[a * 3 + 2];
    const vx = p[c * 3] - p[a * 3], vy = p[c * 3 + 1] - p[a * 3 + 1], vz = p[c * 3 + 2] - p[a * 3 + 2];
    const cx = uy * vz - uz * vy, cy = uz * vx - ux * vz, cz = ux * vy - uy * vx;
    if (cx * cx + cy * cy + cz * cz < 1e-18) continue;
    keep.push(a, b, c);
  }
  return { ...mesh, idx: Uint32Array.from(keep), tris: keep.length / 3 };
}

function centroid(pos) {
  const c = [0, 0, 0];
  for (let i = 0; i < pos.length; i += 3) for (let a = 0; a < 3; a++) c[a] += pos[i + a];
  return c.map((v) => v / (pos.length / 3));
}

const round = (v) => Math.round(v * 10000) / 10000;

/* ---------------------------------------------------------------- */
/* Build                                                             */
/* ---------------------------------------------------------------- */
await MeshoptSimplifier.ready;
let skinPos = new Float32Array(0);
const chunks = [];
const header = [];
const meta = {};
let offset = 0;
const push = (buf) => {
  const pad = (4 - (buf.byteLength % 4)) % 4;
  chunks.push(Buffer.from(buf.buffer, buf.byteOffset, buf.byteLength));
  if (pad) chunks.push(Buffer.alloc(pad));
  const at = offset;
  offset += buf.byteLength + pad;
  return at;
};

for (const g of GROUPS) {
  if (!g.parts.length) throw new Error(`group ${g.id} has no parts`);
  const raw = g.parts.map((id) => ({ id, name: names.get(id), ...readStl(id) }));
  const total = raw.reduce((s, m) => s + m.tris, 0);
  const meshes = raw.map((m) => dropDegenerate({ ...m, ...simplify(m, Math.max(120, Math.round((g.budget * m.tris) / total))) }));

  // merge
  const vCount = meshes.reduce((s, m) => s + m.pos.length / 3, 0);
  const iCount = meshes.reduce((s, m) => s + m.idx.length, 0);
  const pos = new Float32Array(vCount * 3);
  const idx = vCount > 65535 ? new Uint32Array(iCount) : new Uint16Array(iCount);
  let vo = 0, io = 0;
  for (const m of meshes) {
    pos.set(m.pos, vo * 3);
    for (let i = 0; i < m.idx.length; i++) idx[io + i] = m.idx[i] + vo;
    vo += m.pos.length / 3;
    io += m.idx.length;
  }

  // quantise positions to int16 inside the group's bounding box
  const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < pos.length; i += 3) for (let a = 0; a < 3; a++) { min[a] = Math.min(min[a], pos[i + a]); max[a] = Math.max(max[a], pos[i + a]); }
  const q = new Int16Array(pos.length);
  for (let i = 0; i < pos.length; i += 3)
    for (let a = 0; a < 3; a++) q[i + a] = Math.round(((pos[i + a] - min[a]) / (max[a] - min[a] || 1)) * 65534 - 32767);

  if (g.id === "skin") skinPos = pos;
  const posOffset = push(q);
  const idxOffset = push(idx);
  header.push({ id: g.id, vertices: vCount, indices: iCount, index32: idx instanceof Uint32Array, min: min.map(round), max: max.map(round), posOffset, idxOffset });

  // anchor: centroid of the patient-left half for bilateral structures
  let src = pos;
  if (g.anchorParts) {
    src = Float32Array.from(meshes.filter((m) => g.anchorParts.includes(m.id)).flatMap((m) => [...m.pos]));
  } else if (g.side) {
    const left = [];
    for (let i = 0; i < pos.length; i += 3) if (pos[i] > 0.005) left.push(pos[i], pos[i + 1], pos[i + 2]);
    src = Float32Array.from(left);
  }
  const anchor = g.id === "skin" ? [0, 1, 0] : centroid(src);
  let radius = 0;
  for (let i = 0; i < src.length; i += 3) radius = Math.max(radius, Math.hypot(src[i] - anchor[0], src[i + 1] - anchor[1], src[i + 2] - anchor[2]));
  meta[g.id] = { anchor: anchor.map(round), radius: round(radius), triangles: iCount / 3, parts: meshes.length };
  console.log(`${g.id.padEnd(10)} parts ${String(meshes.length).padStart(4)}  tris ${String(total).padStart(8)} -> ${String(iCount / 3).padStart(7)}  verts ${vCount}`);
}

// wrist sensor: band around the left forearm where a watch sits, sized to the skin
{
  const radius = readStl(ids("FMA23465")[0]).pos; // left radius
  const ulna = readStl(ids("FMA23468")[0]).pos; // left ulna
  const both = new Float32Array([...radius, ...ulna]);
  let yMin = Infinity, yMax = -Infinity;
  for (let i = 1; i < both.length; i += 3) { yMin = Math.min(yMin, both[i]); yMax = Math.max(yMax, both[i]); }
  const slab = (lo, hi) => {
    const c = [0, 0, 0];
    let n = 0;
    for (let i = 0; i < both.length; i += 3) if (both[i + 1] >= lo && both[i + 1] <= hi) { c[0] += both[i]; c[1] += both[i + 1]; c[2] += both[i + 2]; n++; }
    return c.map((v) => v / n);
  };
  const distal = slab(yMin, yMin + 0.015); // wrist joint, between radius and ulna
  const proximal = slab(yMax - 0.03, yMax); // elbow
  const axis = distal.map((v, a) => v - proximal[a]);
  const al = Math.hypot(...axis);
  const dir = axis.map((v) => v / al);
  const center = distal.map((v, a) => v - dir[a] * 0.03); // 3 cm proximal of the joint
  // skin cross-section radius around the axis at that point
  const dists = [];
  for (let i = 0; i < skinPos.length; i += 3) {
    const d = [skinPos[i] - center[0], skinPos[i + 1] - center[1], skinPos[i + 2] - center[2]];
    const along = d[0] * dir[0] + d[1] * dir[1] + d[2] * dir[2];
    if (Math.abs(along) > 0.006) continue;
    const perp = d.map((v, a) => v - along * dir[a]);
    const r = Math.hypot(...perp);
    if (r < 0.06) dists.push(r);
  }
  dists.sort((a, b) => a - b);
  const skinR = dists.length ? dists[Math.floor(dists.length * 0.85)] : 0.027;
  meta.wristSensor = { position: center.map(round), direction: dir.map(round), radius: round(skinR + 0.0015) };
  console.log("wrist sensor", meta.wristSensor, "skin samples", dists.length);
}

const hjson = Buffer.from(JSON.stringify(header));
const hpad = Buffer.alloc((4 - ((hjson.length + 4) % 4)) % 4, 0x20);
const len = Buffer.alloc(4);
len.writeUInt32LE(hjson.length + hpad.length);
const bin = Buffer.concat([len, hjson, hpad, ...chunks]);
fs.writeFileSync(OUT_BIN, bin);
// content hash, used as a cache-busting query string by the app
meta.version = crypto.createHash("sha1").update(bin).digest("hex").slice(0, 10);
fs.writeFileSync(OUT_JSON, JSON.stringify(meta, null, 2) + "\n");
console.log(`\nwrote ${OUT_BIN} (${(fs.statSync(OUT_BIN).size / 1e6).toFixed(2)} MB) and ${OUT_JSON}`);
