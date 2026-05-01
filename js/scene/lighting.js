import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

// Pixelation shader
const PixelShader = {
  uniforms: {
    tDiffuse: { value: null },
    resolution: { value: new THREE.Vector2() },
    pixelSize: { value: 4.0 },
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform vec2 resolution;
    uniform float pixelSize;
    varying vec2 vUv;
    void main() {
      if (pixelSize <= 1.0) {
        gl_FragColor = texture2D(tDiffuse, vUv);
        return;
      }
      vec2 dxy = pixelSize / resolution;
      vec2 coord = dxy * floor(vUv / dxy) + dxy * 0.5;
      gl_FragColor = texture2D(tDiffuse, coord);
    }
  `
};

// Borderlands-style edge detection shader (depth + normal based)
const EdgeDetectShader = {
  uniforms: {
    tDiffuse: { value: null },
    tDepth: { value: null },
    tNormal: { value: null },
    resolution: { value: new THREE.Vector2() },
    edgeColor: { value: new THREE.Color(0x000000) },
    edgeStrength: { value: 1.0 },
    depthThreshold: { value: 0.002 },
    normalThreshold: { value: 0.3 },
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform sampler2D tDepth;
    uniform sampler2D tNormal;
    uniform vec2 resolution;
    uniform vec3 edgeColor;
    uniform float edgeStrength;
    uniform float depthThreshold;
    uniform float normalThreshold;
    varying vec2 vUv;

    float getDepth(vec2 uv) {
      return texture2D(tDepth, uv).r;
    }

    vec3 getNormal(vec2 uv) {
      return texture2D(tNormal, uv).rgb * 2.0 - 1.0;
    }

    float depthEdge(vec2 uv, vec2 texel) {
      float d = getDepth(uv);
      float dU = getDepth(uv + vec2(0.0, texel.y));
      float dD = getDepth(uv - vec2(0.0, texel.y));
      float dL = getDepth(uv - vec2(texel.x, 0.0));
      float dR = getDepth(uv + vec2(texel.x, 0.0));
      float diff = abs(dU - d) + abs(dD - d) + abs(dL - d) + abs(dR - d);
      return smoothstep(depthThreshold, depthThreshold * 4.0, diff);
    }

    float normalEdge(vec2 uv, vec2 texel) {
      vec3 n = getNormal(uv);
      vec3 nU = getNormal(uv + vec2(0.0, texel.y));
      vec3 nD = getNormal(uv - vec2(0.0, texel.y));
      vec3 nL = getNormal(uv - vec2(texel.x, 0.0));
      vec3 nR = getNormal(uv + vec2(texel.x, 0.0));
      float diff = 0.0;
      diff += 1.0 - dot(n, nU);
      diff += 1.0 - dot(n, nD);
      diff += 1.0 - dot(n, nL);
      diff += 1.0 - dot(n, nR);
      return smoothstep(normalThreshold, normalThreshold * 2.0, diff);
    }

    void main() {
      vec2 texel = 1.0 / resolution;
      vec4 color = texture2D(tDiffuse, vUv);

      float edge = max(depthEdge(vUv, texel), normalEdge(vUv, texel));
      edge = clamp(edge * edgeStrength, 0.0, 1.0);

      color.rgb = mix(color.rgb, edgeColor, edge);
      gl_FragColor = color;
    }
  `
};

export function apply(scene, renderer, camera) {
  scene.background = new THREE.Color(0x0a0a0a);
  scene.environment = null;

  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.4;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const screen = scene.getObjectByName('STATIC_SCREEN');
  const marquee = scene.getObjectByName('KIEFER');
  let screenPos = new THREE.Vector3(0, 1.15, 0.5);
  let marqueePos = new THREE.Vector3(0, 1.65, 0.2);

  if (screen) {
    screen.getWorldPosition(screenPos);
    screenPos.z += 0.3;
  }
  if (marquee) {
    marquee.getWorldPosition(marqueePos);
    marqueePos.z += 0.15;
  }

  // 1. Warm white cabinet spotlight - key light from above-front
  const cabinetSpot = new THREE.SpotLight(0xfff0e0, 1.5, 10, Math.PI / 4, 0.3);
  cabinetSpot.position.set(screenPos.x, screenPos.y + 2, screenPos.z + 2.5);
  cabinetSpot.target.position.set(screenPos.x, screenPos.y - 0.5, screenPos.z - 0.3);
  cabinetSpot.castShadow = true;
  cabinetSpot.shadow.mapSize.width = 512;
  cabinetSpot.shadow.mapSize.height = 512;
  cabinetSpot.name = 'crt_light';
  scene.add(cabinetSpot);
  scene.add(cabinetSpot.target);

  // 2. Red - left wall wash (boosted intensity + range)
  const redLight = new THREE.PointLight(0xff2222, 3.0, 8);
  redLight.position.set(screenPos.x - 2, screenPos.y + 0.3, screenPos.z + 0.5);
  redLight.name = 'red_light';
  scene.add(redLight);

  // 3. Green - right wall wash (boosted)
  const greenLight = new THREE.PointLight(0x22ff44, 2.5, 8);
  greenLight.position.set(screenPos.x + 2, screenPos.y + 0.2, screenPos.z + 0.3);
  greenLight.name = 'green_light';
  scene.add(greenLight);

  // 4. Magenta - behind-left rim (boosted)
  const magentaRim = new THREE.PointLight(0xff33aa, 2.0, 6);
  magentaRim.position.set(screenPos.x - 1.2, screenPos.y + 0.8, screenPos.z - 0.8);
  magentaRim.name = 'magenta_rim';
  scene.add(magentaRim);

  // 5. Cyan - floor bounce from front-right (boosted)
  const cyanLight = new THREE.PointLight(0x22ddff, 2.0, 7);
  cyanLight.position.set(screenPos.x + 0.8, screenPos.y - 0.8, screenPos.z + 1.5);
  cyanLight.name = 'cyan_light';
  scene.add(cyanLight);

  // Ambient - raised so nothing goes fully black
  const ambient = new THREE.AmbientLight(0x1a1a2e, 0.3);
  ambient.name = 'ambient';
  scene.add(ambient);

  // Marquee backlight
  const marqueeLight = new THREE.PointLight(0xffaa00, 0.8, 2);
  marqueeLight.position.copy(marqueePos);
  marqueeLight.name = 'marquee_light';
  scene.add(marqueeLight);
}

export function getComposer(renderer, scene, camera) {
  const size = new THREE.Vector2();
  renderer.getSize(size);

  // Depth + normal render targets for edge detection
  const depthTarget = new THREE.WebGLRenderTarget(size.x, size.y, {
    minFilter: THREE.NearestFilter,
    magFilter: THREE.NearestFilter,
    type: THREE.FloatType,
  });
  depthTarget.depthTexture = new THREE.DepthTexture(size.x, size.y);
  depthTarget.depthTexture.type = THREE.FloatType;

  const normalTarget = new THREE.WebGLRenderTarget(size.x, size.y, {
    minFilter: THREE.NearestFilter,
    magFilter: THREE.NearestFilter,
    type: THREE.HalfFloatType,
  });

  const normalMat = new THREE.MeshNormalMaterial();

  const composer = new EffectComposer(renderer);

  // Main scene render
  const renderPass = new RenderPass(scene, camera);
  composer.addPass(renderPass);

  // Edge detection pass
  const edgePass = new ShaderPass(EdgeDetectShader);
  edgePass.uniforms.resolution.value.set(size.x, size.y);
  edgePass.uniforms.edgeStrength.value = 3.0;
  edgePass.uniforms.depthThreshold.value = 0.0006;
  edgePass.uniforms.normalThreshold.value = 0.15;

  // Custom render callback to populate depth + normal textures
  const origRender = renderPass.render.bind(renderPass);
  renderPass.render = function(rendererArg, writeBuffer, readBuffer, deltaTime, maskActive) {
    // Normal pass
    const origOverrideMaterial = scene.overrideMaterial;
    const origBackground = scene.background;
    scene.overrideMaterial = normalMat;
    scene.background = null;
    rendererArg.setRenderTarget(normalTarget);
    rendererArg.render(scene, camera);
    scene.overrideMaterial = origOverrideMaterial;
    scene.background = origBackground;

    // Depth pass (render to depthTarget to get depth texture)
    rendererArg.setRenderTarget(depthTarget);
    rendererArg.render(scene, camera);
    rendererArg.setRenderTarget(null);

    // Feed textures to edge shader
    edgePass.uniforms.tDepth.value = depthTarget.depthTexture;
    edgePass.uniforms.tNormal.value = normalTarget.texture;

    // Normal render
    origRender(rendererArg, writeBuffer, readBuffer, deltaTime, maskActive);
  };

  composer.addPass(edgePass);

  const bloom = new UnrealBloomPass(
    new THREE.Vector2(size.x, size.y),
    0.28, 0.0, 2.0
  );
  window.__bloomPass = bloom;
  composer.addPass(bloom);

  composer.addPass(new OutputPass());

  return composer;
}
