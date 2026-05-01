/**
 * useFilmStripParams.ts
 *
 * Central hook that holds every tunable parameter for the film strip scene.
 * The defaults match the look you locked in during the preview tool.
 *
 * Usage:
 *   const { params, setParam, applyLookPreset, applyCurvePreset } = useFilmStripParams();
 *
 * Pass `params` down to <FilmStrip /> and <FilmStripScene />.
 * Use `setParam('bodyColor', '#000')` to change a single value.
 * Use `applyLookPreset('cinematic')` to swap the whole look.
 */

import { useState, useCallback } from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface FilmStripParams {
  // Geometry / instances
  sectionCount: number;        // distinct sections cycled through (drives texture variety)
  bendSteps: number;           // length-direction subdivisions per segment
  stripTilt: number;           // overall tilt of the whole loop in degrees (around X)

  // Camera
  cameraX: number;
  cameraY: number;
  cameraZ: number;
  cameraFov: number;
  lookAtX: number;
  lookAtY: number;
  lookAtZ: number;

  // Strip material
  bodyColor: string;
  bodyRoughness: number;
  bodyMetalness: number;
  bodyEmissive: string;
  placeholderUnlit: boolean;
  placeholderRoughness: number;
  placeholderEmissiveIntensity: number;

  // Lighting
  ambientIntensity: number;
  ambientColor: string;
  keyIntensity: number;
  keyColor: string;
  keyX: number;
  keyY: number;
  keyZ: number;
  fillIntensity: number;
  fillColor: string;

  // Scene + fog
  backgroundColor: string;
  fogNear: number;
  fogFar: number;
  fogEnabled: boolean;

  // Auto-scroll
  autoScrollSpeed: number;     // strip auto-rotates around the loop; 0 to disable
  damping: number;             // momentum smoothing for user drag

  // Curve points (closed loop, in stripGroup-local coords)
  controlPoints: [number, number, number][];
}

// ---------------------------------------------------------------------------
// Default params — locked-in cinematic look from the preview tool
// ---------------------------------------------------------------------------

export const DEFAULT_PARAMS: FilmStripParams = {
  sectionCount: 8,
  bendSteps: 24,
  stripTilt: -8,

  cameraX: 0,
  cameraY: 3,
  cameraZ: 11,
  cameraFov: 35,
  lookAtX: 0,
  lookAtY: 0,
  lookAtZ: 0,

  bodyColor: '#0c0c0f',
  bodyRoughness: 0.95,
  bodyMetalness: 0.0,
  bodyEmissive: '#000000',
  placeholderUnlit: true,
  placeholderRoughness: 0.6,
  placeholderEmissiveIntensity: 0.0,

  ambientIntensity: 0.35,
  ambientColor: '#ffffff',
  keyIntensity: 0.7,
  keyColor: '#ffffff',
  keyX: 4,
  keyY: 10,
  keyZ: 6,
  fillIntensity: 0.12,
  fillColor: '#7898ff',

  backgroundColor: '#020203',
  fogNear: 6,
  fogFar: 22,
  fogEnabled: true,

  autoScrollSpeed: 0.05,        // gentle drift for hero use
  damping: 0.12,

  // Your locked-in 17-point curve
  controlPoints: [
    [-1.90, -0.53, 6.46],
    [-0.52, -0.39, 7.74],
    [ 1.34, -0.06, 6.41],
    [ 0.03,  0.31, 2.99],
    [ 1.34,  0.78, -0.31],
    [ 0.33,  1.18, -6.06],
    [ 0.82,  1.76, -7.89],
    [-0.27,  2.09, -7.85],
    [-1.77,  2.03, -7.73],
    [-3.46,  1.97, -9.71],
    [-5.12,  1.23, -9.96],
    [-7.83,  0.55, -9.95],
    [-8.80,  0.28, -7.97],
    [-7.36, -0.12, -4.61],
    [-6.63, -0.19, -2.61],
    [-5.90, -0.43, -0.33],
    [-2.35, -0.79, 3.12],
  ],
};

// ---------------------------------------------------------------------------
// Look presets — one-click style swaps
// ---------------------------------------------------------------------------

type LookPresetKey = 'cinematic' | 'studio' | 'moody' | 'warm';

export const LOOK_PRESETS: Record<LookPresetKey, Partial<FilmStripParams>> = {
  cinematic: {
    bodyColor: '#0c0c0f',
    bodyRoughness: 0.95,
    bodyMetalness: 0.0,
    bodyEmissive: '#000000',
    placeholderUnlit: true,
    ambientIntensity: 0.35,
    ambientColor: '#ffffff',
    keyIntensity: 0.7,
    keyColor: '#ffffff',
    keyX: 4, keyY: 10, keyZ: 6,
    fillIntensity: 0.12,
    fillColor: '#7898ff',
    backgroundColor: '#020203',
    fogNear: 6, fogFar: 22,
  },
  studio: {
    bodyColor: '#1a1a1d',
    bodyRoughness: 0.6,
    bodyMetalness: 0.05,
    bodyEmissive: '#000000',
    placeholderUnlit: true,
    ambientIntensity: 1.2,
    ambientColor: '#ffffff',
    keyIntensity: 0.9,
    keyColor: '#ffffff',
    keyX: 5, keyY: 10, keyZ: 5,
    fillIntensity: 0.5,
    fillColor: '#ffffff',
    backgroundColor: '#161618',
    fogNear: 12, fogFar: 40,
  },
  moody: {
    bodyColor: '#0a0d18',
    bodyRoughness: 0.7,
    bodyMetalness: 0.1,
    bodyEmissive: '#020410',
    placeholderUnlit: true,
    ambientIntensity: 0.4,
    ambientColor: '#3a4a8c',
    keyIntensity: 0.7,
    keyColor: '#7d9cff',
    keyX: 5, keyY: 8, keyZ: 5,
    fillIntensity: 0.25,
    fillColor: '#a16dff',
    backgroundColor: '#03050d',
    fogNear: 6, fogFar: 24,
  },
  warm: {
    bodyColor: '#1a1410',
    bodyRoughness: 0.7,
    bodyMetalness: 0.0,
    bodyEmissive: '#0a0500',
    placeholderUnlit: true,
    ambientIntensity: 0.7,
    ambientColor: '#ffb88a',
    keyIntensity: 0.65,
    keyColor: '#ffd9a8',
    keyX: 5, keyY: 8, keyZ: 5,
    fillIntensity: 0.2,
    fillColor: '#ff8a4a',
    backgroundColor: '#0a0604',
    fogNear: 8, fogFar: 28,
  },
};

// ---------------------------------------------------------------------------
// Curve presets
// ---------------------------------------------------------------------------

type CurvePresetKey = 'custom' | 'oval' | 'figure8' | 'wavy' | 'circle';

export const CURVE_PRESETS: Record<CurvePresetKey, [number, number, number][]> = {
  custom: DEFAULT_PARAMS.controlPoints,
  oval: [
    [-9, 0, 4], [-7, 0, 5.5], [0, 0, 6], [7, 0, 5.5],
    [9, 0, 4], [11, 0, 0], [9, 0, -4], [7, 0, -5.5],
    [0, 0, -6], [-7, 0, -5.5], [-9, 0, -4], [-11, 0, 0],
  ],
  figure8: [
    [-7, 0, 0], [-5, 0, 3], [-2, 0, 2], [0, 0, 0],
    [2, 0, -2], [5, 0, -3], [7, 0, 0], [5, 0, 3],
    [2, 0, 2], [0, 0, 0], [-2, 0, -2], [-5, 0, -3],
  ],
  wavy: [
    [-9, 0, 4], [-6, 1, 5.5], [0, 0, 5.5], [6, -1, 5.5],
    [9, 0, 4], [10, 1, 0], [9, 0, -4], [6, -1, -5.5],
    [0, 0, -5.5], [-6, 1, -5.5], [-9, 0, -4], [-10, -1, 0],
  ],
  circle: (() => {
    const points: [number, number, number][] = [];
    const N = 12;
    const R = 7;
    for (let i = 0; i < N; i++) {
      const a = (i / N) * Math.PI * 2;
      points.push([Math.cos(a) * R, 0, Math.sin(a) * R]);
    }
    return points;
  })(),
};

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useFilmStripParams(initial?: Partial<FilmStripParams>) {
  const [params, setParams] = useState<FilmStripParams>(() => ({
    ...DEFAULT_PARAMS,
    ...initial,
  }));

  const setParam = useCallback(
    <K extends keyof FilmStripParams>(key: K, value: FilmStripParams[K]) => {
      setParams(p => ({ ...p, [key]: value }));
    },
    []
  );

  const applyLookPreset = useCallback((name: LookPresetKey) => {
    const preset = LOOK_PRESETS[name];
    if (!preset) return;
    setParams(p => ({ ...p, ...preset }));
  }, []);

  const applyCurvePreset = useCallback((name: CurvePresetKey) => {
    const preset = CURVE_PRESETS[name];
    if (!preset) return;
    setParams(p => ({ ...p, controlPoints: preset.map(pt => [...pt] as [number, number, number]) }));
  }, []);

  const reset = useCallback(() => {
    setParams(DEFAULT_PARAMS);
  }, []);

  return { params, setParams, setParam, applyLookPreset, applyCurvePreset, reset };
}

export type UseFilmStripParamsReturn = ReturnType<typeof useFilmStripParams>;
