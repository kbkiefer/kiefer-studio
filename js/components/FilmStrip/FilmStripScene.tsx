/**
 * FilmStripScene.tsx
 *
 * The full preconfigured scene: Canvas + lighting + fog + camera + the strip itself.
 * Drop this anywhere on your page and it'll work.
 *
 * Usage:
 *   <FilmStripScene />                              // uses defaults
 *   <FilmStripScene showControls />                  // shows the live-tweak panel
 *   <FilmStripScene initialParams={{ ... }} />       // override defaults
 *   <FilmStripScene sectionTextures={['/p1.jpg', '/p2.jpg']} />
 */

import React, { Suspense, useRef, useState, useCallback } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import { Color, Fog, Vector3, Plane, Raycaster, Vector2 } from 'three';
import { FilmStrip } from './FilmStrip';
import {
  useFilmStripParams,
  type FilmStripParams,
  type UseFilmStripParamsReturn,
} from './useFilmStripParams';
import { FilmStripControls } from './FilmStripControls';

function DraggablePoint({
  position,
  index,
  onDrag,
  onDragStart,
  onDragEnd,
}: {
  position: [number, number, number];
  index: number;
  onDrag: (index: number, pos: [number, number, number]) => void;
  onDragStart: () => void;
  onDragEnd: () => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const [hovered, setHovered] = useState(false);
  const [dragging, setDragging] = useState(false);
  const { camera, gl } = useThree();
  const dragPlane = useRef(new Plane());
  const offset = useRef(new Vector3());

  const handlePointerDown = useCallback((e: any) => {
    e.stopPropagation();
    setDragging(true);
    onDragStart();
    gl.domElement.style.cursor = 'grabbing';

    const point = new Vector3(...position);
    const camDir = new Vector3();
    camera.getWorldDirection(camDir);
    dragPlane.current.setFromNormalAndCoplanarPoint(camDir, point);

    const intersection = new Vector3();
    const ray = e.ray;
    ray.intersectPlane(dragPlane.current, intersection);
    offset.current.copy(point).sub(intersection);

    const onMove = (ev: PointerEvent) => {
      const rect = gl.domElement.getBoundingClientRect();
      const mouse = new Vector2(
        ((ev.clientX - rect.left) / rect.width) * 2 - 1,
        -((ev.clientY - rect.top) / rect.height) * 2 + 1
      );
      const raycaster = new Raycaster();
      raycaster.setFromCamera(mouse, camera);
      const hit = new Vector3();
      raycaster.ray.intersectPlane(dragPlane.current, hit);
      if (hit) {
        hit.add(offset.current);
        onDrag(index, [
          Math.round(hit.x * 100) / 100,
          Math.round(hit.y * 100) / 100,
          Math.round(hit.z * 100) / 100,
        ]);
      }
    };

    const onUp = () => {
      setDragging(false);
      onDragEnd();
      gl.domElement.style.cursor = '';
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  }, [position, index, camera, gl, onDrag, onDragStart, onDragEnd]);

  return (
    <mesh
      ref={meshRef}
      position={position}
      onPointerDown={handlePointerDown}
      onPointerOver={() => { setHovered(true); gl.domElement.style.cursor = 'grab'; }}
      onPointerOut={() => { setHovered(false); if (!dragging) gl.domElement.style.cursor = ''; }}
    >
      <sphereGeometry args={[0.2, 12, 12]} />
      <meshBasicMaterial
        color={dragging ? '#ff4444' : hovered ? '#ffaa00' : '#44aaff'}
        transparent
        opacity={hovered || dragging ? 0.9 : 0.5}
        depthTest={false}
      />
    </mesh>
  );
}

function CurvePointEditor({
  paramsApi,
  enabled,
}: {
  paramsApi: UseFilmStripParamsReturn;
  enabled: boolean;
}) {
  const { params, setParam } = paramsApi;
  const [isDragging, setIsDragging] = useState(false);

  const handleDrag = useCallback((index: number, pos: [number, number, number]) => {
    const pts = params.controlPoints.map(p => [...p] as [number, number, number]);
    pts[index] = pos;
    setParam('controlPoints', pts);
  }, [params.controlPoints, setParam]);

  if (!enabled) return null;

  return (
    <group>
      {params.controlPoints.map((pt, i) => (
        <DraggablePoint
          key={i}
          position={pt}
          index={i}
          onDrag={handleDrag}
          onDragStart={() => setIsDragging(true)}
          onDragEnd={() => setIsDragging(false)}
        />
      ))}
    </group>
  );
}

interface FilmStripSceneProps {
  /** Override default params */
  initialParams?: Partial<FilmStripParams>;
  /** Real project thumbnails. If omitted, uses gradient placeholders. */
  sectionTextures?: string[];
  /** Show the live-tweak control panel (set to false for production). */
  showControls?: boolean;
  /** Allow user to orbit the camera with right-drag. Default: false (locked camera for hero use). */
  enableOrbit?: boolean;
  /** Show draggable curve control points in 3D space. */
  showCurveEditor?: boolean;
  /** Called when a frame placeholder is clicked */
  onFrameClick?: (sectionIndex: number, worldPosition: any) => void;
  /** Target position to fly the camera into (set on frame click) */
  zoomTarget?: { x: number; y: number; z: number } | null;
  /** Class for the wrapper div (size the scene with this). */
  className?: string;
  /** Inline style for the wrapper div. */
  style?: React.CSSProperties;
}

export function FilmStripScene({
  initialParams,
  sectionTextures,
  showControls = false,
  enableOrbit = false,
  showCurveEditor = false,
  onFrameClick,
  zoomTarget,
  className,
  style,
}: FilmStripSceneProps) {
  const paramsApi = useFilmStripParams(initialParams);
  const { params } = paramsApi;

  return (
    <div
      className={className}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        background: params.backgroundColor,
        ...style,
      }}
    >
      <Canvas
        camera={{
          position: [params.cameraX ?? 0, params.cameraY, params.cameraZ],
          fov: params.cameraFov,
          near: 0.1,
          far: 200,
        }}
        gl={{ antialias: true }}
        dpr={[1, 2]}
        onCreated={({ scene }) => {
          scene.background = new Color(params.backgroundColor);
          if (params.fogEnabled) {
            scene.fog = new Fog(params.backgroundColor, params.fogNear, params.fogFar);
          }
        }}
      >
        {/* Lighting */}
        <ambientLight
          intensity={params.ambientIntensity}
          color={params.ambientColor}
        />
        <directionalLight
          intensity={params.keyIntensity}
          color={params.keyColor}
          position={[params.keyX, params.keyY, params.keyZ]}
        />
        <directionalLight
          intensity={params.fillIntensity}
          color={params.fillColor}
          position={[-5, 3, -3]}
        />

        <Environment preset="night" backgroundIntensity={0} environmentIntensity={0.6} />

        {/* Update fog & background when params change */}
        <SceneEnvUpdater params={params} />

        {/* The strip */}
        <Suspense fallback={null}>
          <FilmStrip params={params} sectionTextures={sectionTextures} onFrameClick={onFrameClick} />
        </Suspense>

        <CurvePointEditor paramsApi={paramsApi} enabled={showCurveEditor} />
        <CameraFlyTo target={zoomTarget ?? null} />
        <CameraExposer />

        {enableOrbit && (
          <OrbitControls
            enableDamping
            dampingFactor={0.08}
            minDistance={2}
            maxDistance={50}
            target={[params.lookAtX ?? 0, params.lookAtY ?? 0, params.lookAtZ ?? 0]}
            mouseButtons={{
              LEFT: undefined,
              MIDDLE: 2 /* PAN */,
              RIGHT: 0 /* ROTATE */,
            }}
          />
        )}
      </Canvas>

      {showControls && <FilmStripControls api={paramsApi} />}
    </div>
  );
}

function CameraFlyTo({ target }: { target: { x: number; y: number; z: number } | null }) {
  const { camera } = useThree();
  const startPos = useRef(new Vector3());
  const startLookAt = useRef(new Vector3());
  const progress = useRef(0);
  const active = useRef(false);
  const savedPos = useRef(new Vector3());
  const hasSaved = useRef(false);

  React.useEffect(() => {
    if (target) {
      if (!hasSaved.current) {
        savedPos.current.copy(camera.position);
        hasSaved.current = true;
      }
      startPos.current.copy(camera.position);
      progress.current = 0;
      active.current = true;
    } else if (hasSaved.current) {
      startPos.current.copy(camera.position);
      progress.current = 0;
      active.current = true;
    }
  }, [target, camera]);

  useFrame((_, delta) => {
    if (!active.current) return;

    progress.current = Math.min(1, progress.current + delta * 0.8);
    const t = 1 - Math.pow(1 - progress.current, 3);

    if (target) {
      const dest = new Vector3(target.x, target.y, target.z + 0.3);
      camera.position.lerpVectors(startPos.current, dest, t);
      camera.lookAt(target.x, target.y, target.z);
    } else if (hasSaved.current) {
      camera.position.lerpVectors(startPos.current, savedPos.current, t);
      camera.lookAt(0, 0, 0);
      if (progress.current >= 1) {
        hasSaved.current = false;
        active.current = false;
      }
    }

    if (progress.current >= 1 && target) {
      active.current = false;
    }
  });

  return null;
}

function CameraExposer() {
  const { camera } = useThree();
  const controlsRef = useThree((s) => s.controls);
  (window as any).__filmStripCamera = camera;
  (window as any).__filmStripControls = controlsRef;
  return null;
}

/** Updates fog + background when params change live (used while controls panel is open). */
import { useEffect } from 'react';

function SceneEnvUpdater({ params }: { params: FilmStripParams }) {
  const { scene, camera } = useThree();

  useEffect(() => {
    scene.background = new Color(params.backgroundColor);
  }, [params.backgroundColor, scene]);

  useEffect(() => {
    if (params.fogEnabled) {
      scene.fog = new Fog(
        params.backgroundColor,
        params.fogNear,
        Math.max(params.fogNear + 0.5, params.fogFar)
      );
    } else {
      scene.fog = null;
    }
  }, [params.fogEnabled, params.fogNear, params.fogFar, params.backgroundColor, scene]);

  const lastCameraKey = useRef('');
  useEffect(() => {
    if ('fov' in camera) {
      const key = `${params.cameraX ?? 0}_${params.cameraY}_${params.cameraZ}`;
      camera.fov = params.cameraFov;
      camera.updateProjectionMatrix();
      if (key !== lastCameraKey.current) {
        camera.position.set(params.cameraX ?? 0, params.cameraY, params.cameraZ);
        camera.lookAt(params.lookAtX ?? 0, params.lookAtY ?? 0, params.lookAtZ ?? 0);
        lastCameraKey.current = key;
      }
    }
  }, [params.cameraY, params.cameraZ, params.cameraFov, params.cameraX, camera]);

  return null;
}
