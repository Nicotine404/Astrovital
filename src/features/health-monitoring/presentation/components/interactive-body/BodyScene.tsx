"use client";

import * as React from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { CameraControls, PerformanceMonitor } from "@react-three/drei";
import { Bloom, EffectComposer, Vignette } from "@react-three/postprocessing";
import type CameraControlsImpl from "camera-controls";
import { acceleratedRaycast, computeBoundsTree, disposeBoundsTree } from "three-mesh-bvh";
import { MeshSurfaceSampler } from "three/examples/jsm/math/MeshSurfaceSampler.js";
import { ANATOMICAL_STRUCTURES, STRUCTURES, type AnatomicalStructureId } from "@/features/health-monitoring/domain/value-objects/anatomical-structure.vo";
import type { BodyZone } from "@/features/health-monitoring/domain/value-objects/body-zone.vo";
import type { HealthStatus } from "@/features/health-monitoring/domain/value-objects/health-status.vo";
import type { OrganAssessment } from "@/features/health-monitoring/domain/models/organ-assessment.model";
import type { AnatomyModel, AnatomyPart } from "@/features/health-monitoring/infrastructure/anatomy/anatomy-model.loader";
import { STATUS_META } from "@/core/presentation/shared/status-meta";
import ANATOMY from "./anatomy.generated.json";
import type { TwinLayer, TwinLayers, TwinViewPreset } from "./twin.types";
import { makeFloorMaterial, makePointsMaterial, makeShellMaterial, makeXrayMaterial } from "./shaders";

// BVH-accelerated raycasting: hover/click over ~700k triangles stays instant.
THREE.BufferGeometry.prototype.computeBoundsTree = computeBoundsTree;
THREE.BufferGeometry.prototype.disposeBoundsTree = disposeBoundsTree;
THREE.Mesh.prototype.raycast = acceleratedRaycast;

/* WebGL can't read CSS variables, so the palette is mirrored here. */
const C = {
  bg: new THREE.Color("#080b11"),
  shell: new THREE.Color("#7f9cf5"),
  points: new THREE.Color("#b9c9ff"),
  organ: new THREE.Color("#a3b1cc"),
  bone: new THREE.Color("#dde3ee"),
  vessel: new THREE.Color("#8d9fe0"),
  device: new THREE.Color("#8aa8ff"),
  selected: new THREE.Color("#86a6ff"),
  status: {
    NOMINAL: new THREE.Color("#4fbf8b"),
    WARNING: new THREE.Color("#f0b54a"),
    CRITICAL: new THREE.Color("#ff5d6c"),
  } as Record<HealthStatus, THREE.Color>,
};

const REVEAL_TIME = 2.6;
/** Frame-rate independent smoothing factor (~0.12 at 60 fps). */
const ease = (dt: number, rate = 8) => 1 - Math.exp(-rate * Math.min(dt, 0.25));
const TOP = 1.8;

type Layer = TwinLayer;
type Layers = TwinLayers;
type ViewPreset = TwinViewPreset;

const layerOf = (id: OrganId): Layer => {
  const o = ORGAN_BY_ID[id];
  if (id === "vessels") return "vessels";
  return o.category === "bone" ? "bones" : "organs";
};

type Part = AnatomyPart;
type OrganId = AnatomicalStructureId;

/** Static geometry metadata emitted by scripts/build-anatomy.mjs (anchor = centroid in metres). */
const GEOMETRY = ANATOMY as unknown as Record<string, { anchor: [number, number, number]; radius: number }> & {
  wristSensor: { position: [number, number, number]; direction: [number, number, number]; radius: number };
};
const ORGANS = ANATOMICAL_STRUCTURES.map((id) => {
  const g = id === "wrist" ? { anchor: GEOMETRY.wristSensor.position, radius: GEOMETRY.wristSensor.radius * 2.2 } : GEOMETRY[id];
  return { id, ...STRUCTURES[id], anchor: g.anchor, radius: g.radius };
});
const ORGAN_BY_ID = Object.fromEntries(ORGANS.map((o) => [o.id, o])) as Record<OrganId, (typeof ORGANS)[number]>;

/* ------------------------------------------------------------------ */
/* Shared scene clock: reveal + scan                                   */
/* ------------------------------------------------------------------ */
type Clock = { reveal: number; scan: number; time: number };

function useSceneClock(heightScale: number) {
  const clock = React.useRef<Clock>({ reveal: 0, scan: -1, time: 0 });
  const start = React.useRef<number | null>(null);
  useFrame(({ clock: c }) => {
    if (start.current == null) start.current = c.elapsedTime;
    const t = c.elapsedTime - start.current;
    const k = Math.min(t / REVEAL_TIME, 1);
    clock.current.time = c.elapsedTime;
    clock.current.reveal = k < 1 ? (1 - Math.pow(1 - k, 3)) * TOP * heightScale : 99;
    const cycle = ((((t - REVEAL_TIME) * 0.14) % 1) + 1) % 1;
    clock.current.scan = k < 1 ? clock.current.reveal : (cycle * 1.25 - 0.1) * TOP * heightScale;
  });
  return clock;
}

function syncUniforms(materials: THREE.ShaderMaterial[], clock: Clock) {
  for (const m of materials) {
    if (m.uniforms.uReveal) m.uniforms.uReveal.value = clock.reveal;
    if (m.uniforms.uScan) m.uniforms.uScan.value = clock.scan;
    if (m.uniforms.uTime) m.uniforms.uTime.value = clock.time;
  }
}

/* ------------------------------------------------------------------ */
/* Skin: hologram shell + surface point cloud                          */
/* ------------------------------------------------------------------ */
function Skin({ part, clock, visible, focused }: { part: Part; clock: React.RefObject<Clock>; visible: boolean; focused: boolean }) {
  const dpr = useThree((s) => s.viewport.dpr);
  const shell = React.useMemo(() => makeShellMaterial(C.shell), []);
  const pointsMat = React.useMemo(() => makePointsMaterial(C.points, dpr), [dpr]);
  const points = React.useRef<THREE.Points>(null);

  const cloud = React.useMemo(() => {
    const sampler = new MeshSurfaceSampler(new THREE.Mesh(part.geometry)).build();
    const N = 30000;
    const pos = new Float32Array(N * 3);
    const rnd = new Float32Array(N);
    const p = new THREE.Vector3();
    for (let i = 0; i < N; i++) {
      sampler.sample(p);
      pos.set([p.x, p.y, p.z], i * 3);
      rnd[i] = Math.random();
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("aRand", new THREE.BufferAttribute(rnd, 1));
    return g;
  }, [part]);

  useFrame((_, dt) => {
    syncUniforms([shell, pointsMat], clock.current);
    const k = ease(dt);
    const target = !visible ? 0 : focused ? 0.16 : 1;
    shell.uniforms.uOpacity.value = THREE.MathUtils.lerp(shell.uniforms.uOpacity.value, target, k);
    pointsMat.uniforms.uSize.value = THREE.MathUtils.lerp(pointsMat.uniforms.uSize.value, visible && !focused ? 1.7 : 0, k);
    points.current!.visible = pointsMat.uniforms.uSize.value > 0.02;
  });

  return (
    <group>
      <mesh geometry={part.geometry} material={shell} renderOrder={1} raycast={() => null} />
      <points ref={points} geometry={cloud} material={pointsMat} renderOrder={2} raycast={() => null} />
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Clickable anatomy                                                   */
/* ------------------------------------------------------------------ */
interface StructuresProps {
  parts: AnatomyModel;
  subject: TwinSubject;
  statuses: TwinStatuses;
  selected: OrganId;
  focused: boolean;
  activeZone: BodyZone | null;
  layers: Layers;
  clock: React.RefObject<Clock>;
  onSelect: (id: OrganId) => void;
  onHover: (id: OrganId | null, e?: ThreeEvent<PointerEvent>) => void;
}

function baseColor(id: OrganId) {
  if (id === "vessels") return C.vessel;
  const cat = ORGAN_BY_ID[id].category;
  return cat === "bone" ? C.bone : cat === "device" ? C.device : C.organ;
}

function Structures({ parts, subject, statuses, selected, focused, activeZone, layers, clock, onSelect, onHover }: StructuresProps) {
  const hovered = React.useRef<OrganId | null>(null);

  const items = React.useMemo(() => {
    const list: { id: OrganId; geometry: THREE.BufferGeometry; center: THREE.Vector3; material: THREE.ShaderMaterial; layer: Layer }[] = [];
    for (const o of ORGANS) {
      if (o.id === "wrist") continue;
      const p = parts[o.id];
      if (!p) continue;
      const bone = o.category === "bone";
      list.push({
        id: o.id,
        geometry: p.geometry,
        center: p.center,
        material: makeXrayMaterial(baseColor(o.id), bone ? 0.16 : 0.3, bone ? 0.6 : 0.7),
        layer: layerOf(o.id),
      });
    }
    // EVA suit wrist sensor: a band around the distal left forearm
    const ws = GEOMETRY.wristSensor;
    const band = new THREE.TorusGeometry(ws.radius, 0.0045, 12, 72);
    band.scale(1.08, 0.86, 1); // wrists are wider side-to-side than front-to-back
    band.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), new THREE.Vector3(...ws.direction).normalize()));
    band.computeBoundsTree();
    list.push({
      id: "wrist",
      geometry: band,
      center: new THREE.Vector3(...ws.position),
      material: makeXrayMaterial(C.device, 0.45, 0.9),
      layer: "organs",
    });
    return list;
  }, [parts]);

  const refs = React.useRef<Partial<Record<OrganId, THREE.Mesh | null>>>({});
  // Ghosted (non-selected while focused) structures let pointer events pass through.
  const ghosts = React.useRef<Partial<Record<OrganId, boolean>>>({});

  useFrame(({ clock: c }, dt) => {
    const t = c.elapsedTime;
    const k = ease(dt);
    syncUniforms(
      items.map((i) => i.material),
      clock.current
    );
    for (const it of items) {
      const status = statuses[it.id] ?? "NOMINAL";
      const isSel = it.id === selected;
      const inZone = activeZone !== null && STRUCTURES[it.id].zone === activeZone;
      const visible = layers[it.layer] || isSel || inZone;
      const target = isSel ? (status === "NOMINAL" ? C.selected : C.status[status]) : status === "NOMINAL" ? baseColor(it.id) : C.status[status];
      const u = it.material.uniforms;
      (u.uColor.value as THREE.Color).lerp(target, k);
      // Isolation: with a focused structure or an active clinical zone, everything else becomes a ghost.
      const ghost = !isSel && (focused || (activeZone !== null && !inZone));
      const dim = ghost ? 0.07 : 1;
      ghosts.current[it.id] = ghost;
      let base = isSel ? 1.15 + Math.sin(t * 3) * 0.08 : status !== "NOMINAL" ? 1.05 : inZone ? 0.95 : it.layer === "bones" ? 0.55 : 0.68;
      if (hovered.current === it.id && !isSel) base += 0.5;
      u.uIntensity.value = THREE.MathUtils.lerp(u.uIntensity.value, visible ? base * dim : 0, k);
      u.uFill.value = THREE.MathUtils.lerp(u.uFill.value, isSel ? 0.34 : it.layer === "bones" ? 0.16 : 0.28, k);

      const mesh = refs.current[it.id];
      if (!mesh) continue;
      mesh.visible = u.uIntensity.value > 0.01;
      if (it.id === "heart") {
        const beat = Math.pow(Math.max(0, Math.sin(t * (subject.heartRate / 60) * Math.PI * 2)), 12);
        mesh.scale.setScalar(1 + beat * 0.035);
      } else if (it.id === "lungs") {
        mesh.scale.setScalar(1 + Math.sin(t * (subject.respiratoryRate / 60) * Math.PI * 2) * 0.012);
      }
    }
  });

  return (
    <group>
      {items.map((it) => (
        <mesh
          key={it.id}
          ref={(m) => {
            refs.current[it.id] = m;
          }}
          geometry={it.geometry}
          material={it.material}
          position={it.center}
          renderOrder={3}
          onClick={(e: ThreeEvent<MouseEvent>) => {
            if (e.delta > 4 || ghosts.current[it.id]) return; // drag, or ghost: let it pass through
            e.stopPropagation();
            onSelect(it.id);
          }}
          onPointerMove={(e: ThreeEvent<PointerEvent>) => {
            if (ghosts.current[it.id]) return;
            e.stopPropagation();
            if (hovered.current !== it.id) {
              hovered.current = it.id;
              document.body.style.cursor = "pointer";
            }
            onHover(it.id, e);
          }}
          onPointerOut={() => {
            if (hovered.current === it.id) {
              hovered.current = null;
              document.body.style.cursor = "";
              onHover(null);
            }
          }}
        />
      ))}
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Floor, rings and height ruler                                       */
/* ------------------------------------------------------------------ */
function Platform({ heightScale, focused }: { heightScale: number; focused: boolean }) {
  const floor = React.useMemo(() => makeFloorMaterial(C.shell), []);
  const rulerMat = React.useMemo(() => new THREE.LineBasicMaterial({ color: C.shell, transparent: true, opacity: 0.35 }), []);
  const ring = React.useRef<THREE.Group>(null);
  useFrame(({ clock }, dt) => {
    floor.uniforms.uTime.value = clock.elapsedTime;
    if (ring.current) ring.current.rotation.z += dt * 0.05;
    rulerMat.opacity = THREE.MathUtils.lerp(rulerMat.opacity, focused ? 0 : 0.35, ease(dt));
  });

  const ruler = React.useMemo(() => {
    const pts: number[] = [];
    const x = -0.55;
    pts.push(x, 0, 0, x, TOP * heightScale, 0);
    for (let i = 0; i <= 18; i++) {
      const y = (i / 10) * heightScale;
      const len = i % 5 === 0 ? 0.04 : 0.018;
      pts.push(x, y, 0, x + len, y, 0);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
    return g;
  }, [heightScale]);

  const basic = (o: number) => (
    <meshBasicMaterial color={C.shell} transparent opacity={o} depthWrite={false} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} />
  );

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} material={floor} raycast={() => null}>
        <planeGeometry args={[3.4, 3.4]} />
      </mesh>
      <group rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, 0]}>
        <mesh raycast={() => null}>
          <ringGeometry args={[0.58, 0.585, 128]} />
          {basic(0.5)}
        </mesh>
        <group ref={ring}>
          {Array.from({ length: 72 }, (_, i) => (
            <mesh key={i} rotation={[0, 0, (i / 72) * Math.PI * 2]} raycast={() => null}>
              <ringGeometry args={[0.6, i % 6 === 0 ? 0.65 : 0.625, 2, 1, 0, 0.006]} />
              {basic(i % 6 === 0 ? 0.6 : 0.3)}
            </mesh>
          ))}
          {Array.from({ length: 4 }, (_, i) => (
            <mesh key={`arc${i}`} rotation={[0, 0, (i / 4) * Math.PI * 2]} raycast={() => null}>
              <ringGeometry args={[0.69, 0.695, 64, 1, 0, Math.PI * 0.32]} />
              {basic(0.45)}
            </mesh>
          ))}
        </group>
      </group>
      <lineSegments geometry={ruler} material={rulerMat} raycast={() => null} />
    </group>
  );
}

function ScanPlane({ clock }: { clock: React.RefObject<Clock> }) {
  const ref = React.useRef<THREE.Group>(null);
  useFrame(() => {
    if (!ref.current) return;
    const y = clock.current.scan;
    ref.current.position.y = y;
    ref.current.visible = y > 0.01 && y < TOP * 1.05;
  });
  return (
    <group ref={ref}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} raycast={() => null}>
        <ringGeometry args={[0.38, 0.382, 128]} />
        <meshBasicMaterial color={C.points} transparent opacity={0.35} depthWrite={false} blending={THREE.AdditiveBlending} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Free camera: orbit (no angle limits), pan, zoom-to-cursor, keys     */
/* ------------------------------------------------------------------ */
const HOME = { pos: new THREE.Vector3(0.55, 1.2, 3.3), target: new THREE.Vector3(0, 0.88, 0) };

function CameraRig({
  selected,
  focused,
  heightScale,
  autoRotate,
  view,
  keys,
  onUserInteract,
}: {
  selected: OrganId;
  focused: boolean;
  heightScale: number;
  autoRotate: boolean;
  view: { preset: ViewPreset; n: number };
  keys: React.RefObject<Set<string>>;
  onUserInteract: () => void;
}) {
  const ref = React.useRef<CameraControlsImpl>(null);
  const dragging = React.useRef(false);
  const tmp = React.useMemo(() => ({ t: new THREE.Vector3(), p: new THREE.Vector3(), s: new THREE.Sphere() }), []);

  // intro dolly
  React.useEffect(() => {
    const c = ref.current;
    if (!c) return;
    c.setLookAt(1.4, 1.9, 6.2, HOME.target.x, HOME.target.y * heightScale, HOME.target.z, false);
    c.setLookAt(HOME.pos.x, HOME.pos.y * heightScale, HOME.pos.z, HOME.target.x, HOME.target.y * heightScale, HOME.target.z, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // fly to the selected structure (keeps the current viewing direction)
  const first = React.useRef(true);
  React.useEffect(() => {
    const c = ref.current;
    if (!c) return;
    if (first.current) {
      first.current = false;
      return;
    }
    if (focused) {
      const o = ORGAN_BY_ID[selected];
      tmp.s.center.set(o.anchor[0], o.anchor[1], o.anchor[2]).multiplyScalar(heightScale);
      tmp.s.radius = Math.max(o.radius * heightScale * 1.5, 0.09);
      void c.fitToSphere(tmp.s, true);
    } else {
      c.getPosition(tmp.p);
      c.getTarget(tmp.t);
      const dir = tmp.p.sub(tmp.t).normalize();
      const target = new THREE.Vector3(0, HOME.target.y * heightScale, 0);
      const pos = target.clone().addScaledVector(dir, 3.3);
      void c.setLookAt(pos.x, Math.max(pos.y, 0.3), pos.z, target.x, target.y, target.z, true);
    }
  }, [selected, focused, heightScale, tmp]);

  // view presets
  React.useEffect(() => {
    const c = ref.current;
    if (!c || view.n === 0) return;
    const P = Math.PI;
    switch (view.preset) {
      case "front":
        void c.rotateTo(0, P / 2, true);
        break;
      case "back":
        void c.rotateTo(P, P / 2, true);
        break;
      case "left":
        void c.rotateTo(P / 2, P / 2, true);
        break;
      case "right":
        void c.rotateTo(-P / 2, P / 2, true);
        break;
      case "top":
        void c.rotateTo(c.azimuthAngle, 0.08, true);
        break;
      case "reset":
        void c.setLookAt(HOME.pos.x, HOME.pos.y * heightScale, HOME.pos.z, HOME.target.x, HOME.target.y * heightScale, HOME.target.z, true);
        break;
    }
  }, [view, heightScale]);

  useFrame((_, dt) => {
    const c = ref.current;
    if (!c) return;
    const k = keys.current;
    if (k.size) {
      const fast = k.has("shift") ? 2.4 : 1;
      const d = dt * 0.9 * fast;
      const r = dt * 1.4 * fast;
      if (k.has("w")) void c.forward(d, false);
      if (k.has("s")) void c.forward(-d, false);
      if (k.has("a")) void c.truck(-d, 0, false);
      if (k.has("d")) void c.truck(d, 0, false);
      if (k.has("e")) void c.truck(0, -d, false);
      if (k.has("q")) void c.truck(0, d, false);
      if (k.has("arrowleft")) void c.rotate(r, 0, false);
      if (k.has("arrowright")) void c.rotate(-r, 0, false);
      if (k.has("arrowup")) void c.rotate(0, r, false);
      if (k.has("arrowdown")) void c.rotate(0, -r, false);
    } else if (autoRotate && !dragging.current) {
      void c.rotate(dt * 0.12, 0, false);
    }
  });

  return (
    <CameraControls
      ref={ref}
      makeDefault
      minDistance={0.08}
      maxDistance={7}
      smoothTime={0.32}
      draggingSmoothTime={0.08}
      dollyToCursor
      dollySpeed={0.7}
      truckSpeed={1.6}
      azimuthRotateSpeed={0.85}
      polarRotateSpeed={0.85}
      onStart={() => {
        dragging.current = true;
        onUserInteract();
      }}
      onEnd={() => {
        dragging.current = false;
      }}
    />
  );
}

/* ------------------------------------------------------------------ */
/* DOM HUD: projected markers, leader-line callout, hover label        */
/* ------------------------------------------------------------------ */
interface HudRefs {
  markers: Partial<Record<OrganId, HTMLDivElement | null>>;
  leader: SVGPolylineElement | null;
  leaderDot: SVGCircleElement | null;
  callout: HTMLDivElement | null;
  azimuth: HTMLSpanElement | null;
  elevation: HTMLSpanElement | null;
  distance: HTMLSpanElement | null;
}

function Projector({ hud, heightScale, selected }: { hud: React.RefObject<HudRefs>; heightScale: number; selected: OrganId }) {
  const v = React.useMemo(() => new THREE.Vector3(), []);
  const t = React.useMemo(() => new THREE.Vector3(), []);
  const controls = useThree((s) => s.controls) as unknown as CameraControlsImpl | null;

  useFrame(({ camera, size }) => {
    const h = hud.current;
    // camera-controls moves the camera after the last render; refresh before projecting
    camera.updateMatrixWorld();
    let selX = -999;
    let selY = -999;
    for (const o of ORGANS) {
      const el = h.markers[o.id];
      if (!el && o.id !== selected) continue;
      v.set(o.anchor[0], o.anchor[1], o.anchor[2]).multiplyScalar(heightScale).project(camera);
      const x = (v.x * 0.5 + 0.5) * size.width;
      const y = (-v.y * 0.5 + 0.5) * size.height;
      if (o.id === selected && v.z < 1) {
        selX = x;
        selY = y;
      }
      if (!el) continue;
      el.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`;
      el.style.opacity = v.z > 1 || Math.abs(v.x) > 1.1 || Math.abs(v.y) > 1.1 ? "0" : "1";
    }
    if (h.callout && h.leader && h.leaderDot) {
      const show = selX > -999;
      h.leader.style.opacity = show ? "1" : "0";
      h.leaderDot.style.opacity = show ? "1" : "0";
      if (show) {
        const bx = h.callout.offsetLeft;
        const by = h.callout.offsetTop + 18;
        const left = selX < bx;
        const ex = left ? bx - 1 : bx + h.callout.offsetWidth + 1;
        const elbowX = left ? Math.min(selX + 40, ex - 24) : Math.max(selX - 40, ex + 24);
        h.leader.setAttribute("points", `${selX},${selY} ${elbowX},${by} ${ex},${by}`);
        h.leaderDot.setAttribute("cx", String(selX));
        h.leaderDot.setAttribute("cy", String(selY));
      }
    }
    if (controls && h.azimuth && h.elevation && h.distance) {
      const az = ((THREE.MathUtils.radToDeg(controls.azimuthAngle) % 360) + 360) % 360;
      h.azimuth.textContent = `${az.toFixed(1).padStart(5, "0")}°`;
      h.elevation.textContent = `${(90 - THREE.MathUtils.radToDeg(controls.polarAngle)).toFixed(1)}°`;
      controls.getTarget(t);
      h.distance.textContent = `${camera.position.distanceTo(t).toFixed(2)} m`;
    }
  });
  return null;
}

function Hud({
  statuses,
  assessment,
  selected,
  onSelect,
  hud,
}: {
  statuses: TwinStatuses;
  assessment: OrganAssessment | undefined;
  selected: OrganId;
  onSelect: (id: OrganId) => void;
  hud: React.RefObject<HudRefs>;
}) {
  const organ = ORGAN_BY_ID[selected];
  const status = assessment?.status ?? statuses[selected] ?? "NOMINAL";
  const meta = STATUS_META[status];
  const SIcon = meta.icon;
  const accent = status === "NOMINAL" ? "var(--primary)" : meta.cssVar;
  // Markers only where they carry meaning: the selection and flagged findings.
  const marked = ORGANS.filter((o) => o.id === selected || (statuses[o.id] ?? "NOMINAL") !== "NOMINAL");

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <svg className="absolute inset-0 size-full overflow-visible">
        <polyline
          ref={(el) => {
            hud.current.leader = el;
          }}
          fill="none"
          stroke={accent}
          strokeWidth="1"
          strokeOpacity="0.85"
        />
        <circle
          ref={(el) => {
            hud.current.leaderDot = el;
          }}
          r="3"
          fill={accent}
        />
      </svg>

      {marked.map((o) => {
        const status = statuses[o.id] ?? "NOMINAL";
        const isSel = o.id === selected;
        const color = isSel ? accent : STATUS_META[status].cssVar;
        return (
          <div
            key={o.id}
            ref={(el) => {
              hud.current.markers[o.id] = el;
            }}
            className="absolute top-0 left-0 transition-opacity duration-300 will-change-transform"
            style={{ transform: "translate3d(-100px,-100px,0)" }}
          >
            <button
              type="button"
              onClick={() => onSelect(o.id)}
              aria-label={`${o.name} · ${STATUS_META[status].label}`}
              aria-pressed={isSel}
              className="group pointer-events-auto relative grid size-7 place-items-center rounded-full outline-none cursor-pointer focus-visible:ring-2 focus-visible:ring-ring"
            >
              <svg viewBox="0 0 20 20" className="size-5 transition-transform duration-200 group-hover:scale-125" aria-hidden>
                <circle
                  cx="10"
                  cy="10"
                  r="7.5"
                  fill="none"
                  stroke={color}
                  strokeWidth="1.2"
                  strokeDasharray={isSel ? "3 2.2" : undefined}
                  style={isSel ? { transformOrigin: "center", animation: "spin 6s linear infinite" } : undefined}
                />
                <circle cx="10" cy="10" r="2.2" fill={color} />
              </svg>
              {!isSel && (
                <span className="pointer-events-none absolute top-1/2 left-7 -translate-y-1/2 whitespace-nowrap rounded border border-white/10 bg-black/70 px-1.5 py-0.5 font-mono text-[10.5px] text-foreground opacity-0 backdrop-blur transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                  {o.name}
                </span>
              )}
            </button>
          </div>
        );
      })}

      <div
        ref={(el) => {
          hud.current.callout = el;
        }}
        className="absolute top-[15%] right-5 hidden w-56 rounded-md border bg-black/55 p-3 backdrop-blur-md sm:block"
        style={{ borderColor: `color-mix(in oklab, ${accent} 45%, transparent)` }}
      >
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono text-[10px] tracking-[0.14em] text-muted-foreground uppercase">{organ.system}</span>
          <SIcon className="size-3.5" style={{ color: status === "NOMINAL" ? "var(--nominal)" : accent }} aria-label={meta.label} />
        </div>
        <p className="mt-1 text-[13.5px] leading-tight font-semibold">{organ.name}</p>
        <div className="mt-2.5 grid grid-cols-2 gap-x-3 gap-y-1.5 border-t border-white/10 pt-2.5">
          {(assessment?.metrics ?? []).slice(0, 2).map((m) => (
            <div key={m.label}>
              <p className="text-[10.5px] text-muted-foreground">{m.label}</p>
              <p className="font-mono text-[14px] leading-tight tabular">
                {m.value}
                {m.unit && <span className="ml-0.5 text-[10px] text-muted-foreground">{m.unit}</span>}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="absolute right-5 bottom-14 hidden text-right font-mono text-[10.5px] leading-relaxed text-muted-foreground sm:block">
        {(
          [
            ["AZ", "azimuth"],
            ["EL", "elevation"],
            ["DIST", "distance"],
          ] as const
        ).map(([label, key]) => (
          <p key={key}>
            {label}{" "}
            <span
              ref={(el) => {
                hud.current[key] = el;
              }}
              className="text-foreground tabular"
            />
          </p>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Scene                                                               */
/* ------------------------------------------------------------------ */
export interface TwinSubject {
  heightCm: number;
  heartRate: number;
  respiratoryRate: number;
}
export type TwinStatuses = Partial<Record<OrganId, HealthStatus>>;

/** Pure 3D view: everything it renders arrives through props; it never fetches or owns clinical state. */
export interface BodySceneProps {
  model: AnatomyModel;
  subject: TwinSubject;
  statuses: TwinStatuses;
  /** Assessment of the selected structure (HUD callout metrics). */
  assessment: OrganAssessment | undefined;
  activeZone: BodyZone | null;
  selected: OrganId;
  onSelect: (id: OrganId) => void;
  autoRotate: boolean;
  focused: boolean;
  layers: Layers;
  view: { preset: ViewPreset; n: number };
  onUserInteract: () => void;
}

function Anatomy(
  props: BodySceneProps & {
    clock: React.RefObject<Clock>;
    onHover: (id: OrganId | null, e?: ThreeEvent<PointerEvent>) => void;
  }
) {
  const parts = props.model;
  return (
    <>
      <Skin part={parts.skin} clock={props.clock} visible={props.layers.skin} focused={props.focused || props.activeZone !== null} />
      <Structures
        parts={parts}
        subject={props.subject}
        statuses={props.statuses}
        selected={props.selected}
        focused={props.focused}
        activeZone={props.activeZone}
        layers={props.layers}
        clock={props.clock}
        onSelect={props.onSelect}
        onHover={props.onHover}
      />
    </>
  );
}

function SceneContent(
  props: BodySceneProps & {
    hud: React.RefObject<HudRefs>;
    keys: React.RefObject<Set<string>>;
    onHover: (id: OrganId | null, e?: ThreeEvent<PointerEvent>) => void;
  }
) {
  const heightScale = props.subject.heightCm / 175;
  const clock = useSceneClock(heightScale);
  return (
    <>
      <color attach="background" args={[C.bg]} />
      <group scale={heightScale}>
        <Anatomy {...props} clock={clock} />
      </group>
      <ScanPlane clock={clock} />
      <Platform heightScale={heightScale} focused={props.focused} />
      <CameraRig
        selected={props.selected}
        focused={props.focused}
        heightScale={heightScale}
        autoRotate={props.autoRotate}
        view={props.view}
        keys={props.keys}
        onUserInteract={props.onUserInteract}
      />
      <Projector hud={props.hud} heightScale={heightScale} selected={props.selected} />
      <EffectComposer multisampling={4}>
        <Bloom mipmapBlur intensity={0.6} luminanceThreshold={0.55} luminanceSmoothing={0.25} radius={0.65} />
        <Vignette offset={0.3} darkness={0.7} />
      </EffectComposer>
    </>
  );
}

const KEYS = new Set(["w", "a", "s", "d", "q", "e", "shift", "arrowleft", "arrowright", "arrowup", "arrowdown"]);

export default function BodyScene(props: BodySceneProps) {
  const hud = React.useRef<HudRefs>({ markers: {}, leader: null, leaderDot: null, callout: null, azimuth: null, elevation: null, distance: null });
  const keys = React.useRef<Set<string>>(new Set());
  const container = React.useRef<HTMLDivElement>(null);
  const label = React.useRef<HTMLDivElement>(null);
  // Adaptive resolution: drop pixel ratio on weaker GPUs, raise it back when there is headroom.
  const [dpr, setDpr] = React.useState(1.5);
  const { onUserInteract } = props;

  const onHover = React.useCallback((id: OrganId | null, e?: ThreeEvent<PointerEvent>) => {
    const el = label.current;
    const box = container.current?.getBoundingClientRect();
    if (!el) return;
    if (!id || !e || !box) {
      el.style.opacity = "0";
      return;
    }
    el.textContent = ORGAN_BY_ID[id].name;
    el.style.opacity = "1";
    el.style.transform = `translate3d(${e.nativeEvent.clientX - box.left + 14}px, ${e.nativeEvent.clientY - box.top + 14}px, 0)`;
  }, []);

  return (
    <div
      ref={container}
      className="relative size-full outline-none"
      tabIndex={0}
      aria-label="Gemelo digital 3D. Arrastrar para rotar, botón derecho para desplazar, rueda para acercar, WASD/QE para moverse."
      onPointerDown={() => container.current?.focus({ preventScroll: true })}
      onKeyDown={(e) => {
        const k = e.key.toLowerCase();
        if (!KEYS.has(k)) return;
        e.preventDefault();
        if (!keys.current.has(k)) {
          keys.current.add(k);
          onUserInteract();
        }
      }}
      onKeyUp={(e) => keys.current.delete(e.key.toLowerCase())}
      onBlur={() => keys.current.clear()}
      onContextMenu={(e) => e.preventDefault()}
    >
      <Canvas
        camera={{ position: [1.4, 1.9, 6.2], fov: 32, near: 0.01, far: 40 }}
        dpr={dpr}
        gl={{ antialias: false, powerPreference: "high-performance", stencil: false }}
        onPointerMissed={() => {
          document.body.style.cursor = "";
          onHover(null);
        }}
      >
        <PerformanceMonitor
          bounds={() => [45, 58]}
          flipflops={4}
          onIncline={() => setDpr((d) => Math.min(d + 0.25, 2))}
          onDecline={() => setDpr((d) => Math.max(d - 0.25, 0.75))}
        />
        <SceneContent {...props} hud={hud} keys={keys} onHover={onHover} />
      </Canvas>
      <Hud statuses={props.statuses} assessment={props.assessment} selected={props.selected} onSelect={props.onSelect} hud={hud} />
      <div
        ref={label}
        className="pointer-events-none absolute top-0 left-0 z-10 rounded border border-white/10 bg-black/75 px-2 py-1 font-mono text-[11px] text-foreground opacity-0 backdrop-blur transition-opacity duration-150"
      />
    </div>
  );
}
