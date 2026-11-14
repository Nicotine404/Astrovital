import * as THREE from "three";
import { computeBoundsTree, disposeBoundsTree, acceleratedRaycast } from "three-mesh-bvh";

// BVH-accelerated raycasting: hover/click over ~700k triangles stays instant.
THREE.BufferGeometry.prototype.computeBoundsTree = computeBoundsTree;
THREE.BufferGeometry.prototype.disposeBoundsTree = disposeBoundsTree;
THREE.Mesh.prototype.raycast = acceleratedRaycast;

export interface AnatomyPart {
  geometry: THREE.BufferGeometry;
  center: THREE.Vector3;
}
export type AnatomyModel = Record<string, AnatomyPart>;

interface HeaderEntry {
  id: string;
  vertices: number;
  indices: number;
  index32: boolean;
  min: number[];
  max: number[];
  posOffset: number;
  idxOffset: number;
}

/**
 * Loads public/models/anatomy.bin (BodyParts3D derivative, see scripts/build-anatomy.mjs):
 * int16-quantised positions + triangle indices per anatomical system.
 */
export async function loadAnatomyModel(url: string): Promise<AnatomyModel> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`No se pudo cargar el modelo anatómico (${res.status})`);
  const buf = await res.arrayBuffer();
  const hl = new DataView(buf).getUint32(0, true);
  const header: HeaderEntry[] = JSON.parse(new TextDecoder().decode(new Uint8Array(buf, 4, hl)));
  const base = 4 + hl;
  const out: AnatomyModel = {};
  for (const h of header) {
    const q = new Int16Array(buf, base + h.posOffset, h.vertices * 3);
    const pos = new Float32Array(h.vertices * 3);
    for (let i = 0; i < pos.length; i++) {
      const a = i % 3;
      pos[i] = h.min[a] + ((q[i] + 32767) / 65534) * (h.max[a] - h.min[a]);
    }
    const idx = h.index32 ? new Uint32Array(buf, base + h.idxOffset, h.indices) : new Uint16Array(buf, base + h.idxOffset, h.indices);
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setIndex(new THREE.BufferAttribute(idx.slice(), 1));
    g.computeVertexNormals();
    g.computeBoundingSphere();
    const center = h.id === "skin" ? new THREE.Vector3() : g.boundingSphere!.center.clone();
    if (h.id !== "skin") {
      g.translate(-center.x, -center.y, -center.z);
      g.computeBoundsTree();
    }
    out[h.id] = { geometry: g, center };
  }
  return out;
}
