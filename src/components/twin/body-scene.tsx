"use client";

import * as React from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { Bloom, EffectComposer, Vignette } from "@react-three/postprocessing";
import { suspend } from "suspend-react";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { MeshSurfaceSampler } from "three/examples/jsm/math/MeshSurfaceSampler.js";
import { ORGANS, ORGAN_BY_ID } from "@/lib/data/mock";
import type { CrewMember, OrganId, Status } from "@/lib/data/types";
import { STATUS_META } from "@/lib/status";
import { buildOrgans, buildSkeleton, buildVessels } from "./anatomy";
import { makeFloorMaterial, makePointsMaterial, makeShellMaterial, makeXrayMaterial } from "./shaders";

/* WebGL can't read CSS variables, so the palette is mirrored here. */
const C = {
  bg: new THREE.Color("#080b11"),
  shell: new THREE.Color("#7f9cf5"),
  points: new THREE.Color("#b9c9ff"),
  bone: new THREE.Color("#c9d3e6"),
  vessel: new THREE.Color("#6f86c9"),
  organ: new THREE.Color("#9aa9c4"),
  selected: new THREE.Color("#86a6ff"),
  status: {
    nominal: new THREE.Color("#4fbf8b"),
    caution: new THREE.Color("#f0b54a"),
    critical: new THREE.Color("#ff5d6c"),
  } as Record<Status, THREE.Color>,
};

const REVEAL_TIME = 2.6;
const TOP = 1.8;

/* ------------------------------------------------------------------ */
/* Baked body mesh                                                     */
/* ------------------------------------------------------------------ */
async function loadBody(): Promise<THREE.BufferGeometry> {
  const buf = await fetch("/models/body.bin").then((r) => r.arrayBuffer());
  const view = new DataView(buf);
  const hl = view.getUint32(0, true);
  const header: { name: string; verts: number; indices: number }[] = JSON.parse(new TextDecoder().decode(new Uint8Array(buf, 4, hl)).trim());
  let off = 4 + hl;
  const parts = header.map((h) => {
    const pos = new Float32Array(buf.slice(off, off + h.verts * 12));
    off += h.verts * 12;
    const idx = new Uint32Array(buf.slice(off, off + h.indices * 4));
    off += h.indices * 4;
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setIndex(new THREE.BufferAttribute(idx, 1));
    g.computeVertexNormals();
    return { name: h.name, g };
  });
  // Skin only: the rig's inner "joint" mesh reads as mechanical spheres.
  return (parts.find((p) => p.name === "body") ?? parts[0]).g;
}

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
    const eased = 1 - Math.pow(1 - k, 3);
    clock.current.time = c.elapsedTime;
    clock.current.reveal = k < 1 ? eased * TOP * heightScale : 99;
    const cycle = (((t - REVEAL_TIME) * 0.16) % 1 + 1) % 1;
    clock.current.scan = k < 1 ? clock.current.reveal : (cycle * 1.25 - 0.1) * TOP * heightScale;
  });
  return clock;
}

function useUniformSync(materials: THREE.ShaderMaterial[], clock: React.RefObject<Clock>) {
  useFrame(() => {
    for (const m of materials) {
      if (m.uniforms.uReveal) m.uniforms.uReveal.value = clock.current.reveal;
      if (m.uniforms.uScan) m.uniforms.uScan.value = clock.current.scan;
      if (m.uniforms.uTime) m.uniforms.uTime.value = clock.current.time;
    }
  });
}

/* ------------------------------------------------------------------ */
/* Body: shell + point cloud + skeleton + vessels                      */
/* ------------------------------------------------------------------ */
function Body({ clock, focused }: { clock: React.RefObject<Clock>; focused: boolean }) {
  const geometry = suspend(loadBody, ["astrovital-body"]);
  const dpr = useThree((s) => s.viewport.dpr);

  const shell = React.useMemo(() => makeShellMaterial(C.shell), []);
  const bones = React.useMemo(() => makeXrayMaterial(C.bone, 0.1, 0.55), []);
  const vessels = React.useMemo(() => makeXrayMaterial(C.vessel, 0.2, 0.6), []);
  const pointsMat = React.useMemo(() => makePointsMaterial(C.points, dpr), [dpr]);
  const skeleton = React.useMemo(() => buildSkeleton(), []);
  const vesselGeo = React.useMemo(() => buildVessels(), []);

  const cloud = React.useMemo(() => {
    const sampler = new MeshSurfaceSampler(new THREE.Mesh(geometry)).build();
    const N = 26000;
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
  }, [geometry]);

  useUniformSync([shell, bones, vessels, pointsMat], clock);
  useFrame(() => {
    const k = 0.06;
    shell.uniforms.uOpacity.value = THREE.MathUtils.lerp(shell.uniforms.uOpacity.value, focused ? 0.55 : 1, k);
    bones.uniforms.uIntensity.value = THREE.MathUtils.lerp(bones.uniforms.uIntensity.value, focused ? 0.32 : 0.55, k);
    vessels.uniforms.uIntensity.value = THREE.MathUtils.lerp(vessels.uniforms.uIntensity.value, focused ? 0.3 : 0.6, k);
  });

  return (
    <group>
      <mesh geometry={geometry} material={shell} renderOrder={1} raycast={() => null} />
      <points geometry={cloud} material={pointsMat} renderOrder={2} raycast={() => null} />
      <mesh geometry={skeleton} material={bones} raycast={() => null} />
      <mesh geometry={vesselGeo} material={vessels} raycast={() => null} />
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Organs                                                              */
/* ------------------------------------------------------------------ */
function Organs({
  crew,
  selected,
  onSelect,
  clock,
  focused,
}: {
  crew: CrewMember;
  selected: OrganId;
  onSelect: (id: OrganId) => void;
  clock: React.RefObject<Clock>;
  focused: boolean;
}) {
  const [hovered, setHovered] = React.useState<OrganId | null>(null);

  const organs = React.useMemo(() => {
    const geos = buildOrgans();
    return ORGANS.map((o) => {
      const g = geos[o.id];
      g.computeBoundingSphere();
      const center = g.boundingSphere!.center.clone();
      g.translate(-center.x, -center.y, -center.z);
      return { id: o.id, geometry: g, center, material: makeXrayMaterial(C.organ, 0.3, 0.8) };
    });
  }, []);

  const refs = React.useRef<Partial<Record<OrganId, THREE.Mesh | null>>>({});
  useUniformSync(
    organs.map((o) => o.material),
    clock
  );

  useFrame(({ clock: c }) => {
    const t = c.elapsedTime;
    for (const o of organs) {
      const status = crew.assessments[o.id]?.status ?? "nominal";
      const isSel = o.id === selected;
      const target = isSel ? (status === "nominal" ? C.selected : C.status[status]) : status === "nominal" ? C.organ : C.status[status];
      const u = o.material.uniforms;
      (u.uColor.value as THREE.Color).lerp(target, 0.1);
      const dim = focused && !isSel ? 0.5 : 1;
      const base = (isSel ? 1.55 + Math.sin(t * 3) * 0.2 : status !== "nominal" ? 1.05 : 0.62) * dim;
      u.uIntensity.value = THREE.MathUtils.lerp(u.uIntensity.value, hovered === o.id ? base + 0.45 : base, 0.12);
      u.uFill.value = THREE.MathUtils.lerp(u.uFill.value, isSel ? 0.45 : 0.28, 0.1);

      const mesh = refs.current[o.id];
      if (!mesh) continue;
      if (o.id === "heart") {
        const beat = Math.pow(Math.max(0, Math.sin(t * (crew.vitals.heartRate / 60) * Math.PI * 2)), 12);
        mesh.scale.setScalar(1 + beat * 0.09);
      } else if (o.id === "lungs") {
        mesh.scale.setScalar(1 + Math.sin(t * (crew.vitals.respRate / 60) * Math.PI * 2) * 0.025);
      }
    }
  });

  return (
    <group>
      {organs.map((o) => (
        <mesh
          key={o.id}
          ref={(m) => {
            refs.current[o.id] = m;
          }}
          geometry={o.geometry}
          material={o.material}
          position={o.center}
          renderOrder={3}
          onClick={(e: ThreeEvent<MouseEvent>) => {
            e.stopPropagation();
            onSelect(o.id);
          }}
          onPointerOver={(e: ThreeEvent<PointerEvent>) => {
            e.stopPropagation();
            setHovered(o.id);
            document.body.style.cursor = "pointer";
          }}
          onPointerOut={() => {
            setHovered(null);
            document.body.style.cursor = "";
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
  const rulerMat = React.useMemo(() => new THREE.LineBasicMaterial({ color: C.shell, transparent: true, opacity: 0.35 }), []);
  const floor = React.useMemo(() => makeFloorMaterial(C.shell), []);
  const ring = React.useRef<THREE.Group>(null);
  useFrame(({ clock }, dt) => {
    floor.uniforms.uTime.value = clock.elapsedTime;
    if (ring.current) ring.current.rotation.z += dt * 0.05;
    rulerMat.opacity = THREE.MathUtils.lerp(rulerMat.opacity, focused ? 0 : 0.35, 0.08);
  });

  const ruler = React.useMemo(() => {
    const pts: number[] = [];
    const x = -0.52;
    const h = TOP * heightScale;
    pts.push(x, 0, 0, x, h, 0);
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
        <ringGeometry args={[0.3, 0.302, 128]} />
        <meshBasicMaterial color={C.points} transparent opacity={0.4} depthWrite={false} blending={THREE.AdditiveBlending} side={THREE.DoubleSide} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} raycast={() => null}>
        <ringGeometry args={[0.22, 0.3, 64]} />
        <meshBasicMaterial color={C.shell} transparent opacity={0.02} depthWrite={false} blending={THREE.AdditiveBlending} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Camera rig: intro dolly + fly-to on selection                      */
/* ------------------------------------------------------------------ */
function CameraRig({
  selected,
  focused,
  heightScale,
  autoRotate,
}: {
  selected: OrganId;
  focused: boolean;
  heightScale: number;
  autoRotate: boolean;
}) {
  const controls = React.useRef<OrbitControlsImpl>(null);
  const camera = useThree((s) => s.camera);
  const fly = React.useRef({ t: 3, target: new THREE.Vector3(0, 0.9, 0), dist: 3.25 });
  const tmp = React.useMemo(() => new THREE.Vector3(), []);

  React.useEffect(() => {
    const f = fly.current;
    f.t = Math.max(f.t, 1.8);
    if (focused) {
      const a = ORGAN_BY_ID[selected].anchor;
      f.target.set(a[0], a[1], a[2]).multiplyScalar(heightScale);
      f.dist = selected === "femur" ? 1.7 : selected === "intestine" || selected === "lungs" ? 1.35 : 1.15;
    } else {
      f.target.set(0, 0.9 * heightScale, 0);
      f.dist = 3.25;
    }
  }, [selected, focused, heightScale]);

  useFrame((_, dt) => {
    const f = fly.current;
    const c = controls.current;
    if (!c || f.t <= 0) return;
    f.t -= dt;
    const k = 1 - Math.pow(0.04, dt);
    c.target.lerp(f.target, k);
    tmp.copy(camera.position).sub(c.target);
    tmp.setLength(THREE.MathUtils.lerp(tmp.length(), f.dist, k));
    camera.position.copy(c.target).add(tmp);
  });

  return (
    <OrbitControls
      ref={controls}
      makeDefault
      enablePan={false}
      enableDamping
      dampingFactor={0.07}
      rotateSpeed={0.6}
      minDistance={0.8}
      maxDistance={5}
      minPolarAngle={Math.PI * 0.2}
      maxPolarAngle={Math.PI * 0.6}
      autoRotate={autoRotate}
      autoRotateSpeed={0.45}
      target={[0, 0.9, 0]}
      onStart={() => {
        fly.current.t = 0;
      }}
    />
  );
}

/* ------------------------------------------------------------------ */
/* DOM HUD: projected markers + leader-line callout                    */
/* ------------------------------------------------------------------ */
interface HudRefs {
  markers: Partial<Record<OrganId, HTMLDivElement | null>>;
  leader: SVGPolylineElement | null;
  leaderDot: SVGCircleElement | null;
  callout: HTMLDivElement | null;
  azimuth: HTMLSpanElement | null;
  elevation: HTMLSpanElement | null;
}

function Projector({ hud, heightScale, selected }: { hud: React.RefObject<HudRefs>; heightScale: number; selected: OrganId }) {
  const v = React.useMemo(() => new THREE.Vector3(), []);
  const axis = React.useMemo(() => new THREE.Vector3(), []);
  const controls = useThree((s) => s.controls) as OrbitControlsImpl | null;

  useFrame(({ camera, size }) => {
    const h = hud.current;
    let selX = 0;
    let selY = 0;
    for (const o of ORGANS) {
      v.set(o.anchor[0], o.anchor[1], o.anchor[2]).multiplyScalar(heightScale);
      axis.set(0, v.y, 0);
      const behind = camera.position.distanceTo(v) > camera.position.distanceTo(axis) + 0.02;
      v.project(camera);
      const x = (v.x * 0.5 + 0.5) * size.width;
      const y = (-v.y * 0.5 + 0.5) * size.height;
      if (o.id === selected) {
        selX = x;
        selY = y;
      }
      const el = h.markers[o.id];
      if (!el) continue;
      el.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`;
      el.style.opacity = v.z > 1 ? "0" : behind ? "0.25" : "1";
    }
    if (h.callout && h.leader && h.leaderDot) {
      const bx = h.callout.offsetLeft;
      const by = h.callout.offsetTop + 18;
      const left = selX < bx;
      const ex = left ? bx - 1 : bx + h.callout.offsetWidth + 1;
      const elbowX = left ? Math.min(selX + 40, ex - 24) : Math.max(selX - 40, ex + 24);
      h.leader.setAttribute("points", `${selX},${selY} ${elbowX},${by} ${ex},${by}`);
      h.leaderDot.setAttribute("cx", String(selX));
      h.leaderDot.setAttribute("cy", String(selY));
    }
    if (controls && h.azimuth && h.elevation) {
      h.azimuth.textContent = `${((THREE.MathUtils.radToDeg(controls.getAzimuthalAngle()) + 360) % 360).toFixed(1).padStart(5, "0")}°`;
      h.elevation.textContent = `${(90 - THREE.MathUtils.radToDeg(controls.getPolarAngle())).toFixed(1)}°`;
    }
  });
  return null;
}

function Hud({
  crew,
  selected,
  onSelect,
  hud,
}: {
  crew: CrewMember;
  selected: OrganId;
  onSelect: (id: OrganId) => void;
  hud: React.RefObject<HudRefs>;
}) {
  const organ = ORGAN_BY_ID[selected];
  const a = crew.assessments[selected]!;
  const meta = STATUS_META[a.status];
  const SIcon = meta.icon;
  const accent = a.status === "nominal" ? "var(--primary)" : `var(--${a.status})`;

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
          strokeOpacity="0.8"
        />
        <circle
          ref={(el) => {
            hud.current.leaderDot = el;
          }}
          r="3"
          fill={accent}
        />
      </svg>

      {ORGANS.map((o) => {
        const status = crew.assessments[o.id]?.status ?? "nominal";
        const isSel = o.id === selected;
        const color = isSel ? accent : status === "nominal" ? "rgba(214,224,245,0.7)" : `var(--${status})`;
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
                {isSel ? (
                  <>
                    <circle
                      cx="10"
                      cy="10"
                      r="7.5"
                      fill="none"
                      stroke={color}
                      strokeWidth="1.2"
                      strokeDasharray="3 2.2"
                      style={{ transformOrigin: "center", animation: "spin 6s linear infinite" }}
                    />
                    <circle cx="10" cy="10" r="2.2" fill={color} />
                  </>
                ) : (
                  <>
                    <path d="M10 4v3M10 13v3M4 10h3M13 10h3" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
                    <circle cx="10" cy="10" r={status === "nominal" ? 1.3 : 2.2} fill={color} />
                  </>
                )}
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
        className="absolute top-[16%] right-5 w-56 rounded-md border bg-black/55 p-3 backdrop-blur-md"
        style={{ borderColor: `color-mix(in oklab, ${accent} 45%, transparent)` }}
      >
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono text-[10px] tracking-[0.14em] text-muted-foreground uppercase">{organ.system}</span>
          <SIcon className="size-3.5" style={{ color: a.status === "nominal" ? "var(--nominal)" : accent }} aria-label={meta.label} />
        </div>
        <p className="mt-1 text-[13.5px] leading-tight font-semibold">{organ.name}</p>
        <div className="mt-2.5 grid grid-cols-2 gap-x-3 gap-y-1.5 border-t border-white/10 pt-2.5">
          {a.metrics.slice(0, 2).map((m) => (
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
        <p>
          AZ{" "}
          <span
            ref={(el) => {
              hud.current.azimuth = el;
            }}
            className="text-foreground tabular"
          />
        </p>
        <p>
          EL{" "}
          <span
            ref={(el) => {
              hud.current.elevation = el;
            }}
            className="text-foreground tabular"
          />
        </p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Scene                                                               */
/* ------------------------------------------------------------------ */
export interface BodySceneProps {
  crew: CrewMember;
  selected: OrganId;
  onSelect: (id: OrganId) => void;
  gravity: number;
  autoRotate: boolean;
  focused: boolean;
}

function SceneContent(props: BodySceneProps & { hud: React.RefObject<HudRefs> }) {
  const heightScale = props.crew.heightCm / 175;
  const clock = useSceneClock(heightScale);
  return (
    <>
      <color attach="background" args={[C.bg]} />
      <group scale={heightScale}>
        <React.Suspense fallback={null}>
          <Body clock={clock} focused={props.focused} />
        </React.Suspense>
        <Organs crew={props.crew} selected={props.selected} onSelect={props.onSelect} clock={clock} focused={props.focused} />
      </group>
      <ScanPlane clock={clock} />
      <Platform heightScale={heightScale} focused={props.focused} />
      <CameraRig selected={props.selected} focused={props.focused} heightScale={heightScale} autoRotate={props.autoRotate} />
      <Projector hud={props.hud} heightScale={heightScale} selected={props.selected} />
      <EffectComposer multisampling={4}>
        <Bloom mipmapBlur intensity={0.9} luminanceThreshold={0.32} luminanceSmoothing={0.3} radius={0.72} />
        <Vignette offset={0.28} darkness={0.72} />
        
      </EffectComposer>
    </>
  );
}

export default function BodyScene(props: BodySceneProps) {
  const hud = React.useRef<HudRefs>({ markers: {}, leader: null, leaderDot: null, callout: null, azimuth: null, elevation: null });
  return (
    <div className="relative size-full">
      <Canvas
        camera={{ position: [0.9, 1.9, 6.2], fov: 32, near: 0.03, far: 40 }}
        dpr={[1, 1.75]}
        gl={{ antialias: false, powerPreference: "high-performance", stencil: false }}
        onPointerMissed={() => (document.body.style.cursor = "")}
      >
        <SceneContent {...props} hud={hud} />
      </Canvas>
      <Hud crew={props.crew} selected={props.selected} onSelect={props.onSelect} hud={hud} />
    </div>
  );
}
