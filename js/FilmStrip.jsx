import React, { useRef, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useGLTF, OrbitControls, Environment } from '@react-three/drei';
import * as THREE from 'three';

const MODEL_PATH = '/assets/arcade_portfolio.glb';

function ArcadeCabinet() {
  const { scene } = useGLTF(MODEL_PATH);
  const groupRef = useRef();

  useEffect(() => {
    scene.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
      if (child.name === 'stick') {
        child.rotation.x = Math.PI;
      }
    });
  }, [scene]);

  return (
    <group ref={groupRef}>
      <primitive object={scene} />
    </group>
  );
}

function CameraRig() {
  const { camera } = useThree();

  useEffect(() => {
    camera.position.set(0, 6, 12);
    camera.lookAt(0, 5, 0);
  }, [camera]);

  return null;
}

export default function ArcadePortfolio() {
  return (
    <Canvas
      shadows
      gl={{ antialias: true, alpha: true }}
      style={{ width: '100%', height: '100%', background: '#111122' }}
    >
      <CameraRig />
      <ambientLight intensity={0.3} />
      <directionalLight position={[5, 10, 5]} intensity={0.8} castShadow />
      <ArcadeCabinet />
      <OrbitControls
        enablePan={false}
        enableZoom={true}
        minPolarAngle={Math.PI * 0.3}
        maxPolarAngle={Math.PI * 0.6}
      />
    </Canvas>
  );
}

useGLTF.preload(MODEL_PATH);
