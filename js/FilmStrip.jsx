import React, { useRef, useState, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

const PROJECTS = [
  { name: 'Cymatics Lab', tags: 'iOS _ Metal _ Audio Viz', tech: 'iOS', color: '#012FFF' },
  { name: 'Imago', tags: 'iOS _ AI _ ADHD', tech: 'iOS', color: '#22cc55' },
  { name: 'Border Child', tags: 'Web _ R3F _ Film', tech: 'Web', color: '#cc8822' },
  { name: 'NovaTrade', tags: 'macOS _ SwiftUI _ Trading', tech: 'macOS', color: '#2299cc' },
  { name: 'Resonance', tags: 'iOS _ Metal _ Consciousness', tech: 'iOS', color: '#8822cc' },
  { name: 'ClearMind', tags: 'iOS _ Canvas _ Neural Map', tech: 'iOS', color: '#cc2244' },
  { name: 'Chrysalis', tags: 'Unity _ 3D _ Game', tech: 'Unity', color: '#ccaa22' },
  { name: 'ShalaMakes', tags: 'Web _ 3D Print _ Store', tech: 'Web', color: '#22ccaa' },
  { name: 'Continuum', tags: 'macOS _ Vision _ AI', tech: 'macOS', color: '#4455cc' },
];

const N = PROJECTS.length;
const R = 5.5;
const ANGLE_STEP = (Math.PI * 2) / (N + 2);
const CARD_W = 2.6;
const CARD_H = 1.8;

function FrameCard({ project, index, angle, isActive, onClick }) {
  const ref = useRef();
  const borderRef = useRef();

  const texture = useMemo(() => {
    const W = 520, H = 360;
    const c = document.createElement('canvas');
    c.width = W; c.height = H;
    const ctx = c.getContext('2d');

    ctx.fillStyle = project.color;
    ctx.fillRect(0, 0, W, H);

    ctx.strokeStyle = 'rgba(0,0,0,0.2)';
    ctx.lineWidth = 6;
    ctx.strokeRect(3, 3, W - 6, H - 6);

    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.font = 'bold 14px "JetBrains Mono", monospace';
    ctx.fillText('PROJECT:', 18, 28);

    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.font = 'bold 46px "Silkscreen", monospace';
    ctx.fillText(project.name.toUpperCase(), 22, H / 2 + 10);
    ctx.fillStyle = '#F0ECE4';
    ctx.fillText(project.name.toUpperCase(), 18, H / 2 + 6);

    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.font = '13px "JetBrains Mono", monospace';
    ctx.fillText(project.tags, 18, H / 2 + 36);

    for (let i = 0; i < 5; i++) {
      ctx.strokeStyle = `rgba(0,0,0,${0.02 + Math.random() * 0.04})`;
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(Math.random() * W, 0);
      ctx.lineTo(Math.random() * W, H);
      ctx.stroke();
    }

    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, [project]);

  const x = Math.sin(angle) * R;
  const z = -Math.cos(angle) * R;

  return (
    <group position={[x, 0, z]} rotation={[0, Math.PI + angle, 0]}>
      <mesh ref={borderRef}>
        <planeGeometry args={[CARD_W + 0.45, CARD_H + 0.55]} />
        <meshStandardMaterial color="#0e0e0e" roughness={0.9} side={THREE.DoubleSide} />
      </mesh>

      <mesh ref={ref} position={[0, 0, 0.01]} onClick={onClick}>
        <planeGeometry args={[CARD_W, CARD_H]} />
        <meshStandardMaterial map={texture} roughness={0.35} side={THREE.DoubleSide} />
      </mesh>

      <SprocketRow y={(CARD_H + 0.55) / 2 - 0.1} width={CARD_W + 0.45} />
      <SprocketRow y={-(CARD_H + 0.55) / 2 + 0.1} width={CARD_W + 0.45} />
    </group>
  );
}

function SprocketRow({ y, width }) {
  const holes = [];
  const count = 7;
  const start = -width / 2 + 0.25;
  const step = (width - 0.5) / (count - 1);
  for (let i = 0; i < count; i++) {
    holes.push(
      <mesh key={i} position={[start + i * step, y, 0.02]}>
        <planeGeometry args={[0.12, 0.14]} />
        <meshBasicMaterial color="#0b0b1e" />
      </mesh>
    );
  }
  return <>{holes}</>;
}

function Reel({ active, setActive, onOpenProject }) {
  const reelRef = useRef();
  const targetRot = useRef(0);

  useFrame(() => {
    if (!reelRef.current) return;
    targetRot.current = active * ANGLE_STEP;
    reelRef.current.rotation.y += (-targetRot.current - reelRef.current.rotation.y) * 0.06;
  });

  return (
    <group ref={reelRef}>
      {PROJECTS.map((p, i) => (
        <FrameCard
          key={i}
          project={p}
          index={i}
          angle={i * ANGLE_STEP}
          isActive={i === active}
          onClick={() => {
            if (i === active) onOpenProject(p);
            else setActive(i);
          }}
        />
      ))}
    </group>
  );
}

function Scene({ active, setActive, onOpenProject }) {
  const { gl, camera } = useThree();

  React.useEffect(() => {
    camera.lookAt(0, 0, -R);
  }, [camera]);

  React.useEffect(() => {
    const el = gl.domElement;
    let wAcc = 0;

    const onWheel = (e) => {
      e.preventDefault();
      wAcc += e.deltaY;
      const s = Math.sign(wAcc) * Math.floor(Math.abs(wAcc) / 50);
      if (s) {
        wAcc -= s * 50;
        setActive((prev) => ((prev + s) % N + N) % N);
      }
    };

    let tx = null;
    const onTouchStart = (e) => { tx = e.touches[0].clientX; };
    const onTouchMove = (e) => {
      if (tx == null) return;
      const d = e.touches[0].clientX - tx;
      if (Math.abs(d) > 35) {
        setActive((prev) => ((prev + (d > 0 ? -1 : 1)) % N + N) % N);
        tx = e.touches[0].clientX;
      }
    };
    const onTouchEnd = () => { tx = null; };

    const onKey = (e) => {
      if (e.key === 'ArrowRight') { setActive((prev) => (prev + 1) % N); e.preventDefault(); }
      if (e.key === 'ArrowLeft') { setActive((prev) => ((prev - 1) + N) % N); e.preventDefault(); }
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: true });
    el.addEventListener('touchend', onTouchEnd);
    window.addEventListener('keydown', onKey);

    return () => {
      el.removeEventListener('wheel', onWheel);
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('keydown', onKey);
    };
  }, [gl, setActive]);

  return (
    <>
      <ambientLight intensity={0.35} color="#6666aa" />
      <spotLight
        position={[0, 7, 3]}
        angle={0.5}
        penumbra={0.7}
        intensity={8}
        target-position={[0, 0, -R]}
        castShadow={false}
      />
      <pointLight position={[0, -3, -1]} intensity={2} color="#3344aa" distance={12} />
      <fog attach="fog" args={['#0b0b1e', 6, 18]} />
      <mesh position={[0, 0, -3]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="red" />
      </mesh>
      <Reel active={active} setActive={setActive} onOpenProject={onOpenProject} />
    </>
  );
}

export default function FilmStripPortfolio() {
  const [active, setActive] = useState(0);
  const p = PROJECTS[active];

  const openModal = (project) => {
    const modal = document.getElementById('work-modal');
    document.getElementById('work-modal-hero').style.background = project.color;
    document.getElementById('work-modal-title').textContent = project.name;
    document.getElementById('work-modal-tags').textContent = project.tags;
    document.getElementById('work-modal-body').innerHTML = `<p>${project.tags}</p>`;
    modal.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  };

  return (
    <div style={{ width: '100%', height: '100%', position: 'absolute', inset: 0 }}>
      <Canvas
        camera={{ position: [0, 0.8, 0], fov: 55, near: 0.1, far: 100 }}
        style={{ width: '100%', height: '100%', background: '#0b0b1e' }}
        gl={{ antialias: true, outputColorSpace: THREE.SRGBColorSpace }}
        resize={{ scroll: false }}
      >
        <Scene active={active} setActive={setActive} onOpenProject={openModal} />
      </Canvas>

      <div style={{
        position: 'absolute', top: 16, left: 20, right: 20,
        display: 'flex', justifyContent: 'space-between',
        pointerEvents: 'none', zIndex: 5,
      }}>
        <span style={{
          fontFamily: '"Silkscreen", monospace', fontSize: 12,
          letterSpacing: 2, textTransform: 'uppercase', color: '#FFFF62',
        }}>Selected Work</span>
        <span style={{
          fontFamily: '"JetBrains Mono", monospace', fontSize: 11,
          letterSpacing: 2, textTransform: 'uppercase', color: 'rgba(240,236,228,0.5)',
        }}>Scroll / Swipe / Arrows</span>
      </div>

      <div style={{
        position: 'absolute', bottom: 24, left: 20, right: 20,
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
        pointerEvents: 'none', zIndex: 5,
      }}>
        <div>
          <div style={{
            fontFamily: '"JetBrains Mono", monospace', fontSize: 11,
            letterSpacing: 2, textTransform: 'uppercase',
            color: 'rgba(240,236,228,0.5)', marginBottom: 6,
          }}>
            {String(active + 1).padStart(2, '0')} / {String(N).padStart(2, '0')} · {p.tech}
          </div>
          <div style={{
            fontFamily: '"Silkscreen", monospace', fontSize: 28,
            letterSpacing: 2, color: p.color,
            textShadow: '0 0 20px rgba(255,255,255,0.2), 2px 2px 0 rgba(0,0,0,0.6)',
          }}>{p.name}</div>
        </div>
        <div style={{ display: 'flex', gap: 4, alignItems: 'flex-end' }}>
          {PROJECTS.map((_, i) => (
            <div key={i} style={{
              width: i === active ? 18 : 4, height: 4,
              background: i === active ? '#FFFF62' : 'rgba(240,236,228,0.25)',
              transition: 'width 0.3s',
            }} />
          ))}
        </div>
      </div>
    </div>
  );
}
