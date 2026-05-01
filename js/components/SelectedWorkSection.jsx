import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import { useControls } from 'leva';
import * as THREE from 'three';
import './SelectedWorkSection.css';

function DodecahedronGem({ position }) {
  const ref = useRef();
  const { gemScale, gemColor, rotSpeed } = useControls('gem', {
    gemScale: { value: 0.35, min: 0.1, max: 1, step: 0.05 },
    gemColor: '#3322cc',
    rotSpeed: { value: 0.4, min: 0, max: 2, step: 0.1 },
  });

  useFrame((_, delta) => {
    if (ref.current) {
      ref.current.rotation.y += delta * rotSpeed;
      ref.current.rotation.x += delta * rotSpeed * 0.3;
    }
  });

  return (
    <mesh ref={ref} position={position} scale={gemScale}>
      <dodecahedronGeometry args={[1, 0]} />
      <meshStandardMaterial
        color={gemColor}
        roughness={0.15}
        metalness={0.9}
        emissive={gemColor}
        emissiveIntensity={0.3}
      />
    </mesh>
  );
}

function EnergyBeam({ parentRef }) {
  const pointsRef = useRef();
  const COUNT = 200;

  const { beamHeight, beamRadius, cubeSize, opacity, glow, glowPulse, glowSpeed } = useControls('cubes', {
    cubeSize: { value: 0.04, min: 0.01, max: 0.1, step: 0.005 },
    opacity: { value: 0.85, min: 0, max: 1, step: 0.05 },
    glow: { value: 0.4, min: 0, max: 2, step: 0.1 },
    glowPulse: { value: 0.08, min: 0, max: 0.5, step: 0.01 },
    glowSpeed: { value: 10.0, min: 0, max: 30, step: 0.5 },
  });

  const beamH = 2.5;
  const beamR = 0.25;

  const { positions, speeds, phases, radii, colors, dummy, cubeGeo } = useMemo(() => {
    const pos = new Float32Array(COUNT * 3);
    const spd = [];
    const pha = [];
    const rad = [];
    const col = new Float32Array(COUNT * 3);

    for (let i = 0; i < COUNT; i++) {
      const t = Math.random();
      const angle = Math.random() * Math.PI * 2;
      const maxR = beamR * (1 - t * 0.7);
      const r = Math.pow(Math.random(), 1.5) * maxR;
      pos[i * 3] = Math.cos(angle) * r;
      pos[i * 3 + 1] = -t * beamH;
      pos[i * 3 + 2] = Math.sin(angle) * r;
      spd.push(0.4 + Math.random() * 0.5);
      pha.push(angle);
      rad.push(r);

      const height = 1 - t;
      const isCore = r < 0.03;
      if (isCore) {
        col[i * 3] = 0.85 + height * 0.15;
        col[i * 3 + 1] = 0.95 + height * 0.05;
        col[i * 3 + 2] = 1.0;
      } else {
        col[i * 3] = 0.15 + height * 0.25;
        col[i * 3 + 1] = 0.6 + height * 0.3;
        col[i * 3 + 2] = 0.95 + height * 0.05;
      }
    }

    const d = new THREE.Object3D();
    const geo = new THREE.BoxGeometry(1, 1, 1);
    return { positions: pos, speeds: spd, phases: pha, radii: rad, colors: col, dummy: d, cubeGeo: geo };
  }, []);

  const meshRef = useRef();

  useFrame(({ clock }, delta) => {
    if (!meshRef.current) return;
    const elapsed = clock.elapsedTime;
    const posArr = positions;

    for (let i = 0; i < COUNT; i++) {
      posArr[i * 3 + 1] -= speeds[i] * delta;
      const y = posArr[i * 3 + 1];
      const depth = Math.abs(y) / beamH;
      const phase = phases[i] + elapsed * 0.5;
      const r = radii[i] * (1 - depth * 0.6);
      posArr[i * 3] = Math.cos(phase) * r;
      posArr[i * 3 + 2] = Math.sin(phase) * r;

      if (posArr[i * 3 + 1] < -beamH) {
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.pow(Math.random(), 1.5) * beamR;
        posArr[i * 3] = Math.cos(angle) * radius;
        posArr[i * 3 + 1] = 0;
        posArr[i * 3 + 2] = Math.sin(angle) * radius;
        phases[i] = angle;
        radii[i] = radius;
      }

      dummy.position.set(posArr[i * 3], posArr[i * 3 + 1], posArr[i * 3 + 2]);
      dummy.scale.setScalar(cubeSize);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;

    if (meshRef.current.material) {
      const pulse = Math.sin(elapsed * glowSpeed);
      meshRef.current.material.emissiveIntensity = glow + pulse * glowPulse;
      meshRef.current.material.opacity = opacity;
    }
  });

  return (
    <group position={[0, -0.2, 0]}>
      <instancedMesh ref={meshRef} args={[cubeGeo, null, COUNT]}>
        <meshStandardMaterial
          color="#44ccff"
          emissive="#44ccff"
          emissiveIntensity={glow}
          transparent
          opacity={opacity}
          toneMapped={false}
          depthWrite={false}
        />
      </instancedMesh>
    </group>
  );
}

function GemGroup() {
  const groupRef = useRef();

  const { flowSpeed, spiralScale } = useControls('gem', {
    flowSpeed: { value: 0.15, min: 0, max: 1, step: 0.05 },
    spiralScale: { value: 0.7, min: 0, max: 2, step: 0.1 },
  });

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.elapsedTime * flowSpeed;
    groupRef.current.position.y = Math.sin(t) * 0.08 * spiralScale;
    groupRef.current.position.x = Math.cos(t * 0.7) * 0.03 * spiralScale;
  });

  return (
    <group ref={groupRef} position={[-1.2, 0.3, 0]}>
      <DodecahedronGem position={[0, 0, 0]} />
      <EnergyBeam parentRef={groupRef} />
    </group>
  );
}

function Scene() {
  return (
    <>
      <ambientLight intensity={0.3} />
      <pointLight position={[2, 3, 2]} intensity={0.8} />
      <pointLight position={[-2, 1, -1]} intensity={0.4} color="#4488ff" />
      <GemGroup />
    </>
  );
}

export default function SelectedWorkSection() {
  return (
    <section className="selected-work" id="work">
      <div className="selected-work__canvas">
        <Canvas camera={{ position: [0, 0, 4], fov: 45 }} gl={{ alpha: true, antialias: true }}>
          <Scene />
        </Canvas>
      </div>
      <div className="selected-work__content">
        <div className="selected-work__header">
          <div className="selected-work__gem-spacer" />
          <div className="selected-work__text">
            <h2 className="selected-work__title">
              <span className="selected-work__title-sm">SELECTED</span>
              <br />
              <span className="selected-work__title-lg">WORK</span>
            </h2>
            <p className="selected-work__desc">
              A SELECTION OF PROJECTS<br />
              WHERE DESIGN MEETS CODE.<br />
              <span className="selected-work__desc-accent">
                BUILDING DIGITAL EXPERIENCES<br />
                THAT ARE BOTH USEFUL AND<br />
                UNFORGETTABLE.
              </span>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
