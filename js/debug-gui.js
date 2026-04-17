import GUI from 'lil-gui';
import { getModel, getCamera } from './bust.js';

export const scrollConfig = {
  rotationY: 10.11,
  camStartY: 0.57,
  camEndY: 5,
  camStartZ: 1.8,
  camEndZ: 1.75,
  scrollLength: 850,
  scrub: 1.5,
};

export const modelConfig = {
  posX: 0,
  posY: 0,
  posZ: 0,
  scale: 1.3,
  rotOffsetX: 0.0084073464102068,
  rotOffsetY: 0,
  rotOffsetZ: 0,
};

export const lightConfig = {
  ambientIntensity: 0,
  keyIntensity: 3.28,
  keyX: 3,
  keyY: 6.1,
  keyZ: 3.5,
  rimIntensity: 0.56,
  rimX: -5.4,
  rimY: 10,
  rimZ: -1,
};

export const pixelConfig = {
  pixelSize: 8,
};

let gui;
let timelineScrub = { progress: 0 };
let applyFn = null;

export function initDebugGUI(applyScrollProgress, lightsRef, rebuildPixel) {
  applyFn = applyScrollProgress;
  gui = new GUI({ title: 'Bust Controls', width: 320 });

  const reapply = () => { if (applyFn) applyFn(timelineScrub.progress); };

  /* Timeline */
  const tlFolder = gui.addFolder('Scroll Timeline');
  tlFolder.add(timelineScrub, 'progress', 0, 1, 0.001).name('Scrub').listen().onChange(reapply);
  tlFolder.add(scrollConfig, 'rotationY', 0, Math.PI * 20, 0.01).name('Total Y Rot').onChange(reapply);
  tlFolder.add(scrollConfig, 'camStartY', -5, 5, 0.01).name('Cam Start Y').onChange(reapply);
  tlFolder.add(scrollConfig, 'camEndY', -20, 20, 0.01).name('Cam End Y').onChange(reapply);
  tlFolder.add(scrollConfig, 'camStartZ', -2, 10, 0.01).name('Cam Start Z').onChange(reapply);
  tlFolder.add(scrollConfig, 'camEndZ', -5, 10, 0.01).name('Cam End Z').onChange(reapply);
  tlFolder.add(scrollConfig, 'scrollLength', 100, 2000, 10).name('Scroll Length %');
  tlFolder.open();

  /* Model */
  const modelFolder = gui.addFolder('Model Transform');
  modelFolder.add(modelConfig, 'posX', -5, 5, 0.01).name('Offset X').onChange(reapply);
  modelFolder.add(modelConfig, 'posY', -5, 5, 0.01).name('Offset Y').onChange(applyModelPos);
  modelFolder.add(modelConfig, 'posZ', -5, 5, 0.01).name('Offset Z').onChange(applyModelPos);
  modelFolder.add(modelConfig, 'scale', 0.1, 5, 0.01).name('Scale').onChange(applyModelPos);
  modelFolder.add(modelConfig, 'rotOffsetX', -Math.PI, Math.PI, 0.01).name('Rot Offset X').onChange(reapply);
  modelFolder.add(modelConfig, 'rotOffsetY', -Math.PI, Math.PI, 0.01).name('Rot Offset Y').onChange(reapply);
  modelFolder.add(modelConfig, 'rotOffsetZ', -Math.PI, Math.PI, 0.01).name('Rot Offset Z').onChange(reapply);
  modelFolder.open();

  /* Lighting */
  const lightFolder = gui.addFolder('Lighting');
  if (lightsRef.ambient) {
    lightFolder.add(lightConfig, 'ambientIntensity', 0, 2, 0.01).name('Ambient').onChange(() => { lightsRef.ambient.intensity = lightConfig.ambientIntensity; });
  }
  if (lightsRef.key) {
    lightFolder.add(lightConfig, 'keyIntensity', 0, 5, 0.01).name('Key Intensity').onChange(() => { lightsRef.key.intensity = lightConfig.keyIntensity; });
    lightFolder.add(lightConfig, 'keyX', -10, 10, 0.1).name('Key X').onChange(() => { lightsRef.key.position.x = lightConfig.keyX; });
    lightFolder.add(lightConfig, 'keyY', -10, 10, 0.1).name('Key Y').onChange(() => { lightsRef.key.position.y = lightConfig.keyY; });
    lightFolder.add(lightConfig, 'keyZ', -10, 10, 0.1).name('Key Z').onChange(() => { lightsRef.key.position.z = lightConfig.keyZ; });
  }
  if (lightsRef.rim) {
    lightFolder.add(lightConfig, 'rimIntensity', 0, 3, 0.01).name('Rim Intensity').onChange(() => { lightsRef.rim.intensity = lightConfig.rimIntensity; });
    lightFolder.add(lightConfig, 'rimX', -10, 10, 0.1).name('Rim X').onChange(() => { lightsRef.rim.position.x = lightConfig.rimX; });
    lightFolder.add(lightConfig, 'rimY', -10, 10, 0.1).name('Rim Y').onChange(() => { lightsRef.rim.position.y = lightConfig.rimY; });
    lightFolder.add(lightConfig, 'rimZ', -10, 10, 0.1).name('Rim Z').onChange(() => { lightsRef.rim.position.z = lightConfig.rimZ; });
  }

  /* Pixel */
  const pixelFolder = gui.addFolder('Pixel Effect');
  pixelFolder.add(pixelConfig, 'pixelSize', 1, 20, 1).name('Pixel Size').onChange(() => {
    if (rebuildPixel) rebuildPixel(pixelConfig.pixelSize);
  });

  /* Export */
  gui.addFolder('Export').add({ copy: copyConfig }, 'copy').name('Copy Config to Clipboard');
}

function applyModelPos() {
  const model = getModel();
  if (!model) return;
  model.scale.setScalar(modelConfig.scale);
  model.position.y += modelConfig.posY;
  model.position.z = modelConfig.posZ;
}

export function setTimelineProgress(p) {
  timelineScrub.progress = p;
}

function copyConfig() {
  const output = {
    scroll: { ...scrollConfig },
    model: { ...modelConfig },
    light: { ...lightConfig },
    pixel: { ...pixelConfig },
  };
  const json = JSON.stringify(output, null, 2);
  navigator.clipboard.writeText(json).then(() => {
    console.log('Config copied:', json);
  });
}
