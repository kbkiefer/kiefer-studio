/**
 * FilmStripControls.tsx
 *
 * Live-tweak control panel. Use during development to dial in the look.
 * Hide in production by passing `showControls={false}` to <FilmStripScene />.
 */

import { useState } from 'react';
import type { UseFilmStripParamsReturn, FilmStripParams } from './useFilmStripParams';

interface ControlsProps {
  api: UseFilmStripParamsReturn;
}

export function FilmStripControls({ api }: ControlsProps) {
  const { params, setParam, applyLookPreset, applyCurvePreset, reset } = api;
  const [collapsed, setCollapsed] = useState(false);

  if (collapsed) {
    return (
      <button
        onClick={() => setCollapsed(false)}
        style={{ ...buttonStyle, position: 'absolute', top: 12, right: 12 }}
      >
        Show Controls
      </button>
    );
  }

  return (
    <div style={panelStyle}>
      <div style={headerStyle}>
        <strong>Film Strip Controls</strong>
        <button onClick={() => setCollapsed(true)} style={smallButtonStyle}>
          Hide
        </button>
      </div>

      <Section title="Look Presets">
        <Row>
          <button onClick={() => applyLookPreset('cinematic')} style={buttonStyle}>
            Cinematic
          </button>
          <button onClick={() => applyLookPreset('studio')} style={buttonStyle}>
            Studio
          </button>
          <button onClick={() => applyLookPreset('moody')} style={buttonStyle}>
            Moody
          </button>
          <button onClick={() => applyLookPreset('warm')} style={buttonStyle}>
            Warm
          </button>
        </Row>
      </Section>

      <Section title="Curve Presets">
        <Row>
          <button onClick={() => applyCurvePreset('custom')} style={buttonStyle}>
            Custom
          </button>
          <button onClick={() => applyCurvePreset('oval')} style={buttonStyle}>
            Oval
          </button>
          <button onClick={() => applyCurvePreset('circle')} style={buttonStyle}>
            Circle
          </button>
        </Row>
      </Section>

      <Section title="Sections">
        <Slider label="Sections" value={params.sectionCount} min={3} max={20} step={1}
          onChange={(v) => setParam('sectionCount', v)} />
        <Slider label="Bend Steps" value={params.bendSteps} min={8} max={48} step={1}
          onChange={(v) => setParam('bendSteps', v)} />
        <Slider label="Tilt (deg)" value={params.stripTilt} min={-30} max={30} step={1}
          onChange={(v) => setParam('stripTilt', v)} />
      </Section>

      <Section title="Camera">
        <Slider label="Y" value={params.cameraY} min={-2} max={12} step={0.1}
          onChange={(v) => setParam('cameraY', v)} />
        <Slider label="Z" value={params.cameraZ} min={3} max={25} step={0.5}
          onChange={(v) => setParam('cameraZ', v)} />
        <Slider label="FOV" value={params.cameraFov} min={20} max={80} step={1}
          onChange={(v) => setParam('cameraFov', v)} />
      </Section>

      <Section title="Strip Material">
        <ColorRow label="Color" value={params.bodyColor}
          onChange={(v) => setParam('bodyColor', v)} />
        <Slider label="Roughness" value={params.bodyRoughness} min={0} max={1} step={0.01}
          onChange={(v) => setParam('bodyRoughness', v)} />
        <Slider label="Metalness" value={params.bodyMetalness} min={0} max={1} step={0.01}
          onChange={(v) => setParam('bodyMetalness', v)} />
        <ColorRow label="Emissive" value={params.bodyEmissive}
          onChange={(v) => setParam('bodyEmissive', v)} />
        <CheckRow label="Unlit Thumbnails" value={params.placeholderUnlit}
          onChange={(v) => setParam('placeholderUnlit', v)} />
      </Section>

      <Section title="Lighting">
        <Slider label="Ambient" value={params.ambientIntensity} min={0} max={3} step={0.05}
          onChange={(v) => setParam('ambientIntensity', v)} />
        <ColorRow label="Ambient Color" value={params.ambientColor}
          onChange={(v) => setParam('ambientColor', v)} />
        <Slider label="Key" value={params.keyIntensity} min={0} max={3} step={0.05}
          onChange={(v) => setParam('keyIntensity', v)} />
        <ColorRow label="Key Color" value={params.keyColor}
          onChange={(v) => setParam('keyColor', v)} />
        <Slider label="Key X" value={params.keyX} min={-15} max={15} step={0.5}
          onChange={(v) => setParam('keyX', v)} />
        <Slider label="Key Y" value={params.keyY} min={-5} max={20} step={0.5}
          onChange={(v) => setParam('keyY', v)} />
        <Slider label="Key Z" value={params.keyZ} min={-15} max={15} step={0.5}
          onChange={(v) => setParam('keyZ', v)} />
        <Slider label="Fill" value={params.fillIntensity} min={0} max={3} step={0.05}
          onChange={(v) => setParam('fillIntensity', v)} />
        <ColorRow label="Fill Color" value={params.fillColor}
          onChange={(v) => setParam('fillColor', v)} />
      </Section>

      <Section title="Scene">
        <ColorRow label="Background" value={params.backgroundColor}
          onChange={(v) => setParam('backgroundColor', v)} />
        <CheckRow label="Fog" value={params.fogEnabled}
          onChange={(v) => setParam('fogEnabled', v)} />
        <Slider label="Fog Near" value={params.fogNear} min={1} max={30} step={0.5}
          onChange={(v) => setParam('fogNear', v)} />
        <Slider label="Fog Far" value={params.fogFar} min={5} max={60} step={0.5}
          onChange={(v) => setParam('fogFar', v)} />
      </Section>

      <Section title="Motion">
        <Slider label="Auto-Scroll" value={params.autoScrollSpeed} min={-1} max={1} step={0.01}
          onChange={(v) => setParam('autoScrollSpeed', v)} />
      </Section>

      <Section title="Curve Points">
        {params.controlPoints.map((pt, i) => (
          <div key={i} style={{ marginBottom: 6, borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: 4 }}>
            <div style={{ fontSize: 10, opacity: 0.4, marginBottom: 2 }}>Point {i}</div>
            <Slider label="X" value={pt[0]} min={-15} max={15} step={0.1}
              onChange={(v) => {
                const pts = params.controlPoints.map(p => [...p] as [number, number, number]);
                pts[i][0] = v;
                setParam('controlPoints', pts);
              }} />
            <Slider label="Y" value={pt[1]} min={-5} max={5} step={0.1}
              onChange={(v) => {
                const pts = params.controlPoints.map(p => [...p] as [number, number, number]);
                pts[i][1] = v;
                setParam('controlPoints', pts);
              }} />
            <Slider label="Z" value={pt[2]} min={-15} max={15} step={0.1}
              onChange={(v) => {
                const pts = params.controlPoints.map(p => [...p] as [number, number, number]);
                pts[i][2] = v;
                setParam('controlPoints', pts);
              }} />
          </div>
        ))}
      </Section>

      <Row>
        <button onClick={reset} style={buttonStyle}>
          Reset to Defaults
        </button>
        <button
          onClick={() => navigator.clipboard?.writeText(JSON.stringify(params, null, 2))}
          style={buttonStyle}
        >
          Copy Params
        </button>
      </Row>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Reusable small UI bits
// ---------------------------------------------------------------------------

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 11, opacity: 0.55, textTransform: 'uppercase', marginBottom: 6, letterSpacing: 0.5 }}>
        {title}
      </div>
      {children}
    </div>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>{children}</div>;
}

function Slider({
  label, value, min, max, step, onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}) {
  return (
    <div style={rowStyle}>
      <label style={labelStyle}>{label}</label>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        style={{ flex: 1, accentColor: '#ff77aa' }}
      />
      <span style={valueStyle}>
        {Math.abs(value) < 1 ? value.toFixed(2) : value.toFixed(1)}
      </span>
    </div>
  );
}

function ColorRow({
  label, value, onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div style={rowStyle}>
      <label style={labelStyle}>{label}</label>
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={colorInputStyle}
      />
    </div>
  );
}

function CheckRow({
  label, value, onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div style={rowStyle}>
      <label style={labelStyle}>{label}</label>
      <input
        type="checkbox"
        checked={value}
        onChange={(e) => onChange(e.target.checked)}
        style={{ marginLeft: 'auto' }}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Inline styles (so this stays self-contained — no CSS files to wire up)
// ---------------------------------------------------------------------------

const panelStyle: React.CSSProperties = {
  position: 'absolute',
  top: 12,
  right: 12,
  width: 280,
  maxHeight: 'calc(100vh - 24px)',
  overflowY: 'auto',
  background: 'rgba(12, 12, 14, 0.92)',
  backdropFilter: 'blur(8px)',
  color: 'rgba(255, 255, 255, 0.85)',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  fontSize: 12,
  padding: 14,
  borderRadius: 8,
  border: '1px solid rgba(255, 255, 255, 0.08)',
  zIndex: 10,
  pointerEvents: 'auto',
};

const headerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 12,
  paddingBottom: 8,
  borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
};

const rowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  marginBottom: 4,
};

const labelStyle: React.CSSProperties = {
  fontSize: 11,
  opacity: 0.7,
  width: 80,
  flexShrink: 0,
};

const valueStyle: React.CSSProperties = {
  fontSize: 10,
  fontFamily: 'ui-monospace, monospace',
  opacity: 0.6,
  width: 36,
  textAlign: 'right',
};

const buttonStyle: React.CSSProperties = {
  padding: '6px 10px',
  background: 'rgba(255, 255, 255, 0.06)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: 4,
  color: 'rgba(255, 255, 255, 0.85)',
  fontSize: 11,
  cursor: 'pointer',
  fontFamily: 'inherit',
};

const smallButtonStyle: React.CSSProperties = {
  ...buttonStyle,
  padding: '2px 6px',
  fontSize: 10,
};

const colorInputStyle: React.CSSProperties = {
  width: 38,
  height: 22,
  background: 'transparent',
  border: '1px solid rgba(255, 255, 255, 0.2)',
  borderRadius: 3,
  padding: 0,
  cursor: 'pointer',
  marginLeft: 'auto',
};
