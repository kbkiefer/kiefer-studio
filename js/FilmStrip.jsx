import React, { useRef, useState, useMemo, useEffect, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { CRTShaderMaterial, createBulgeGeometry } from './crt-shader.js';
import GUI from 'lil-gui';

const PROJECTS = [
  { name: 'Cymatics Lab', tags: 'iOS _ Metal _ Audio Viz', tech: 'iOS', color: '#012FFF', desc: 'Real-time audio visualization powered by Metal shaders.' },
  { name: 'Imago', tags: 'iOS _ AI _ ADHD', tech: 'iOS', color: '#22cc55', desc: 'An ADHD companion app using on-device AI.' },
  { name: 'Border Child', tags: 'Web _ R3F _ Film', tech: 'Web', color: '#cc8822', desc: 'Cinematic scroll-driven website for a Laredo creative studio.' },
  { name: 'NovaTrade', tags: 'macOS _ SwiftUI _ Trading', tech: 'macOS', color: '#2299cc', desc: 'Sovereign trading terminal for macOS with Liquid Glass.' },
  { name: 'Resonance', tags: 'iOS _ Metal _ Consciousness', tech: 'iOS', color: '#8822cc', desc: 'Cymatics, audio entrainment, and Watch HR instrument.' },
  { name: 'ClearMind', tags: 'iOS _ Canvas _ Neural Map', tech: 'iOS', color: '#cc2244', desc: 'ADHD neural map task manager with AI categorization.' },
  { name: 'Chrysalis', tags: 'Unity _ 3D _ Game', tech: 'Unity', color: '#ccaa22', desc: '3D transformation game. Caterpillar to butterfly.' },
  { name: 'ShalaMakes', tags: 'Web _ 3D Print _ Store', tech: 'Web', color: '#22ccaa', desc: 'E-commerce for custom 3D printed products.' },
  { name: 'Continuum', tags: 'macOS _ Vision _ AI', tech: 'macOS', color: '#4455cc', desc: 'Local visual perception for Apple Silicon at 20 FPS.' },
];

const N = PROJECTS.length;

const CAM_WIDE = { pos: [2.5, 1.5, 5], lookAt: [0, 0.3, 0] };
const CAM_SCREEN = { pos: [0, 0.7, 3.2], lookAt: [0, 0.5, 0] };

function makeScreenTex(project, index, state) {
  const W = 512, H = 400;
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const ctx = c.getContext('2d');

  ctx.fillStyle = '#050510';
  ctx.fillRect(0, 0, W, H);

  for (let y = 0; y < H; y += 2) {
    ctx.fillStyle = 'rgba(255,255,255,0.02)';
    ctx.fillRect(0, y, W, 1);
  }

  if (state === 'start') {
    ctx.fillStyle = '#012FFF';
    ctx.globalAlpha = 0.08;
    ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = 1;

    ctx.fillStyle = '#FFFF62';
    ctx.font = 'bold 42px "Silkscreen", monospace';
    const title = 'KIEFER';
    const tm = ctx.measureText(title);
    ctx.fillText(title, (W - tm.width) / 2, H / 2 - 40);

    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.font = '12px "Silkscreen", monospace';
    const sub = 'PORTFOLIO ARCADE';
    const sm = ctx.measureText(sub);
    ctx.fillText(sub, (W - sm.width) / 2, H / 2 - 10);

    ctx.fillStyle = '#FFFF62';
    ctx.font = 'bold 16px "Silkscreen", monospace';
    const insert = '> INSERT COIN <';
    const im = ctx.measureText(insert);
    ctx.fillText(insert, (W - im.width) / 2, H / 2 + 40);

    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.font = '10px "JetBrains Mono", monospace';
    const hint = 'PRESS ENTER OR CLICK';
    const hm = ctx.measureText(hint);
    ctx.fillText(hint, (W - hm.width) / 2, H - 30);
  } else {
    ctx.fillStyle = project.color;
    ctx.globalAlpha = 0.1;
    ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = 1;

    ctx.strokeStyle = project.color;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(8, 8, W - 16, H - 16);

    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.font = '10px "JetBrains Mono", monospace';
    ctx.fillText(`${String(index + 1).padStart(2, '0')}/${N}`, 14, 22);
    ctx.textAlign = 'right';
    ctx.fillText(project.tech, W - 14, 22);
    ctx.textAlign = 'left';

    ctx.fillStyle = project.color;
    ctx.font = 'bold 34px "Silkscreen", monospace';
    const name = project.name.toUpperCase();
    const nm = ctx.measureText(name);
    ctx.fillText(name, (W - nm.width) / 2, H / 2 - 20);

    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.font = '12px "JetBrains Mono", monospace';
    const tags = project.tags;
    const tgm = ctx.measureText(tags);
    ctx.fillText(tags, (W - tgm.width) / 2, H / 2 + 8);

    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.font = '11px "Space Grotesk", sans-serif';
    wrapText(ctx, project.desc, 20, H / 2 + 36, W - 40, 16);

    ctx.fillStyle = '#FFFF62';
    ctx.font = 'bold 11px "Silkscreen", monospace';
    const view = 'ENTER: VIEW PROJECT';
    const vm = ctx.measureText(view);
    ctx.fillText(view, (W - vm.width) / 2, H - 20);

    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.font = '9px "Silkscreen", monospace';
    ctx.fillText('<  PREV', 14, H - 20);
    ctx.textAlign = 'right';
    ctx.fillText('NEXT  >', W - 14, H - 20);
    ctx.textAlign = 'left';
  }

  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function wrapText(ctx, text, x, y, maxW, lh) {
  const words = text.split(' ');
  let line = '';
  for (const w of words) {
    const test = line + w + ' ';
    if (ctx.measureText(test).width > maxW && line) { ctx.fillText(line, x, y); line = w + ' '; y += lh; }
    else line = test;
    if (y > 370) return;
  }
  ctx.fillText(line, x, y);
}

function ArcadeCabinet({ active, gameState, onScreenClick }) {
  const { scene } = useGLTF('/models/arcade-cabinet-v3.glb');
  const cloned = useMemo(() => scene.clone(true), [scene]);
  const groupRef = useRef();
  const crtMatRef = useRef();
  const crtMeshRef = useRef();
  const screenOriginal = useRef();

  const bulgeGeo = useMemo(() => createBulgeGeometry(0.52, 0.42, 32, 0.07), []);

  const crtMaterial = useMemo(() => {
    const mat = new THREE.ShaderMaterial({
      uniforms: {
        uTexture: { value: null },
        uTime: { value: 0 },
        uGlow: { value: new THREE.Color(0x0044ff) },
      },
      vertexShader: CRTShaderMaterial.vertexShader,
      fragmentShader: CRTShaderMaterial.fragmentShader,
      depthWrite: true,
    });
    crtMatRef.current = mat;
    return mat;
  }, []);

  useEffect(() => {
    cloned.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
  }, [cloned]);

  useEffect(() => {
    if (!crtMatRef.current) return;
    const p = PROJECTS[active];
    const tex = makeScreenTex(p, active, gameState);
    crtMatRef.current.uniforms.uTexture.value = tex;
    crtMatRef.current.uniforms.uGlow.value = new THREE.Color(p.color);
  }, [active, gameState]);

  useFrame((state) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.2) * 0.02;

    if (crtMatRef.current) {
      crtMatRef.current.uniforms.uTime.value = state.clock.elapsedTime;
    }
  });

  const screenConfig = useRef({ x: -0.005, y: 0.815, z: 0.38, scaleX: 3.15, scaleY: 2.94, rotX: -0.22, rotY: 0, rotZ: 0 });
  const guiRef = useRef(null);

  useEffect(() => {
    if (guiRef.current) return;
    const gui = new GUI({ title: 'CRT Screen', width: 300 });
    guiRef.current = gui;
    const cfg = screenConfig.current;
    const update = () => {
      if (crtMeshRef.current) {
        crtMeshRef.current.position.set(cfg.x, cfg.y, cfg.z);
        crtMeshRef.current.scale.set(cfg.scaleX, cfg.scaleY, 2.5);
        crtMeshRef.current.rotation.set(cfg.rotX, cfg.rotY, cfg.rotZ);
      }
    };
    gui.add(cfg, 'x', -2, 2, 0.005).name('X').onChange(update);
    gui.add(cfg, 'y', -2, 2, 0.005).name('Y').onChange(update);
    gui.add(cfg, 'z', -2, 4, 0.005).name('Z').onChange(update);
    gui.add(cfg, 'rotX', -1, 1, 0.005).name('Rot X').onChange(update);
    gui.add(cfg, 'rotY', -1, 1, 0.005).name('Rot Y').onChange(update);
    gui.add(cfg, 'rotZ', -1, 1, 0.005).name('Rot Z').onChange(update);
    gui.add(cfg, 'scaleX', 0.5, 5, 0.01).name('Scale W').onChange(update);
    gui.add(cfg, 'scaleY', 0.5, 5, 0.01).name('Scale H').onChange(update);
    gui.add({ copy: () => {
      const out = { x: cfg.x, y: cfg.y, z: cfg.z, rotX: cfg.rotX, rotY: cfg.rotY, rotZ: cfg.rotZ, scaleX: cfg.scaleX, scaleY: cfg.scaleY };
      navigator.clipboard.writeText(JSON.stringify(out, null, 2));
      console.log('Screen config:', out);
    }}, 'copy').name('Copy Config');
    return () => { gui.destroy(); guiRef.current = null; };
  }, []);

  return (
    <group ref={groupRef} onClick={onScreenClick}>
      <primitive object={cloned} scale={2.5} />

      {/* CRT bulge screen */}
      <mesh
        ref={crtMeshRef}
        geometry={bulgeGeo}
        material={crtMaterial}
        position={[screenConfig.current.x, screenConfig.current.y, screenConfig.current.z]}
        rotation={[screenConfig.current.rotX, screenConfig.current.rotY, screenConfig.current.rotZ]}
        scale={[screenConfig.current.scaleX, screenConfig.current.scaleY, 2.5]}
      />

      {/* Screen glow halo */}
      <pointLight
        position={[-0.024, 0.75, 1.9]}
        intensity={0.8}
        color={gameState === 'playing' ? PROJECTS[active].color : '#0044ff'}
        distance={2}
      />

      {/* Borderlands outline */}
      <group scale={2.55}>
        {cloned.children.filter(c => c.isMesh && c.name !== 'Screen').map((child, i) => (
          <mesh key={i} geometry={child.geometry} position={child.position} rotation={child.rotation} scale={child.scale}>
            <meshBasicMaterial color="#000000" side={THREE.BackSide} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

function CameraRig({ gameState }) {
  const { camera } = useThree();
  const progressRef = useRef(0);

  useFrame(() => {
    const target = gameState === 'start' ? 0 : (gameState === 'coin' ? 0.6 : 1);
    progressRef.current += (target - progressRef.current) * 0.025;
    const t = progressRef.current;

    const eased = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

    const px = CAM_WIDE.pos[0] + (CAM_SCREEN.pos[0] - CAM_WIDE.pos[0]) * eased;
    const py = CAM_WIDE.pos[1] + (CAM_SCREEN.pos[1] - CAM_WIDE.pos[1]) * eased;
    const pz = CAM_WIDE.pos[2] + (CAM_SCREEN.pos[2] - CAM_WIDE.pos[2]) * eased;

    camera.position.set(px, py, pz);

    const lx = CAM_WIDE.lookAt[0] + (CAM_SCREEN.lookAt[0] - CAM_WIDE.lookAt[0]) * eased;
    const ly = CAM_WIDE.lookAt[1] + (CAM_SCREEN.lookAt[1] - CAM_WIDE.lookAt[1]) * eased;
    const lz = CAM_WIDE.lookAt[2] + (CAM_SCREEN.lookAt[2] - CAM_WIDE.lookAt[2]) * eased;
    camera.lookAt(lx, ly, lz);
  });

  return null;
}

function Coin({ inserting }) {
  const coinRef = useRef();
  const startTime = useRef(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (inserting) {
      setVisible(true);
      startTime.current = performance.now();
    }
  }, [inserting]);

  useFrame(() => {
    if (!coinRef.current || !visible) return;
    const elapsed = (performance.now() - startTime.current) / 1000;

    if (elapsed < 0.4) {
      coinRef.current.position.set(0.8, -0.5 + elapsed * 2, 2.5 - elapsed * 2);
      coinRef.current.rotation.x = elapsed * 8;
      coinRef.current.rotation.z = elapsed * 4;
    } else if (elapsed < 0.8) {
      const t = (elapsed - 0.4) / 0.4;
      coinRef.current.position.set(0.8 - t * 0.8, -0.5 + 0.8 - t * 2.2, 2.5 - 0.8 + t * 0.3);
      coinRef.current.rotation.x += 0.15;
      coinRef.current.rotation.z = Math.PI / 2;
    } else if (elapsed < 1.0) {
      const t = (elapsed - 0.8) / 0.2;
      coinRef.current.position.y = -1.9 - t * 0.3;
      coinRef.current.scale.setScalar(1 - t);
    } else {
      setVisible(false);
    }
  });

  if (!visible) return null;

  return (
    <mesh ref={coinRef}>
      <cylinderGeometry args={[0.12, 0.12, 0.02, 16]} />
      <meshStandardMaterial color="#ffcc00" metalness={0.9} roughness={0.2} />
    </mesh>
  );
}

function SceneContent({ active, setActive, gameState, setGameState, onOpen, coinInserting }) {
  return (
    <>
      {/* Strong warm ambient to lift everything */}
      <ambientLight intensity={1.5} color="#ccaa88" />

      {/* Bright warm overhead */}
      <spotLight
        position={[0, 6, 3]}
        angle={0.9}
        penumbra={0.5}
        intensity={15}
        color="#ffddbb"
        castShadow
      />

      {/* Front light so cabinet face is visible */}
      <directionalLight
        position={[0, 3, 6]}
        intensity={3}
        color="#ffeedd"
      />

      {/* Left fill */}
      <pointLight position={[-4, 2, 3]} intensity={5} color="#8899cc" distance={12} />

      {/* Right fill */}
      <pointLight position={[4, 2, 3]} intensity={5} color="#ccaa77" distance={12} />

      {/* Screen glow */}
      <pointLight
        position={[0, 0.5, 1.5]}
        intensity={2}
        color={gameState === 'playing' ? PROJECTS[active].color : '#4466ff'}
        distance={5}
      />

      {/* Floor bounce */}
      <pointLight position={[0, -2, 2]} intensity={2} color="#665577" distance={6} />

      <CameraRig gameState={gameState} />

      <Coin inserting={coinInserting} />

      <Suspense fallback={null}>
        <ArcadeCabinet
          active={active}
          gameState={gameState}
          onScreenClick={() => {
            if (gameState === 'start') setGameState('coin');
            else if (gameState === 'playing') onOpen(PROJECTS[active]);
          }}
        />
      </Suspense>

      {/* Floor - dark purple carpet like arcade */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.4, 0]} receiveShadow>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color="#1a1528" roughness={0.95} />
      </mesh>

      {/* Back wall - warm brick tone */}
      <mesh position={[0, 1.5, -3]}>
        <planeGeometry args={[20, 10]} />
        <meshStandardMaterial color="#3d2a20" roughness={0.95} />
      </mesh>

      {/* Left wall */}
      <mesh rotation={[0, Math.PI / 2, 0]} position={[-6, 1.5, 0]}>
        <planeGeometry args={[20, 10]} />
        <meshStandardMaterial color="#352520" roughness={0.95} />
      </mesh>

      {/* Right wall */}
      <mesh rotation={[0, -Math.PI / 2, 0]} position={[6, 1.5, 0]}>
        <planeGeometry args={[20, 10]} />
        <meshStandardMaterial color="#352520" roughness={0.95} />
      </mesh>

      {/* Ceiling */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 5, 0]}>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color="#1a1215" roughness={1} />
      </mesh>
    </>
  );
}

export default function ArcadePortfolio() {
  const [active, setActive] = useState(0);
  const [gameState, setGameState] = useState('start');
  const [coinInserting, setCoinInserting] = useState(false);
  const containerRef = useRef();
  const p = PROJECTS[active];

  useEffect(() => {
    if (gameState === 'coin') {
      setCoinInserting(true);
      setTimeout(() => {
        setGameState('playing');
        setCoinInserting(false);
      }, 1200);
    }
  }, [gameState]);

  const openModal = (project) => {
    const modal = document.getElementById('work-modal');
    if (!modal) return;
    document.getElementById('work-modal-hero').style.background = project.color;
    document.getElementById('work-modal-title').textContent = project.name;
    document.getElementById('work-modal-tags').textContent = project.tags;
    document.getElementById('work-modal-body').innerHTML = `<p>${project.desc}</p>`;
    modal.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  };

  useEffect(() => {
    const onKey = (e) => {
      if (gameState === 'start') {
        if (e.key === 'Enter' || e.key === ' ') { setGameState('coin'); e.preventDefault(); }
        return;
      }
      if (e.key === 'ArrowRight') { setActive(prev => (prev + 1) % N); e.preventDefault(); }
      if (e.key === 'ArrowLeft') { setActive(prev => (prev - 1 + N) % N); e.preventDefault(); }
      if (e.key === 'Enter' || e.key === ' ') { openModal(PROJECTS[active]); e.preventDefault(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [active, gameState]);

  const onWheel = (e) => {
    if (gameState !== 'playing') return;
    if (Math.abs(e.deltaY) > 30) {
      setActive(prev => ((prev + Math.sign(e.deltaY)) % N + N) % N);
    }
  };

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%', position: 'absolute', inset: 0 }} onWheel={onWheel}>
      <Canvas
        camera={{ position: CAM_WIDE.pos, fov: 45 }}
        shadows
        style={{ width: '100%', height: '100%' }}
        gl={{ antialias: true }}
      >
        <color attach="background" args={['#1a1220']} />
        <fog attach="fog" args={['#1a1220', 8, 22]} />
        <SceneContent
          active={active}
          setActive={setActive}
          gameState={gameState}
          setGameState={setGameState}
          onOpen={openModal}
          coinInserting={coinInserting}
        />
      </Canvas>

      {/* HUD */}
      <div style={{
        position: 'absolute', top: 14, left: 18, right: 18,
        display: 'flex', justifyContent: 'space-between',
        pointerEvents: 'none', zIndex: 5,
      }}>
        <span style={{ fontFamily: '"Silkscreen", monospace', fontSize: 12, letterSpacing: 2, textTransform: 'uppercase', color: '#FFFF62' }}>
          {gameState === 'start' ? 'Scroll to Approach' : 'Insert Coin'}
        </span>
        <span style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: 'rgba(240,236,228,0.35)' }}>
          {gameState === 'start' ? 'Scroll Down' : 'Arrows: Browse · Enter: View'}
        </span>
      </div>

      {gameState === 'playing' && (
        <div style={{
          position: 'absolute', bottom: 20, left: 18, right: 18,
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
          pointerEvents: 'none', zIndex: 5,
        }}>
          <div>
            <div style={{
              fontFamily: '"JetBrains Mono", monospace', fontSize: 11, letterSpacing: 2,
              textTransform: 'uppercase', color: 'rgba(240,236,228,0.4)', marginBottom: 4,
            }}>
              {String(active + 1).padStart(2, '0')} / {String(N).padStart(2, '0')} · {p.tech}
            </div>
            <div style={{
              fontFamily: '"Silkscreen", monospace', fontSize: 26, letterSpacing: 2,
              color: p.color, textShadow: `0 0 20px ${p.color}44`,
            }}>{p.name}</div>
          </div>
          <div style={{ display: 'flex', gap: 4, alignItems: 'flex-end' }}>
            {PROJECTS.map((_, i) => (
              <div key={i} style={{
                width: i === active ? 18 : 4, height: 4,
                background: i === active ? '#FFFF62' : 'rgba(240,236,228,0.2)',
                transition: 'width 0.3s',
              }} />
            ))}
          </div>
        </div>
      )}

      {/* Touch nav buttons (visible when playing) */}
      {gameState === 'playing' && (
        <>
          <button onClick={() => setActive(prev => (prev - 1 + N) % N)} style={{
            position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
            color: 'rgba(255,255,255,0.5)', fontSize: 18, padding: '10px 12px', cursor: 'pointer', zIndex: 5,
            fontFamily: '"Silkscreen", monospace',
          }}>&lt;</button>
          <button onClick={() => setActive(prev => (prev + 1) % N)} style={{
            position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
            color: 'rgba(255,255,255,0.5)', fontSize: 18, padding: '10px 12px', cursor: 'pointer', zIndex: 5,
            fontFamily: '"Silkscreen", monospace',
          }}>&gt;</button>
        </>
      )}

      {gameState === 'start' && (
        <button onClick={() => setGameState('coin')} style={{
          position: 'absolute', bottom: '20%', left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(255,255,62,0.1)', border: '2px solid #FFFF62',
          color: '#FFFF62', fontSize: 16, padding: '14px 40px', cursor: 'pointer', zIndex: 5,
          fontFamily: '"Silkscreen", monospace', letterSpacing: 4, textTransform: 'uppercase',
          animation: 'blink 1.2s infinite',
          boxShadow: '0 0 30px rgba(255,255,62,0.15)',
        }}>Insert Coin</button>
      )}

      <style>{`@keyframes blink { 0%,60% { opacity: 1; } 61%,100% { opacity: 0.3; } }`}</style>
    </div>
  );
}
