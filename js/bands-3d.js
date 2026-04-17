import * as THREE from 'three';

const BAND_DEFS = [
  {
    name: 'blue1',
    text: 'design and code and build and ',
    color: '#012FFF',
    textColor: '#ffffff',
    fontSize: 130,
    fontWeight: '400',
    bandWidth: 156.5,
    bandHeight: 0.25,
    position: [10, 2.75, -4.3],
    rotation: [0, 0, 0.07],
    speed: 0.73,
  },
  {
    name: 'pink',
    text: 'IMAGINE  CREATE  ',
    color: '#FFBDFF',
    textColor: '#202020',
    fontSize: 200,
    fontWeight: '700',
    bandWidth: 54,
    bandHeight: 0.74,
    position: [1.1, 2.15, -12],
    rotation: [0.055, -0.135, -0.035],
    speed: -0.74,
  },
  {
    name: 'blue2',
    text: 'KIEFER  STUDIO  ',
    color: '#012FFF',
    textColor: '#ffffff',
    fontSize: 186,
    fontWeight: '700',
    bandWidth: 5,
    bandHeight: 0.1,
    position: [0, 0.55, 0.8],
    rotation: [-0.29, 0.34, 0.23],
    speed: -0.58,
  },
  {
    name: 'dark',
    text: 'art direction . motion . 3d . branding . typography . ',
    color: '#202020',
    textColor: 'rgba(255,255,255,0.6)',
    fontSize: 36,
    fontWeight: '400',
    bandWidth: 72,
    bandHeight: 0.32,
    position: [-2.4, -1.75, -10.15],
    rotation: [0.04, -0.13, -0.015],
    speed: 0.41,
  },
  {
    name: 'yellow',
    text: 'self-taught . developer . designer . builder . ',
    color: '#FFFF62',
    textColor: '#202020',
    fontSize: 130,
    fontWeight: '700',
    bandWidth: 47.5,
    bandHeight: 0.25,
    position: [-1.45, -2.25, -8],
    rotation: [0, 0, 0],
    speed: -0.42,
  },
];

const bands = [];

export function createBands3D(scene) {
  for (const def of BAND_DEFS) {
    const band = buildBand(def);
    scene.add(band.group);
    bands.push(band);
  }
}

function buildBand(def) {
  const group = new THREE.Group();
  group.position.set(...def.position);
  group.rotation.set(...def.rotation);

  const canvas = renderTextToCanvas(def);
  const texture = makeTexture(canvas);

  const texAspect = canvas.width / canvas.height;
  const tileWidth = def.bandHeight * texAspect;
  const tilesNeeded = def.bandWidth / tileWidth;
  texture.repeat.set(tilesNeeded, 1);

  const geo = new THREE.PlaneGeometry(def.bandWidth, def.bandHeight);
  const mat = new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide });
  const mesh = new THREE.Mesh(geo, mat);
  group.add(mesh);

  return {
    name: def.name,
    group,
    mesh,
    texture,
    speed: def.speed,
    offset: 0,
    def,
    bandWidth: def.bandWidth,
    bandHeight: def.bandHeight,
    fontSize: def.fontSize,
  };
}

function renderTextToCanvas(def) {
  const px = def.fontSize * 2;
  const font = `${def.fontWeight} ${px}px 'Silkscreen', monospace`;

  const measure = document.createElement('canvas');
  const mCtx = measure.getContext('2d');
  mCtx.font = font;
  const textW = Math.ceil(mCtx.measureText(def.text).width);

  const w = textW + 20;
  const h = Math.ceil(px * 1.5);

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = def.color;
  ctx.fillRect(0, 0, w, h);

  ctx.font = font;
  ctx.fillStyle = def.textColor;
  ctx.textBaseline = 'middle';
  ctx.fillText(def.text, 0, h / 2);

  return canvas;
}

function makeTexture(canvas) {
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.minFilter = THREE.NearestFilter;
  texture.magFilter = THREE.NearestFilter;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function rebuildBandMesh(band) {
  const oldMesh = band.mesh;
  band.group.remove(oldMesh);
  oldMesh.geometry.dispose();
  oldMesh.material.map.dispose();
  oldMesh.material.dispose();

  const canvas = renderTextToCanvas(band.def);
  const texture = makeTexture(canvas);

  const texAspect = canvas.width / canvas.height;
  const tileWidth = band.bandHeight * texAspect;
  const tilesNeeded = band.bandWidth / tileWidth;
  texture.repeat.set(tilesNeeded, 1);
  texture.offset.x = band.offset;

  const geo = new THREE.PlaneGeometry(band.bandWidth, band.bandHeight);
  const mat = new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide });
  const mesh = new THREE.Mesh(geo, mat);

  band.group.add(mesh);
  band.mesh = mesh;
  band.texture = texture;
}

export function updateBands3D(time) {
  for (const band of bands) {
    band.offset += band.speed * 0.001;
    band.texture.offset.x = band.offset;
  }
}

export function getBands3D() {
  return bands;
}
