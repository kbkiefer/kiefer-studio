import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Application } from '@splinetool/runtime';

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
const SPLINE_URL = 'https://prod.spline.design/xNcB9vIJZhtTQGVX/scene.splinecode';
const CRT_W = 512;
const CRT_H = 400;

function drawCRT(ctx, project, index, total) {
  const W = CRT_W, H = CRT_H;
  ctx.fillStyle = '#080818';
  ctx.fillRect(0, 0, W, H);
  for (let y = 0; y < H; y += 3) { ctx.fillStyle = 'rgba(255,255,255,0.02)'; ctx.fillRect(0, y, W, 1); }
  ctx.fillStyle = project.color; ctx.globalAlpha = 0.12; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1;
  ctx.strokeStyle = project.color; ctx.lineWidth = 2; ctx.strokeRect(10, 10, W - 20, H - 20);
  ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.font = '11px "JetBrains Mono", monospace';
  ctx.textAlign = 'left';
  ctx.fillText(`${String(index + 1).padStart(2, '0')}/${total}`, 16, 26);
  ctx.textAlign = 'right'; ctx.fillText(project.tech, W - 16, 26); ctx.textAlign = 'left';
  ctx.fillStyle = project.color; ctx.font = 'bold 36px "Silkscreen", monospace';
  const name = project.name.toUpperCase();
  ctx.fillText(name, (W - ctx.measureText(name).width) / 2, H / 2 - 15);
  ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.font = '13px "JetBrains Mono", monospace';
  ctx.fillText(project.tags, (W - ctx.measureText(project.tags).width) / 2, H / 2 + 15);
  ctx.fillStyle = '#FFFF62'; ctx.font = 'bold 12px "Silkscreen", monospace';
  const cta = 'ENTER: VIEW PROJECT';
  ctx.fillText(cta, (W - ctx.measureText(cta).width) / 2, H - 25);
}

function projectPoint(mesh, camera, canvas, lx, ly, lz) {
  const v = mesh.localToWorld(new camera.position.constructor(lx, ly, lz));
  v.project(camera);
  return {
    x: (v.x * 0.5 + 0.5) * canvas.clientWidth,
    y: (-v.y * 0.5 + 0.5) * canvas.clientHeight,
  };
}

function CRTScreen({ app, splineCanvas, active, gameState, projects }) {
  const canvasRef = useRef(null);
  const [rect, setRect] = useState(null);
  const rafRef = useRef(null);

  useEffect(() => {
    if (!app) return;

    let screenMesh = null;
    app._scene.traverse(obj => {
      if (obj.name === 'Screen Placeholder') screenMesh = obj;
    });
    if (!screenMesh) return;

    const geo = screenMesh.geometry;
    geo.computeBoundingBox();
    const bb = geo.boundingBox;
    const camera = app._camera;

    const track = () => {
      screenMesh.updateWorldMatrix(true, false);
      const tl = projectPoint(screenMesh, camera, splineCanvas, bb.min.x, bb.max.y, 0);
      const tr = projectPoint(screenMesh, camera, splineCanvas, bb.max.x, bb.max.y, 0);
      const bl = projectPoint(screenMesh, camera, splineCanvas, bb.min.x, bb.min.y, 0);
      const br = projectPoint(screenMesh, camera, splineCanvas, bb.max.x, bb.min.y, 0);

      const left = Math.min(tl.x, tr.x, bl.x, br.x);
      const right = Math.max(tl.x, tr.x, bl.x, br.x);
      const top = Math.min(tl.y, tr.y, bl.y, br.y);
      const bottom = Math.max(tl.y, tr.y, bl.y, br.y);

      setRect({ left, top, width: right - left, height: bottom - top });
      rafRef.current = requestAnimationFrame(track);
    };
    rafRef.current = requestAnimationFrame(track);

    return () => cancelAnimationFrame(rafRef.current);
  }, [app, splineCanvas]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || gameState !== 'playing') return;
    const ctx = canvas.getContext('2d');
    drawCRT(ctx, projects[active], active, N);
  }, [active, gameState, projects]);

  if (!rect || gameState !== 'playing') return null;

  return (
    <canvas
      ref={canvasRef}
      width={CRT_W}
      height={CRT_H}
      style={{
        position: 'absolute',
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height,
        imageRendering: 'pixelated',
        pointerEvents: 'none',
        zIndex: 3,
        borderRadius: 4,
      }}
    />
  );
}

export default function ArcadePortfolio() {
  const [active, setActive] = useState(0);
  const [gameState, setGameState] = useState('start');
  const [appLoaded, setAppLoaded] = useState(false);
  const canvasRef = useRef(null);
  const appRef = useRef(null);
  const activeRef = useRef(0);
  const gameStateRef = useRef('start');
  activeRef.current = active;
  gameStateRef.current = gameState;
  const p = PROJECTS[active];

  const openModal = useCallback((project) => {
    const modal = document.getElementById('work-modal');
    if (!modal) return;
    document.getElementById('work-modal-hero').style.background = project.color;
    document.getElementById('work-modal-title').textContent = project.name;
    document.getElementById('work-modal-tags').textContent = project.tags;
    document.getElementById('work-modal-body').innerHTML = `<p>${project.tags}</p>`;
    modal.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || appRef.current) return;
    const app = new Application(canvas);
    appRef.current = app;
    app.load(SPLINE_URL).then(() => {
      window.__splineApp = app;
      setAppLoaded(true);
    });
  }, []);

  useEffect(() => {
    const el = document.getElementById('projects');
    if (!el) return;
    const onScroll = () => {
      const r = el.getBoundingClientRect();
      const sectionH = r.height;
      const scrolled = window.innerHeight - r.top;
      const progress = scrolled / sectionH;
      if (progress > 0.55 && gameStateRef.current === 'start') {
        setGameState('playing');
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (gameStateRef.current !== 'playing') return;
      if (e.key === 'ArrowRight') { setActive(prev => (prev + 1) % N); e.preventDefault(); }
      if (e.key === 'ArrowLeft') { setActive(prev => (prev - 1 + N) % N); e.preventDefault(); }
      if (e.key === 'Enter' || e.key === ' ') { openModal(PROJECTS[activeRef.current]); e.preventDefault(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [openModal]);

  const onWheel = (e) => {
    if (gameState !== 'playing') return;
    if (Math.abs(e.deltaY) > 30) setActive(prev => ((prev + Math.sign(e.deltaY)) % N + N) % N);
  };

  return (
    <div style={{ width: '100%', height: '100%', position: 'absolute', inset: 0 }} onWheel={onWheel}>
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block', touchAction: 'pan-y' }} />

      <CRTScreen
        app={appLoaded ? appRef.current : null}
        splineCanvas={canvasRef.current}
        active={active}
        gameState={gameState}
        projects={PROJECTS}
      />

      {gameState === 'playing' && (
        <div style={{ position: 'absolute', bottom: 20, left: 18, right: 18, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', pointerEvents: 'none', zIndex: 5 }}>
          <div>
            <div style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: 'rgba(240,236,228,0.4)', marginBottom: 4 }}>{String(active + 1).padStart(2, '0')} / {String(N).padStart(2, '0')} · {p.tech}</div>
            <div style={{ fontFamily: '"Silkscreen", monospace', fontSize: 26, letterSpacing: 2, color: p.color, textShadow: `0 0 20px ${p.color}44` }}>{p.name}</div>
          </div>
          <div style={{ display: 'flex', gap: 4 }}>{PROJECTS.map((_, i) => (<div key={i} style={{ width: i === active ? 18 : 4, height: 4, background: i === active ? '#FFFF62' : 'rgba(240,236,228,0.2)', transition: 'width 0.3s' }} />))}</div>
        </div>
      )}
      {gameState === 'playing' && (
        <>
          <button onClick={() => setActive(prev => (prev - 1 + N) % N)} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.5)', fontSize: 18, padding: '10px 12px', cursor: 'pointer', zIndex: 5, fontFamily: '"Silkscreen", monospace' }}>&lt;</button>
          <button onClick={() => setActive(prev => (prev + 1) % N)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.5)', fontSize: 18, padding: '10px 12px', cursor: 'pointer', zIndex: 5, fontFamily: '"Silkscreen", monospace' }}>&gt;</button>
        </>
      )}
    </div>
  );
}
