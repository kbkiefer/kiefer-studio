import GUI from 'lil-gui';
import { getModel, getCamera } from './bust.js';
import { getTrailConfig } from './element-trails.js';

export const scrollConfig = {
  rotationY: 62.83185307179586,
  camStartX: 0,
  camEndX: 0,
  camStartY: 0.609999999999999,
  camEndY: 0.91,
  camStartZ: 1.9,
  camEndZ: 1.44,
  scrollLength: 850,
  scrub: 1.5,
};

export const exitConfig = {
  camExitX: -1.4,
};

export const modelConfig = {
  posX: 0,
  posY: -0.39,
  posZ: 0.54,
  scale: 1.37,
  rotOffsetX: -0.00159265358979299,
  rotOffsetY: -0.631592653589793,
  rotOffsetZ: -0.00159265358979299,
};

export const lightConfig = {
  ambientIntensity: 0,
  keyIntensity: 6.41,
  keyX: -2.2,
  keyY: 3.7,
  keyZ: 1.5,
  rimIntensity: 2.07,
  rimX: -5.4,
  rimY: 10,
  rimZ: -1,
};

export const pixelConfig = {
  pixelSize: 11,
};

let gui;
let timelineScrub = { progress: 0, exitProgress: 0 };
let applyFn = null;
let applyExitFn = null;

export function initDebugGUI(applyScrollProgress, lightsRef, rebuildPixel, applyExit) {
  applyFn = applyScrollProgress;
  applyExitFn = applyExit;
  gui = new GUI({ title: 'Bust Controls', width: 340 });

  const reapply = () => { if (applyFn) applyFn(timelineScrub.progress); };
  const reapplyExit = () => { if (applyExitFn) applyExitFn(timelineScrub.exitProgress); };

  /* Phase 1: Hero scroll */
  const p1 = gui.addFolder('Phase 1: Hero Scroll');
  p1.add(timelineScrub, 'progress', 0, 1, 0.001).name('Scrub').listen().onChange(reapply);
  p1.add(scrollConfig, 'rotationY', 0, Math.PI * 20, 0.01).name('Total Y Rot').onChange(reapply);
  p1.add(scrollConfig, 'camStartX', -10, 10, 0.01).name('Cam Start X').onChange(reapply);
  p1.add(scrollConfig, 'camEndX', -10, 10, 0.01).name('Cam End X').onChange(reapply);
  p1.add(scrollConfig, 'camStartY', -10, 10, 0.01).name('Cam Start Y').onChange(reapply);
  p1.add(scrollConfig, 'camEndY', -20, 20, 0.01).name('Cam End Y').onChange(reapply);
  p1.add(scrollConfig, 'camStartZ', -5, 15, 0.01).name('Cam Start Z').onChange(reapply);
  p1.add(scrollConfig, 'camEndZ', -5, 15, 0.01).name('Cam End Z').onChange(reapply);
  p1.add(scrollConfig, 'scrollLength', 100, 3000, 10).name('Scroll Length %');
  p1.open();

  /* Phase 2: Blue section exit */
  const p2 = gui.addFolder('Phase 2: Exit into Blue');
  p2.add(timelineScrub, 'exitProgress', 0, 1, 0.001).name('Exit Scrub').listen().onChange(reapplyExit);
  p2.add(exitConfig, 'camExitX', -5, 5, 0.01).name('Slide X').onChange(reapplyExit);
  p2.open();

  /* Model */
  const modelFolder = gui.addFolder('Model Transform');
  modelFolder.add(modelConfig, 'posX', -5, 5, 0.01).name('Offset X').onChange(reapply);
  modelFolder.add(modelConfig, 'posY', -5, 5, 0.01).name('Offset Y').onChange(applyModelPos);
  modelFolder.add(modelConfig, 'posZ', -5, 5, 0.01).name('Offset Z').onChange(applyModelPos);
  modelFolder.add(modelConfig, 'scale', 0.1, 5, 0.01).name('Scale').onChange(applyModelPos);
  modelFolder.add(modelConfig, 'rotOffsetX', -Math.PI, Math.PI, 0.01).name('Rot Offset X').onChange(reapply);
  modelFolder.add(modelConfig, 'rotOffsetY', -Math.PI, Math.PI, 0.01).name('Rot Offset Y').onChange(reapply);
  modelFolder.add(modelConfig, 'rotOffsetZ', -Math.PI, Math.PI, 0.01).name('Rot Offset Z').onChange(reapply);

  /* Lighting */
  const lightFolder = gui.addFolder('Lighting');
  if (lightsRef.ambient) lightFolder.add(lightConfig, 'ambientIntensity', 0, 2, 0.01).name('Ambient').onChange(() => { lightsRef.ambient.intensity = lightConfig.ambientIntensity; });
  if (lightsRef.key) {
    lightFolder.add(lightConfig, 'keyIntensity', 0, 8, 0.01).name('Key Intensity').onChange(() => { lightsRef.key.intensity = lightConfig.keyIntensity; });
    lightFolder.add(lightConfig, 'keyX', -10, 10, 0.1).name('Key X').onChange(() => { lightsRef.key.position.x = lightConfig.keyX; });
    lightFolder.add(lightConfig, 'keyY', -10, 10, 0.1).name('Key Y').onChange(() => { lightsRef.key.position.y = lightConfig.keyY; });
    lightFolder.add(lightConfig, 'keyZ', -10, 10, 0.1).name('Key Z').onChange(() => { lightsRef.key.position.z = lightConfig.keyZ; });
  }
  if (lightsRef.rim) {
    lightFolder.add(lightConfig, 'rimIntensity', 0, 5, 0.01).name('Rim Intensity').onChange(() => { lightsRef.rim.intensity = lightConfig.rimIntensity; });
  }

  /* Pixel */
  const pixelFolder = gui.addFolder('Pixel Effect');
  pixelFolder.add(pixelConfig, 'pixelSize', 1, 20, 1).name('Pixel Size').onChange(() => {
    if (rebuildPixel) rebuildPixel(pixelConfig.pixelSize);
  });

  /* Trails */
  const trailFolder = gui.addFolder('Elemental Trails');
  const trailCfg = getTrailConfig();
  for (const [name, cfg] of Object.entries(trailCfg)) {
    const f = trailFolder.addFolder(name);
    f.add(cfg, 'size', 0.01, 0.5, 0.01).name('Particle Size');
    f.add(cfg, 'count', 5, 200, 1).name('Count');
    f.add(cfg, 'lifetime', 0.2, 5, 0.1).name('Lifetime');
    f.add(cfg, 'spread', 0.05, 1, 0.01).name('Spread');
    f.add(cfg, 'speed', -2, 2, 0.01).name('Speed');
    f.addColor(cfg, 'color1Hex').name('Color 1').onChange((v) => { cfg.color1 = parseInt(v.replace('#', ''), 16); });
    f.addColor(cfg, 'color2Hex').name('Color 2').onChange((v) => { cfg.color2 = parseInt(v.replace('#', ''), 16); });
    f.close();
  }

  /* Export */
  gui.addFolder('Export').add({ copy: copyConfig }, 'copy').name('Copy All Config');
}

function applyModelPos() {
  const model = getModel();
  if (!model) return;
  model.scale.setScalar(modelConfig.scale);
}

export function setTimelineProgress(p) {
  timelineScrub.progress = p;
}

export function setExitProgress(p) {
  timelineScrub.exitProgress = p;
}

function copyConfig() {
  const output = {
    scroll: { ...scrollConfig },
    exit: { ...exitConfig },
    model: { ...modelConfig },
    light: { ...lightConfig },
    pixel: { ...pixelConfig },
  };
  const json = JSON.stringify(output, null, 2);
  navigator.clipboard.writeText(json).then(() => {
    console.log('Config copied:', json);
  });
}
