import * as THREE from 'three';

let inkTexture = null;

function generateInkTexture() {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, size, size);

  ctx.globalCompositeOperation = 'multiply';

  // Scratches: many thin lines at various angles
  for (let i = 0; i < 120; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const len = 20 + Math.random() * 80;
    const angle = Math.random() * Math.PI;
    const weight = 0.5 + Math.random() * 1.5;

    ctx.strokeStyle = `rgba(0,0,0,${0.05 + Math.random() * 0.15})`;
    ctx.lineWidth = weight;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(angle) * len, y + Math.sin(angle) * len);
    ctx.stroke();
  }

  // Longer drag marks
  for (let i = 0; i < 30; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const len = 60 + Math.random() * 200;
    const angle = -0.3 + Math.random() * 0.6;

    ctx.strokeStyle = `rgba(0,0,0,${0.03 + Math.random() * 0.08})`;
    ctx.lineWidth = 0.5 + Math.random() * 1;
    ctx.beginPath();
    ctx.moveTo(x, y);

    let cx = x, cy = y;
    for (let j = 0; j < 8; j++) {
      cx += Math.cos(angle + (Math.random() - 0.5) * 0.3) * (len / 8);
      cy += Math.sin(angle + (Math.random() - 0.5) * 0.3) * (len / 8);
      ctx.lineTo(cx, cy);
    }
    ctx.stroke();
  }

  ctx.globalCompositeOperation = 'screen';

  // Lighter scratch highlights
  for (let i = 0; i < 40; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const len = 30 + Math.random() * 60;
    const angle = Math.random() * Math.PI;

    ctx.strokeStyle = `rgba(255,255,255,${0.03 + Math.random() * 0.08})`;
    ctx.lineWidth = 0.5 + Math.random();
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(angle) * len, y + Math.sin(angle) * len);
    ctx.stroke();
  }

  // Dirt spots
  ctx.globalCompositeOperation = 'multiply';
  for (let i = 0; i < 50; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const r = 2 + Math.random() * 8;
    ctx.fillStyle = `rgba(0,0,0,${0.02 + Math.random() * 0.06})`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

const vertexShader = `
varying vec3 vNormal;
varying vec3 vViewDir;
varying vec3 vWorldPos;
varying vec3 vLocalPos;

void main() {
  vNormal = normalize(normalMatrix * normal);
  vLocalPos = position;
  vec4 worldPos = modelMatrix * vec4(position, 1.0);
  vWorldPos = worldPos.xyz;
  vViewDir = normalize(cameraPosition - worldPos.xyz);
  gl_Position = projectionMatrix * viewMatrix * worldPos;
}
`;

const fragmentShader = `
uniform vec3 uColor;
uniform vec3 uLightDir;
uniform sampler2D uInkTex;

varying vec3 vNormal;
varying vec3 vViewDir;
varying vec3 vWorldPos;
varying vec3 vLocalPos;

float crossHatch(vec2 p, float density) {
  float h = 0.0;
  h += step(0.92, fract(p.x * density + p.y * density));
  h += step(0.92, fract(p.x * density - p.y * density + 0.5)) * 0.8;
  h += step(0.94, fract(p.x * density * 0.7 + 0.3)) * 0.5;
  return min(h, 1.0);
}

void main() {
  vec3 normal = normalize(vNormal);
  vec3 lightDir = normalize(uLightDir);
  vec3 viewDir = normalize(vViewDir);

  // Toon lighting: 4 bands with smooth steps
  float NdotL = dot(normal, lightDir);
  float toon = smoothstep(-0.1, 0.0, NdotL) * 0.25 +
               smoothstep(0.15, 0.25, NdotL) * 0.25 +
               smoothstep(0.45, 0.55, NdotL) * 0.25 +
               smoothstep(0.75, 0.85, NdotL) * 0.25;

  vec3 color = uColor * (0.3 + toon * 0.7);

  // Ink/scratch texture overlay (triplanar mapping for seamless coverage)
  float scale = 3.0;
  vec3 blend = abs(normal);
  blend = pow(blend, vec3(4.0));
  blend /= dot(blend, vec3(1.0));

  vec3 inkXY = texture2D(uInkTex, vWorldPos.xy * scale).rgb;
  vec3 inkXZ = texture2D(uInkTex, vWorldPos.xz * scale).rgb;
  vec3 inkYZ = texture2D(uInkTex, vWorldPos.yz * scale).rgb;
  vec3 inkVal = inkXY * blend.z + inkXZ * blend.y + inkYZ * blend.x;

  // Apply scratches: darken and lighten based on ink texture
  float inkMono = (inkVal.r + inkVal.g + inkVal.b) / 3.0;
  color *= 0.6 + inkMono * 0.8;

  // Cross-hatching in shadow areas
  float shadowAmount = 1.0 - smoothstep(0.0, 0.5, toon);
  if (shadowAmount > 0.1) {
    vec2 hatchUV = vWorldPos.xy * 2.0 + vWorldPos.yz;
    float hatch = crossHatch(hatchUV, 20.0);
    color = mix(color, color * 0.35, hatch * shadowAmount * 0.7);
  }

  // Rim darkening
  float rim = 1.0 - max(dot(viewDir, normal), 0.0);
  float rimDark = smoothstep(0.5, 0.8, rim);
  color = mix(color, color * 0.15, rimDark);

  // Specular highlight (toon)
  vec3 halfDir = normalize(lightDir + viewDir);
  float spec = pow(max(dot(normal, halfDir), 0.0), 40.0);
  color += vec3(0.2) * step(0.4, spec);

  // Slight warm tint in shadows
  color = mix(color, color * vec3(1.0, 0.95, 0.85), shadowAmount * 0.3);

  gl_FragColor = vec4(color, 1.0);
}
`;

export function createBorderlandsMaterial(color) {
  if (!inkTexture) {
    inkTexture = generateInkTexture();
  }

  const col = new THREE.Color(color);

  return new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: col },
      uLightDir: { value: new THREE.Vector3(3, 5, 4).normalize() },
      uInkTex: { value: inkTexture },
    },
    vertexShader,
    fragmentShader,
  });
}
