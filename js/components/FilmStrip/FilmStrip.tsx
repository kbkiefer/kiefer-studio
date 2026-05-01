/**
 * FilmStrip.tsx
 *
 * The 3D film strip itself: a closed-loop curve with frame instances bending
 * along it. Loads FilmStrip_Segment.glb (must be in /public/models/) for the
 * mesh source, and uses your control points as the curve.
 *
 * Use inside a <Canvas> from @react-three/fiber. Wrap with <FilmStripScene />
 * if you want the full scene (camera, lighting, fog, etc.) preconfigured.
 */

import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import type { FilmStripParams } from './useFilmStripParams';

// ---------------------------------------------------------------------------
// Geometry constants — must match what the Blender model was built with
// ---------------------------------------------------------------------------

const SEG_LENGTH = 1.0;
const STRIP_THICKNESS = 0.02;

const GLB_URL = '/models/FilmStrip_Segment.glb';

// ---------------------------------------------------------------------------
// Texture generator: gradient + section number
// In production you'd swap this for real project thumbnails (loaded via TextureLoader)
// ---------------------------------------------------------------------------

interface ProjectData {
  num: string;
  category: string;
  categoryColor: string;
  year: string;
  title: string;
  titleColor: string;
  description: string;
  imageUrl?: string;
}

export const PROJECTS: ProjectData[] = [
  { num: '01', category: 'IOS APP', categoryColor: '#44dd66', year: '2026', title: 'CYMATICS LAB', titleColor: '#44dd66', description: 'Sound visualization instrument for iOS. Real-time FFT analysis with Metal-powered cymatics patterns.' },
  { num: '02', category: 'IOS APP', categoryColor: '#4488ff', year: '2026', title: 'DINK', titleColor: '#4488ff', description: 'Pickleball companion app. Score tracking, court finder, leagues, and learning.' },
  { num: '03', category: 'IOS APP', categoryColor: '#ff44aa', year: '2026', title: 'IMAGO', titleColor: '#ff44aa', description: 'ADHD companion with on-device AI. Metamorphosis-themed task lifecycle.' },
  { num: '04', category: 'CONSCIOUSNESS', categoryColor: '#aa66ff', year: '2026', title: 'RESONANCE', titleColor: '#aa66ff', description: 'Consciousness instrument. Metal cymatics, audio entrainment, and Watch HR integration.' },
  { num: '05', category: 'IOS APP', categoryColor: '#44ccff', year: '2026', title: 'CLEARMIND', titleColor: '#44ccff', description: 'ADHD neural map task manager. Canvas rendering with 6 life areas and AI categorization.' },
  { num: '06', category: 'E-COMMERCE', categoryColor: '#ffcc44', year: '2026', title: 'SHALAMAKES', titleColor: '#ffcc44', description: '3D print store. Custom commission workflow with Stripe integration.' },
  { num: '07', category: 'WEB DESIGN', categoryColor: '#44dd66', year: '2026', title: 'KIEFER.STUDIO', titleColor: '#44dd66', description: 'Personal portfolio built with Three.js, pixelated bust, and retro aesthetics.' },
  { num: '08', category: 'TRADING', categoryColor: '#ff6644', year: '2026', title: 'NOVATRADE', titleColor: '#ff6644', description: 'macOS SwiftUI trading desk with Liquid Glass. Real-time market data.' },
  { num: '09', category: 'AI RESEARCH', categoryColor: '#aa66ff', year: '2026', title: 'CONTINUUM', titleColor: '#aa66ff', description: 'Three-tier continuous visual perception system for Apple Silicon. 20 FPS local AI.' },
  { num: '10', category: '3D TOOL', categoryColor: '#44ccff', year: '2026', title: 'MANIFOLD', titleColor: '#44ccff', description: 'Browser-native 3D scene editor with MCP. React Three Fiber + Zustand.' },
];

function makeProjectTexture(project: ProjectData): THREE.CanvasTexture {
  const w = 1280;
  const h = 720;
  const cv = document.createElement('canvas');
  cv.width = w;
  cv.height = h;
  const ctx = cv.getContext('2d')!;
  const pad = 40;
  const mono = '"JetBrains Mono", "SF Mono", "Courier New", monospace';
  const pixel = '"Silkscreen", monospace';

  // Background
  ctx.fillStyle = '#080a14';
  ctx.fillRect(0, 0, w, h);

  // Subtle border
  ctx.strokeStyle = 'rgba(255,255,255,0.06)';
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, w - 2, h - 2);

  // Year - top right
  ctx.font = `400 28px ${mono}`;
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.textAlign = 'right';
  ctx.fillText(project.year, w - pad, pad + 24);

  // Number badge + category - top left
  ctx.textAlign = 'left';
  ctx.fillStyle = project.categoryColor;
  ctx.font = `700 24px ${mono}`;
  // Badge background
  const badgeText = project.num;
  const badgeW = ctx.measureText(badgeText).width + 16;
  ctx.fillStyle = project.categoryColor;
  ctx.fillRect(pad, pad, badgeW, 32);
  ctx.fillStyle = '#000';
  ctx.font = `700 20px ${mono}`;
  ctx.fillText(badgeText, pad + 8, pad + 23);
  // Category text
  ctx.fillStyle = project.categoryColor;
  ctx.font = `700 24px ${mono}`;
  ctx.fillText(project.category, pad + badgeW + 12, pad + 24);

  // Image placeholder area
  const imgTop = pad + 56;
  const imgH = 320;
  ctx.fillStyle = 'rgba(255,255,255,0.03)';
  ctx.fillRect(pad, imgTop, w - pad * 2, imgH);
  ctx.strokeStyle = 'rgba(255,255,255,0.05)';
  ctx.strokeRect(pad, imgTop, w - pad * 2, imgH);
  // Placeholder text
  ctx.font = `400 20px ${mono}`;
  ctx.fillStyle = 'rgba(255,255,255,0.08)';
  ctx.textAlign = 'center';
  ctx.fillText('[ screenshot ]', w / 2, imgTop + imgH / 2);

  // Project title
  ctx.textAlign = 'left';
  const titleTop = imgTop + imgH + 44;
  ctx.fillStyle = project.titleColor;
  ctx.font = `700 36px ${pixel}`;
  ctx.fillText(project.title, pad, titleTop);

  // Description
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.font = `400 22px ${mono}`;
  const maxLineW = w - pad * 2 - 280;
  const words = project.description.split(' ');
  let line = '';
  let lineY = titleTop + 40;
  for (const word of words) {
    const test = line + word + ' ';
    if (ctx.measureText(test).width > maxLineW && line) {
      ctx.fillText(line.trim(), pad, lineY);
      line = word + ' ';
      lineY += 30;
    } else {
      line = test;
    }
  }
  if (line) ctx.fillText(line.trim(), pad, lineY);

  // View project link - bottom right
  ctx.fillStyle = project.titleColor;
  ctx.font = `700 22px ${mono}`;
  ctx.textAlign = 'right';
  ctx.fillText('VIEW PROJECT →', w - pad, h - pad);

  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.flipY = true;
  tex.anisotropy = 8;
  return tex;
}

// ---------------------------------------------------------------------------
// Bending function (from preview tool)
// Maps a "rest" mesh (flat segment in XY plane) onto a slice of the closed curve
// ---------------------------------------------------------------------------

const _tmpPoint = new THREE.Vector3();
const _tmpForward = new THREE.Vector3();
const _tmpOut = new THREE.Vector3();

function bendInstanceGeometry(
  curve: THREE.CatmullRomCurve3,
  restPositions: Float32Array,
  geomAttr: THREE.BufferAttribute,
  uStart: number,
  uEnd: number,
  extraZOffset = 0
) {
  const positions = geomAttr.array as Float32Array;
  const vertexCount = positions.length / 3;

  for (let v = 0; v < vertexCount; v++) {
    const idx = v * 3;
    const xRest = restPositions[idx];
    const yRest = restPositions[idx + 1];
    const zRest = restPositions[idx + 2];

    // tInSegment: 0 at left edge of segment, 1 at right edge
    const tInSegment = (xRest + SEG_LENGTH / 2) / SEG_LENGTH;
    let u = uStart + tInSegment * (uEnd - uStart);
    u = u - Math.floor(u);

    curve.getPointAt(u, _tmpPoint);
    curve.getTangentAt(u, _tmpForward);

    // Build orthonormal basis: forward, up (locked to world Y if possible), out (forward × up)
    let upX = 0, upY = 1, upZ = 0;
    const horizMag = Math.sqrt(_tmpForward.x * _tmpForward.x + _tmpForward.z * _tmpForward.z);
    if (horizMag < 1e-3) {
      upX = 1; upY = 0; upZ = 0;
    }

    // out = up × forward (for correct texture orientation)
    _tmpOut.x = upY * _tmpForward.z - upZ * _tmpForward.y;
    _tmpOut.y = upZ * _tmpForward.x - upX * _tmpForward.z;
    _tmpOut.z = upX * _tmpForward.y - upY * _tmpForward.x;
    const outLen = Math.sqrt(_tmpOut.x ** 2 + _tmpOut.y ** 2 + _tmpOut.z ** 2);
    if (outLen > 1e-6) {
      _tmpOut.x /= outLen;
      _tmpOut.y /= outLen;
      _tmpOut.z /= outLen;
    }

    // Recompute up = forward × out so it's perpendicular to both
    const finalUpX = _tmpForward.y * _tmpOut.z - _tmpForward.z * _tmpOut.y;
    const finalUpY = _tmpForward.z * _tmpOut.x - _tmpForward.x * _tmpOut.z;
    const finalUpZ = _tmpForward.x * _tmpOut.y - _tmpForward.y * _tmpOut.x;

    positions[idx]     = _tmpPoint.x + finalUpX * yRest + _tmpOut.x * (zRest + extraZOffset);
    positions[idx + 1] = _tmpPoint.y + finalUpY * yRest + _tmpOut.y * (zRest + extraZOffset);
    positions[idx + 2] = _tmpPoint.z + finalUpZ * yRest + _tmpOut.z * (zRest + extraZOffset);
  }

  geomAttr.needsUpdate = true;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface FilmStripProps {
  params: FilmStripParams;
  sectionTextures?: string[];
  onFrameClick?: (sectionIndex: number, worldPosition: THREE.Vector3) => void;
}

interface InstanceData {
  group: THREE.Group;
  body: THREE.Mesh;
  placeholder: THREE.Mesh;
  bodyRest: Float32Array;
  placeholderRest: Float32Array;
}

export function FilmStrip({ params, sectionTextures, onFrameClick }: FilmStripProps) {
  const stripGroupRef = useRef<THREE.Group>(null!);
  const instancesRef = useRef<InstanceData[]>([]);
  const scrollOffsetRef = useRef(0);

  // Load GLB via drei (cached, suspends until ready)
  const gltf = useGLTF(GLB_URL);

  // Extract body & placeholder geometries from the GLB exactly once
  const { bodyGeometry, placeholderGeometry } = useMemo(() => {
    let bodyGeom: THREE.BufferGeometry | null = null;
    let phGeom: THREE.BufferGeometry | null = null;

    // Axis fix: glTF Z-up→Y-up conversion swaps Y/Z relative to how we built the model.
    // Rotate -90° around X to restore: X=length, Y=width, Z=thickness.
    const rotFix = new THREE.Matrix4().makeRotationX(-Math.PI / 2);

    gltf.scene.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        const mesh = obj as THREE.Mesh;
        const geom = mesh.geometry.clone();
        geom.applyMatrix4(mesh.matrixWorld);
        geom.applyMatrix4(rotFix);
        if (mesh.name.startsWith('FilmStrip_Body')) bodyGeom = geom;
        else if (mesh.name.startsWith('FilmStrip_Placeholder')) phGeom = geom;
      }
    });

    // Fallback: assign by primitive order
    if (!bodyGeom || !phGeom) {
      const geoms: THREE.BufferGeometry[] = [];
      gltf.scene.traverse((obj) => {
        if ((obj as THREE.Mesh).isMesh) {
          const g = (obj as THREE.Mesh).geometry.clone();
          g.applyMatrix4(((obj as unknown) as THREE.Object3D).matrixWorld);
          g.applyMatrix4(rotFix);
          geoms.push(g);
        }
      });
      if (!bodyGeom && geoms[0]) bodyGeom = geoms[0];
      if (!phGeom && geoms[1]) phGeom = geoms[1];
    }

    return { bodyGeometry: bodyGeom, placeholderGeometry: phGeom };
  }, [gltf]);

  // Build the curve from control points
  const { curve, curveLength, instanceCount } = useMemo(() => {
    const pts = params.controlPoints.map(([x, y, z]) => new THREE.Vector3(x, y, z));
    const c = new THREE.CatmullRomCurve3(pts, true /* closed */, 'catmullrom', 0.5);
    const len = c.getLength();
    return {
      curve: c,
      curveLength: len,
      instanceCount: Math.max(3, Math.round(len / SEG_LENGTH)),
    };
  }, [params.controlPoints]);

  // Build placeholder textures (gradient or user-provided)
  const placeholderTextures = useMemo(() => {
    if (sectionTextures && sectionTextures.length > 0) {
      const loader = new THREE.TextureLoader();
      return sectionTextures.map((url) => {
        const tex = loader.load(url);
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.anisotropy = 8;
        return tex;
      });
    }
    return PROJECTS.map((project) => makeProjectTexture(project));
  }, [sectionTextures]);

  // Build instances when geometry, curve, or instance count changes
  useEffect(() => {
    if (!bodyGeometry || !placeholderGeometry || !stripGroupRef.current) return;

    // Clean up previous instances
    for (const inst of instancesRef.current) {
      stripGroupRef.current.remove(inst.group);
      inst.body.geometry.dispose();
      (inst.body.material as THREE.Material).dispose();
      inst.placeholder.geometry.dispose();
      (inst.placeholder.material as THREE.Material).dispose();
    }
    instancesRef.current = [];

    // Build new instances
    for (let i = 0; i < instanceCount; i++) {
      const group = new THREE.Group();

      const bodyGeom = bodyGeometry.clone();
      const bodyRest = new Float32Array(bodyGeom.attributes.position.array);
      const bodyMat = new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(params.bodyColor),
        roughness: params.bodyRoughness,
        metalness: params.bodyMetalness,
        emissive: new THREE.Color(params.bodyEmissive),
        clearcoat: 0.8,
        clearcoatRoughness: 0.15,
        reflectivity: 0.6,
        envMapIntensity: 1.2,
      });
      const body = new THREE.Mesh(bodyGeom, bodyMat);
      group.add(body);

      const phGeom = placeholderGeometry.clone();
      const phRest = new Float32Array(phGeom.attributes.position.array);
      const phMat = params.placeholderUnlit
        ? new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide })
        : new THREE.MeshStandardMaterial({
            color: 0xffffff,
            roughness: params.placeholderRoughness,
            metalness: 0,
            emissive: 0xffffff,
            emissiveIntensity: params.placeholderEmissiveIntensity,
            side: THREE.DoubleSide,
          });
      const placeholder = new THREE.Mesh(phGeom, phMat);
      placeholder.userData.isPlaceholder = true;
      placeholder.userData.instanceIndex = i;
      group.add(placeholder);

      stripGroupRef.current.add(group);
      instancesRef.current.push({
        group,
        body,
        placeholder,
        bodyRest,
        placeholderRest: phRest,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bodyGeometry, placeholderGeometry, instanceCount]);

  // Live-update materials when params change (without full rebuild)
  useEffect(() => {
    for (const inst of instancesRef.current) {
      const m = inst.body.material as THREE.MeshPhysicalMaterial;
      if (m.isMeshPhysicalMaterial || m.isMeshStandardMaterial) {
        m.color.set(params.bodyColor);
        m.roughness = params.bodyRoughness;
        m.metalness = params.bodyMetalness;
        m.emissive.set(params.bodyEmissive);
      }
    }
  }, [params.bodyColor, params.bodyRoughness, params.bodyMetalness, params.bodyEmissive]);

  // Animation loop: bend each instance to its slice of the curve every frame
  useFrame((_state, delta) => {
    // Auto-scroll
    scrollOffsetRef.current += params.autoScrollSpeed * delta;

    const offset = scrollOffsetRef.current;
    const sectionCount = Math.max(1, Math.round(params.sectionCount));
    const instCount = instancesRef.current.length;
    if (instCount === 0) return;

    for (let i = 0; i < instCount; i++) {
      const inst = instancesRef.current[i];
      const slot = i + offset;
      const uStart = slot / instCount;
      const uEnd = (slot + 1) / instCount;

      bendInstanceGeometry(
        curve,
        inst.bodyRest,
        inst.body.geometry.attributes.position as THREE.BufferAttribute,
        uStart,
        uEnd,
        0
      );
      inst.body.geometry.computeVertexNormals();

      bendInstanceGeometry(
        curve,
        inst.placeholderRest,
        inst.placeholder.geometry.attributes.position as THREE.BufferAttribute,
        uStart,
        uEnd,
        0
      );
      inst.placeholder.geometry.computeVertexNormals();

      // Cycle texture by section
      const sectionIndex = ((Math.floor(slot) % sectionCount) + sectionCount) % sectionCount;
      const tex = placeholderTextures[sectionIndex % placeholderTextures.length];
      const phMat = inst.placeholder.material as THREE.MeshBasicMaterial | THREE.MeshStandardMaterial;
      if (phMat.map !== tex) {
        phMat.map = tex;
        phMat.needsUpdate = true;
      }
    }
  });

  const handleClick = (e: any) => {
    if (!onFrameClick) return;
    let obj = e.object;
    while (obj && !obj.userData?.isPlaceholder) obj = obj.parent;
    if (!obj?.userData?.isPlaceholder) return;

    e.stopPropagation();
    const sectionCount = Math.max(1, Math.round(params.sectionCount));
    const idx = obj.userData.instanceIndex;
    const slot = idx + scrollOffsetRef.current;
    const sectionIndex = ((Math.floor(slot) % sectionCount) + sectionCount) % sectionCount;

    const worldPos = new THREE.Vector3();
    obj.getWorldPosition(worldPos);
    onFrameClick(sectionIndex, worldPos);
  };

  return (
    <group
      ref={stripGroupRef}
      rotation={[(params.stripTilt * Math.PI) / 180, 0, 0]}
      onClick={handleClick}
    />
  );
}

// Preload the GLB so it's ready when component first mounts
useGLTF.preload(GLB_URL);
