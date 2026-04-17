import GUI from 'lil-gui';
import { getBands3D, rebuildBandMesh } from './bands-3d.js';

let gui;

export function initHeroGUI(shapesData) {
  gui = new GUI({ title: 'Hero Layout', width: 340 });

  const bandsFolder = gui.addFolder('Bands');

  setTimeout(() => {
    const bands3d = getBands3D();
    for (const band of bands3d) {
      const f = bandsFolder.addFolder(band.name);

      f.add(band.group.position, 'x', -20, 20, 0.05).name('X').listen();
      f.add(band.group.position, 'y', -5, 5, 0.05).name('Y').listen();
      f.add(band.group.position, 'z', -12, 4, 0.05).name('Z (depth)').listen();
      f.add(band.group.rotation, 'x', -0.5, 0.5, 0.005).name('Rot X').listen();
      f.add(band.group.rotation, 'y', -0.5, 0.5, 0.005).name('Rot Y').listen();
      f.add(band.group.rotation, 'z', -0.5, 0.5, 0.005).name('Rot Z').listen();
      f.add(band, 'speed', -2, 2, 0.01).name('Scroll Speed');
      f.add(band, 'bandWidth', 5, 200, 0.5).name('Width').onChange(() => rebuildBandMesh(band));
      f.add(band, 'bandHeight', 0.1, 3, 0.01).name('Height').onChange(() => rebuildBandMesh(band));
      f.add(band, 'fontSize', 10, 200, 1).name('Font Size').onChange(() => {
        band.def.fontSize = band.fontSize;
        rebuildBandMesh(band);
      });
      f.close();
    }
  }, 500);

  bandsFolder.open();

  const shapesFolder = gui.addFolder('Shapes');
  for (const s of shapesData) {
    const f = shapesFolder.addFolder(s.name);
    f.add(s, 'orbit', 0.5, 5, 0.05).name('Orbit');
    f.add(s, 'yOffset', -3, 3, 0.05).name('Y Offset');
    f.add(s, 'zOffset', -10, 3, 0.05).name('Z Offset');
    f.add(s, 'size', 0.05, 1, 0.01).name('Size').onChange(() => {
      const r = s.size / s.origSize;
      s.mesh.scale.setScalar(r);
      s.outline.scale.setScalar(r * 1.06);
    });
    f.add(s, 'speed', -0.5, 0.5, 0.01).name('Speed');
    f.close();
  }
  shapesFolder.open();

  const exportFolder = gui.addFolder('Export');
  exportFolder.add({ copy: () => copyConfig(shapesData) }, 'copy').name('Copy All Config');
}

function copyConfig(shapesData) {
  const bands3d = getBands3D();
  const bandsOut = {};
  for (const b of bands3d) {
    bandsOut[b.name] = {
      position: [b.group.position.x, b.group.position.y, b.group.position.z],
      rotation: [b.group.rotation.x, b.group.rotation.y, b.group.rotation.z],
      bandWidth: b.bandWidth,
      bandHeight: b.bandHeight,
      fontSize: b.fontSize,
      speed: b.speed,
    };
  }

  const shapesOut = {};
  for (const s of shapesData) {
    shapesOut[s.name] = {
      orbit: s.orbit,
      yOffset: s.yOffset,
      zOffset: s.zOffset,
      size: s.size,
      speed: s.speed,
    };
  }

  const output = { bands: bandsOut, shapes: shapesOut };
  navigator.clipboard.writeText(JSON.stringify(output, null, 2));
  console.log('Hero config copied:', output);
}
