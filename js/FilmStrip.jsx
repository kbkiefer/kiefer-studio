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
const INSET = 0.06;

function projectPoint(mesh, camera, canvas, lx, ly, lz) {
  const v = mesh.localToWorld(new camera.position.constructor(lx, ly, lz));
  v.project(camera);
  return {
    x: (v.x * 0.5 + 0.5) * canvas.clientWidth,
    y: (-v.y * 0.5 + 0.5) * canvas.clientHeight,
    z: v.z,
  };
}

function CRTScreen({ app, splineCanvas, gameState }) {
  const [rect, setRect] = useState(null);
  const [dragX, setDragX] = useState(0);
  const [selectedProject, setSelectedProject] = useState(null);
  const dragRef = useRef({ active: false, startX: 0, startDragX: 0, moved: false });
  const rafRef = useRef(null);
  const stripRef = useRef(null);

  // Track screen mesh position
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
    const rangeX = bb.max.x - bb.min.x;
    const rangeY = bb.max.y - bb.min.y;
    const camera = app._camera;

    const track = () => {
      screenMesh.updateWorldMatrix(true, false);
      const inX = rangeX * INSET;
      const inY = rangeY * INSET;
      const tl = projectPoint(screenMesh, camera, splineCanvas, bb.min.x + inX, bb.max.y - inY, 0);
      const tr = projectPoint(screenMesh, camera, splineCanvas, bb.max.x - inX, bb.max.y - inY, 0);
      const bl = projectPoint(screenMesh, camera, splineCanvas, bb.min.x + inX, bb.min.y + inY, 0);
      const br = projectPoint(screenMesh, camera, splineCanvas, bb.max.x - inX, bb.min.y + inY, 0);

      const left = Math.min(tl.x, tr.x, bl.x, br.x);
      const right = Math.max(tl.x, tr.x, bl.x, br.x);
      const top = Math.min(tl.y, tr.y, bl.y, br.y);
      const bottom = Math.max(tl.y, tr.y, bl.y, br.y);

      const w = right - left;
      const h = bottom - top;
      // Hide only if behind camera (z > 1 means behind near plane)
      const behind = [tl, tr, bl, br].some(p => p.z > 1);
      if (!behind && w > 10 && h > 10) {
        setRect({ left, top, width: w, height: h });
      } else {
        setRect(null);
      }
      rafRef.current = requestAnimationFrame(track);
    };
    rafRef.current = requestAnimationFrame(track);
    return () => cancelAnimationFrame(rafRef.current);
  }, [app, splineCanvas]);

  // Clamp drag position
  const clampDrag = useCallback((x) => {
    if (!stripRef.current || !rect) return x;
    const stripW = stripRef.current.scrollWidth;
    const viewW = rect.width;
    const minX = -(stripW - viewW);
    return Math.max(minX, Math.min(0, x));
  }, [rect]);

  // Mouse drag handlers
  const onPointerDown = useCallback((e) => {
    dragRef.current = { active: true, startX: e.clientX, startDragX: dragX, moved: false };
    e.currentTarget.setPointerCapture(e.pointerId);
  }, [dragX]);

  const onPointerMove = useCallback((e) => {
    if (!dragRef.current.active) return;
    const dx = e.clientX - dragRef.current.startX;
    if (Math.abs(dx) > 4) dragRef.current.moved = true;
    setDragX(clampDrag(dragRef.current.startDragX + dx));
  }, [clampDrag]);

  const onPointerUp = useCallback((e) => {
    dragRef.current.active = false;
  }, []);

  const handleCardClick = useCallback((project, i) => {
    if (dragRef.current.moved) return;
    setSelectedProject(project);
    if (app) app.emitEvent('mouseDown', 'Screen Placeholder');
  }, [app]);

  if (!rect) return null;

  const cardW = rect.width * 0.42;
  const cardGap = rect.width * 0.03;
  const s = rect.width / 600; // scale factor: 1.0 when screen is 600px wide

  return (
    <div
      style={{
        position: 'absolute',
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height,
        zIndex: 1,
        borderRadius: '8% / 10%',
        overflow: 'hidden',
        background: '#060612',
        cursor: dragRef.current.active ? 'grabbing' : 'grab',
        touchAction: 'pan-y',
        userSelect: 'none',
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      {/* CRT glass bubble effect */}
      <div style={{
        position: 'absolute', inset: 0, borderRadius: 'inherit',
        background: 'radial-gradient(ellipse 120% 120% at 40% 35%, rgba(255,255,255,0.04) 0%, transparent 60%)',
        pointerEvents: 'none', zIndex: 10,
      }} />

      {/* Scanlines */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 9, pointerEvents: 'none', borderRadius: 'inherit',
        backgroundImage: 'repeating-linear-gradient(0deg, transparent 0px, transparent 2px, rgba(0,0,0,0.15) 2px, rgba(0,0,0,0.15) 4px)',
        backgroundSize: '100% 4px',
      }} />

      {/* Screen glow edge */}
      <div style={{
        position: 'absolute', inset: 0, borderRadius: 'inherit', pointerEvents: 'none', zIndex: 8,
        boxShadow: 'inset 0 0 30px rgba(0,20,60,0.6), inset 0 0 60px rgba(0,0,0,0.4)',
      }} />

      {/* Draggable project strip */}
      <div
        ref={stripRef}
        style={{
          position: 'absolute',
          top: '8%', bottom: '8%', left: '4%',
          display: 'flex',
          gap: cardGap,
          alignItems: 'stretch',
          transform: `translateX(${dragX}px)`,
          transition: dragRef.current.active ? 'none' : 'transform 0.3s ease-out',
        }}
      >
        {PROJECTS.map((p, i) => (
          <div
            key={i}
            onClick={() => handleCardClick(p, i)}
            style={{
              width: cardW,
              flexShrink: 0,
              borderRadius: '4%',
              border: `1px solid ${p.color}44`,
              background: `linear-gradient(145deg, ${p.color}18 0%, #0a0a1a 60%)`,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              gap: Math.max(2, 8 * s),
              padding: '5%',
              cursor: 'pointer',
              transition: 'border-color 0.2s, background 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = p.color + '88';
              e.currentTarget.style.background = `linear-gradient(145deg, ${p.color}28 0%, #0a0a1a 50%)`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = p.color + '44';
              e.currentTarget.style.background = `linear-gradient(145deg, ${p.color}18 0%, #0a0a1a 60%)`;
            }}
          >
            <div style={{
              fontFamily: '"Silkscreen", monospace',
              fontSize: Math.max(4, 18 * s),
              color: p.color,
              textAlign: 'center',
              letterSpacing: s,
              textShadow: `0 0 ${12 * s}px ${p.color}44`,
              lineHeight: 1.2,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: '100%',
            }}>
              {p.name.toUpperCase()}
            </div>
            <div style={{
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: Math.max(3, 10 * s),
              color: 'rgba(255,255,255,0.35)',
              textAlign: 'center',
              letterSpacing: 0.5 * s,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
            }}>
              {p.tags}
            </div>
            <div style={{
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: Math.max(3, 8 * s),
              color: p.color + '66',
              textTransform: 'uppercase',
              letterSpacing: s,
              whiteSpace: 'nowrap',
            }}>
              {p.tech}
            </div>
          </div>
        ))}
      </div>

      {/* Scroll hint dots */}
      {!selectedProject && (
        <div style={{
          position: 'absolute', bottom: '3%', left: 0, right: 0,
          display: 'flex', justifyContent: 'center', gap: 4, zIndex: 7, pointerEvents: 'none',
        }}>
          {PROJECTS.map((_, i) => {
            const cardCenter = i * (cardW + cardGap) + cardW / 2;
            const viewCenter = -dragX + (rect?.width || 0) / 2;
            const dist = Math.abs(cardCenter - viewCenter);
            const isNear = dist < cardW * 0.7;
            return (
              <div key={i} style={{
                width: isNear ? 10 : 4, height: 4,
                background: isNear ? '#FFFF62' : 'rgba(255,255,255,0.15)',
                borderRadius: 2,
                transition: 'width 0.2s, background 0.2s',
              }} />
            );
          })}
        </div>
      )}

      {/* Selected project detail view */}
      {selectedProject && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 12,
          background: '#060612',
          display: 'flex', flexDirection: 'column',
          padding: '6%',
          animation: 'screenFlicker 0.4s ease-out',
          borderRadius: 'inherit',
        }}>
          <button
            onClick={() => {
              setSelectedProject(null);
              if (app) app.emitEvent('mouseDown', 'Screen Placeholder');
            }}
            style={{
              alignSelf: 'flex-start',
              fontFamily: '"Silkscreen", monospace',
              fontSize: 'clamp(8px, 1.5vw, 12px)',
              color: '#FFFF62',
              background: 'none',
              border: '1px solid #FFFF6244',
              padding: '2% 4%',
              cursor: 'pointer',
              letterSpacing: 1,
              marginBottom: '4%',
            }}
          >
            {'< BACK'}
          </button>
          <div style={{
            fontFamily: '"Silkscreen", monospace',
            fontSize: 'clamp(16px, 4vw, 36px)',
            color: selectedProject.color,
            textShadow: `0 0 20px ${selectedProject.color}44`,
            letterSpacing: 2,
            marginBottom: '3%',
          }}>
            {selectedProject.name.toUpperCase()}
          </div>
          <div style={{
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: 'clamp(9px, 1.5vw, 13px)',
            color: 'rgba(255,255,255,0.5)',
            marginBottom: '4%',
          }}>
            {selectedProject.tags}
          </div>
          <div style={{
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: 'clamp(8px, 1.2vw, 11px)',
            color: selectedProject.color + '88',
            textTransform: 'uppercase',
            letterSpacing: 2,
          }}>
            {selectedProject.tech}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ArcadePortfolio() {
  const [gameState, setGameState] = useState('start');
  const [appLoaded, setAppLoaded] = useState(false);
  const canvasRef = useRef(null);
  const appRef = useRef(null);
  const gameStateRef = useRef('start');
  gameStateRef.current = gameState;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || appRef.current) return;
    const app = new Application(canvas);
    appRef.current = app;
    app.load(SPLINE_URL).then(() => {
      window.__splineApp = app;

      // Make canvas background transparent so HTML behind shows through
      const renderer = app._renderer;
      if (renderer) {
        renderer.setClearAlpha(0);
        renderer.setClearColor(0x000000, 0);
      }
      // Remove scene background color
      if (app._scene && app._scene.background) {
        app._scene.background = null;
      }
      // Hide the Screen Placeholder so it becomes a transparent window
      app._scene.traverse(obj => {
        if (obj.name === 'Screen Placeholder') {
          obj.visible = false;
        }
      });

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

  return (
    <div style={{ width: '100%', height: '100%', position: 'absolute', inset: 0 }}>
      {/* CRT content sits BEHIND the Spline canvas - shows through transparent screen hole */}
      <CRTScreen
        app={appLoaded ? appRef.current : null}
        splineCanvas={canvasRef.current}
        gameState={gameState}
      />

      {/* Spline canvas on top - transparent where Screen Placeholder was */}
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block', touchAction: 'pan-y', position: 'relative', zIndex: 2, pointerEvents: 'none' }} />

      <style>{`
        @keyframes screenFlicker {
          0% { opacity: 0; filter: brightness(3) saturate(0); }
          30% { opacity: 1; filter: brightness(1.8) saturate(0.5); }
          60% { opacity: 0.9; filter: brightness(1.3) saturate(0.8); }
          100% { opacity: 1; filter: brightness(1) saturate(1); }
        }
      `}</style>
    </div>
  );
}
