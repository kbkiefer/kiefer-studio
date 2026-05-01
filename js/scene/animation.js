import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const _gltfLoader = new GLTFLoader();
function loadGLB(url) {
  return new Promise((resolve, reject) => {
    _gltfLoader.load(url, resolve, undefined, reject);
  });
}

// ── Load pixel font ──────────────────────────────────────────────
const dogicaFont = new FontFace('Dogica', 'url(/dogicabold.ttf)');
dogicaFont.load().then(f => document.fonts.add(f));

// ── Arcade sound generator ───────────────────────────────────────
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playSound(type) {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  const now = audioCtx.currentTime;

  if (type === 'hover') {
    osc.type = 'square';
    osc.frequency.setValueAtTime(800, now);
    gain.gain.setValueAtTime(0.06, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
    osc.start(now);
    osc.stop(now + 0.06);
  } else if (type === 'select') {
    osc.type = 'square';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.setValueAtTime(900, now + 0.05);
    osc.frequency.setValueAtTime(1200, now + 0.1);
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    osc.start(now);
    osc.stop(now + 0.2);
  }
}

// ── CRT Breakout Game (3 Levels) ────────────────────────────────
function createCRTCanvas() {
  const W = 512, H = 384;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  const dustSpecs = [];
  for (let i = 0; i < 20; i++) {
    dustSpecs.push({ x: Math.random() * W, y: Math.random() * H, size: 0.5 + Math.random() * 1.5, brightness: 0.3 + Math.random() * 0.4 });
  }

  let gameState = 'play';
  let hoveredIndex = -1;

  const LEVELS = [
    { cols: 8,  rows: 4, ballSpeed: 3.5, paddleW: 80,  label: 'LEVEL 1' },
    { cols: 9,  rows: 5, ballSpeed: 4.5, paddleW: 70,  label: 'LEVEL 2' },
    { cols: 10, rows: 6, ballSpeed: 5.5, paddleW: 60,  label: 'LEVEL 3' },
  ];
  let level = 0;
  let levelFlashTimer = 0;

  const MARGIN = 20;
  const PLAY_W = W - MARGIN * 2;
  const HUD_H = 32;

  const paddleH = 10;
  const paddleY = H - MARGIN - 20;
  let paddleW = 80;
  let paddleX = W / 2 - paddleW / 2;
  const paddleSpeed = 6;
  const keys = { left: false, right: false };

  const ballSize = 7;
  let ballX, ballY, ballDX, ballDY;

  const brickH = 12;
  const brickPad = 3;
  const brickColors = ['#ff4444', '#ff6633', '#ff8844', '#ffcc00', '#44cc44', '#4488ff'];
  let bricks = [];
  let score = 0;
  let lives = 3;
  let combo = 0;
  let particles = [];

  function spawnParticles(x, y, color, count) {
    for (let i = 0; i < count; i++) {
      particles.push({ x, y, vx: (Math.random() - 0.5) * 4, vy: (Math.random() - 0.5) * 4, life: 1, color, size: 2 + Math.random() * 3 });
    }
  }

  function buildBricks() {
    const lv = LEVELS[level];
    const cols = lv.cols;
    const rows = lv.rows;
    const brickW = Math.floor((PLAY_W - (cols - 1) * brickPad) / cols);
    const offX = MARGIN + (PLAY_W - (cols * brickW + (cols - 1) * brickPad)) / 2;
    const offY = MARGIN + HUD_H + 10;
    bricks = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        bricks.push({ x: offX + c * (brickW + brickPad), y: offY + r * (brickH + brickPad), w: brickW, alive: true, row: r });
      }
    }
  }

  function resetBall() {
    const lv = LEVELS[level];
    ballX = W / 2;
    ballY = paddleY - 20;
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * 0.8;
    ballDX = Math.cos(angle) * lv.ballSpeed;
    ballDY = Math.sin(angle) * lv.ballSpeed;
    combo = 0;
  }

  function startLevel(lv) {
    level = lv;
    const lvData = LEVELS[level];
    paddleW = lvData.paddleW;
    paddleX = W / 2 - paddleW / 2;
    buildBricks();
    resetBall();
    gameState = 'game';
    particles = [];
    levelFlashTimer = 2;
  }

  function startGame() {
    score = 0;
    lives = 3;
    startLevel(0);
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'a') {
      keys.left = true;
      if (window.__joystickTilt) window.__joystickTilt('left');
    }
    if (e.key === 'ArrowRight' || e.key === 'd') {
      keys.right = true;
      if (window.__joystickTilt) window.__joystickTilt('right');
    }
    if (gameState === 'play' || gameState === 'gameover' || gameState === 'win') {
      if (e.key === 'Enter' || e.key === ' ') startGame();
    }
  });
  document.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'a') keys.left = false;
    if (e.key === 'ArrowRight' || e.key === 'd') keys.right = false;
    if (!keys.left && !keys.right && window.__joystickTilt) window.__joystickTilt('center');
  });

  let touchActive = false;
  let touchStartX = 0;
  let touchPaddleStart = 0;

  document.addEventListener('touchstart', (e) => {
    if (gameState === 'play' || gameState === 'gameover' || gameState === 'win') { startGame(); return; }
    touchActive = true;
    touchStartX = e.touches[0].clientX;
    touchPaddleStart = paddleX;
  }, { passive: true });

  document.addEventListener('touchmove', (e) => {
    if (!touchActive || gameState !== 'game') return;
    const dx = e.touches[0].clientX - touchStartX;
    paddleX = Math.max(MARGIN, Math.min(W - MARGIN - paddleW, touchPaddleStart + dx * 1.5));
  }, { passive: true });

  document.addEventListener('touchend', () => { touchActive = false; }, { passive: true });

  function updateGame(delta) {
    if (keys.left) paddleX = Math.max(MARGIN, paddleX - paddleSpeed);
    if (keys.right) paddleX = Math.min(W - MARGIN - paddleW, paddleX + paddleSpeed);

    if (levelFlashTimer > 0) { levelFlashTimer -= delta; return; }

    ballX += ballDX;
    ballY += ballDY;

    if (ballX <= MARGIN) { ballX = MARGIN; ballDX = Math.abs(ballDX); playSound('hover'); }
    if (ballX >= W - MARGIN - ballSize) { ballX = W - MARGIN - ballSize; ballDX = -Math.abs(ballDX); playSound('hover'); }
    if (ballY <= MARGIN + HUD_H) { ballY = MARGIN + HUD_H; ballDY = Math.abs(ballDY); playSound('hover'); }

    if (ballY >= H) {
      lives--;
      combo = 0;
      if (lives <= 0) { gameState = 'gameover'; } else { resetBall(); }
      return;
    }

    if (ballY + ballSize >= paddleY && ballY + ballSize <= paddleY + paddleH + 4 &&
        ballX + ballSize >= paddleX && ballX <= paddleX + paddleW) {
      ballDY = -Math.abs(ballDY);
      const hitPos = (ballX + ballSize / 2 - paddleX) / paddleW;
      ballDX = (hitPos - 0.5) * (LEVELS[level].ballSpeed * 2);
      const speed = Math.sqrt(ballDX * ballDX + ballDY * ballDY);
      const maxSpeed = LEVELS[level].ballSpeed * 1.5;
      if (speed > maxSpeed) { ballDX *= maxSpeed / speed; ballDY *= maxSpeed / speed; }
      combo = 0;
      playSound('hover');
    }

    for (const brick of bricks) {
      if (!brick.alive) continue;
      if (ballX + ballSize > brick.x && ballX < brick.x + brick.w &&
          ballY + ballSize > brick.y && ballY < brick.y + brickH) {
        brick.alive = false;
        ballDY = -ballDY;
        combo++;
        score += 10 * combo * (level + 1);
        spawnParticles(brick.x + brick.w / 2, brick.y + brickH / 2, brickColors[brick.row % brickColors.length], 8);
        playSound('select');
        break;
      }
    }

    if (bricks.every(b => !b.alive)) {
      if (level < LEVELS.length - 1) { startLevel(level + 1); } else { gameState = 'win'; }
    }

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx; p.y += p.vy; p.life -= 0.03;
      if (p.life <= 0) particles.splice(i, 1);
    }
  }

  let lastElapsed = 0;

  function renderCRT(elapsed) {
    const delta = elapsed - lastElapsed;
    lastElapsed = elapsed;

    ctx.fillStyle = '#0a0a08';
    ctx.fillRect(0, 0, W, H);

    const bandY = H * 0.5 + Math.sin(elapsed * 0.3) * H * 0.1;
    const bandGrad = ctx.createLinearGradient(0, bandY - 60, 0, bandY + 60);
    bandGrad.addColorStop(0, 'rgba(30, 20, 10, 0)');
    bandGrad.addColorStop(0.5, 'rgba(80, 50, 20, 0.2)');
    bandGrad.addColorStop(1, 'rgba(30, 20, 10, 0)');
    ctx.fillStyle = bandGrad;
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = 'rgba(0, 0, 0, 0.12)';
    for (let y = 0; y < H; y += 3) ctx.fillRect(0, y, W, 1);

    const scanY = (elapsed * 40) % (H + 40) - 20;
    const scanGrad = ctx.createLinearGradient(0, scanY - 15, 0, scanY + 15);
    scanGrad.addColorStop(0, 'rgba(60, 45, 20, 0)');
    scanGrad.addColorStop(0.5, 'rgba(60, 45, 20, 0.06)');
    scanGrad.addColorStop(1, 'rgba(60, 45, 20, 0)');
    ctx.fillStyle = scanGrad;
    ctx.fillRect(0, scanY - 15, W, 30);

    for (const d of dustSpecs) {
      const flicker = Math.sin(elapsed * 2 + d.x) > 0.7 ? 1 : 0.3;
      ctx.fillStyle = `rgba(255, 255, 255, ${d.brightness * flicker * 0.3})`;
      ctx.fillRect(d.x, d.y, d.size, d.size);
    }

    ctx.imageSmoothingEnabled = false;

    if (gameState === 'play') {
      ctx.font = '12px Dogica, monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#888866';
      ctx.fillText('KIEFER ARCADE', W / 2, H / 2 - 60);
      ctx.font = '9px Dogica, monospace';
      ctx.fillStyle = '#555544';
      ctx.fillText('BREAKOUT  //  3 LEVELS', W / 2, H / 2 - 30);
      if (Math.sin(elapsed * 3) > 0) {
        ctx.fillStyle = '#ffcc00';
        ctx.font = '20px Dogica, monospace';
        ctx.shadowColor = '#ffaa00';
        ctx.shadowBlur = 15;
        ctx.fillText('PRESS START', W / 2, H / 2 + 10);
        ctx.shadowBlur = 0;
      }
      ctx.font = '8px Dogica, monospace';
      ctx.fillStyle = '#444433';
      ctx.fillText('ARROWS / TOUCH TO PLAY', W / 2, H / 2 + 50);
    } else if (gameState === 'game') {
      updateGame(delta);

      ctx.strokeStyle = 'rgba(255, 200, 0, 0.08)';
      ctx.lineWidth = 1;
      ctx.strokeRect(MARGIN, MARGIN + HUD_H, PLAY_W, H - MARGIN - HUD_H - MARGIN);

      for (const brick of bricks) {
        if (!brick.alive) continue;
        ctx.fillStyle = brickColors[brick.row % brickColors.length];
        ctx.fillRect(brick.x, brick.y, brick.w, brickH);
        ctx.fillStyle = 'rgba(255,255,255,0.15)';
        ctx.fillRect(brick.x, brick.y, brick.w, 2);
      }

      for (const p of particles) { ctx.globalAlpha = p.life; ctx.fillStyle = p.color; ctx.fillRect(p.x, p.y, p.size, p.size); }
      ctx.globalAlpha = 1;

      ctx.shadowColor = '#ffaa00';
      ctx.shadowBlur = 8;
      ctx.fillStyle = '#ffcc00';
      ctx.fillRect(paddleX, paddleY, paddleW, paddleH);
      ctx.shadowBlur = 0;
      ctx.fillStyle = 'rgba(255,255,255,0.25)';
      ctx.fillRect(paddleX, paddleY, paddleW, 2);

      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = '#ffffff';
      ctx.shadowBlur = 6;
      ctx.fillRect(ballX, ballY, ballSize, ballSize);
      ctx.shadowBlur = 0;

      ctx.font = '9px Dogica, monospace';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillStyle = '#ffcc00';
      ctx.fillText('SCORE ' + String(score).padStart(6, '0'), MARGIN + 4, MARGIN + 4);
      ctx.textAlign = 'center';
      ctx.fillStyle = '#888866';
      ctx.fillText(LEVELS[level].label, W / 2, MARGIN + 4);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#ff4444';
      let livesStr = '';
      for (let i = 0; i < lives; i++) livesStr += '♥ ';
      ctx.fillText(livesStr, W - MARGIN - 4, MARGIN + 4);
      if (combo > 1) {
        ctx.textAlign = 'center';
        ctx.fillStyle = '#ffcc00';
        ctx.font = '8px Dogica, monospace';
        ctx.fillText('x' + combo + ' COMBO', W / 2, MARGIN + 18);
      }
      if (levelFlashTimer > 0) {
        ctx.globalAlpha = Math.min(1, levelFlashTimer);
        ctx.fillStyle = '#ffcc00';
        ctx.font = '24px Dogica, monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = '#ffaa00';
        ctx.shadowBlur = 20;
        ctx.fillText(LEVELS[level].label, W / 2, H / 2);
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
      }
    } else if (gameState === 'gameover') {
      ctx.font = '20px Dogica, monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#ff4444';
      ctx.shadowColor = '#ff0000';
      ctx.shadowBlur = 15;
      ctx.fillText('GAME OVER', W / 2, H / 2 - 40);
      ctx.shadowBlur = 0;
      ctx.font = '12px Dogica, monospace';
      ctx.fillStyle = '#ffcc00';
      ctx.fillText('SCORE ' + score, W / 2, H / 2);
      ctx.font = '9px Dogica, monospace';
      ctx.fillStyle = '#888866';
      ctx.fillText('REACHED ' + LEVELS[Math.min(level, LEVELS.length - 1)].label, W / 2, H / 2 + 30);
      if (Math.sin(elapsed * 3) > 0) {
        ctx.font = '12px Dogica, monospace';
        ctx.fillStyle = '#ffcc00';
        ctx.shadowColor = '#ffaa00';
        ctx.shadowBlur = 10;
        ctx.fillText('PRESS START', W / 2, H / 2 + 70);
        ctx.shadowBlur = 0;
      }
    } else if (gameState === 'win') {
      ctx.font = '18px Dogica, monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#44cc44';
      ctx.shadowColor = '#00ff00';
      ctx.shadowBlur = 15;
      ctx.fillText('ALL LEVELS CLEAR', W / 2, H / 2 - 40);
      ctx.shadowBlur = 0;
      ctx.font = '12px Dogica, monospace';
      ctx.fillStyle = '#ffcc00';
      ctx.fillText('FINAL SCORE ' + score, W / 2, H / 2);
      if (Math.sin(elapsed * 3) > 0) {
        ctx.font = '12px Dogica, monospace';
        ctx.fillStyle = '#ffcc00';
        ctx.shadowColor = '#ffaa00';
        ctx.shadowBlur = 10;
        ctx.fillText('PLAY AGAIN', W / 2, H / 2 + 50);
        ctx.shadowBlur = 0;
      }
    }

    const edgeGrad = ctx.createRadialGradient(W/2, H/2, W * 0.3, W/2, H/2, W * 0.7);
    edgeGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
    edgeGrad.addColorStop(1, 'rgba(0, 0, 0, 0.4)');
    ctx.fillStyle = edgeGrad;
    ctx.fillRect(0, 0, W, H);
  }

  return {
    canvas,
    render: renderCRT,
    mainItems: [],
    getCurrentItems: () => [],
    getState: () => gameState,
    setState: (s) => { if (s === 'main') startGame(); else gameState = s; },
    getCategory: () => null,
    getHovered: () => hoveredIndex,
    setHovered: (i) => { hoveredIndex = i; },
    selectItem: () => {
      if (gameState === 'gameover' || gameState === 'win' || gameState === 'play') {
        startGame();
        return { action: 'restart' };
      }
      return null;
    },
    startGame,
  };
}

// ── Main ─────────────────────────────────────────────────────────
export async function apply(scene) {
  const animations = [];
  const slotPositions = {
    'left-1': new THREE.Vector3(0.36, 0.77, -0.14),
    'left-2': new THREE.Vector3(0.36, 0.50, -0.20),
    'right-1': new THREE.Vector3(-0.16, 0.77, -0.14),
    'right-2': new THREE.Vector3(-0.16, 0.50, -0.20),
  };
  const refs = {};
  scene.traverse((obj) => {
    if (obj.name) refs[obj.name] = obj;
  });

  const screenMesh = refs['STATIC_SCREEN'];
  const crtLight = refs['crt_light'];

  // 2. Dust motes drift
  const motes = refs['dust_motes'];
  if (motes && motes.isInstancedMesh) {
    const dummy = new THREE.Object3D();
    const positions = [];
    for (let i = 0; i < motes.count; i++) {
      const m = new THREE.Matrix4();
      motes.getMatrixAt(i, m);
      const p = new THREE.Vector3();
      p.setFromMatrixPosition(m);
      positions.push({ x: p.x, y: p.y, z: p.z, baseY: p.y });
    }
    animations.push((elapsed, delta) => {
      for (let i = 0; i < motes.count; i++) {
        const p = positions[i];
        p.y += delta * 0.02;
        p.x += Math.sin(elapsed + i) * 0.0003;
        p.z += Math.cos(elapsed * 0.7 + i) * 0.0003;
        if (p.y > p.baseY + 1.0) {
          p.y = p.baseY - 0.5;
          p.x += (Math.random() - 0.5) * 0.3;
        }
        dummy.position.set(p.x, p.y, p.z);
        dummy.updateMatrix();
        motes.setMatrixAt(i, dummy.matrix);
      }
      motes.instanceMatrix.needsUpdate = true;
    });
  }

  // 3. Joystick - tilts based on menu navigation, pivots at base ball
  const joystick = refs['Joystick'];
  const stickGroup = joystick ? joystick.getObjectByName('stick') : null;
  let joystickTarget = { x: 0, z: 0 };
  let joystickCurrent = { x: 0, z: 0 };
  const TILT_ANGLE = Math.PI / 7.2;

  window.__joystickTilt = (dir) => {
    if (dir === 'up')    { joystickTarget.x = TILT_ANGLE; joystickTarget.z = 0; }
    else if (dir === 'down')  { joystickTarget.x = -TILT_ANGLE; joystickTarget.z = 0; }
    else if (dir === 'left')  { joystickTarget.x = 0; joystickTarget.z = -TILT_ANGLE; }
    else if (dir === 'right') { joystickTarget.x = 0; joystickTarget.z = TILT_ANGLE; }
    else { joystickTarget.x = 0; joystickTarget.z = 0; }
  };

  let pivotGroup = null;
  if (stickGroup) {
    // Find the base ball (bottom-most sphere in the stick group)
    let baseBallPos = new THREE.Vector3(0, 0, 0);
    let lowestY = Infinity;
    stickGroup.children.forEach(child => {
      if (child.position.y < lowestY) {
        lowestY = child.position.y;
        baseBallPos.copy(child.position);
      }
    });

    // Create pivot group at the base ball position
    pivotGroup = new THREE.Group();
    pivotGroup.name = 'joystick_pivot';
    pivotGroup.position.copy(baseBallPos);
    stickGroup.add(pivotGroup);

    // Reparent stick children under the pivot, offset by -baseBallPos
    const children = [...stickGroup.children].filter(c => c !== pivotGroup);
    children.forEach(child => {
      stickGroup.remove(child);
      child.position.sub(baseBallPos);
      pivotGroup.add(child);
    });

    animations.push((elapsed, delta) => {
      const speed = 10;
      joystickCurrent.x += (joystickTarget.x - joystickCurrent.x) * Math.min(speed * delta, 1);
      joystickCurrent.z += (joystickTarget.z - joystickCurrent.z) * Math.min(speed * delta, 1);
      pivotGroup.rotation.x = joystickCurrent.x;
      pivotGroup.rotation.z = joystickCurrent.z;
    });
  }

  // 4. Marquee light flicker
  const marqueeLight = refs['marquee_light'];
  if (marqueeLight) {
    const baseIntensity = marqueeLight.intensity;
    animations.push(() => {
      marqueeLight.intensity = baseIntensity + (Math.random() > 0.98 ? -0.1 : 0);
    });
  }

  // ── 5. Arcade buttons ──────────────────────────────────────────
  const buttonDefs = [
    { name: 'red_button_1', glow: new THREE.Color(0xff2222) },
    { name: 'red_button_2', glow: new THREE.Color(0xff2222) },
    { name: 'red_button_3', glow: new THREE.Color(0xff2222) },
    { name: 'Yellow_Button', glow: new THREE.Color(0xffdd00) },
    { name: 'Blue_Button', glow: new THREE.Color(0x44aaff) },
  ];

  const arcadeButtons = [];
  const pressDepth = 0.4;

  for (const def of buttonDefs) {
    const group = refs[def.name];
    if (!group || group.children.length < 2) continue;
    const cap = group.children[0];
    const baseY = cap.position.y;
    arcadeButtons.push({ cap, group, baseY, glowColor: def.glow, pressed: false, pressAmount: 0 });
  }

  // ── 6. Laptop Popout (loaded from separate GLB) ─────────────────
  let laptopGroup = null;
  let laptopScreen = null;

  const laptopLoader = new GLTFLoader();
  try {
    const gltf = await new Promise((resolve, reject) => {
      laptopLoader.load('/laptop.glb', resolve, undefined, reject);
    });

    laptopGroup = new THREE.Group();
    laptopGroup.name = 'Group_1';

    // Match arcade scene scale
    const glbRoot = scene.getObjectByName('glb_root');
    const arcadeScale = glbRoot ? glbRoot.scale.x : 0.14;
    gltf.scene.scale.setScalar(arcadeScale);

    gltf.scene.traverse((child) => {
      if (child.name === 'Plane') laptopScreen = child;
    });

    laptopGroup.add(gltf.scene);
    scene.add(laptopGroup);
  } catch(e) {
    console.error('Failed to load laptop:', e);
  }
  let laptopVisible = false;
  let laptopAnimT = 0;
  let laptopTargetT = 0;

  if (laptopGroup) {
    // Hide laptop initially
    laptopGroup.visible = false;

    // Scale laptop to match the arcade scene (arcade was scaled ~0.14)
    const glbRoot = scene.getObjectByName('glb_root');
    const arcadeScale = glbRoot ? glbRoot.scale.x : 0.14;
    laptopGroup.scale.setScalar(0.64);

    // Get screen world position for fly-out origin
    const screenWorldPos = new THREE.Vector3();
    if (screenMesh) {
      screenMesh.updateWorldMatrix(true, false);
      screenMesh.getWorldPosition(screenWorldPos);
    }

    const laptopOutPos = slotPositions['left-1'].clone();
    laptopGroup.rotation.y = 167 * Math.PI / 180;
    laptopGroup.rotation.x = -21 * Math.PI / 180;
    // Start position = at screen center
    // OFF position - inside the screen area
    const laptopStartPos = new THREE.Vector3(0.16, 0.74, -0.19);
    laptopGroup.position.copy(laptopStartPos);
    laptopGroup.scale.setScalar(0.01); // start invisible inside screen

    // Video texture on laptop screen
    if (laptopScreen) {
      const video = document.createElement('video');
      video.src = '/legal-demo-loop.mp4';
      video.loop = true;
      video.muted = true;
      video.playsInline = true;
      video.crossOrigin = 'anonymous';
      video.setAttribute('loop', '');
      video.addEventListener('ended', () => {
        video.currentTime = 0;
        video.play().catch(() => {});
      });

      const videoTex = new THREE.VideoTexture(video);
      videoTex.minFilter = THREE.LinearFilter;
      videoTex.magFilter = THREE.LinearFilter;
      videoTex.colorSpace = THREE.SRGBColorSpace;
      // Flip horizontally
      videoTex.repeat.set(1, -1);
      videoTex.offset.set(0, 1);

      laptopScreen.material = new THREE.MeshBasicMaterial({
        map: videoTex,
        side: THREE.DoubleSide,
        toneMapped: false,
      });

      window.__laptopVideo = video;
    }

    // Energy tether beam - tight focused column beneath laptop
    const beamHeight = 0.4;
    const beamRadius = 0.12;
    const particleCount = 200;
    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    const particleSpeeds = [];
    const particlePhases = [];
    const particleRadii = [];

    for (let i = 0; i < particleCount; i++) {
      const t = Math.random();
      const angle = Math.random() * Math.PI * 2;
      const maxR = beamRadius * (1 - t * 0.7);
      const radius = Math.pow(Math.random(), 1.5) * maxR;

      particlePositions[i * 3] = Math.cos(angle) * radius;
      particlePositions[i * 3 + 1] = -t * beamHeight;
      particlePositions[i * 3 + 2] = Math.sin(angle) * radius;
      particleSpeeds.push(0.4 + Math.random() * 0.5);
      particlePhases.push(angle);
      particleRadii.push(radius);
    }

    const particleColors = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      const y = particlePositions[i * 3 + 1];
      const height = 1 - Math.abs(y) / beamHeight;
      const isCore = particleRadii[i] < 0.03;

      if (isCore) {
        particleColors[i * 3] = 0.85 + height * 0.15;
        particleColors[i * 3 + 1] = 0.95 + height * 0.05;
        particleColors[i * 3 + 2] = 1.0;
      } else {
        particleColors[i * 3] = 0.15 + height * 0.25;
        particleColors[i * 3 + 1] = 0.6 + height * 0.3;
        particleColors[i * 3 + 2] = 0.95 + height * 0.05;
      }
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    particleGeo.setAttribute('color', new THREE.BufferAttribute(particleColors, 3));

    const spriteCanvas = document.createElement('canvas');
    spriteCanvas.width = 8;
    spriteCanvas.height = 8;
    const sCtx = spriteCanvas.getContext('2d');
    sCtx.fillStyle = '#44ccff';
    sCtx.fillRect(1, 1, 6, 6);
    sCtx.fillStyle = '#ccf0ff';
    sCtx.fillRect(2, 2, 4, 4);
    sCtx.fillStyle = '#ffffff';
    sCtx.fillRect(3, 3, 2, 2);
    const spriteTex = new THREE.CanvasTexture(spriteCanvas);
    spriteTex.minFilter = THREE.NearestFilter;
    spriteTex.magFilter = THREE.NearestFilter;

    const particleMat = new THREE.PointsMaterial({
      size: 0.042,
      map: spriteTex,
      transparent: true,
      opacity: 0.41,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
      vertexColors: true,
    });

    const particlePoints = new THREE.Points(particleGeo, particleMat);
    const particles = new THREE.Group();
    particles.name = 'laptop_particles';
    particles.add(particlePoints);
    particles.position.y = -0.16;
    particles.visible = false;
    laptopGroup.add(particles);

    // Animate laptop popout
    animations.push((elapsed, delta) => {
      const speed = laptopTargetT > laptopAnimT ? 5 : 4;
      laptopAnimT += (laptopTargetT - laptopAnimT) * Math.min(speed * delta, 1);

      // Skip animation when in preview mode
      if (window.__laptopPreview) {
        const l = window.__laptopGroup;
        if (l) {
          l.visible = true;
          if (window.__laptopPreview === 'off') l.position.copy(laptopStartPos);
          else l.position.copy(laptopOutPos);
          l.scale.setScalar(window.__laptopBaseScale || 0.64);
        }
        return;
      }

      if (laptopAnimT < 0.01 && laptopTargetT === 0) {
        laptopGroup.visible = false;
        particles.visible = false;
        if (window.__laptopVideo) window.__laptopVideo.pause();
        return;
      }

      laptopGroup.visible = true;
      particles.visible = laptopAnimT > 0.1;

      // Ease curve
      const t = laptopAnimT * laptopAnimT * (3 - 2 * laptopAnimT);

      // Interpolate position
      laptopGroup.position.lerpVectors(laptopStartPos, laptopOutPos, t);

      // Slight float
      laptopGroup.position.y += Math.sin(elapsed * 1.5) * 0.02 * t;

      // Scale from 0 (hidden inside screen) to full
      const baseScale = window.__laptopBaseScale || 0.64;
      const s = baseScale * t;
      laptopGroup.scale.setScalar(s);

      const posArr = particleGeo.attributes.position.array;
      for (let i = 0; i < particleCount; i++) {
        posArr[i * 3 + 1] -= particleSpeeds[i] * delta * t;

        const y = posArr[i * 3 + 1];
        const depth = Math.abs(y) / beamHeight;

        const phase = particlePhases[i] + elapsed * 0.5;
        const r = particleRadii[i] * (1 - depth * 0.6);
        posArr[i * 3] = Math.cos(phase) * r;
        posArr[i * 3 + 2] = Math.sin(phase) * r;

        if (posArr[i * 3 + 1] < -beamHeight) {
          const angle = Math.random() * Math.PI * 2;
          const radius = Math.pow(Math.random(), 1.5) * beamRadius;
          posArr[i * 3] = Math.cos(angle) * radius;
          posArr[i * 3 + 1] = 0;
          posArr[i * 3 + 2] = Math.sin(angle) * radius;
          particlePhases[i] = angle;
          particleRadii[i] = radius;
        }
      }
      particleGeo.attributes.position.needsUpdate = true;
      particleMat.opacity = 0.85 * t;

      const pulse = Math.sin(elapsed * 3);
      particleMat.opacity = (0.41 + pulse * 0.08) * t;
    });

    // Expose for tweaker
    window.__laptopOutPos = laptopOutPos;
    window.__laptopStartPos = laptopStartPos;
    window.__laptopBaseScale = 0.64;
    window.__laptopParticleMat = particleMat;
    window.__laptopParticles = particles;
    window.__laptopGroup = laptopGroup;
  }

  window.__showLaptop = (show) => {
    if (!laptopGroup) return;
    laptopTargetT = show ? 1 : 0;
    if (show && window.__laptopVideo) {
      window.__laptopVideo.currentTime = 0;
      window.__laptopVideo.play().catch(() => {});
    }
  };

  function createSlot({ id, outPos, startPos, rotY, rotX, baseScale, beamOffY, animStyle }) {
    const group = new THREE.Group();
    group.name = `slot_${id}`;
    group.userData.outPos = outPos;
    group.position.copy(startPos);
    group.rotation.y = rotY * Math.PI / 180;
    group.rotation.x = rotX * Math.PI / 180;
    group.scale.setScalar(0.01);
    group.visible = false;
    scene.add(group);

    const beamHeight = 0.4;
    const beamRadius = 0.12;
    const particleCount = 150;
    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    const particleSpeeds = [];
    const particlePhases = [];
    const particleRadii = [];

    for (let i = 0; i < particleCount; i++) {
      const t = Math.random();
      const angle = Math.random() * Math.PI * 2;
      const maxR = beamRadius * (1 - t * 0.7);
      const radius = Math.pow(Math.random(), 1.5) * maxR;

      particlePositions[i * 3] = Math.cos(angle) * radius;
      particlePositions[i * 3 + 1] = -t * beamHeight;
      particlePositions[i * 3 + 2] = Math.sin(angle) * radius;
      particleSpeeds.push(0.4 + Math.random() * 0.5);
      particlePhases.push(angle);
      particleRadii.push(radius);
    }

    const particleColors = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      const y = particlePositions[i * 3 + 1];
      const height = 1 - Math.abs(y) / beamHeight;
      const isCore = particleRadii[i] < 0.03;

      if (isCore) {
        particleColors[i * 3] = 0.85 + height * 0.15;
        particleColors[i * 3 + 1] = 0.95 + height * 0.05;
        particleColors[i * 3 + 2] = 1.0;
      } else {
        particleColors[i * 3] = 0.15 + height * 0.25;
        particleColors[i * 3 + 1] = 0.6 + height * 0.3;
        particleColors[i * 3 + 2] = 0.95 + height * 0.05;
      }
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    particleGeo.setAttribute('color', new THREE.BufferAttribute(particleColors, 3));

    const spriteCanvas = document.createElement('canvas');
    spriteCanvas.width = 8;
    spriteCanvas.height = 8;
    const sCtx = spriteCanvas.getContext('2d');
    sCtx.fillStyle = '#44ccff';
    sCtx.fillRect(1, 1, 6, 6);
    sCtx.fillStyle = '#ccf0ff';
    sCtx.fillRect(2, 2, 4, 4);
    sCtx.fillStyle = '#ffffff';
    sCtx.fillRect(3, 3, 2, 2);
    const spriteTex = new THREE.CanvasTexture(spriteCanvas);
    spriteTex.minFilter = THREE.NearestFilter;
    spriteTex.magFilter = THREE.NearestFilter;

    const particleMat = new THREE.PointsMaterial({
      size: 0.042,
      map: spriteTex,
      transparent: true,
      opacity: 0.41,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
      vertexColors: true,
    });

    const particlePoints = new THREE.Points(particleGeo, particleMat);
    const particles = new THREE.Group();
    particles.name = `slot_${id}_particles`;
    particles.add(particlePoints);
    particles.position.y = beamOffY;
    particles.visible = false;
    group.add(particles);

    let targetT = 0;
    let animT = 0;
    let materializeStep = -1;
    const materializeJitter = new THREE.Vector3();

    function setChildOpacity(opacity) {
      group.traverse((child) => {
        if (!child.material || child === particlePoints) return;
        const mats = Array.isArray(child.material) ? child.material : [child.material];
        mats.forEach((mat) => {
          mat.transparent = opacity < 1;
          mat.opacity = opacity;
          mat.needsUpdate = true;
        });
      });
    }

    animations.push((elapsed, delta) => {
      const speed = targetT > animT ? 5 : 4;
      animT += (targetT - animT) * Math.min(speed * delta, 1);

      if (animT < 0.01 && targetT === 0) {
        group.visible = false;
        particles.visible = false;
        return;
      }

      group.visible = true;
      particles.visible = animT > 0.1;

      let t = animT * animT * (3 - 2 * animT);
      let scaleT = t;
      let opacityT = t;
      const arcY = 0;
      group.rotation.y = rotY * Math.PI / 180;
      group.rotation.x = rotX * Math.PI / 180;

      if (animStyle === 'spiral') {
        t = 1 - Math.pow(1 - animT, 3);
        scaleT = t;
        opacityT = t;
        group.rotation.y = (rotY + (1 - t) * 540) * Math.PI / 180;
        group.position.lerpVectors(startPos, outPos, t);
        group.position.y += Math.sin(t * Math.PI) * 0.08;
      } else if (animStyle === 'bounce') {
        if (animT < 0.6) {
          const a = animT / 0.6;
          t = a * a * (3 - 2 * a) * 1.15;
        } else {
          const a = (animT - 0.6) / 0.4;
          t = 1 + (1 - (a * a * (3 - 2 * a))) * 0.15;
        }
        scaleT = Math.max(t, 0);
        opacityT = Math.min(Math.max(animT, 0), 1);
        group.position.lerpVectors(startPos, outPos, t);
      } else if (animStyle === 'materialize') {
        const rawStep = Math.min(Math.floor(animT * 5), 5);
        const step = rawStep / 5;
        if (rawStep !== materializeStep) {
          materializeStep = rawStep;
          materializeJitter.set(
            rawStep >= 5 ? 0 : (Math.random() - 0.5) * 0.01,
            0,
            rawStep >= 5 ? 0 : (Math.random() - 0.5) * 0.01
          );
        }
        t = step;
        scaleT = step;
        opacityT = [0, 0.2, 0.4, 0.7, 1, 1][rawStep];
        group.position.lerpVectors(startPos, outPos, step);
        group.position.add(materializeJitter);
      } else {
        group.position.lerpVectors(startPos, outPos, t);
      }

      if (animStyle !== 'spiral' && animStyle !== 'bounce' && animStyle !== 'materialize') {
        group.position.y += arcY;
      }

      group.scale.setScalar(baseScale * Math.max(scaleT, 0.01));
      setChildOpacity(opacityT);

      const posArr = particleGeo.attributes.position.array;
      for (let i = 0; i < particleCount; i++) {
        posArr[i * 3 + 1] -= particleSpeeds[i] * delta * Math.max(opacityT, 0);

        const y = posArr[i * 3 + 1];
        const depth = Math.abs(y) / beamHeight;

        const phase = particlePhases[i] + elapsed * 0.5;
        const r = particleRadii[i] * (1 - depth * 0.6);
        posArr[i * 3] = Math.cos(phase) * r;
        posArr[i * 3 + 2] = Math.sin(phase) * r;

        if (posArr[i * 3 + 1] < -beamHeight) {
          const angle = Math.random() * Math.PI * 2;
          const radius = Math.pow(Math.random(), 1.5) * beamRadius;
          posArr[i * 3] = Math.cos(angle) * radius;
          posArr[i * 3 + 1] = 0;
          posArr[i * 3 + 2] = Math.sin(angle) * radius;
          particlePhases[i] = angle;
          particleRadii[i] = radius;
        }
      }
      particleGeo.attributes.position.needsUpdate = true;

      const pulse = Math.sin(elapsed * 3);
      particleMat.opacity = (0.41 + pulse * 0.08) * opacityT;
    });

    return {
      group,
      particles,
      show() {
        targetT = 1;
      },
      hide() {
        targetT = 0;
      },
      id,
    };
  }

  const slotLeft2 = createSlot({
    id: 'left-2',
    outPos: slotPositions['left-2'].clone(),
    startPos: new THREE.Vector3(0.16, 0.74, -0.19),
    rotY: 160,
    rotX: -15,
    baseScale: 0.35,
    beamOffY: -0.16,
    animStyle: 'spiral',
  });

  const slotRight1 = createSlot({
    id: 'right-1',
    outPos: slotPositions['right-1'].clone(),
    startPos: new THREE.Vector3(0.16, 0.74, -0.19),
    rotY: -169,
    rotX: -18,
    baseScale: 0.37,
    beamOffY: -0.16,
    animStyle: 'bounce',
  });

  // Load phone model into RIGHT-1 slot
  try {
    const phoneGltf = await loadGLB('/iphone_with_screen_placeholder.glb');
    const phoneModel = phoneGltf.scene;
    const glbRoot = scene.getObjectByName('glb_root');
    const arcadeScale = glbRoot ? glbRoot.scale.x : 0.14;
    phoneModel.scale.setScalar(arcadeScale * 4);
    phoneModel.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    slotRight1.group.add(phoneModel);
    window.__phoneModel = phoneModel;
    console.log('Phone model loaded into RIGHT-1');
  } catch(e) {
    console.error('Failed to load phone:', e);
  }

  const slotRight2 = createSlot({
    id: 'right-2',
    outPos: slotPositions['right-2'].clone(),
    startPos: new THREE.Vector3(0.16, 0.74, -0.19),
    rotY: -155,
    rotX: -12,
    baseScale: 0.33,
    beamOffY: -0.16,
    animStyle: 'materialize',
  });

  window.__slots = {
    'left-1': { show: () => window.__showLaptop(true), hide: () => window.__showLaptop(false) },
    'left-2': slotLeft2,
    'right-1': slotRight1,
    'right-2': slotRight2,
  };

  window.__showSlot = (id, show) => {
    const slot = window.__slots[id];
    if (slot) show ? slot.show() : slot.hide();
  };

  // ── 7. CRT Screen ─────────────────────────────────────────────
  if (screenMesh) {
    const crt = createCRTCanvas();
    const crtTexture = new THREE.CanvasTexture(crt.canvas);
    crtTexture.minFilter = THREE.LinearFilter;
    crtTexture.magFilter = THREE.LinearFilter;

    // Generate UVs for the screen mesh (Nomad doesn't export UVs)
    // Use planar projection from the bounding box
    screenMesh.geometry.computeBoundingBox();
    const bb = screenMesh.geometry.boundingBox;
    const pos = screenMesh.geometry.attributes.position;
    const uvs = new Float32Array(pos.count * 2);

    // Find which two axes span the screen face (the two smallest BB dimensions)
    const sx = bb.max.x - bb.min.x;
    const sy = bb.max.y - bb.min.y;
    const sz = bb.max.z - bb.min.z;

    // Project UVs using the two largest local axes for best coverage
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const z = pos.getZ(i);

      if (sx <= sy && sx <= sz) {
        uvs[i * 2] = 1 - (z - bb.min.z) / sz;
        uvs[i * 2 + 1] = (y - bb.min.y) / sy;
      } else if (sy <= sx && sy <= sz) {
        uvs[i * 2] = 1 - (x - bb.min.x) / sx;
        uvs[i * 2 + 1] = (z - bb.min.z) / sz;
      } else {
        uvs[i * 2] = 1 - (x - bb.min.x) / sx;
        uvs[i * 2 + 1] = (y - bb.min.y) / sy;
      }
    }
    screenMesh.geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));

    // CRT material - emissive canvas with dark amber glass tint
    screenMesh.material = new THREE.MeshStandardMaterial({
      color: 0x221100,
      emissiveMap: crtTexture,
      emissive: new THREE.Color(0xffffff),
      emissiveIntensity: 1.5,
      roughness: 0.08,
      metalness: 0.15,
    });

    // Menu group for tweak panel
    const menuGroup = new THREE.Group();
    menuGroup.name = 'arcade_menu';
    screenMesh.updateWorldMatrix(true, false);
    const wp = new THREE.Vector3();
    screenMesh.getWorldPosition(wp);
    menuGroup.position.copy(wp);
    scene.add(menuGroup);

    // Update CRT canvas every frame
    animations.push((elapsed) => {
      crt.render(elapsed);
      crtTexture.needsUpdate = true;

      if (crtLight) {
        crtLight.intensity = 1.6 + Math.sin(elapsed * 2.1) * 0.4;
      }
    });

    // Click detection via UV coordinates on the screen mesh
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    const camera = window.__cephalopodCamera;
    const canvas = window.__cephalopodRenderer.domElement;

    // Re-enable raycast on screen mesh for UV-based click detection
    delete screenMesh.raycast;

    const getItemAtUV = (uv) => {
      const state = crt.getState();
      if (state !== 'main' && state !== 'sub' && state !== 'detail') return -1;

      const cx = uv.x;
      const cy = 1 - uv.y;

      // Detail view has BACK at the bottom
      if (state === 'detail') {
        const backY = (384 - 50) / 384;
        if (cx > 0.1 && cx < 0.9 && Math.abs(cy - backY) < 0.06) return 0;
        return -1;
      }

      const items = crt.getCurrentItems();
      const headerOffset = state === 'sub' ? 20 / 384 : 0;
      const slots = items.length + 2;
      const itemH = (1 - headerOffset) / slots;
      const startY = headerOffset + itemH * 1.5;

      for (let i = 0; i < items.length; i++) {
        const y = startY + i * itemH;
        if (cx > 0.1 && cx < 0.9 && Math.abs(cy - y) < itemH * 0.4) {
          return i;
        }
      }
      return -1;
    };

    const updateMouse = (e) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    };

    // Track cursor movement direction
    let lastMouseX = 0, lastMouseY = 0;
    let mouseDX = 0, mouseDY = 0;

    // Hover
    canvas.addEventListener('pointermove', (e) => {
      mouseDX = e.clientX - lastMouseX;
      mouseDY = e.clientY - lastMouseY;
      lastMouseX = e.clientX;
      lastMouseY = e.clientY;

      updateMouse(e);
      raycaster.setFromCamera(mouse, camera);

      // Check button hovers for left/right joystick
      const capMeshes = arcadeButtons.map(b => b.cap);
      const btnHover = raycaster.intersectObjects(capMeshes, true);
      if (btnHover.length > 0 && window.__joystickTilt) {
        const dir = mouseDX > 2 ? 'right' : mouseDX < -2 ? 'left' : (mouseDY > 2 ? 'down' : mouseDY < -2 ? 'up' : null);
        if (dir) {
          window.__joystickTilt(dir);
          clearTimeout(window.__joystickSnapTimer);
          window.__joystickSnapTimer = setTimeout(() => { window.__joystickTilt('center'); }, 200);
        }
      }

      const hits = raycaster.intersectObject(screenMesh, false);

      if (hits.length > 0 && hits[0].uv) {
        const idx = getItemAtUV(hits[0].uv);
        const prev = crt.getHovered();
        crt.setHovered(idx);
        canvas.style.cursor = idx >= 0 ? 'pointer' : '';

        if (idx >= 0 && idx !== prev) {
          playSound('hover');
          if (window.__joystickTilt) {
            const dir = Math.abs(mouseDY) > Math.abs(mouseDX)
              ? (mouseDY < 0 ? 'up' : 'down')
              : (mouseDX > 0 ? 'right' : 'left');
            window.__joystickTilt(dir);
            clearTimeout(window.__joystickSnapTimer);
            window.__joystickSnapTimer = setTimeout(() => { window.__joystickTilt('center'); }, 200);
          }

          // Show laptop on Legal Services hover (but not if already in detail view)
          const state = crt.getState();
          if (state !== 'detail') {
            const items = crt.getCurrentItems();
            if (state === 'sub' && items[idx] === 'LEGAL SERVICES') {
              if (window.__showLaptop) window.__showLaptop(true);
              if (window.__showSlot) window.__showSlot('right-1', true);
            } else {
              if (window.__showLaptop) window.__showLaptop(false);
              if (window.__showSlot) window.__showSlot('right-1', false);
            }
          }
        }
      } else {
        crt.setHovered(-1);
        canvas.style.cursor = '';
        if (crt.getState() !== 'detail') {
          if (window.__showLaptop) window.__showLaptop(false);
          if (window.__showSlot) window.__showSlot('right-1', false);
        }
      }
    });

    // Click
    canvas.addEventListener('pointerdown', (e) => {
      updateMouse(e);
      raycaster.setFromCamera(mouse, camera);

      // Check arcade buttons first
      const capMeshes = arcadeButtons.map(b => b.cap);
      const btnHits = raycaster.intersectObjects(capMeshes, true);
      if (btnHits.length > 0) {
        const btn = arcadeButtons.find(b => b.cap === btnHits[0].object || b.cap === btnHits[0].object.parent);
        if (btn) {
          btn.pressed = true;
          playSound('select');
        }
      }

      // Screen click - also trigger blue button press
      const screenHits = raycaster.intersectObject(screenMesh, false);
      if (screenHits.length > 0 && screenHits[0].uv) {
        const uv = screenHits[0].uv;

        // Trigger blue button press on any screen click
        const blueBtn = arcadeButtons.find(b => b.group.name === 'Blue_Button');
        if (blueBtn) {
          blueBtn.pressed = true;
          setTimeout(() => { blueBtn.pressed = false; }, 150);
        }

        const state = crt.getState();
        if (state === 'play' || state === 'gameover' || state === 'win') {
          playSound('select');
          crt.selectItem();
        } else {
          const idx = getItemAtUV(uv);
          if (idx >= 0) {
            const result = crt.selectItem(idx);
            if (result) {
              playSound(result.action === 'back' ? 'hover' : 'select');
            }
          }
        }
      }
    });

    canvas.addEventListener('pointerup', () => {
      arcadeButtons.forEach(b => { b.pressed = false; });
    });

    canvas.addEventListener('pointerleave', () => {
      arcadeButtons.forEach(b => { b.pressed = false; });
      crt.setHovered(-1);
    });
  }

  // Arcade button press animation
  if (arcadeButtons.length > 0) {
    animations.push((elapsed, delta) => {
      for (const btn of arcadeButtons) {
        const target = btn.pressed ? 1 : 0;
        const speed = btn.pressed ? 15 : 5;
        btn.pressAmount += (target - btn.pressAmount) * Math.min(speed * delta, 1);
        btn.cap.position.y = btn.baseY - btn.pressAmount * pressDepth;
        if (btn.cap.material) {
          if (btn.pressAmount > 0.05) {
            btn.cap.material.emissive = btn.glowColor;
            btn.cap.material.emissiveIntensity = btn.pressAmount * 3.0;
          } else {
            btn.cap.material.emissiveIntensity = 0;
          }
        }
      }
    });
  }

  scene.userData.animations = animations;
}
