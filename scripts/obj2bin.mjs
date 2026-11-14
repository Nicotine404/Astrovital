// Converts the MakeHuman base mesh (CC0) into public/models/body.bin.
// Usage: node scripts/obj2bin.mjs base.obj public/models/body.bin
// Source: https://github.com/makehumancommunity/makehuman (makehuman/data/3dobjs/base.obj)
import fs from 'fs';
const lines = fs.readFileSync(process.argv[2], 'utf8').split('\n');
const out = process.argv[3];
const V = []; let group = ''; const faces = [];
for (const l of lines) {
  if (l.startsWith('v ')) { const [, x, y, z] = l.trim().split(/\s+/); V.push([+x, +y, +z]); }
  else if (l.startsWith('g ')) group = l.slice(2).trim();
  else if (l.startsWith('f ') && group === 'body') faces.push(l.trim().split(/\s+/).slice(1).map(t => parseInt(t.split('/')[0]) - 1));
}
const remap = new Map(); const pos = [];
const id = (i) => { if (!remap.has(i)) { remap.set(i, pos.length / 3); pos.push(...V[i]); } return remap.get(i); };
const idx = [];
for (const f of faces) { const ids = f.map(id); for (let k = 1; k < ids.length - 1; k++) idx.push(ids[0], ids[k], ids[k + 1]); }
let min = [1e9, 1e9, 1e9], max = [-1e9, -1e9, -1e9];
for (let i = 0; i < pos.length; i += 3) for (let a = 0; a < 3; a++) { min[a] = Math.min(min[a], pos[i + a]); max[a] = Math.max(max[a], pos[i + a]); }
console.log('verts', pos.length / 3, 'tris', idx.length / 3, 'min', min, 'max', max);
const s = 1.75 / (max[1] - min[1]); const cx = (max[0] + min[0]) / 2, cz = (max[2] + min[2]) / 2 - 0.068 / s;
for (let i = 0; i < pos.length; i += 3) { pos[i] = (pos[i] - cx) * s; pos[i + 1] = (pos[i + 1] - min[1]) * s; pos[i + 2] = (pos[i + 2] - cz) * s; }
const P = new Float32Array(pos), I = new Uint32Array(idx);
const header = JSON.stringify([{ name: 'body', verts: P.length / 3, indices: I.length }]);
const padded = header.padEnd(Math.ceil(header.length / 4) * 4);
const len = Buffer.alloc(4); len.writeUInt32LE(padded.length);
fs.writeFileSync(out, Buffer.concat([len, Buffer.from(padded), Buffer.from(P.buffer), Buffer.from(I.buffer)]));
// landmarks
for (let y = 0; y <= 1.76; y += 0.05) {
  const xs = []; let zf = -9, zb = 9;
  for (let i = 0; i < P.length; i += 3) if (Math.abs(P[i + 1] - y) < 0.008) { xs.push(P[i]); if (Math.abs(P[i]) < 0.03) { zf = Math.max(zf, P[i + 2]); zb = Math.min(zb, P[i + 2]); } }
  xs.sort((a, b) => a - b);
  const cl = []; let cur = [xs[0]];
  for (let i = 1; i < xs.length; i++) { if (xs[i] - xs[i - 1] > 0.025) { cl.push(cur); cur = []; } cur.push(xs[i]); }
  cl.push(cur);
  console.log(y.toFixed(2), 'z[', zb.toFixed(3), zf.toFixed(3), ']', cl.map(c => `[${c[0]?.toFixed(3)},${c[c.length - 1]?.toFixed(3)}]`).join(' '));
}
