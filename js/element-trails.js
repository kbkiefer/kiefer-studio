import * as THREE from 'three';

const TRAIL_CONFIG = {
  tetrahedron: {
    color1: 0xff4400,
    color2: 0xffcc00,
    size: 0.06,
    count: 60,
    lifetime: 0.8,
    spread: 0.15,
    speed: 0.4,
    direction: [0, 1, 0],
  },
  octahedron: {
    color1: 0xccddff,
    color2: 0xffffff,
    size: 0.03,
    count: 40,
    lifetime: 1.2,
    spread: 0.25,
    speed: 0.15,
    direction: [0, 0.3, 0],
  },
  box: {
    color1: 0x664422,
    color2: 0x998866,
    size: 0.04,
    count: 30,
    lifetime: 0.6,
    spread: 0.1,
    speed: -0.3,
    direction: [0, -1, 0],
  },
  icosahedron: {
    color1: 0x2288ff,
    color2: 0x88ddff,
    size: 0.05,
    count: 50,
    lifetime: 1.0,
    spread: 0.2,
    speed: 0.1,
    direction: [0, -0.5, 0],
  },
  dodecahedron: {
    color1: 0xaa66ff,
    color2: 0xffaaff,
    size: 0.04,
    count: 45,
    lifetime: 1.4,
    spread: 0.3,
    speed: 0.05,
    direction: [0, 0.2, 0],
  },
};

const trails = [];

export function createTrail(name, scene) {
  const cfg = TRAIL_CONFIG[name];
  if (!cfg) return null;

  const positions = new Float32Array(cfg.count * 3);
  const colors = new Float32Array(cfg.count * 3);
  const sizes = new Float32Array(cfg.count);
  const ages = new Float32Array(cfg.count);

  const c1 = new THREE.Color(cfg.color1);
  const c2 = new THREE.Color(cfg.color2);

  for (let i = 0; i < cfg.count; i++) {
    positions[i * 3] = 0;
    positions[i * 3 + 1] = -999;
    positions[i * 3 + 2] = 0;
    colors[i * 3] = c1.r;
    colors[i * 3 + 1] = c1.g;
    colors[i * 3 + 2] = c1.b;
    sizes[i] = 0;
    ages[i] = cfg.lifetime + 1;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

  const mat = new THREE.PointsMaterial({
    vertexColors: true,
    sizeAttenuation: true,
    transparent: true,
    opacity: 0.8,
    depthWrite: false,
    blending: name === 'tetrahedron' ? THREE.AdditiveBlending : THREE.NormalBlending,
  });

  const points = new THREE.Points(geo, mat);
  scene.add(points);

  const trail = {
    name,
    cfg,
    points,
    geo,
    positions,
    colors,
    sizes,
    ages,
    spawnIndex: 0,
    c1,
    c2,
  };

  trails.push(trail);
  return trail;
}

export function updateTrails(dt, objectsMap) {
  for (const trail of trails) {
    const obj = objectsMap[trail.name];
    if (!obj) continue;

    const cfg = trail.cfg;
    const worldPos = new THREE.Vector3();
    obj.group.getWorldPosition(worldPos);

    const spawnRate = cfg.count / cfg.lifetime;
    const toSpawn = Math.ceil(spawnRate * dt);

    for (let s = 0; s < toSpawn; s++) {
      const i = trail.spawnIndex % cfg.count;
      trail.spawnIndex++;

      trail.positions[i * 3] = worldPos.x + (Math.random() - 0.5) * cfg.spread;
      trail.positions[i * 3 + 1] = worldPos.y + (Math.random() - 0.5) * cfg.spread;
      trail.positions[i * 3 + 2] = worldPos.z + (Math.random() - 0.5) * cfg.spread;
      trail.ages[i] = 0;
      trail.sizes[i] = cfg.size;
    }

    for (let i = 0; i < cfg.count; i++) {
      trail.ages[i] += dt;
      const life = trail.ages[i] / cfg.lifetime;

      if (life > 1) {
        trail.sizes[i] = 0;
        continue;
      }

      trail.positions[i * 3] += cfg.direction[0] * cfg.speed * dt;
      trail.positions[i * 3 + 1] += cfg.direction[1] * cfg.speed * dt;
      trail.positions[i * 3 + 2] += cfg.direction[2] * cfg.speed * dt;

      if (trail.name === 'tetrahedron') {
        trail.positions[i * 3] += (Math.random() - 0.5) * 0.02;
        trail.positions[i * 3 + 1] += Math.random() * 0.015;
      }

      if (trail.name === 'octahedron') {
        trail.positions[i * 3] += Math.sin(trail.ages[i] * 3 + i) * 0.005;
        trail.positions[i * 3 + 2] += Math.cos(trail.ages[i] * 3 + i) * 0.005;
      }

      if (trail.name === 'icosahedron') {
        trail.positions[i * 3 + 1] += Math.sin(trail.ages[i] * 2 + i * 0.5) * 0.003;
      }

      if (trail.name === 'dodecahedron') {
        const a = trail.ages[i] * 2 + i;
        trail.positions[i * 3] += Math.sin(a) * 0.004;
        trail.positions[i * 3 + 1] += Math.cos(a * 0.7) * 0.004;
        trail.positions[i * 3 + 2] += Math.sin(a * 1.3) * 0.004;
      }

      const fade = 1 - life;
      trail.sizes[i] = cfg.size * fade;

      const mixedColor = trail.c1.clone().lerp(trail.c2, life);
      trail.colors[i * 3] = mixedColor.r * fade;
      trail.colors[i * 3 + 1] = mixedColor.g * fade;
      trail.colors[i * 3 + 2] = mixedColor.b * fade;
    }

    trail.geo.attributes.position.needsUpdate = true;
    trail.geo.attributes.color.needsUpdate = true;
    trail.geo.attributes.size.needsUpdate = true;
  }
}

export function setTrailsVisible(v) {
  for (const trail of trails) {
    trail.points.visible = v;
  }
}
