// ─── Constants ────────────────────────────────────────────────────────────────
let   CELL    = 70;       // recomputed dynamically per level + viewport
const SW_BASE = 18;       // stroke-width at CELL=70; scales proportionally
let   SW      = 18;
const EXIT    = 1100;     // px the exit track extends off-screen
const MAX_LIVES = 3;

// Arrowhead geometry as fractions of CELL — stays proportional at any size
// At CELL=70: TIP=28px, BK=8px, ARM=18px
const TIP_FRAC = 28 / 70;
const BK_FRAC  =  8 / 70;
const ARM_FRAC = 18 / 70;

const COLORS = [
  '#1a237e', '#4a1942', '#1b3a2f', '#7b3f00',
  '#546e7a', '#1c1c1c', '#003d6b', '#3b1a08',
  '#2d4a1e', '#4a0a0a',
];

const DIRS = [
  { dr:  0, dc:  1 },
  { dr:  0, dc: -1 },
  { dr:  1, dc:  0 },
  { dr: -1, dc:  0 },
];

// ─── Utilities ────────────────────────────────────────────────────────────────
const rnd  = n   => Math.floor(Math.random() * n);
const pick = arr => arr[rnd(arr.length)];

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = rnd(i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ─── Dynamic cell size ────────────────────────────────────────────────────────
function computeCell(rows, cols) {
  const HEADER_PX = 90;
  const FOOTER_PX = 130;
  const PADDING   = 24;
  const maxW = (window.innerWidth  - PADDING * 2) / cols;
  const maxH = (window.innerHeight - HEADER_PX - FOOTER_PX) / rows;
  return Math.max(Math.floor(Math.min(maxW, maxH, 80)), 36);
}

// ─── Level config ─────────────────────────────────────────────────────────────
function getLevelConfig(n) {
  if (n === 1) return { rows: 4, cols: 4, num: 3, min: 2, max: 3 };
  if (n === 2) return { rows: 4, cols: 4, num: 4, min: 2, max: 4 };
  if (n === 3) return { rows: 5, cols: 5, num: 4, min: 2, max: 4 };
  if (n === 4) return { rows: 5, cols: 5, num: 5, min: 3, max: 5 };
  if (n === 5) return { rows: 6, cols: 6, num: 5, min: 3, max: 5 };
  if (n === 6) return { rows: 6, cols: 6, num: 6, min: 3, max: 6 };
  if (n === 7) return { rows: 7, cols: 7, num: 6, min: 3, max: 6 };
  if (n === 8) return { rows: 8, cols: 8, num: 7, min: 3, max: 7 };
  return { rows: 8, cols: 8, num: Math.min(10, 6 + Math.floor((n - 6) / 2)), min: 4, max: 7 };
}

// ─── Level generation ─────────────────────────────────────────────────────────
function buildBody(headR, headC, dr, dc, targetLen, occ, rows, cols) {
  const cells = [{ r: headR, c: headC }];
  const has   = (r, c) => cells.some(x => x.r === r && x.c === c);
  let cr = headR, cc = headC, bdr = -dr, bdc = -dc;

  for (let j = 1; j < targetLen; j++) {
    const straight = { dr: bdr,  dc: bdc  };
    const left     = { dr: -bdc, dc: bdr  };
    const right    = { dr: bdc,  dc: -bdr };
    const opts = Math.random() < 0.70
      ? [straight, left, right]
      : shuffle([straight, left, right]);
    let moved = false;
    for (const { dr: od, dc: oc } of opts) {
      const tr = cr + od, tc = cc + oc;
      if (tr < 0 || tr >= rows || tc < 0 || tc >= cols) continue;
      if (occ[tr][tc] !== null || has(tr, tc)) continue;
      cells.unshift({ r: tr, c: tc });
      cr = tr; cc = tc; bdr = od; bdc = oc;
      moved = true; break;
    }
    if (!moved) break;
  }
  return cells.length >= 2 ? cells : null;
}

function isLevelSolvable(arrows, rows, cols) {
  const occ   = Array.from({ length: rows }, () => Array(cols).fill(null));
  arrows.forEach((a, i) => a.cells.forEach(({ r, c }) => { occ[r][c] = i; }));
  const alive = arrows.map(() => true);
  let progress = true;
  while (progress) {
    progress = false;
    for (let i = 0; i < arrows.length; i++) {
      if (!alive[i]) continue;
      const n  = arrows[i].cells.length;
      const dr = arrows[i].cells[n-1].r - arrows[i].cells[n-2].r;
      const dc = arrows[i].cells[n-1].c - arrows[i].cells[n-2].c;
      let r = arrows[i].cells[n-1].r + dr, c = arrows[i].cells[n-1].c + dc;
      let clear = true;
      while (r >= 0 && r < rows && c >= 0 && c < cols) {
        if (occ[r][c] !== null) { clear = false; break; }
        r += dr; c += dc;
      }
      if (clear) {
        arrows[i].cells.forEach(({ r, c }) => { occ[r][c] = null; });
        alive[i] = false; progress = true;
      }
    }
  }
  return alive.every(v => !v);
}

function randomLayout(rows, cols, num, minLen, maxLen) {
  const colors = shuffle([...COLORS]).slice(0, num);
  const occ    = Array.from({ length: rows }, () => Array(cols).fill(null));
  const arrows = [];
  for (let i = 0; i < num; i++) {
    let placed = false;
    for (let att = 0; att < 500 && !placed; att++) {
      const { dr, dc } = pick(DIRS);
      const r = rnd(rows), c = rnd(cols);
      if (occ[r][c] !== null) continue;
      const len   = minLen + rnd(maxLen - minLen + 1);
      const cells = buildBody(r, c, dr, dc, len, occ, rows, cols);
      if (!cells) continue;
      cells.forEach(({ r, c }) => { occ[r][c] = i; });
      arrows.push({ cells, color: colors[i] });
      placed = true;
    }
    if (!placed) return null;
  }
  return arrows;
}

function generateLevel(rows, cols, num, minLen, maxLen) {
  let arrows, attempts = 0;
  do {
    arrows = randomLayout(rows, cols, num, minLen, maxLen);
    if (++attempts > 5000) return null;
  } while (!arrows || !isLevelSolvable(arrows, rows, cols));
  return arrows;
}

// ─── Game state ───────────────────────────────────────────────────────────────
let levelNumber = 1;
let ROWS = 4, COLS = 4;
let arrowStates = [];
let occupancy   = [];
let lives       = MAX_LIVES;
let isGameOver  = false;
let levelDefs   = [];

// ─── Geometry helpers ─────────────────────────────────────────────────────────
const cx = c => c * CELL + CELL / 2;
const cy = r => r * CELL + CELL / 2;

function getDir(cells) {
  const n = cells.length;
  return { dr: cells[n-1].r - cells[n-2].r, dc: cells[n-1].c - cells[n-2].c };
}

// ─── Occupancy ────────────────────────────────────────────────────────────────
function buildOccupancy() {
  occupancy = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
  arrowStates.forEach((a, i) => {
    if (a.alive && !a.firing) a.cells.forEach(({ r, c }) => { occupancy[r][c] = i; });
  });
}

function isPathClear(idx) {
  const a  = arrowStates[idx];
  const hd = a.cells[a.cells.length - 1];
  const { dr, dc } = getDir(a.cells);
  let r = hd.r + dr, c = hd.c + dc;
  while (r >= 0 && r < ROWS && c >= 0 && c < COLS) {
    if (occupancy[r][c] !== null) return false;
    r += dr; c += dc;
  }
  return true;
}

function gapAhead(idx) {
  const a  = arrowStates[idx];
  const hd = a.cells[a.cells.length - 1];
  const { dr, dc } = getDir(a.cells);
  let r = hd.r + dr, c = hd.c + dc, gap = 0;
  while (r >= 0 && r < ROWS && c >= 0 && c < COLS) {
    if (occupancy[r][c] !== null) break;
    gap++; r += dr; c += dc;
  }
  return gap;
}

// ─── SVG rendering ────────────────────────────────────────────────────────────
function arrowHeadGeom(hcx, hcy, dr, dc) {
  const tip = CELL * TIP_FRAC;
  const bk  = CELL * BK_FRAC;
  const arm = CELL * ARM_FRAC;
  const tipX = hcx + dc * tip,      tipY = hcy + dr * tip;
  const bkX  = hcx + dc * bk,       bkY  = hcy + dr * bk;
  const w1x  = bkX + (-dr) * arm,   w1y  = bkY + dc * arm;
  const w2x  = bkX - (-dr) * arm,   w2y  = bkY - dc * arm;
  return { tipX, tipY, w1x, w1y, w2x, w2y };
}

function makeArrowSVG(a, idx) {
  const { dr, dc } = getDir(a.cells);
  const pts   = a.cells.map(({ r, c }) => cx(c) + ',' + cy(r));
  const bodyD = `M ${pts.join(' L ')}`;

  const hd = a.cells[a.cells.length - 1];
  const { tipX, tipY, w1x, w1y, w2x, w2y } =
    arrowHeadGeom(cx(hd.c), cy(hd.r), dr, dc);
  const headD = `M ${w1x},${w1y} L ${tipX},${tipY} L ${w2x},${w2y}`;

  return `<g id="ag${idx}">
    <path id="body${idx}" d="${bodyD}"
      stroke="${a.color}" stroke-width="${SW}"
      stroke-linejoin="round" stroke-linecap="round" fill="none"/>
    <path id="head${idx}" d="${headD}"
      stroke="${a.color}" stroke-width="${SW}"
      stroke-linejoin="round" stroke-linecap="round" fill="none"/>
  </g>`;
}

function fullRender() {
  const svg = document.getElementById('board');
  svg.setAttribute('width',  COLS * CELL);
  svg.setAttribute('height', ROWS * CELL);
  svg.innerHTML = arrowStates
    .map((a, i) => a.alive ? makeArrowSVG(a, i) : '')
    .join('');
}

function hideArrow(idx) {
  const g = document.getElementById('ag' + idx);
  if (g) g.style.display = 'none';
}

// ─── Click handling ───────────────────────────────────────────────────────────
document.getElementById('board').addEventListener('click', e => {
  if (isGameOver) return;
  const rect = e.currentTarget.getBoundingClientRect();
  const col  = Math.floor((e.clientX - rect.left) / CELL);
  const row  = Math.floor((e.clientY - rect.top)  / CELL);
  if (row < 0 || row >= ROWS || col < 0 || col >= COLS) return;
  const idx = occupancy[row]?.[col];
  if (idx == null) return;
  handleClick(idx);
});

function handleClick(idx) {
  if (isGameOver) return;
  const a = arrowStates[idx];
  if (!a?.alive || a.busy) return;

  const { dr, dc } = getDir(a.cells);
  const g      = document.getElementById('ag'   + idx);
  const bodyEl = document.getElementById('body' + idx);
  const headEl = document.getElementById('head' + idx);

  if (isPathClear(idx)) {
    // ── FIRE ──────────────────────────────────────────────────────────────────
    a.busy = true; a.firing = true;
    buildOccupancy();

    const L_orig = bodyEl.getTotalLength();
    const hd = a.cells[a.cells.length - 1];
    const lx = cx(hd.c), ly = cy(hd.r);
    bodyEl.setAttribute('d',
      bodyEl.getAttribute('d') + ` L ${lx + dc * EXIT},${ly + dr * EXIT}`);

    bodyEl.style.transition       = 'none';
    bodyEl.style.strokeDasharray  = `${L_orig} 99999`;
    bodyEl.style.strokeDashoffset = '0';
    headEl.style.transition = 'none';
    headEl.style.transform  = 'translate(0px, 0px)';

    const DUR = 500;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const exitBuf = EXIT + Math.round(CELL * TIP_FRAC) + CELL;
        bodyEl.style.transition       = `stroke-dashoffset ${DUR}ms linear`;
        bodyEl.style.strokeDashoffset = `${-(L_orig + exitBuf)}`;
        headEl.style.transition = `transform ${DUR}ms linear`;
        headEl.style.transform  = `translate(${dc * exitBuf}px, ${dr * exitBuf}px)`;
      });
    });

    setTimeout(() => {
      a.alive = false; a.busy = false; a.firing = false;
      buildOccupancy();
      hideArrow(idx);
      checkWin();
    }, DUR + 150);

  } else {
    // ── BOUNCE (blocked) ──────────────────────────────────────────────────────
    a.busy = true;
    loseLife();

    const gap       = gapAhead(idx);
    const slideDist = gap > 0 ? gap * CELL : CELL * 0.35;
    const FWD       = 100 + gap * 40;
    const BACK      = 300;
    const origD     = bodyEl.getAttribute('d');

    const L_orig = bodyEl.getTotalLength();
    const hd = a.cells[a.cells.length - 1];
    const lx = cx(hd.c), ly = cy(hd.r);
    bodyEl.setAttribute('d',
      origD + ` L ${lx + dc * (slideDist + 20)},${ly + dr * (slideDist + 20)}`);

    bodyEl.style.transition       = 'none';
    bodyEl.style.strokeDasharray  = `${L_orig} 99999`;
    bodyEl.style.strokeDashoffset = '0';
    headEl.style.transition = 'none';
    headEl.style.transform  = 'translate(0px, 0px)';

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        bodyEl.style.transition       = `stroke-dashoffset ${FWD}ms ease-out`;
        bodyEl.style.strokeDashoffset = `${-slideDist}`;
        headEl.style.transition = `transform ${FWD}ms ease-out`;
        headEl.style.transform  = `translate(${dc * slideDist}px, ${dr * slideDist}px)`;
      });
    });

    setTimeout(() => {
      bodyEl.setAttribute('stroke', '#c0321f');
      headEl.setAttribute('stroke', '#c0321f');
      bodyEl.style.transition       = `stroke-dashoffset ${BACK}ms cubic-bezier(.36,.07,.19,.97)`;
      bodyEl.style.strokeDashoffset = '0';
      headEl.style.transition = `transform ${BACK}ms cubic-bezier(.36,.07,.19,.97)`;
      headEl.style.transform  = 'translate(0px, 0px)';

      setTimeout(() => {
        bodyEl.style.transition = headEl.style.transition = 'none';
        bodyEl.style.strokeDasharray = bodyEl.style.strokeDashoffset = '';
        headEl.style.transform = '';
        bodyEl.setAttribute('d', origD);
        bodyEl.setAttribute('stroke', a.color);
        headEl.setAttribute('stroke', a.color);
        a.busy = false;
      }, BACK + 60);
    }, FWD + 20);
  }
}

// ─── Lives ────────────────────────────────────────────────────────────────────
function loseLife() {
  if (lives <= 0) return;
  lives--;
  renderHearts();
  if (lives === 0) triggerGameOver();
}

function renderHearts() {
  document.querySelectorAll('.heart')
    .forEach((h, i) => h.classList.toggle('lost', i >= lives));
}

function buildHearts() {
  const container = document.getElementById('hearts');
  container.innerHTML = '';
  for (let i = 0; i < MAX_LIVES; i++) {
    const svg  = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('width',  '18');
    svg.setAttribute('height', '18');
    svg.classList.add('heart');
    path.setAttribute('d', 'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z');
    path.setAttribute('fill', '#e57373');
    svg.appendChild(path);
    container.appendChild(svg);
  }
}

// ─── Win / Game over ──────────────────────────────────────────────────────────
function checkWin() {
  const remaining = arrowStates.filter(a => a.alive).length;
  const msg = document.getElementById('message');
  document.getElementById('counter').textContent =
    remaining === 1 ? '1 arrow remaining' : `${remaining} arrows remaining`;
  if (remaining === 0) {
    msg.textContent = '✓ Level complete!';
    msg.className   = 'win';
    document.getElementById('btn-next').style.display = 'inline-block';
  }
}

function triggerGameOver() {
  isGameOver = true;
  const msg = document.getElementById('message');
  msg.textContent = '✗ No lives left!';
  msg.className   = 'gameover';
  document.getElementById('btn-retry').style.display = 'inline-block';
}

function resetUI() {
  const msg = document.getElementById('message');
  msg.textContent = 'Click an arrow to fire it';
  msg.className   = '';
  document.getElementById('btn-next').style.display  = 'none';
  document.getElementById('btn-retry').style.display = 'none';
}

// ─── Progress persistence (localStorage) ─────────────────────────────────────
const SAVE_KEY = 'arrowPuzzle_progress';

function saveProgress() {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify({
      maxLevel:  levelNumber,
      updatedAt: Date.now(),
    }));
  } catch (_) {}
}

function loadProgress() {
  try {
    const raw  = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (typeof data.maxLevel === 'number' && data.maxLevel >= 1) return data;
  } catch (_) {}
  return null;
}

// ─── Level flow ───────────────────────────────────────────────────────────────
function startLevel(n) {
  levelNumber = n;
  const cfg = getLevelConfig(n);
  ROWS = cfg.rows; COLS = cfg.cols;
  CELL = computeCell(ROWS, COLS);
  SW   = Math.round(SW_BASE * (CELL / 70));
  lives     = MAX_LIVES;
  isGameOver = false;

  let defs = null;
  for (let t = 0; t < 100 && !defs; t++)
    defs = generateLevel(ROWS, COLS, cfg.num, cfg.min, cfg.max);
  if (!defs) { startLevel(n); return; }

  levelDefs   = defs;
  arrowStates = defs.map(d => ({
    color:  d.color,
    cells:  d.cells.map(c => ({ ...c })),
    alive:  true,
    firing: false,
    busy:   false,
  }));
  buildOccupancy();

  document.getElementById('level-num').textContent = n;
  const remaining = arrowStates.length;
  document.getElementById('counter').textContent =
    remaining === 1 ? '1 arrow remaining' : `${remaining} arrows remaining`;

  buildHearts();
  resetUI();
  fullRender();
}

function restartLevel() { startLevel(levelNumber); }

function nextLevel() {
  startLevel(levelNumber + 1);
  saveProgress();
}

// ═════════════════════════════════════════════════════════════════════════════
//  SUPABASE — Auth + Cloud sync
// ═════════════════════════════════════════════════════════════════════════════
const SUPABASE_URL = 'https://vllurrtaxijlzuyussjs.supabase.co';     
const SUPABASE_KEY = 'sb_publishable_cBuhWyK4y5GvY8qC7EFGSw_CH243IBY';

const supabaseClient = window.supabase
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY)
  : null;

// ─── Auth modal helpers ───────────────────────────────────────────────────────
let currentTab = 'signin';

function openAuthModal() {
  setTab('signin');
  const savedEmail = localStorage.getItem('saved_email') || '';
  document.getElementById('auth-email').value    = savedEmail;
  document.getElementById('auth-password').value = '';
  setAuthError('');
  document.getElementById('auth-overlay').classList.add('open');
  document.getElementById(savedEmail ? 'auth-password' : 'auth-email').focus();
}

function closeAuthModal() {
  document.getElementById('auth-overlay').classList.remove('open');
}

function setTab(tab) {
  currentTab = tab;
  const tabs   = document.querySelectorAll('.auth-tab');
  const submit = document.getElementById('auth-submit');
  tabs[0].classList.toggle('active', tab === 'signin');
  tabs[1].classList.toggle('active', tab === 'signup');
  submit.textContent = tab === 'signin' ? 'Sign In' : 'Create Account';
  document.getElementById('auth-password').setAttribute(
    'autocomplete', tab === 'signin' ? 'current-password' : 'new-password'
  );
  setAuthError('');
}

function setAuthError(msg) {
  document.getElementById('auth-error').textContent = msg;
}

document.getElementById('auth-overlay').addEventListener('click', e => {
  if (e.target === document.getElementById('auth-overlay')) closeAuthModal();
});

document.getElementById('auth-password').addEventListener('keydown', e => {
  if (e.key === 'Enter') submitAuth();
});

// ─── Auth actions ─────────────────────────────────────────────────────────────
async function submitAuth() {
  if (!supabaseClient) { setAuthError('Supabase no disponible'); return; }

  const email    = document.getElementById('auth-email').value.trim();
  const password = document.getElementById('auth-password').value;
  const submit   = document.getElementById('auth-submit');

  if (!email || !password) { setAuthError('Email and password are required.'); return; }

  submit.disabled    = true;
  submit.textContent = '…';
  setAuthError('');

  let error;
  if (currentTab === 'signin') {
    ({ error } = await supabaseClient.auth.signInWithPassword({ email, password }));
  } else {
    ({ error } = await supabaseClient.auth.signUp({ email, password }));
  }

  submit.disabled    = false;
  submit.textContent = currentTab === 'signin' ? 'Sign In' : 'Create Account';

  if (error) {
    setAuthError(error.message);
  } else {
    try { localStorage.setItem('saved_email', email); } catch (_) {}
    closeAuthModal();
  }
}

async function logout() {
  try {
    if (!supabaseClient) return;
    console.log('[auth] Cerrando sesión…');
    const { error } = await supabaseClient.auth.signOut();
    if (error) throw error;
    console.log('[auth] Sesión cerrada con éxito. Recargando…');
    window.location.reload();
  } catch (err) {
    console.error('[auth] Error al cerrar sesión:', err.message);
  }
}

// ─── Cloud sync ───────────────────────────────────────────────────────────────
async function syncProgress(user) {
  if (!supabaseClient || !user) return;
  console.log('[sync] ── Iniciando para:', user.email, '──────────────────');

  const stored     = loadProgress() || { maxLevel: 1, updatedAt: 0 };
  const localLevel = Math.max(levelNumber, parseInt(stored.maxLevel, 10) || 1);
  console.log('[sync] Local  → maxLevel:', localLevel,
              '(memoria:', levelNumber, '| localStorage:', stored.maxLevel + ')');

  let cloud = null;
  try {
    console.log('[sync] Consultando Supabase…');
    const { data, error } = await supabaseClient
      .from('arrow_game_progress')
      .select('max_level, updated_at')
      .eq('id', user.id)
      .maybeSingle();
    if (error) throw error;
    cloud = data;
  } catch (err) {
    console.warn('[sync] ❌ Error al leer nube:', err?.message ?? err);
    return;
  }

  console.log('[sync] Nube   →',
    cloud
      ? `maxLevel: ${cloud.max_level} | updatedAt: ${new Date(cloud.updated_at).toLocaleString()}`
      : 'Sin datos (usuario nuevo)');

  if (!cloud) {
    console.log('[sync] Nuevo usuario. Insertando nivel local:', localLevel);
    try {
      const { error } = await supabaseClient
        .from('arrow_game_progress')
        .insert({ id: user.id, max_level: localLevel,
                  updated_at: new Date(stored.updatedAt || Date.now()).toISOString() });
      if (error) throw error;
      console.log('[sync] ✓ INSERT OK → nube tiene nivel', localLevel);
    } catch (err) {
      console.warn('[sync] ❌ Error en INSERT:', err?.message ?? err);
    }
    showSynced();
    return;
  }

  const cloudLevel = parseInt(cloud.max_level, 10) || 1;
  const finalLevel = Math.max(localLevel, cloudLevel);
  console.log(`[sync] Resultado fusión: Local=${localLevel} | Nube=${cloudLevel} | Final=${finalLevel}`);

  if (cloudLevel > localLevel) {
    console.log('[sync] ✓ La NUBE gana → startLevel(' + cloudLevel + ')');
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify({
        maxLevel: cloudLevel, updatedAt: new Date(cloud.updated_at).getTime(),
      }));
    } catch (_) {}
    startLevel(cloudLevel);

  } else if (localLevel > cloudLevel) {
    console.log('[sync] ✓ El LOCAL gana → UPDATE nube a', localLevel);
    try {
      const { error } = await supabaseClient
        .from('arrow_game_progress')
        .update({ max_level: localLevel,
                  updated_at: new Date(stored.updatedAt || Date.now()).toISOString() })
        .eq('id', user.id);
      if (error) throw error;
      console.log('[sync] ✓ UPDATE OK → nube tiene nivel', localLevel);
    } catch (err) {
      console.warn('[sync] ❌ Error en UPDATE:', err?.message ?? err);
    }

  } else {
    console.log('[sync] ✓ Empate en nivel', finalLevel, '— ya sincronizados.');
  }

  showSynced();
  console.log('[sync] ── Fin ───────────────────────────────────────────────');
}

function showSynced() {
  const el = document.getElementById('sync-indicator');
  el.style.display = 'inline';
  setTimeout(() => { el.style.display = 'none'; }, 2500);
}

// ─── Auth state listener ──────────────────────────────────────────────────────
if (supabaseClient) {
  supabaseClient.auth.onAuthStateChange(async (event, session) => {
    console.log('[auth] evento:', event, '| usuario:', session?.user?.email ?? 'ninguno');
    const user      = session?.user ?? null;
    const authUser  = document.getElementById('auth-user');
    const btnLogin  = document.getElementById('btn-login');
    const btnLogout = document.getElementById('btn-logout');

    if (user) {
      authUser.textContent    = user.email;
      authUser.style.display  = 'inline';
      btnLogin.style.display  = 'none';
      btnLogout.style.display = 'inline-block';
      if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
        await syncProgress(user);
      }
    } else {
      authUser.style.display  = 'none';
      btnLogin.style.display  = 'inline-block';
      btnLogout.style.display = 'none';
    }
  });
}

// ─── Boot ─────────────────────────────────────────────────────────────────────
(function boot() {
  const saved   = loadProgress();
  const startAt = saved ? saved.maxLevel : 1;
  startLevel(startAt);
})();

// Re-render on resize / orientation change
let resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    CELL = computeCell(ROWS, COLS);
    SW   = Math.round(SW_BASE * (CELL / 70));
    buildOccupancy();
    fullRender();
  }, 150);
});
