import * as THREE from "three";

const common = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vView;
  varying vec3 vWorld;
`;

const vertex = /* glsl */ `
  ${common}
  void main() {
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vWorld = wp.xyz;
    vNormal = normalize(mat3(modelMatrix) * normal);
    vView = normalize(cameraPosition - wp.xyz);
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;

/** Body shell: fresnel rim + CT-style slice contours + scan band + reveal. */
const shellFragment = /* glsl */ `
  ${common}
  uniform vec3 uColor;
  uniform float uScan;
  uniform float uReveal;
  uniform float uOpacity;
  void main() {
    if (vWorld.y > uReveal) discard;
    vec3 n = normalize(vNormal);
    float facing = abs(dot(n, normalize(vView)));
    float fres = pow(1.0 - facing, 3.0);

    float f = vWorld.y * 100.0;                 // 1 cm slices
    float minor = 1.0 - min(abs(fract(f - 0.5) - 0.5) / fwidth(f), 1.0);
    float F = vWorld.y * 10.0;                  // 10 cm slices
    float major = 1.0 - min(abs(fract(F - 0.5) - 0.5) / fwidth(F), 1.0);

    float scan = exp(-pow((vWorld.y - uScan) * 45.0, 2.0));
    float edge = smoothstep(0.03, 0.0, uReveal - vWorld.y);

    float a = fres * 0.62 + minor * 0.025 + major * 0.08 * (0.3 + fres) + scan * 0.18 + edge * 0.5;
    vec3 col = uColor * (0.45 + fres * 0.8) + vec3(0.75, 0.85, 1.0) * (scan * 0.35 + edge);
    gl_FragColor = vec4(col, a * uOpacity);
  }
`;

/** X-ray material for organs, bones and vessels. */
const xrayFragment = /* glsl */ `
  ${common}
  uniform vec3 uColor;
  uniform float uIntensity;
  uniform float uFill;
  uniform float uScan;
  uniform float uReveal;
  void main() {
    if (vWorld.y > uReveal) discard;
    vec3 n = normalize(vNormal);
    float facing = abs(dot(n, normalize(vView)));
    float fres = pow(1.0 - facing, 2.2);
    float scan = exp(-pow((vWorld.y - uScan) * 45.0, 2.0));
    float light = 0.5 + 0.5 * dot(n, normalize(vec3(0.3, 0.8, 0.5)));
    vec3 col = uColor * (uFill * light + fres * 1.3) * uIntensity + uColor * scan * 0.5;
    float a = (uFill * 0.55 + fres * 0.9) * uIntensity + scan * 0.2;
    gl_FragColor = vec4(col, clamp(a, 0.0, 1.0));
  }
`;

export function makeShellMaterial(color: THREE.Color) {
  return new THREE.ShaderMaterial({
    uniforms: { uColor: { value: color }, uScan: { value: -1 }, uReveal: { value: 0 }, uOpacity: { value: 1 } },
    vertexShader: vertex,
    fragmentShader: shellFragment,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
  });
}

export function makeXrayMaterial(color: THREE.Color, fill = 0.25, intensity = 1) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: color.clone() },
      uIntensity: { value: intensity },
      uFill: { value: fill },
      uScan: { value: -1 },
      uReveal: { value: 0 },
    },
    vertexShader: vertex,
    fragmentShader: xrayFragment,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
  });
}

/** Surface point cloud ("LiDAR" sampling of the body). */
export function makePointsMaterial(color: THREE.Color, pixelRatio: number) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: color },
      uTime: { value: 0 },
      uScan: { value: -1 },
      uReveal: { value: 0 },
      uSize: { value: 1.8 },
      uPixelRatio: { value: pixelRatio },
    },
    vertexShader: /* glsl */ `
      attribute float aRand;
      uniform float uTime;
      uniform float uScan;
      uniform float uReveal;
      uniform float uSize;
      uniform float uPixelRatio;
      varying float vAlpha;
      void main() {
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vec4 mv = viewMatrix * wp;
        gl_Position = projectionMatrix * mv;
        float scan = exp(-pow((wp.y - uScan) * 30.0, 2.0));
        float twinkle = 0.55 + 0.45 * sin(uTime * 1.6 + aRand * 60.0);
        vAlpha = (0.16 * twinkle + scan * 0.45) * step(wp.y, uReveal);
        gl_PointSize = uSize * uPixelRatio * (1.0 + scan * 0.6) * (2.6 / -mv.z);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      varying float vAlpha;
      void main() {
        float d = length(gl_PointCoord - 0.5);
        if (d > 0.5) discard;
        gl_FragColor = vec4(uColor, vAlpha * smoothstep(0.5, 0.0, d));
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
}

/** Polar measurement grid for the floor. */
export function makeFloorMaterial(color: THREE.Color) {
  return new THREE.ShaderMaterial({
    uniforms: { uColor: { value: color }, uTime: { value: 0 } },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() { vUv = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      uniform float uTime;
      varying vec2 vUv;
      float line(float v, float w) { return 1.0 - min(abs(fract(v - 0.5) - 0.5) / (fwidth(v) * w), 1.0); }
      void main() {
        float r = length(vUv);
        float a = atan(vUv.y, vUv.x);
        float rings = line(r * 10.0, 1.0) * 0.35 + line(r * 2.0, 1.4) * 0.5;
        float spokes = line(a / 6.28318 * 24.0, 1.0) * 0.25 * smoothstep(0.12, 0.3, r);
        float sweep = pow(max(0.0, cos(a - uTime * 0.6)), 24.0) * smoothstep(1.4, 0.2, r) * 0.35;
        float fade = smoothstep(1.6, 0.25, r);
        float glow = smoothstep(0.55, 0.0, r) * 0.08;
        float alpha = (rings + spokes + sweep) * fade + glow;
        gl_FragColor = vec4(uColor, alpha * 0.55);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
}
