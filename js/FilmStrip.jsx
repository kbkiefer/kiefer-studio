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

function CRTOverlay({ active, gameState, projects }) {
  const canvasRef = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (gameState === 'playing') {
      const timer = setTimeout(() => setVisible(true), 500);
      return () => clearTimeout(timer);
    } else {
      setVisible(false);
    }
  }, [gameState]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !visible) return;
    const ctx = canvas.getContext('2d');
    const W = 512, H = 400;
    const p = projects[active];

    ctx.fillStyle = '#080818';
    ctx.fillRect(0, 0, W, H);

    for (let y = 0; y < H; y += 3) { ctx.fillStyle = 'rgba(255,255,255,0.02)'; ctx.fillRect(0, y, W, 1); }

    ctx.fillStyle = p.color; ctx.globalAlpha = 0.12; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1;
    ctx.strokeStyle = p.color; ctx.lineWidth = 2; ctx.strokeRect(10, 10, W - 20, H - 20);

    ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.font = '11px "JetBrains Mono", monospace';
    ctx.fillText(`${String(active + 1).padStart(2, '0')}/${projects.length}`, 16, 26);
    ctx.textAlign = 'right'; ctx.fillText(p.tech, W - 16, 26); ctx.textAlign = 'left';

    ctx.fillStyle = p.color; ctx.font = 'bold 36px "Silkscreen", monospace';
    const name = p.name.toUpperCase();
    ctx.fillText(name, (W - ctx.measureText(name).width) / 2, H / 2 - 15);

    ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.font = '13px "JetBrains Mono", monospace';
    ctx.fillText(p.tags, (W - ctx.measureText(p.tags).width) / 2, H / 2 + 15);

    ctx.fillStyle = '#FFFF62'; ctx.font = 'bold 12px "Silkscreen", monospace';
    const v = 'ENTER: VIEW PROJECT';
    ctx.fillText(v, (W - ctx.measureText(v).width) / 2, H - 25);
  }, [active, visible, projects]);

  if (!visible) return null;

  return (
    <div style={{
      position: 'absolute',
      top: '50%', left: '50%',
      transform: 'translate(-50%, -60%)',
      width: 'min(52vw, 52vh * 1.28)',
      aspectRatio: '512 / 400',
      maxWidth: '600px',
      zIndex: 3,
      borderRadius: 'clamp(6px, 1vw, 14px)',
      overflow: 'hidden',
      background: '#080818',
      boxShadow: '0 0 40px rgba(0,100,255,0.12), inset 0 0 80px rgba(0,0,0,0.4)',
      animation: 'screenFlicker 0.6s ease-out',
      pointerEvents: 'none',
    }}>
      <canvas ref={canvasRef} width={512} height={400} style={{
        width: '100%', height: '100%', imageRendering: 'pixelated', display: 'block',
      }} />
      <style>{`
        @keyframes screenFlicker {
          0% { opacity: 0; filter: brightness(3) saturate(0); }
          30% { opacity: 1; filter: brightness(2) saturate(0.5); }
          60% { opacity: 0.8; filter: brightness(1.5) saturate(0.8); }
          100% { opacity: 1; filter: brightness(1) saturate(1); }
        }
      `}</style>
    </div>
  );
}

export default function ArcadePortfolio() {
  const [active, setActive] = useState(0);
  const [gameState, setGameState] = useState('start');
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
    app.load(SPLINE_URL);
  }, []);

  useEffect(() => {
    const el = document.getElementById('projects');
    if (!el) return;
    const onScroll = () => {
      const r = el.getBoundingClientRect();
      if (r.top < window.innerHeight * 0.4 && r.bottom > window.innerHeight * 0.5 && gameStateRef.current === 'start') {
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

      {/* CRT Screen overlay - fades in after zoom */}
      <CRTOverlay active={active} gameState={gameState} projects={PROJECTS} />

      {/* CRT Screen overlay - appears after zoom in */}
      {gameState === 'playing' && (
        <div id="crt-overlay" style={{
          position: 'absolute',
          top: '12%',
          left: '24%',
          width: '52%',
          height: '52%',
          zIndex: 3,
          borderRadius: '12px',
          overflow: 'hidden',
          background: '#080818',
          boxShadow: '0 0 30px rgba(0,100,255,0.15), inset 0 0 60px rgba(0,0,0,0.5)',
          opacity: 0,
          animation: 'screenOn 0.8s ease-out 0.3s forwards',
        }}>
          <canvas ref={screenCanvasRef} width={512} height={400} style={{
            width: '100%',
            height: '100%',
            imageRendering: 'pixelated',
          }} />
        </div>
      )}
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
