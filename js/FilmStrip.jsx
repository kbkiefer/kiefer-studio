import React, { useState, useEffect, useRef, Suspense, useCallback } from 'react';

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
const SPLINE_URL = 'https://prod.spline.design/xNcB9vIJZhtTQGVX/scene.splinecode';

const SplineScene = React.lazy(() => import('@splinetool/react-spline'));

export default function ArcadePortfolio() {
  const [active, setActive] = useState(0);
  const [gameState, setGameState] = useState('start');
  const splineRef = useRef(null);
  const crtOverlayRef = useRef(null);
  const p = PROJECTS[active];

  useEffect(() => {
    const canvas = crtOverlayRef.current;
    if (!canvas) return;

    canvas.width = 512;
    canvas.height = 400;
    const ctx = canvas.getContext('2d');

    const proj = PROJECTS[active];

    ctx.fillStyle = '#050510';
    ctx.fillRect(0, 0, 512, 400);

    for (let y = 0; y < 400; y += 2) {
      ctx.fillStyle = 'rgba(255,255,255,0.025)';
      ctx.fillRect(0, y, 512, 1);
    }

    if (gameState !== 'playing') {
      ctx.fillStyle = '#FFFF62';
      ctx.font = 'bold 42px "Silkscreen", monospace';
      const title = 'KIEFER';
      const tm = ctx.measureText(title);
      ctx.fillText(title, (512 - tm.width) / 2, 160);

      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.font = '12px "Silkscreen", monospace';
      const sub = 'PORTFOLIO ARCADE';
      const sm = ctx.measureText(sub);
      ctx.fillText(sub, (512 - sm.width) / 2, 190);

      ctx.fillStyle = '#FFFF62';
      ctx.font = 'bold 16px "Silkscreen", monospace';
      const ins = '> INSERT COIN <';
      const im = ctx.measureText(ins);
      ctx.fillText(ins, (512 - im.width) / 2, 240);
    } else {
      ctx.fillStyle = proj.color;
      ctx.globalAlpha = 0.12;
      ctx.fillRect(0, 0, 512, 400);
      ctx.globalAlpha = 1;

      ctx.strokeStyle = proj.color;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(8, 8, 496, 384);

      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.font = '10px "JetBrains Mono", monospace';
      ctx.fillText(`${String(active + 1).padStart(2, '0')}/${N}`, 14, 22);
      ctx.textAlign = 'right';
      ctx.fillText(proj.tech, 498, 22);
      ctx.textAlign = 'left';

      ctx.fillStyle = proj.color;
      ctx.font = 'bold 34px "Silkscreen", monospace';
      const name = proj.name.toUpperCase();
      const nm = ctx.measureText(name);
      ctx.fillText(name, (512 - nm.width) / 2, 180);

      ctx.fillStyle = 'rgba(255,255,255,0.45)';
      ctx.font = '12px "JetBrains Mono", monospace';
      const tgm = ctx.measureText(proj.tags);
      ctx.fillText(proj.tags, (512 - tgm.width) / 2, 210);

      ctx.fillStyle = '#FFFF62';
      ctx.font = 'bold 11px "Silkscreen", monospace';
      const view = 'ENTER: VIEW PROJECT';
      const vm = ctx.measureText(view);
      ctx.fillText(view, (512 - vm.width) / 2, 380);
    }
  }, [active, gameState]);

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
      if (gameState !== 'playing') return;
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

  const screenUpdateInterval = useRef(null);

  function makeScreenCanvas(project, index, state) {
    const W = 512, H = 400;
    const c = screenCanvasRef.current || document.createElement('canvas');
    screenCanvasRef.current = c;
    c.width = W; c.height = H;
    const ctx = c.getContext('2d');

    ctx.fillStyle = '#050510';
    ctx.fillRect(0, 0, W, H);

    // Scanlines
    for (let y = 0; y < H; y += 2) {
      ctx.fillStyle = 'rgba(255,255,255,0.02)';
      ctx.fillRect(0, y, W, 1);
    }

    if (state !== 'playing') {
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
      const words = project.desc.split(' ');
      let line = '', ly = H / 2 + 36;
      for (const w of words) {
        const test = line + w + ' ';
        if (ctx.measureText(test).width > W - 40 && line) { ctx.fillText(line, 20, ly); line = w + ' '; ly += 16; }
        else line = test;
        if (ly > 380) break;
      }
      ctx.fillText(line, 20, ly);

      ctx.fillStyle = '#FFFF62';
      ctx.font = 'bold 11px "Silkscreen", monospace';
      const view = 'ENTER: VIEW PROJECT';
      const vm = ctx.measureText(view);
      ctx.fillText(view, (W - vm.width) / 2, H - 20);
    }

    return c;
  }

  function updateSplineScreen() {
    // No-op for now - screen handled by Spline
  }

  const screenMeshRef = useRef(null);

  function onSplineLoad(splineApp) {
    splineRef.current = splineApp;

    try {
      const scene = splineApp._scene;
      if (!scene) return;

      scene.traverse((child) => {
        if (child.isMesh && child.name === 'Screen Placeholder') {
          screenMeshRef.current = child;

          // Create canvas
          const canvas = document.createElement('canvas');
          canvas.width = 512;
          canvas.height = 400;

          // Get CanvasTexture from Spline's internal Three.js
          // Find any existing texture in the scene to get the constructor
          let TextureClass = null;
          scene.traverse((c) => {
            if (c.isMesh && c.material && c.material.map && !TextureClass) {
              TextureClass = c.material.map.constructor;
            }
          });

          if (!TextureClass) {
            // Fallback: use the Texture base class from the mesh
            const proto = Object.getPrototypeOf(child.material);
            console.log('Material type:', child.material.type);
            // Try creating a basic texture manually
            const tex = { image: canvas, needsUpdate: true, isTexture: true, flipY: true };
            Object.setPrototypeOf(tex, Object.getPrototypeOf(child.material.map || {}));
          }

          // Direct approach: create a texture using the same class
          if (TextureClass) {
            const tex = new TextureClass(canvas);
            tex.flipY = false;
            tex.needsUpdate = true;

            // Replace material
            const MatClass = child.material.constructor;
            child.material = new MatClass({ map: tex, toneMapped: false });
            child.material.map = tex;
            child.material.needsUpdate = true;

            // Store for updates
            screenMeshRef.current._crtCanvas = canvas;
            screenMeshRef.current._crtTexture = tex;

            drawScreen(canvas, PROJECTS[0], 0, 'start');
            console.log('Screen texture applied successfully');
          } else {
            console.log('No TextureClass found, trying direct assignment');
            // Last resort: just draw to canvas and assign directly
            drawScreen(canvas, PROJECTS[0], 0, 'start');

            if (child.material.map) {
              child.material.map.image = canvas;
              child.material.map.needsUpdate = true;
            }
          }

          // Update loop
          screenUpdateInterval.current = setInterval(() => {
            const mesh = screenMeshRef.current;
            if (!mesh || !mesh._crtCanvas) return;
            drawScreen(mesh._crtCanvas, PROJECTS[active], active, gameState);
            if (mesh._crtTexture) mesh._crtTexture.needsUpdate = true;
            if (mesh.material && mesh.material.map) mesh.material.map.needsUpdate = true;
          }, 150);
        }
      });
    } catch(e) {
      console.log('Screen setup error:', e.message);
    }
  }

  function drawScreen(canvas, project, index, state) {
    const W = canvas.width, H = canvas.height;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#080818';
    ctx.fillRect(0, 0, W, H);

    for (let y = 0; y < H; y += 3) {
      ctx.fillStyle = 'rgba(255,255,255,0.02)';
      ctx.fillRect(0, y, W, 1);
    }

    if (state !== 'playing') {
      ctx.fillStyle = '#FFFF62';
      ctx.font = 'bold 44px "Silkscreen", monospace';
      const t = 'KIEFER';
      ctx.fillText(t, (W - ctx.measureText(t).width) / 2, H / 2 - 40);

      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.font = '14px "Silkscreen", monospace';
      const s = 'PORTFOLIO ARCADE';
      ctx.fillText(s, (W - ctx.measureText(s).width) / 2, H / 2 - 5);

      ctx.fillStyle = '#FFFF62';
      ctx.font = 'bold 18px "Silkscreen", monospace';
      const ins = '> INSERT COIN <';
      ctx.fillText(ins, (W - ctx.measureText(ins).width) / 2, H / 2 + 50);
    } else {
      ctx.fillStyle = project.color;
      ctx.globalAlpha = 0.15;
      ctx.fillRect(0, 0, W, H);
      ctx.globalAlpha = 1;

      ctx.strokeStyle = project.color;
      ctx.lineWidth = 2;
      ctx.strokeRect(10, 10, W - 20, H - 20);

      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.font = '11px "JetBrains Mono", monospace';
      ctx.fillText(`${String(index + 1).padStart(2, '0')}/${N}`, 16, 26);
      ctx.textAlign = 'right';
      ctx.fillText(project.tech, W - 16, 26);
      ctx.textAlign = 'left';

      ctx.fillStyle = project.color;
      ctx.font = 'bold 36px "Silkscreen", monospace';
      const name = project.name.toUpperCase();
      ctx.fillText(name, (W - ctx.measureText(name).width) / 2, H / 2 - 15);

      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.font = '13px "JetBrains Mono", monospace';
      ctx.fillText(project.tags, (W - ctx.measureText(project.tags).width) / 2, H / 2 + 15);

      ctx.fillStyle = '#FFFF62';
      ctx.font = 'bold 12px "Silkscreen", monospace';
      const v = 'ENTER: VIEW PROJECT';
      ctx.fillText(v, (W - ctx.measureText(v).width) / 2, H - 25);
    }
  }

  useEffect(() => {
    return () => {
      if (screenUpdateInterval.current) clearInterval(screenUpdateInterval.current);
    };
  }, []);

  useEffect(() => {
    updateSplineScreen();
  }, [active, gameState]);

  useEffect(() => {
    const workSection = document.getElementById('projects');
    if (!workSection) return;

    const onScroll = () => {
      const rect = workSection.getBoundingClientRect();
      const wH = window.innerHeight;

      if (rect.top < wH * 0.4 && rect.bottom > wH * 0.5 && gameState === 'start') {
        setGameState('playing');
        if (splineRef.current) {
          try { splineRef.current.emitEvent('mouseDown', 'INSERT COIN'); } catch(e) {}
        }
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [gameState]);

  return (
    <div style={{ width: '100%', height: '100%', position: 'absolute', inset: 0 }} onWheel={onWheel}>

      {/* Hidden - texture applied directly to Spline mesh */}
      <canvas ref={crtOverlayRef} style={{ display: 'none' }} />
      <Suspense fallback={
        <div style={{
          width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: '#0a0a14', color: '#FFFF62', fontFamily: '"Silkscreen", monospace', fontSize: 16,
        }}>Loading Arcade...</div>
      }>
        <SplineScene
          scene={SPLINE_URL}
          onLoad={onSplineLoad}
          style={{ width: '100%', height: '100%', touchAction: 'pan-y' }}
        />
      </Suspense>

      {/* HUD overlay */}

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

      <style>{`@keyframes blink { 0%,60% { opacity: 1; } 61%,100% { opacity: 0.3; } }`}</style>
    </div>
  );
}
