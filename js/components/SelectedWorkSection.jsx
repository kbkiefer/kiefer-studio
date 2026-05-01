import React, { useRef, useMemo, useState, useCallback, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment } from '@react-three/drei';
import * as THREE from 'three';
import { FilmStripScene, PROJECTS } from './FilmStrip/index.ts';
import './SelectedWorkSection.css';

function PurpleGem() {
  const gemRef = useRef();

  useFrame((_, delta) => {
    if (!gemRef.current) return;
    gemRef.current.rotation.y += delta * 0.4;
    gemRef.current.rotation.x = Math.sin(Date.now() * 0.001) * 0.15;
    gemRef.current.position.y = 1.5 + Math.sin(Date.now() * 0.0008) * 0.1;
  });

  return (
    <group ref={gemRef} position={[-3.3, 1.5, 0.5]} scale={0.55}>
      <mesh>
        <dodecahedronGeometry args={[0.6, 0]} />
        <meshStandardMaterial
          color="#6a3daa"
          roughness={0.5}
          metalness={0.4}
          emissive="#2a0d5a"
          emissiveIntensity={0.3}
        />
      </mesh>
      <mesh>
        <dodecahedronGeometry args={[0.66, 0]} />
        <meshBasicMaterial color="#000000" side={THREE.BackSide} />
      </mesh>
    </group>
  );
}

function GemScene() {
  return (
    <>
      <ambientLight intensity={0.2} />
      <directionalLight position={[5, 8, 4]} intensity={1.2} color="#ccddff" />
      <directionalLight position={[-4, 3, -2]} intensity={0.5} color="#8866cc" />
      <pointLight position={[-4, 2, 2]} intensity={0.6} color="#8855cc" distance={6} />
      <PurpleGem />
      <Environment preset="night" />
    </>
  );
}

function ProjectDetail({ project, onBack }) {
  if (!project) return null;

  return (
    <>
      <button className="project-detail__back" onClick={onBack}>
        &larr; Back to projects
      </button>
      <div className="project-detail__content">
        <div className="project-detail__badge" style={{ color: project.categoryColor }}>
          <span className="project-detail__num">{project.num}</span>
          {project.category}
        </div>
        <h1 className="project-detail__title" style={{ color: project.titleColor }}>
          {project.title}
        </h1>
        <p className="project-detail__year">{project.year}</p>
        <p className="project-detail__desc">{project.description}</p>
        <div className="project-detail__placeholder">
          [ Project screenshots and details go here ]
        </div>
      </div>
    </>
  );
}

const DESKTOP_CAMERA = { cameraX: 1.06, cameraY: -0.47, cameraZ: 10.88, lookAtX: 0, lookAtY: 0, lookAtZ: 0 };
const MOBILE_CAMERA = { cameraX: 2.28, cameraY: -0.46, cameraZ: 11.21 };

export default function SelectedWorkSection() {
  const [selectedProject, setSelectedProject] = useState(null);
  const [zooming, setZooming] = useState(false);
  const [zoomTarget, setZoomTarget] = useState(null);
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' && window.innerWidth <= 768);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const cam = isMobile ? MOBILE_CAMERA : DESKTOP_CAMERA;

  const handleFrameClick = useCallback((sectionIndex, worldPosition) => {
    if (zooming || selectedProject) return;
    const project = PROJECTS[sectionIndex % PROJECTS.length];
    setZoomTarget({ x: worldPosition.x, y: worldPosition.y, z: worldPosition.z });
    setZooming(true);
    setSelectedProject(project);

    setTimeout(() => {
      setZooming(false);
    }, 1200);
  }, [zooming, selectedProject]);

  const handleBack = useCallback(() => {
    setSelectedProject(null);
    setZoomTarget(null);
  }, []);

  return (
    <section className="selected-work" id="work">
      <div className="selected-work__strip-area">
        <FilmStripScene
          key={isMobile ? 'mobile' : 'desktop'}
          onFrameClick={handleFrameClick}
          zoomTarget={zoomTarget}
          initialParams={{
            sectionCount: 10,
            bendSteps: 48,
            stripTilt: 4,
            cameraX: cam.cameraX,
            cameraY: cam.cameraY,
            cameraZ: cam.cameraZ,
            lookAtX: cam.lookAtX ?? 0,
            lookAtY: cam.lookAtY ?? 0,
            lookAtZ: cam.lookAtZ ?? 0,
            cameraFov: 32,
            bodyColor: '#08080c',
            bodyRoughness: 0.61,
            bodyMetalness: 0,
            bodyEmissive: '#000000',
            placeholderUnlit: true,
            placeholderRoughness: 0.6,
            placeholderEmissiveIntensity: 0,
            ambientIntensity: 1.45,
            ambientColor: '#545454',
            keyIntensity: 3,
            keyColor: '#8899cc',
            keyX: 1.5,
            keyY: -1.5,
            keyZ: 10,
            fillIntensity: 2.15,
            fillColor: '#a6a6a6',
            backgroundColor: '#020308',
            fogNear: 6,
            fogFar: 10.5,
            fogEnabled: true,
            autoScrollSpeed: 0.11,
            damping: 0.12,
            controlPoints: [
              [-2.12, 0.14, 6.48], [0, 0.1, 7.64], [1.56, 0.36, 6.29],
              [2.42, 1.02, 2.94], [0.52, 1.62, 1.32], [-1.44, 1.71, 1.05],
              [0.82, 1.76, -7.89], [-0.27, 2.09, -7.85], [-1.76, 2.04, -7.73],
              [-3.46, 1.97, -9.71], [-5.12, 1.23, -9.96], [-7.83, 0.55, -9.95],
              [-8.8, 0.28, -7.97], [-7.36, -0.12, -4.61], [-4.12, 0.63, -4.29],
              [-6.44, 1.65, 0.15], [-3.55, 1.11, 3.24],
            ],
          }}
        />
      </div>

      {!selectedProject && (
        <>
          <div className="selected-work__gem-canvas">
            <Canvas
              camera={{ position: [0, 0.5, 6], fov: 45 }}
              dpr={[1, 1.5]}
              gl={{ antialias: true, alpha: true }}
            >
              <GemScene />
            </Canvas>
          </div>

          <div className="selected-work__content">
            <div className="selected-work__header">
              <div className="selected-work__gem-spacer" />
              <div className="selected-work__heading-block">
                <h2 className="selected-work__title">
                  <span className="selected-work__title-line">Selected</span>
                  <span className="selected-work__title-line selected-work__title-line--large">Work</span>
                </h2>
              </div>
              <div className="selected-work__description">
                <p className="selected-work__desc-text">
                  A selection of projects
                  <br />where design meets code.
                  <br />
                  <span className="selected-work__desc-highlight">
                    Building digital experiences
                    <br />that are both useful and
                    <br />unforgettable.
                  </span>
                </p>
              </div>
            </div>
          </div>
        </>
      )}

      <div className={`project-detail ${selectedProject && !zooming ? 'project-detail--visible' : ''}`}>
        {selectedProject && <ProjectDetail project={selectedProject} onBack={handleBack} />}
      </div>
    </section>
  );
}
