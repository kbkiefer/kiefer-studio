import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Application } from '@splinetool/runtime';
import GUI from 'lil-gui';

const SPLINE_URL = 'https://prod.spline.design/xNcB9vIJZhtTQGVX/scene.splinecode';
const INSET = 0.06;

const CATEGORIES = ['Websites', 'Apps', 'Design', 'Concepts'];

const PROJECTS = {
  Websites: [
    { name: 'Kiefer Studio', icon: '🌐' },
    { name: 'ShalaWorks', icon: '⚡' },
    { name: 'ShalaMakes', icon: '🏭' },
    { name: 'Border Child', icon: '🎬' },
    { name: 'Cymatics Lab', icon: '🔊' },
  ],
  Apps: [
    { name: 'Cymatics Lab', icon: '🔊' },
    { name: 'Imago', icon: '🦋' },
    { name: 'ClearMind', icon: '🧠' },
    { name: 'Resonance', icon: '🎵' },
    { name: 'NovaTrade', icon: '📊' },
    { name: 'Dink', icon: '🏓' },
  ],
  Design: [
    { name: 'Brand Systems', icon: '🎨' },
    { name: 'Typography', icon: '🔤' },
    { name: 'Motion', icon: '🎞️' },
    { name: 'Icon Design', icon: '💎' },
  ],
  Concepts: [
    { name: 'Continuum', icon: '👁️' },
    { name: 'AXIS', icon: '🧬' },
    { name: 'Chrysalis', icon: '🎮' },
    { name: 'Shala3D', icon: '🧊' },
  ],
};

const screenConfig = {
  inset: 0.06,
  offsetX: 0,
  offsetY: 0,
  scaleW: 1.0,
  scaleH: 1.0,
  borderRadius: 8,
  showOutline: true,
  screenShowAt: 0.3,
  bootTrigger: 0.55,
};

let debugGui = null;
let onReplayBoot = null;

function initScreenGUI() {
  if (debugGui) return;
  debugGui = new GUI({ title: 'Screen Framing' });
  debugGui.domElement.style.zIndex = '9999';

  const pos = debugGui.addFolder('Position');
  pos.add(screenConfig, 'inset', 0, 0.2, 0.005).name('Inset');
  pos.add(screenConfig, 'offsetX', -200, 200, 1).name('Offset X');
  pos.add(screenConfig, 'offsetY', -200, 200, 1).name('Offset Y');
  pos.add(screenConfig, 'scaleW', 0.5, 1.5, 0.01).name('Scale W');
  pos.add(screenConfig, 'scaleH', 0.5, 1.5, 0.01).name('Scale H');
  pos.add(screenConfig, 'borderRadius', 0, 30, 1).name('Border Radius');

  const timing = debugGui.addFolder('Timing');
  timing.add(screenConfig, 'screenShowAt', 0, 1, 0.01).name('Screen Show At');
  timing.add(screenConfig, 'bootTrigger', 0, 1, 0.01).name('Boot Trigger');

  debugGui.add(screenConfig, 'showOutline').name('Show Outline');
  debugGui.add({ replay: () => onReplayBoot?.() }, 'replay').name('Replay Boot');
  debugGui.add({
    log: () => {
      const out = { ...screenConfig };
      delete out.showOutline;
      console.log('Screen config:', JSON.stringify(out, null, 2));
    },
  }, 'log').name('Log Values');
}

function projectPoint(mesh, camera, canvas, lx, ly, lz) {
  const v = mesh.localToWorld(new camera.position.constructor(lx, ly, lz));
  v.project(camera);
  return {
    x: (v.x * 0.5 + 0.5) * canvas.clientWidth,
    y: (-v.y * 0.5 + 0.5) * canvas.clientHeight,
    z: v.z,
  };
}

function useTypewriter(text, speed, startTyping) {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);
  useEffect(() => {
    if (!startTyping) return;
    setDisplayed('');
    setDone(false);
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) { clearInterval(interval); setDone(true); }
    }, speed);
    return () => clearInterval(interval);
  }, [text, speed, startTyping]);
  return { displayed, done };
}

/* ── Pixel Icon ─────────────────────────────────────────────── */
function PixelIcon({ emoji, size, active }) {
  return (
    <div style={{
      width: size, height: size,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.55,
      background: active
        ? 'linear-gradient(180deg, #2a1a00 0%, #1a0f00 100%)'
        : 'linear-gradient(180deg, #1a1200 0%, #0f0a00 100%)',
      border: active ? '2px solid #ffaa33' : '2px solid #443300',
      boxShadow: active
        ? '0 0 12px rgba(255,170,51,0.4), inset 0 0 8px rgba(255,170,51,0.1)'
        : 'none',
      imageRendering: 'pixelated',
    }}>
      {emoji}
    </div>
  );
}

/* ── Arcade Screen Content ──────────────────────────────────── */
function ArcadeMenu({ s }) {
  const [activeCat, setActiveCat] = useState(1);
  const [activeIdx, setActiveIdx] = useState(0);

  const items = PROJECTS[CATEGORIES[activeCat]];
  const total = items.length;
  const pad = (n) => String(n).padStart(2, '0');

  const prev = () => setActiveIdx((i) => (i - 1 + total) % total);
  const next = () => setActiveIdx((i) => (i + 1) % total);

  const selectCat = (i) => {
    setActiveCat(i);
    setActiveIdx(0);
  };

  const prevIdx = (activeIdx - 1 + total) % total;
  const nextIdx = (activeIdx + 1) % total;
  const iconSize = Math.max(28, 70 * s);
  const amber = '#ffaa33';
  const amberDim = '#664400';
  const amberGlow = 'rgba(255,170,51,0.4)';

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      height: '100%',
      justifyContent: 'space-between',
      padding: `${6 * s}% ${5 * s}%`,
      fontFamily: '"Silkscreen", monospace',
      color: amber,
    }}>
      {/* ─ Crown icon ─ */}
      <div style={{
        textAlign: 'center',
        fontSize: Math.max(8, 16 * s),
        marginBottom: 2 * s,
        filter: `drop-shadow(0 0 4px ${amberGlow})`,
      }}>▼</div>

      {/* ─ Category tabs ─ */}
      <div style={{
        display: 'flex', justifyContent: 'center',
        gap: Math.max(4, 10 * s),
        fontSize: Math.max(5, 11 * s),
        letterSpacing: Math.max(0.5, 1 * s),
        marginBottom: Math.max(4, 10 * s),
      }}>
        {CATEGORIES.map((cat, i) => (
          <span
            key={cat}
            onClick={() => selectCat(i)}
            style={{
              cursor: 'pointer',
              padding: `${2 * s}px ${Math.max(3, 6 * s)}px`,
              border: i === activeCat ? `1px solid ${amber}` : '1px solid transparent',
              color: i === activeCat ? amber : amberDim,
              textShadow: i === activeCat ? `0 0 8px ${amberGlow}` : 'none',
              transition: 'all 0.2s',
              textTransform: 'uppercase',
            }}
          >
            {cat}
          </span>
        ))}
      </div>

      {/* ─ Category + counter ─ */}
      <div style={{
        fontSize: Math.max(5, 10 * s),
        letterSpacing: Math.max(0.5, 1.5 * s),
        color: amberDim,
        marginBottom: Math.max(4, 8 * s),
        textShadow: `0 0 4px rgba(255,170,51,0.2)`,
      }}>
        {'>'} CATEGORY: {CATEGORIES[activeCat].toUpperCase()} {pad(activeIdx + 1)}/{pad(total)}
      </div>

      {/* ─ Carousel ─ */}
      <div style={{
        display: 'flex', alignItems: 'center',
        justifyContent: 'center',
        gap: Math.max(6, 14 * s),
        flex: 1,
        minHeight: 0,
      }}>
        {/* Left arrow */}
        <div
          onClick={prev}
          style={{
            fontSize: Math.max(8, 18 * s),
            color: amber,
            cursor: 'pointer',
            textShadow: `0 0 6px ${amberGlow}`,
            userSelect: 'none',
          }}
        >◄</div>

        {/* Prev item */}
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          gap: Math.max(2, 6 * s),
          opacity: 0.4,
          transform: `scale(0.8)`,
          transition: 'all 0.25s',
        }}>
          <PixelIcon emoji={items[prevIdx].icon} size={iconSize * 0.75} active={false} />
          <span style={{
            fontSize: Math.max(4, 8 * s),
            color: amberDim,
            textTransform: 'uppercase',
            letterSpacing: 0.5 * s,
            textAlign: 'center',
            maxWidth: iconSize,
            overflow: 'hidden',
            whiteSpace: 'nowrap',
            textOverflow: 'ellipsis',
          }}>{items[prevIdx].name}</span>
        </div>

        {/* Active item */}
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          gap: Math.max(4, 8 * s),
          transition: 'all 0.25s',
        }}>
          <PixelIcon emoji={items[activeIdx].icon} size={iconSize} active={true} />
          <span style={{
            fontSize: Math.max(6, 13 * s),
            color: amber,
            textTransform: 'uppercase',
            letterSpacing: Math.max(1, 2 * s),
            textShadow: `0 0 8px ${amberGlow}`,
            textAlign: 'center',
            maxWidth: iconSize * 1.8,
          }}>{items[activeIdx].name}</span>
        </div>

        {/* Next item */}
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          gap: Math.max(2, 6 * s),
          opacity: 0.4,
          transform: `scale(0.8)`,
          transition: 'all 0.25s',
        }}>
          <PixelIcon emoji={items[nextIdx].icon} size={iconSize * 0.75} active={false} />
          <span style={{
            fontSize: Math.max(4, 8 * s),
            color: amberDim,
            textTransform: 'uppercase',
            letterSpacing: 0.5 * s,
            textAlign: 'center',
            maxWidth: iconSize,
            overflow: 'hidden',
            whiteSpace: 'nowrap',
            textOverflow: 'ellipsis',
          }}>{items[nextIdx].name}</span>
        </div>

        {/* Right arrow */}
        <div
          onClick={next}
          style={{
            fontSize: Math.max(8, 18 * s),
            color: amber,
            cursor: 'pointer',
            textShadow: `0 0 6px ${amberGlow}`,
            userSelect: 'none',
          }}
        >►</div>
      </div>

      {/* ─ Score / Credits ─ */}
      <div style={{
        display: 'flex', justifyContent: 'flex-end',
        gap: Math.max(6, 16 * s),
        fontSize: Math.max(4, 8 * s),
        color: amberDim,
        letterSpacing: Math.max(0.5, 1 * s),
        marginTop: Math.max(2, 6 * s),
        textShadow: `0 0 3px rgba(255,170,51,0.15)`,
      }}>
        <span>HI-SCORE: 9999</span>
        <span>CREDITS: 01</span>
      </div>

      {/* ─ Controls legend ─ */}
      <div style={{
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        gap: Math.max(6, 16 * s),
        fontSize: Math.max(4, 9 * s),
        letterSpacing: Math.max(0.5, 1 * s),
        color: amberDim,
        marginTop: Math.max(4, 8 * s),
        paddingTop: Math.max(4, 8 * s),
        borderTop: `1px solid #221500`,
      }}>
        <span>PRESS ► TO SCROLL</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 3 * s }}>
          <span style={{
            display: 'inline-block', width: Math.max(4, 7 * s), height: Math.max(4, 7 * s),
            borderRadius: '50%', background: '#33cc33',
          }} />
          SELECT
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 3 * s }}>
          <span style={{
            display: 'inline-block', width: Math.max(4, 7 * s), height: Math.max(4, 7 * s),
            borderRadius: '50%', background: '#cc3333',
          }} />
          BACK
        </span>
      </div>
    </div>
  );
}

/* ── CRT Screen ─────────────────────────────────────────────── */
function CRTScreen({ app, splineCanvas }) {
  const [rect, setRect] = useState(null);
  const [phase, setPhase] = useState('off');
  const [outline, setOutline] = useState(true);
  const [screenVisible, setScreenVisible] = useState(false);
  const rafRef = useRef(null);
  const hasBooted = useRef(false);

  const boot1 = useTypewriter('KIEFER.STUDIO v1.0', 45, phase === 'boot1');
  const boot2 = useTypewriter('LOADING PORTFOLIO...', 35, phase === 'boot2');

  useEffect(() => {
    onReplayBoot = () => {
      hasBooted.current = false;
      setPhase('off');
      setTimeout(() => {
        hasBooted.current = true;
        setPhase('flicker');
        setTimeout(() => setPhase('boot1'), 400);
      }, 100);
    };
    return () => { onReplayBoot = null; };
  }, []);

  useEffect(() => {
    if (boot1.done && phase === 'boot1') {
      const t = setTimeout(() => setPhase('boot2'), 300);
      return () => clearTimeout(t);
    }
  }, [boot1.done, phase]);

  useEffect(() => {
    if (boot2.done && phase === 'boot2') {
      const t = setTimeout(() => setPhase('clearing'), 400);
      return () => clearTimeout(t);
    }
  }, [boot2.done, phase]);

  useEffect(() => {
    if (phase === 'clearing') {
      const t = setTimeout(() => setPhase('menu'), 350);
      return () => clearTimeout(t);
    }
  }, [phase]);

  // Track screen mesh position
  useEffect(() => {
    if (!app) return;
    let screenMesh = null;
    app._scene.traverse((obj) => {
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
      const cfg = screenConfig;
      const inX = rangeX * cfg.inset;
      const inY = rangeY * cfg.inset;
      const tl = projectPoint(screenMesh, camera, splineCanvas, bb.min.x + inX, bb.max.y - inY, 0);
      const tr = projectPoint(screenMesh, camera, splineCanvas, bb.max.x - inX, bb.max.y - inY, 0);
      const bl = projectPoint(screenMesh, camera, splineCanvas, bb.min.x + inX, bb.min.y + inY, 0);
      const br = projectPoint(screenMesh, camera, splineCanvas, bb.max.x - inX, bb.min.y + inY, 0);

      let left = Math.min(tl.x, tr.x, bl.x, br.x);
      let top = Math.min(tl.y, tr.y, bl.y, br.y);
      let w = Math.max(tl.x, tr.x, bl.x, br.x) - left;
      let h = Math.max(tl.y, tr.y, bl.y, br.y) - top;

      const cx = left + w / 2;
      const cy = top + h / 2;
      w *= cfg.scaleW;
      h *= cfg.scaleH;
      left = cx - w / 2 + cfg.offsetX;
      top = cy - h / 2 + cfg.offsetY;

      const behind = [tl, tr, bl, br].some((p) => p.z > 1);
      if (!behind && w > 10 && h > 10) {
        setRect({ left, top, width: w, height: h });
        setOutline(cfg.showOutline);

        if (splineCanvas) {
          const cW = splineCanvas.clientWidth;
          const cH = splineCanvas.clientHeight;
          const r = cfg.borderRadius * (w / 600);
          const svg = `url("data:image/svg+xml,${encodeURIComponent(
            `<svg xmlns='http://www.w3.org/2000/svg' width='${cW}' height='${cH}'>` +
            `<defs><mask id='m'>` +
            `<rect width='100%' height='100%' fill='white'/>` +
            `<rect x='${left}' y='${top}' width='${w}' height='${h}' rx='${r}' ry='${r}' fill='black'/>` +
            `</mask></defs>` +
            `<rect width='100%' height='100%' fill='white' mask='url(#m)'/>` +
            `</svg>`
          )}")`;
          splineCanvas.style.maskImage = svg;
          splineCanvas.style.webkitMaskImage = svg;
          splineCanvas.style.maskSize = '100% 100%';
          splineCanvas.style.webkitMaskSize = '100% 100%';
        }
      } else {
        setRect(null);
        if (splineCanvas) {
          splineCanvas.style.maskImage = 'none';
          splineCanvas.style.webkitMaskImage = 'none';
        }
      }
      rafRef.current = requestAnimationFrame(track);
    };
    rafRef.current = requestAnimationFrame(track);
    return () => cancelAnimationFrame(rafRef.current);
  }, [app, splineCanvas]);

  // Control screen visibility and boot trigger
  useEffect(() => {
    const section = document.getElementById('projects');
    if (!section) return;
    const onScroll = () => {
      const r = section.getBoundingClientRect();
      const scrolled = window.innerHeight - r.top;
      const progress = scrolled / r.height;
      setScreenVisible(progress >= screenConfig.screenShowAt);
      if (progress > screenConfig.bootTrigger && !hasBooted.current) {
        hasBooted.current = true;
        setPhase('flicker');
        setTimeout(() => setPhase('boot1'), 400);
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (!rect || !screenVisible) return null;

  const s = rect.width / 600;
  const isOff = phase === 'off';
  const isFlicker = phase === 'flicker';
  const showBoot = phase === 'boot1' || phase === 'boot2';
  const showMenu = phase === 'menu';
  const isClearing = phase === 'clearing';
  const br = `${screenConfig.borderRadius}%`;
  const amber = '#ffaa33';

  return (
    <div
      style={{
        position: 'absolute',
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height,
        zIndex: 1,
        borderRadius: `${br} / ${br}`,
        overflow: 'hidden',
        background: '#0a0600',
        userSelect: 'none',
        outline: outline ? '2px solid #ff0066' : 'none',
      }}
    >
      {/* CRT glass bubble */}
      <div style={{
        position: 'absolute', inset: 0, borderRadius: 'inherit',
        background: 'radial-gradient(ellipse 120% 120% at 40% 35%, rgba(255,180,60,0.03) 0%, transparent 60%)',
        pointerEvents: 'none', zIndex: 10,
      }} />

      {/* Scanlines */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 9, pointerEvents: 'none', borderRadius: 'inherit',
        backgroundImage: 'repeating-linear-gradient(0deg, transparent 0px, transparent 2px, rgba(0,0,0,0.12) 2px, rgba(0,0,0,0.12) 4px)',
        backgroundSize: '100% 4px',
      }} />

      {/* Screen edge glow */}
      <div style={{
        position: 'absolute', inset: 0, borderRadius: 'inherit', pointerEvents: 'none', zIndex: 8,
        boxShadow: 'inset 0 0 40px rgba(255,150,30,0.08), inset 0 0 80px rgba(0,0,0,0.5)',
      }} />

      {/* Power-on flicker */}
      {isFlicker && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 11, borderRadius: 'inherit',
          animation: 'crtPowerOn 0.4s ease-out forwards',
          background: amber,
        }} />
      )}

      {/* Screen content */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 5,
        opacity: isOff || isFlicker ? 0 : 1,
        transition: 'opacity 0.3s',
      }}>
        {/* Boot text */}
        {(showBoot || isClearing) && (
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', flexDirection: 'column',
            justifyContent: 'center',
            padding: `${10 * s}%`,
            opacity: isClearing ? 0 : 1,
            transition: 'opacity 0.3s',
          }}>
            <div style={{
              fontFamily: '"Silkscreen", monospace',
              fontSize: Math.max(6, 14 * s),
              color: amber,
              letterSpacing: Math.max(0.5, 1 * s),
              lineHeight: 2.2,
              textShadow: `0 0 8px rgba(255,170,51,0.4)`,
            }}>
              {boot1.displayed}
            </div>
            <div style={{
              fontFamily: '"Silkscreen", monospace',
              fontSize: Math.max(5, 11 * s),
              color: amber,
              letterSpacing: Math.max(0.5, 1 * s),
              lineHeight: 2,
              opacity: 0.6,
              textShadow: `0 0 6px rgba(255,170,51,0.3)`,
            }}>
              {boot2.displayed}
            </div>
            <span style={{
              fontFamily: '"Silkscreen", monospace',
              fontSize: Math.max(6, 14 * s),
              color: amber,
              animation: 'cursorBlink 0.6s step-end infinite',
            }}>_</span>
          </div>
        )}

        {/* Arcade menu */}
        {showMenu && (
          <ArcadeMenu s={s} />
        )}
      </div>

      <style>{`
        @keyframes crtPowerOn {
          0% { opacity: 0; }
          15% { opacity: 0.8; }
          30% { opacity: 0.1; }
          50% { opacity: 0.6; }
          70% { opacity: 0.05; }
          85% { opacity: 0.3; }
          100% { opacity: 0; }
        }
        @keyframes cursorBlink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}

/* ── Main Component ─────────────────────────────────────────── */
export default function ArcadePortfolio() {
  const [appLoaded, setAppLoaded] = useState(false);
  const canvasRef = useRef(null);
  const appRef = useRef(null);

  useEffect(() => {
    initScreenGUI();
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

  return (
    <div style={{ width: '100%', height: '100%', position: 'absolute', inset: 0 }}>
      <CRTScreen
        app={appLoaded ? appRef.current : null}
        splineCanvas={canvasRef.current}
      />
      <canvas
        ref={canvasRef}
        style={{
          width: '100%', height: '100%', display: 'block',
          touchAction: 'pan-y', position: 'relative', zIndex: 2, pointerEvents: 'none',
        }}
      />
    </div>
  );
}
