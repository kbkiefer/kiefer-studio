import * as THREE from 'three';

export const CRTShaderMaterial = {
  uniforms: {
    uTexture: { value: null },
    uTime: { value: 0 },
    uGlow: { value: new THREE.Color(0x0044ff) },
  },

  vertexShader: `
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vViewDir;

    void main() {
      vUv = uv;
      vNormal = normalize(normalMatrix * normal);
      vec4 worldPos = modelMatrix * vec4(position, 1.0);
      vViewDir = normalize(cameraPosition - worldPos.xyz);
      gl_Position = projectionMatrix * viewMatrix * worldPos;
    }
  `,

  fragmentShader: `
    uniform sampler2D uTexture;
    uniform float uTime;
    uniform vec3 uGlow;

    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vViewDir;

    void main() {
      // Barrel distortion (CRT curve)
      vec2 uv = vUv;
      vec2 center = uv - 0.5;
      float dist = dot(center, center);
      uv = uv + center * dist * 0.15;

      // Check if we're inside the screen after distortion
      if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
        gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
        return;
      }

      // Sample the texture
      vec3 color = texture2D(uTexture, uv).rgb;

      // Scanlines
      float scanline = sin(uv.y * 400.0) * 0.08;
      color -= scanline;

      // Horizontal scanline bands (thicker, slower)
      float band = sin(uv.y * 80.0 + uTime * 2.0) * 0.03;
      color += band;

      // Phosphor dot pattern
      float px = mod(gl_FragCoord.x, 3.0);
      if (px < 1.0) color.gb *= 0.92;
      else if (px < 2.0) color.rb *= 0.92;
      else color.rg *= 0.92;

      // Vignette (darker edges)
      float vig = 1.0 - dist * 2.5;
      vig = clamp(vig, 0.0, 1.0);
      color *= vig;

      // Screen edge glow
      float edge = smoothstep(0.0, 0.08, uv.x) * smoothstep(1.0, 0.92, uv.x) *
                   smoothstep(0.0, 0.08, uv.y) * smoothstep(1.0, 0.92, uv.y);
      float edgeGlow = (1.0 - edge) * 0.4;
      color += uGlow * edgeGlow;

      // Subtle flicker
      float flicker = 1.0 + sin(uTime * 8.0) * 0.01 + sin(uTime * 13.0) * 0.005;
      color *= flicker;

      // Screen reflection/glare (subtle bright spot upper right)
      float glare = smoothstep(0.6, 0.0, length(uv - vec2(0.75, 0.2)));
      color += vec3(0.04) * glare;

      // Slight color fringing at edges
      float fringe = dist * 0.3;
      vec3 fringed;
      fringed.r = texture2D(uTexture, uv + vec2(fringe, 0.0) * 0.02).r;
      fringed.g = color.g;
      fringed.b = texture2D(uTexture, uv - vec2(fringe, 0.0) * 0.02).b;
      color = mix(color, fringed, 0.5);

      // Overall screen brightness boost
      color *= 1.15;

      gl_FragColor = vec4(color, 1.0);
    }
  `,
};

export function createBulgeGeometry(width, height, segments, bulge) {
  const geo = new THREE.PlaneGeometry(width, height, segments, segments);
  const pos = geo.attributes.position;

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const nx = x / (width / 2);
    const ny = y / (height / 2);
    const dist = nx * nx + ny * ny;
    const z = bulge * (1.0 - dist) * 0.5;
    pos.setZ(i, z);
  }

  geo.computeVertexNormals();
  return geo;
}
