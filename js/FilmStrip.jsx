import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Application } from '@splinetool/runtime';

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

export default function ArcadePortfolio() {
  const [active, setActive] = useState(0);
  const [gameState, setGameState] = useState('start');
  const canvasRef = useRef(null);
  const appRef = useRef(null);
  const screenMeshRef = useRef(null);
  const crtCanvasRef = useRef(null);
  const updateRef = useRef(null);
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
    document.getElementById('work-modal-body').innerHTML = `<p>${project.desc}</p>`;
    modal.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || appRef.current) return;

    const app = new Application(canvas);
    appRef.current = app;

    app.load(SPLINE_URL).then(() => {
      console.log('Spline loaded via runtime');

      const scene = app._scene;
      if (!scene) { console.log('No _scene'); return; }

      scene.traverse((child) => {
        if (child.isMesh && child.name === 'Screen Placeholder') {
          screenMeshRef.current = child;
          console.log('Screen mesh found:', child.name);

          const crtCanvas = document.createElement('canvas');
          crtCanvas.width = 512;
          crtCanvas.height = 400;
          crtCanvasRef.current = crtCanvas;

          // Get Three.js CanvasTexture from existing textures in scene
          let TexClass = null;
          scene.traverse((c) => {
            if (c.isMesh && c.material) {
              const mat = c.material;
              if (mat.map && mat.map.isTexture && !TexClass) {
                TexClass = mat.map.constructor;
              }
            }
          });

          const existingMat = child.material;
          console.log('Material type:', existingMat.type, 'constructor:', existingMat.constructor.name);
          console.log('Material keys:', Object.keys(existingMat).join(', '));

          drawScreen(crtCanvas, PROJECTS[0], 0, 'start');

          // Try to find any property on the material that accepts a texture/image
          // Spline's NodeMaterial might use different property names
          try {
            // Method 1: Try setting uniforms if it's a shader material
            if (existingMat.uniforms) {
              for (const [key, uniform] of Object.entries(existingMat.uniforms)) {
                console.log('Uniform:', key, typeof uniform.value);
                if (uniform.value && uniform.value.isTexture) {
                  uniform.value.image = crtCanvas;
                  uniform.value.needsUpdate = true;
                  console.log('Set canvas on uniform:', key);
                }
              }
            }

            // Method 2: Try direct map property
            if (existingMat.map && existingMat.map.isTexture) {
              existingMat.map.image = crtCanvas;
              existingMat.map.needsUpdate = true;
              console.log('Set canvas on existing map');
            }

            // Method 3: Search all material properties for texture-like objects
            for (const key of Object.keys(existingMat)) {
              const val = existingMat[key];
              if (val && val.isTexture) {
                val.image = crtCanvas;
                val.needsUpdate = true;
                console.log('Set canvas on property:', key);
              }
            }

            existingMat.needsUpdate = true;
            console.log('Material update attempted');
          } catch(e) {
            console.log('Material update error:', e.message);
          }

          updateRef.current = setInterval(() => {
            drawScreen(crtCanvas, PROJECTS[activeRef.current], activeRef.current, gameStateRef.current);
            const mat = child.material;
            if (mat.map && mat.map.isTexture) { mat.map.needsUpdate = true; }
            if (mat.uniforms) {
              for (const u of Object.values(mat.uniforms)) {
                if (u.value && u.value.isTexture) u.value.needsUpdate = true;
              }
            }
            mat.needsUpdate = true;
          }, 120);
        }
      });
    });

    return () => {
      if (updateRef.current) clearInterval(updateRef.current);
    };
  }, []);

  // Scroll trigger
  useEffect(() => {
    const workSection = document.getElementById('projects');
    if (!workSection) return;

    const onScroll = () => {
      const rect = workSection.getBoundingClientRect();
      const wH = window.innerHeight;
      if (rect.top < wH * 0.4 && rect.bottom > wH * 0.5 && gameStateRef.current === 'start') {
        setGameState('playing');
        if (appRef.current) {
          try { appRef.current.emitEvent('mouseDown', 'INSERT COIN'); } catch(e) {}
        }
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Keyboard
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
    if (Math.abs(e.deltaY) > 30) {
      setActive(prev => ((prev + Math.sign(e.deltaY)) % N + N) % N);
    }
  };

  return (
    <div style={{ width: '100%', height: '100%', position: 'absolute', inset: 0 }} onWheel={onWheel}>
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: '100%', display: 'block', touchAction: 'pan-y' }}
      />

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

function drawScreen(canvas, project, index, state) {
  const W = canvas.width, H = canvas.height;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#080818';
  ctx.fillRect(0, 0, W, H);

  // Scanlines
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
    const tags = project.tags;
    ctx.fillText(tags, (W - ctx.measureText(tags).width) / 2, H / 2 + 15);

    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.font = '12px "Space Grotesk", sans-serif';
    const words = project.desc.split(' ');
    let line = '', ly = H / 2 + 45;
    for (const w of words) {
      const test = line + w + ' ';
      if (ctx.measureText(test).width > W - 40 && line) { ctx.fillText(line, 20, ly); line = w + ' '; ly += 16; }
      else line = test;
    }
    ctx.fillText(line, 20, ly);

    ctx.fillStyle = '#FFFF62';
    ctx.font = 'bold 12px "Silkscreen", monospace';
    const v = 'ENTER: VIEW PROJECT';
    ctx.fillText(v, (W - ctx.measureText(v).width) / 2, H - 25);
  }
}
