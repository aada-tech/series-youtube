// Moteur d'animation commun aux épisodes du Village des Trois Moulins.
// Chaque épisode s'enregistre avec Moteur.episode({...}) puis la page appelle Moteur.demarrer().
// Si une voix a été générée (audio/durees.js), la durée de chaque réplique suit l'audio réel.
(() => {
  const M = window.Moteur = {};
  const W = 1920, H = 1080, GROUND = 860;
  const cv = document.createElement('canvas');   // image affichée (caméra, effets, sous-titres)
  cv.width = W; cv.height = H;
  const d = cv.getContext('2d');
  const wcv = document.createElement('canvas');  // monde : les scènes y dessinent
  wcv.width = W; wcv.height = H;
  const c = wcv.getContext('2d');
  const pcv = document.createElement('canvas');  // scène précédente, pour les transitions
  pcv.width = W; pcv.height = H;
  const pc = pcv.getContext('2d');
  const INK = '#2B2E33', RED = '#D64541', GREEN = '#2F9E62', CLAY = '#C0643A', RAW = '#A39485', PAPER = '#F6F7F2', BLUE = '#3C7DD9';
  const FD = '"Fredoka", "Trebuchet MS", sans-serif';
  const FB = '"Atkinson Hyperlegible", Verdana, sans-serif';
  Object.assign(M, { c, cv, W, H, GROUND, INK, RED, GREEN, CLAY, RAW, PAPER, BLUE, FD, FB });

  // ---------- outils ----------
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, p) => a + (b - a) * p;
  const ease = x => x < .5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;
  const prog = (t, a, d) => ease(clamp((t - a) / d));
  const lin = (t, a, d) => clamp((t - a) / d);
  const win = (t, a, b, f) => clamp((t - a) / f) * clamp((b - t) / f);
  function hex(h) { const n = parseInt(h.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; }
  function mix(a, b, p) { const A = hex(a), B = hex(b); return 'rgb(' + A.map((v, i) => Math.round(lerp(v, B[i], p))).join(',') + ')'; }
  function rr(x, y, w, h, r) { c.beginPath(); c.roundRect(x, y, w, h, r); }
  function circ(x, y, r) { c.beginPath(); c.arc(x, y, Math.max(0, r), 0, Math.PI * 2); }
  function ell(x, y, rx, ry, rot = 0) { c.beginPath(); c.ellipse(x, y, Math.max(0, rx), Math.max(0, ry), rot, 0, Math.PI * 2); }
  function line(x1, y1, x2, y2) { c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke(); }
  function poly(pts) { c.beginPath(); pts.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.closePath(); }
  function alpha(a, fn) { if (a <= 0) return; c.save(); c.globalAlpha *= a; fn(); c.restore(); }
  Object.assign(M, { clamp, lerp, ease, prog, lin, win, mix, rr, circ, ell, line, poly, alpha });
  const rnd = i => { const v = Math.sin(i * 127.1 + 311.7) * 43758.5453; return v - Math.floor(v); };
  const easeOutBack = x => { const k = 1.70158; return 1 + (k + 1) * Math.pow(x - 1, 3) + k * Math.pow(x - 1, 2); };
  const easeOutBounce = x => {
    const n = 7.5625, d = 2.75;
    if (x < 1 / d) return n * x * x;
    if (x < 2 / d) return n * (x -= 1.5 / d) * x + .75;
    if (x < 2.5 / d) return n * (x -= 2.25 / d) * x + .9375;
    return n * (x -= 2.625 / d) * x + .984375;
  };
  // Apparition avec léger dépassement : échelle et opacité pour une progression a (0 → 1).
  const pop = a => a >= 1 ? 1 : Math.max(0, easeOutBack(clamp(a)));
  // Étincelle à quatre branches.
  function sparkle(x, y, s, a = 1, col = '#FFD76A') {
    alpha(a, () => {
      c.fillStyle = col; c.beginPath();
      for (let i = 0; i < 8; i++) { const ang = i * Math.PI / 4, rr_ = i % 2 ? s * .28 : s; c.lineTo(x + Math.cos(ang) * rr_, y + Math.sin(ang) * rr_); }
      c.closePath(); c.fill();
    });
  }
  // Explosion d'étincelles et anneau (p : 0 → 1).
  function burst(x, y, p, r = 30, col = '#FFD76A') {
    if (p <= 0 || p >= 1) return;
    alpha(1 - p, () => {
      c.strokeStyle = col; c.lineWidth = 6 * (1 - p) + 1; circ(x, y, r * (.6 + p * 2.2)); c.stroke();
      for (let i = 0; i < 8; i++) { const ang = i * Math.PI / 4 + .3, d = r * (.8 + p * 2.6); sparkle(x + Math.cos(ang) * d, y + Math.sin(ang) * d, r * .35 * (1 - p) + 2, 1, i % 2 ? '#FFFFFF' : col); }
    });
  }

  // ---------- personnages ----------
  const KIND = { kid: 17, teen: 15.5, adult: 13.5 };
  const CAST = {
    narr:        { name: 'Narratrice', cap: '#D5DBE0' },
    sacha:       { name: 'Sacha', kind: 'kid', shirt: '#E8833A', skin: '#E9B48A', hair: '#3A2A20', style: 'short', ring: '#E8833A', cap: '#FFB27E' },
    milo:        { name: 'Milo', kind: 'kid', shirt: BLUE, skin: '#C99570', hair: '#1F1A17', style: 'curly', glasses: true, ring: BLUE, cap: '#9CC2FF' },
    naya:        { name: 'Naya', kind: 'teen', shirt: '#7A5BC4', skin: '#8D5A3B', hair: '#1E1614', style: 'bun', ring: '#7A5BC4', cap: '#CDB8FF' },
    menuisier:   { name: 'Le menuisier', kind: 'adult', shirt: '#6F8FA6', apron: '#9B6A3E', skin: '#C68B5E', hair: '#4A3524', style: 'short', beard: true, ring: '#9B6A3E', cap: '#E6BD8F' },
    forgeronne:  { name: 'La forgeronne', kind: 'adult', shirt: '#B5483C', apron: '#4F5A66', skin: '#F1C9A5', hair: '#8A3B1E', style: 'tail', ring: '#4F5A66', cap: '#F2A094' },
    bergere:     { name: 'La bergère', kind: 'adult', shirt: '#5E9A5A', skin: '#A86B45', hair: '#2B1D16', style: 'curly', ring: '#5E9A5A', cap: '#AEDBA9' },
    meunier:     { name: 'Le meunier', kind: 'adult', shirt: '#EFE3C4', apron: '#D9B64A', skin: '#F0C6A0', hair: '#9A9A9A', style: 'bald', ring: '#C9A43A', cap: '#F2DC8C' },
    maraichere:  { name: 'La maraîchère', kind: 'adult', shirt: '#E2B33C', apron: '#6E8B3D', skin: '#6B4430', hair: '#16100D', style: 'bun', ring: '#6E8B3D', cap: '#C9E29A' },
    marchand:    { name: "L'artisan nomade", kind: 'adult', shirt: '#2E8C8C', apron: '#C6A15B', skin: '#D8A27A', hair: '#2C2C2C', style: 'short', beard: true, ring: '#2E8C8C', cap: '#8FD6D6' },
    mecanicienne:{ name: 'La mécanicienne', kind: 'adult', shirt: '#546E8C', apron: '#394A5E', skin: '#E8BE98', hair: '#5A3A22', style: 'tail', ring: '#394A5E', cap: '#A9C0DC' },
    epiciere:    { name: "L'épicière", kind: 'adult', shirt: '#C2577A', apron: '#F3E9DC', skin: '#B97A52', hair: '#3B2418', style: 'short', ring: '#C2577A', cap: '#F3A6C0' },
  };
  M.CAST = CAST;

  function head(P, open, o = {}) {
    const r = KIND[P.kind], blink = o.blink || 0, look = o.look || 0, mood = o.mood || '';
    const OUT = 'rgba(43,46,51,.5)';
    c.lineJoin = 'round'; c.lineCap = 'round';
    c.fillStyle = P.hair;
    if (P.style === 'tail') { ell(-r * 1.02, r * .28, r * .38, r * .68, .25); c.fill(); }
    if (P.style === 'bun') { circ(0, -r * 1.12, r * .45); c.fill(); }
    if (P.style === 'curly') for (const a of [-3.1, -2.75, -2.35, -1.95, -1.57, -1.2, -.8, -.4, -.05]) { circ(Math.cos(a) * r * .98, Math.sin(a) * r * .98 + r * .12, r * .36); c.fill(); }
    if (P.style !== 'bald') { circ(0, -r * .1, r * 1.05); c.fill(); }
    c.fillStyle = P.skin;
    circ(-r * .93, r * .16, r * .2); c.fill(); circ(r * .93, r * .16, r * .2); c.fill();
    circ(0, r * .08, r * .92); c.fill();
    c.strokeStyle = OUT; c.lineWidth = r * .06; c.stroke();
    c.fillStyle = 'rgba(0,0,0,.06)'; c.beginPath(); c.arc(0, r * .08, r * .92, .15 * Math.PI, .85 * Math.PI); c.fill();
    c.fillStyle = P.hair;
    if (P.style === 'short') { c.beginPath(); c.moveTo(-r * .92, 0); c.quadraticCurveTo(-r * .55, -r * .65, r * .12, -r * .52); c.quadraticCurveTo(r * .62, -r * .56, r * .92, -r * .08); c.lineTo(r * .92, -r * .7); c.lineTo(-r * .92, -r * .7); c.closePath(); c.fill(); }
    if (P.style === 'curly') { [[-.45, -.58, .26], [.02, -.66, .26], [.48, -.55, .24]].forEach(([x, y, rr_]) => { circ(x * r, y * r, rr_ * r); c.fill(); }); }
    if (P.style === 'bun' || P.style === 'tail') { c.beginPath(); c.moveTo(-r * .9, -r * .02); c.quadraticCurveTo(-r * .2, -r * .8, r * .9, -r * .22); c.lineTo(r * .9, -r * .75); c.lineTo(-r * .9, -r * .75); c.closePath(); c.fill(); }
    if (P.style === 'bald') { circ(-r * .9, -r * .08, r * .26); c.fill(); circ(r * .9, -r * .08, r * .26); c.fill(); }
    if (P.style !== 'bald') { c.strokeStyle = 'rgba(255,255,255,.2)'; c.lineWidth = r * .1; c.beginPath(); c.arc(0, -r * .1, r * .82, -2.5, -1.75); c.stroke(); }
    const eyY = -r * .02, sep = r * .36, px = look * r * .08;
    [-1, 1].forEach(sd => {
      const ex = sd * sep, eh = r * .21 * (1 - blink) * (mood === '!' ? 1.1 : 1);
      if (eh > r * .05) {
        c.fillStyle = '#FFFFFF'; ell(ex, eyY, r * .17, eh); c.fill();
        c.fillStyle = INK; circ(ex + px, eyY + r * .02, Math.min(r * .12, eh * .75)); c.fill();
        c.fillStyle = '#FFFFFF'; circ(ex + px + r * .045, eyY - r * .035, r * .04); c.fill();
      } else { c.strokeStyle = INK; c.lineWidth = r * .06; c.beginPath(); c.arc(ex, eyY - r * .03, r * .13, .15 * Math.PI, .85 * Math.PI); c.stroke(); }
    });
    c.strokeStyle = P.style === 'bald' ? '#7A7A7A' : P.hair; c.lineWidth = r * .09;
    const by = -r * .33 - (mood === '!' ? r * .09 : 0);
    [-1, 1].forEach(sd => {
      const raise = mood === '?' && sd === 1 ? r * .1 : 0, sad = mood === 'think' ? r * .04 : 0;
      line(sd * (sep - r * .14), by - raise + sad * sd, sd * (sep + r * .13), by - raise - (mood === 'think' ? 0 : r * .025));
    });
    if (P.glasses) { c.strokeStyle = INK; c.lineWidth = r * .07; circ(-sep, eyY, r * .26); c.stroke(); circ(sep, eyY, r * .26); c.stroke(); line(-r * .1, eyY, r * .1, eyY); }
    c.strokeStyle = 'rgba(110,55,35,.35)'; c.lineWidth = r * .06; c.beginPath(); c.arc(0, r * .2, r * .09, .15 * Math.PI, .85 * Math.PI); c.stroke();
    c.fillStyle = 'rgba(232,110,95,.28)'; circ(-r * .56, r * .33, r * .15); c.fill(); circ(r * .56, r * .33, r * .15); c.fill();
    if (P.beard) { c.fillStyle = P.hair; c.beginPath(); c.arc(0, r * .15, r * .88, .06 * Math.PI, .94 * Math.PI); c.closePath(); c.fill(); }
    if (open > .08) {
      const mw = r * (.2 + (mood === '!' ? .05 : 0)), mh = r * .06 + open * r * .17;
      c.fillStyle = '#5E2222'; ell(0, r * .5, mw, mh); c.fill();
      c.fillStyle = '#E0736B'; ell(0, r * .5 + mh * .45, mw * .55, mh * .35); c.fill();
    } else {
      c.strokeStyle = P.beard ? '#F3E3D3' : INK; c.lineWidth = r * .08;
      const big = mood === 'happy' ? 1.25 : 1;
      c.beginPath(); c.arc(0, r * .28, r * .22 * big, .2 * Math.PI, .8 * Math.PI); c.stroke();
    }
  }

  const POS = {}; let PREV = {};
  function hashStr(s) { let h = 7; for (const ch of s) h = (h * 31 + ch.charCodeAt(0)) % 9973; return h / 9973 * 6.283; }
  // Membre articulé (cuisse + tibia, ou bras + avant-bras). Angles mesurés depuis la verticale, positifs vers l'avant.
  function limb(x0, y0, a1, a2, L1, L2, col, w) {
    const x1 = x0 + Math.sin(a1) * L1, y1 = y0 + Math.cos(a1) * L1;
    const x2 = x1 + Math.sin(a1 + a2) * L2, y2 = y1 + Math.cos(a1 + a2) * L2;
    c.lineCap = 'round'; c.lineJoin = 'round';
    c.strokeStyle = 'rgba(43,46,51,.5)'; c.lineWidth = w + 2.2;
    c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.lineTo(x2, y2); c.stroke();
    c.strokeStyle = col; c.lineWidth = w;
    c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.lineTo(x2, y2); c.stroke();
    return [x2, y2];
  }

  // Personnage debout, pieds en (x, y), hauteur h. Il respire, cligne des yeux, regarde celui qui parle,
  // et joue sa réplique : gestes, saut sur « ! », tête penchée sur « ? », main au menton sur « … ».
  function person(who, x, y, h, o = {}) {
    const P = CAST[who], r = KIND[P.kind], s = h / 100, f = o.face || 1, adult = P.kind === 'adult';
    const ph = hashStr(who);
    const legTop = adult ? -42 : -38, bodyTop = -100 + 2 * r - 3, bw = adult ? 34 : 30;
    const ln = CUR && CUR.who === who && CUR_T < CUR.d - .5 ? CUR : null;
    const txt = ln ? ln.text.trim() : '';
    const mood = o.mood || (!ln ? '' : /…$/.test(txt) || (txt.includes('…') && !/[!?]/.test(txt)) ? 'think' : /!/.test(txt) ? '!' : /\?$/.test(txt) ? '?' : '');
    const walking = !!o.walk, wp = o.walk || 0;
    const bob = walking ? Math.abs(Math.sin(wp)) * 2.4 : 0;
    const hop = !walking && ln && mood === '!' && !adult ? Math.sin(clamp(CUR_T / .5) * Math.PI) * 8 : 0;
    const breathe = Math.sin(TT * 2.2 + ph);
    const bt = (TT * .85 + ph * 3) % 3.9, blink = bt < .15 ? Math.sin(bt / .15 * Math.PI) : 0;
    const tx = o.lookAt ?? (CUR && CUR.who !== who && PREV[CUR.who] ? PREV[CUR.who].x : null);
    const look = tx == null ? Math.sin(TT * .4 + ph) * .3 : clamp((tx - x) / 250, -1, 1) * f;
    POS[who] = { x, y: y - h * .8, h };
    c.save(); c.translate(x, y); c.scale(s * f, s);
    if (o.hl) { const g = c.createRadialGradient(0, 0, 2, 0, 0, 42); g.addColorStop(0, `rgba(255,205,80,${.55 * o.hl})`); g.addColorStop(1, 'rgba(255,205,80,0)'); c.fillStyle = g; ell(0, 0, 44, 10); c.fill(); }
    c.fillStyle = 'rgba(40,55,40,.16)'; ell(0, 0, 22 - hop * .6, 4.5); c.fill();
    c.translate(0, -bob - hop);
    // jambes
    const L1 = -legTop * .52, L2 = -legTop * .5, pants = P.pants || '#3E4A5C';
    let la = .03, lb = -.03, ka = 0, kb = 0;
    if (walking) { la = Math.sin(wp) * .55; lb = -la; ka = -Math.max(0, Math.sin(wp + 1.4)) * .8; kb = -Math.max(0, Math.sin(wp + 1.4 + Math.PI)) * .8; }
    const shoe = ([fx, fy]) => { c.fillStyle = INK; ell(fx + 2.5, fy - 1.5, 6.5, 3.8); c.fill(); c.fillStyle = 'rgba(255,255,255,.18)'; ell(fx + 3.5, fy - 3, 3, 1.2); c.fill(); };
    shoe(limb(-5, legTop, lb, kb, L1, L2, pants, 8.5));
    shoe(limb(5, legTop, la, ka, L1, L2, pants, 8.5));
    // bras : angles des deux bras selon l'action
    const A1 = adult ? 14 : 12.5, A2 = adult ? 13 : 11.5, shX = bw / 2 - 3, shY = bodyTop + 7;
    let fa1 = .12 + Math.sin(TT * 1.3 + ph) * .04, fa2 = .22, ba1 = -.12 - Math.sin(TT * 1.1 + ph) * .04, ba2 = -.2;
    if (walking) { fa1 = -Math.sin(wp) * .6; ba1 = Math.sin(wp) * .6; fa2 = .4; ba2 = .4; }
    if (ln && !walking) {
      if (mood === 'think') { fa1 = 2.6; fa2 = 2.35; }
      else {
        fa1 = .95 + .38 * Math.sin(TT * 3.1 + ph); fa2 = .75 + .35 * Math.sin(TT * 4.2 + ph);
        if (mood === '!') { ba1 = -(.9 + .35 * Math.sin(TT * 3.7 + ph)); ba2 = -.6; }
        if (mood === '?') { fa1 = 1.2; fa2 = 1.1 + .15 * Math.sin(TT * 3); }
      }
    }
    if (o.reach) { fa1 = 1.45 + Math.sin(TT * 2 + ph) * .04; fa2 = .1; }
    if (o.up) { fa1 = 2.35 + .22 * Math.sin(TT * 9 + ph); fa2 = -.5; }
    if (o.both) { ba1 = 1.3; ba2 = .1; fa1 = 1.45; fa2 = .1; }
    const sy = 1 + breathe * .013;
    c.save(); c.translate(0, legTop + 4); c.scale(1, sy); c.translate(0, -(legTop + 4));
    const bh = limb(-shX, shY, ba1, ba2, A1, A2, mix(P.shirt, '#000000', .12), 7);
    c.fillStyle = P.skin; circ(bh[0], bh[1], 4.2); c.fill();
    // buste
    rr(-bw / 2, bodyTop, bw, legTop - bodyTop + 4, 10);
    c.fillStyle = P.shirt; c.fill(); c.strokeStyle = 'rgba(43,46,51,.5)'; c.lineWidth = 2; c.stroke();
    c.save(); rr(-bw / 2, bodyTop, bw, legTop - bodyTop + 4, 10); c.clip();
    c.fillStyle = 'rgba(0,0,0,.09)'; c.fillRect(-bw / 2, legTop - 8, bw, 14);
    c.fillStyle = 'rgba(255,255,255,.13)'; c.fillRect(-bw / 2, bodyTop, 5, legTop - bodyTop);
    if (P.apron) { c.fillStyle = P.apron; rr(-bw / 2 + 5, bodyTop + 10, bw - 10, legTop - bodyTop + 6, 4); c.fill(); c.fillStyle = 'rgba(0,0,0,.1)'; c.fillRect(-bw / 2 + 5, bodyTop + 16, bw - 10, 2); }
    c.restore();
    c.fillStyle = P.skin; ell(0, bodyTop + 1.5, 5.5, 3.2); c.fill();
    const fh = limb(shX, shY, fa1, fa2, A1, A2, P.shirt, 7);
    c.fillStyle = P.skin; circ(fh[0], fh[1], 4.4); c.fill(); c.strokeStyle = 'rgba(43,46,51,.4)'; c.lineWidth = 1.2; c.stroke();
    c.restore();
    const tilt = (o.tilt || 0) + (ln && mood === '?' ? .14 : 0) + (ln && mood === 'think' ? -.1 : 0) + (ln ? Math.sin(TT * 5.5 + ph) * .04 : Math.sin(TT * .8 + ph) * .025);
    c.save(); c.translate(0, -100 + r - breathe * .6); c.rotate(tilt);
    head(P, o.open || 0, { blink, look, mood: ln ? mood : (o.mood || '') });
    c.restore();
    c.restore();
    return { hx: x + f * fh[0] * s, hy: y + (fh[1] - bob - hop) * s, top: y - h, x };
  }
  // Personnage standard d'une scène : bouche et halo suivent la réplique en cours.
  function actor(who, x, y, h, o = {}) { return person(who, x, y, h, { open: talk(who), hl: spk(who), ...o }); }
  Object.assign(M, { head, person, actor, KIND, POS });

  // ---------- objets ----------
  const ITEMS = {
    pomme(s) {
      c.fillStyle = '#D9443A'; circ(0, s * .1, s * .8); c.fill();
      c.fillStyle = 'rgba(255,255,255,.35)'; ell(-s * .3, -s * .15, s * .16, s * .24, -.4); c.fill();
      c.strokeStyle = '#5B3A22'; c.lineWidth = s * .12; c.lineCap = 'round'; line(0, -s * .55, s * .1, -s * .92);
      c.save(); c.translate(s * .32, -s * .74); c.rotate(-.5); c.fillStyle = '#4E9A4B'; ell(0, 0, s * .3, s * .13); c.fill(); c.restore();
    },
    panier(s) {
      [[-.45, -.32], [.45, -.32], [0, -.5]].forEach(([dx, dy]) => { c.save(); c.translate(dx * s, dy * s); ITEMS.pomme(s * .42); c.restore(); });
      c.fillStyle = '#B07A45'; poly([[-s, -.2 * s], [s, -.2 * s], [.75 * s, .8 * s], [-.75 * s, .8 * s]]); c.fill();
      c.strokeStyle = '#8A5A2E'; c.lineWidth = s * .08; line(-.9 * s, .15 * s, .9 * s, .15 * s); line(-.82 * s, .48 * s, .82 * s, .48 * s);
    },
    planche(s) {
      c.rotate(-.1);
      c.fillStyle = '#C98E55'; rr(-s * 1.1, -s * .3, s * 2.2, s * .6, s * .08); c.fill();
      c.strokeStyle = '#8A5A2E'; c.lineWidth = s * .06; c.stroke();
      c.strokeStyle = 'rgba(120,75,35,.55)'; c.lineWidth = s * .04;
      c.beginPath(); c.moveTo(-s * .95, -s * .1); c.bezierCurveTo(-s * .3, -s * .2, s * .2, 0, s * .95, -s * .12); c.stroke();
      c.beginPath(); c.moveTo(-s * .95, s * .12); c.bezierCurveTo(-s * .2, s * .02, s * .3, s * .2, s * .95, s * .1); c.stroke();
    },
    clous(s) {
      [-1, 0, 1].forEach(i => {
        c.save(); c.translate(i * s * .45, 0); c.rotate(i * .15);
        c.strokeStyle = '#7D8894'; c.lineWidth = s * .15; c.lineCap = 'butt'; line(0, -s * .66, 0, s * .6);
        c.fillStyle = '#7D8894'; poly([[-s * .075, s * .6], [s * .075, s * .6], [0, s * .85]]); c.fill();
        c.fillStyle = '#4F5A66'; rr(-s * .24, -s * .82, s * .48, s * .17, s * .05); c.fill();
        c.restore();
      });
    },
    laine(s) {
      c.fillStyle = '#F1E4CC'; circ(0, 0, s * .85); c.fill();
      c.strokeStyle = '#C3AC82'; c.lineWidth = s * .07; c.stroke(); c.lineWidth = s * .06;
      [[-.3, .9], [0, 1], [.35, .85]].forEach(([dx, k]) => { c.beginPath(); c.ellipse(dx * s, 0, s * .3 * k, s * .8 * k, .5, -1.2, 1.2); c.stroke(); });
    },
    farine(s) {
      c.fillStyle = '#EFE3C4'; c.strokeStyle = '#BFA877'; c.lineWidth = s * .07;
      c.beginPath(); c.moveTo(-s * .45, -s * .6); c.quadraticCurveTo(-s * .95, s * .1, -s * .7, s * .85); c.lineTo(s * .7, s * .85); c.quadraticCurveTo(s * .95, s * .1, s * .45, -s * .6); c.closePath(); c.fill(); c.stroke();
      poly([[-s * .45, -s * .6], [-s * .55, -s * .9], [s * .55, -s * .9], [s * .45, -s * .6]]); c.fill(); c.stroke();
      c.strokeStyle = '#C9A43A'; c.lineWidth = s * .08; line(0, s * .55, 0, -s * .1);
      [-.05, .12, .28].forEach(y => { line(0, y * s, -s * .18, (y - .16) * s); line(0, y * s, s * .18, (y - .16) * s); });
    },
    ble(s) {
      c.strokeStyle = '#C9A43A'; c.lineWidth = s * .09; c.lineCap = 'round';
      [-.35, 0, .35].forEach(dx => {
        line(dx * s, s * .9, dx * s * .6, -s * .2);
        for (let k = 0; k < 4; k++) { const y = -s * .2 - k * s * .18; c.fillStyle = '#E2BD4E'; ell(dx * s * .6 - s * .08, y, s * .08, s * .14, -.5); c.fill(); ell(dx * s * .6 + s * .08, y, s * .08, s * .14, .5); c.fill(); }
      });
    },
    carotte(s) {
      c.fillStyle = '#E8792E'; poly([[-s * .3, -s * .5], [s * .3, -s * .5], [0, s * .9]]); c.fill();
      c.strokeStyle = '#B85A1C'; c.lineWidth = s * .06; line(-s * .15, -s * .2, s * .05, -s * .2); line(-s * .05, s * .15, s * .12, s * .15);
      c.strokeStyle = '#4E9A4B'; c.lineWidth = s * .12; c.lineCap = 'round'; line(0, -s * .5, -s * .25, -s * .95); line(0, -s * .5, 0, -s); line(0, -s * .5, s * .25, -s * .95);
    },
    salade(s) {
      c.fillStyle = '#7DBB5A'; circ(0, 0, s * .8); c.fill();
      c.fillStyle = '#A5D67E'; circ(-s * .2, -s * .15, s * .45); c.fill(); circ(s * .25, -s * .05, s * .4); c.fill();
      c.fillStyle = '#C9EAA3'; circ(0, -s * .1, s * .25); c.fill();
    },
    legumes(s) {
      c.fillStyle = '#B07A45'; poly([[-s, -.1 * s], [s, -.1 * s], [.8 * s, .8 * s], [-.8 * s, .8 * s]]); c.fill();
      c.save(); c.translate(-s * .45, -s * .35); ITEMS.salade(s * .5); c.restore();
      c.save(); c.translate(s * .35, -s * .45); c.rotate(.4); ITEMS.carotte(s * .5); c.restore();
      c.save(); c.translate(0, -s * .3); ITEMS.carotte(s * .45); c.restore();
    },
    binette(s) {
      c.strokeStyle = '#8A5A2E'; c.lineWidth = s * .14; c.lineCap = 'round'; line(-s * .6, s * .8, s * .5, -s * .7);
      c.fillStyle = '#7D8894'; poly([[s * .35, -s * .75], [s * .85, -s * .55], [s * .75, -s * .3], [s * .3, -s * .5]]); c.fill();
    },
    graines(s) {
      c.fillStyle = '#E9D7B0'; rr(-s * .6, -s * .8, s * 1.2, s * 1.6, s * .1); c.fill();
      c.strokeStyle = '#B9A172'; c.lineWidth = s * .06; c.stroke();
      c.fillStyle = '#7DBB5A'; ell(0, -s * .15, s * .3, s * .4); c.fill();
      c.fillStyle = '#8A5A2E'; [[-.25, .45], [0, .55], [.25, .45]].forEach(([x, y]) => { ell(x * s, y * s, s * .08, s * .12); c.fill(); });
    },
    bache(s) {
      c.fillStyle = '#5E8FBF'; c.beginPath(); c.moveTo(-s, s * .1); c.quadraticCurveTo(0, -s * 1.1, s, s * .1); c.closePath(); c.fill();
      c.strokeStyle = '#8A5A2E'; c.lineWidth = s * .1; line(-s * .9, s * .1, -s * .9, s * .8); line(s * .9, s * .1, s * .9, s * .8);
      c.strokeStyle = '#9CC8E8'; c.lineWidth = s * .08; c.lineCap = 'round'; [[-.4, -.9], [.1, -1.1], [.5, -.85]].forEach(([x, y]) => line(x * s, y * s, x * s - s * .12, y * s + s * .25));
    },
    eau(s) {
      c.fillStyle = '#5DA9E9'; rr(-s * .45, -s * .55, s * .9, s * 1.4, s * .3); c.fill();
      c.fillStyle = '#2F6FA8'; rr(-s * .22, -s * .85, s * .44, s * .32, s * .08); c.fill();
      c.fillStyle = 'rgba(255,255,255,.45)'; rr(-s * .3, -s * .35, s * .15, s * .9, s * .08); c.fill();
    },
    galettes(s) {
      [.45, .15, -.15].forEach(y => { c.fillStyle = '#D9A55B'; ell(0, y * s, s * .85, s * .28); c.fill(); c.fillStyle = '#E9C07E'; ell(0, y * s - s * .06, s * .8, s * .22); c.fill(); });
      c.fillStyle = '#8A5A2E'; [[-.3, -.2], [.1, -.25], [.4, -.15]].forEach(([x, y]) => { circ(x * s, y * s, s * .05); c.fill(); });
    },
    trousse(s) {
      c.fillStyle = '#FFFFFF'; rr(-s * .9, -s * .6, s * 1.8, s * 1.3, s * .15); c.fill();
      c.strokeStyle = '#2F9E62'; c.lineWidth = s * .08; c.stroke();
      c.fillStyle = '#2F9E62'; c.fillRect(-s * .12, -s * .4, s * .24, s * .9); c.fillRect(-s * .45, -s * .07, s * .9, s * .24);
      c.strokeStyle = '#5E6A72'; c.lineWidth = s * .1; c.beginPath(); c.arc(0, -s * .6, s * .28, Math.PI, 0); c.stroke();
    },
    toupie(s) {
      c.fillStyle = '#F4C542'; poly([[-s * .8, -s * .2], [s * .8, -s * .2], [0, s * .8]]); c.fill();
      c.fillStyle = '#E8589A'; ell(0, -s * .2, s * .8, s * .3); c.fill();
      c.fillStyle = '#7A5BC4'; rr(-s * .1, -s * .8, s * .2, s * .6, s * .05); c.fill();
      c.strokeStyle = '#FFE58A'; c.lineWidth = s * .08; c.lineCap = 'round'; line(-s * 1.1, -s * .5, -s * .95, -s * .35); line(s * 1.1, -s * .5, s * .95, -s * .35); line(0, -s * 1.1, 0, -s * .95);
    },
    bonbons(s) {
      [[-.45, .1, '#E8589A'], [.35, -.2, '#6CC4A1'], [.1, .45, '#F4C542']].forEach(([x, y, col]) => {
        c.save(); c.translate(x * s, y * s); c.rotate(.4); c.fillStyle = col;
        ell(0, 0, s * .32, s * .22); c.fill(); poly([[-s * .3, 0], [-s * .55, -s * .18], [-s * .55, s * .18]]); c.fill(); poly([[s * .3, 0], [s * .55, -s * .18], [s * .55, s * .18]]); c.fill();
        c.restore();
      });
    },
    longuevue(s) {
      c.rotate(-.35);
      c.fillStyle = '#C07A3A'; rr(-s * .9, -s * .22, s * .8, s * .44, s * .08); c.fill();
      c.fillStyle = '#D9994F'; rr(-s * .15, -s * .3, s * .7, s * .6, s * .08); c.fill();
      c.fillStyle = '#E8B36A'; rr(s * .5, -s * .38, s * .45, s * .76, s * .08); c.fill();
      c.fillStyle = '#9CC8E8'; ell(s * .95, 0, s * .06, s * .3); c.fill();
    },
    pinceaux(s) {
      c.fillStyle = '#8A5A2E'; rr(-s, -s * .2, s * 2, s * .9, s * .1); c.fill();
      c.fillStyle = '#B07A45'; rr(-s * .92, -s * .12, s * 1.84, s * .74, s * .06); c.fill();
      [[-.6, '#D64541'], [0, '#3C7DD9'], [.6, '#F4C542']].forEach(([x, col]) => {
        c.save(); c.translate(x * s, 0); c.rotate(-.2);
        c.fillStyle = '#E9D7B0'; rr(-s * .07, -s * .95, s * .14, s * .9, s * .05); c.fill();
        c.fillStyle = '#9AA3A8'; c.fillRect(-s * .08, -s * 1.1, s * .16, s * .18);
        c.fillStyle = col; poly([[-s * .09, -s * 1.1], [s * .09, -s * 1.1], [0, -s * 1.4]]); c.fill();
        c.restore();
      });
    },
    cerfvolant(s) {
      c.fillStyle = '#D64541'; poly([[0, -s], [s * .65, -s * .1], [0, s * .6], [-s * .65, -s * .1]]); c.fill();
      c.fillStyle = '#F4C542'; poly([[0, -s], [s * .65, -s * .1], [0, -s * .1]]); c.fill(); poly([[0, s * .6], [-s * .65, -s * .1], [0, -s * .1]]); c.fill();
      c.strokeStyle = INK; c.lineWidth = s * .04; c.beginPath(); c.moveTo(0, s * .6); c.bezierCurveTo(s * .3, s * .9, -s * .3, s * 1.1, s * .1, s * 1.4); c.stroke();
      c.fillStyle = '#3C7DD9'; [[.08, .9], [-.05, 1.12]].forEach(([x, y]) => { c.save(); c.translate(x * s, y * s); c.rotate(.8); c.fillRect(-s * .08, -s * .05, s * .16, s * .1); c.restore(); });
    },
    engrenage(s) { gear(0, 0, s * .8, 8, 0, '#8C96A3'); c.fillStyle = '#5D6875'; circ(0, 0, s * .2); c.fill(); },
    figurine(s) {
      c.fillStyle = '#6CC4A1'; rr(-s * .35, -s * .2, s * .7, s * .8, s * .12); c.fill();
      c.fillStyle = '#9EE0C4'; rr(-s * .4, -s * .85, s * .8, s * .6, s * .15); c.fill();
      c.fillStyle = INK; circ(-s * .15, -s * .55, s * .07); c.fill(); circ(s * .15, -s * .55, s * .07); c.fill();
      c.strokeStyle = '#6CC4A1'; c.lineWidth = s * .08; line(0, -s * .85, 0, -s * 1.05); c.fillStyle = '#E8589A'; circ(0, -s * 1.08, s * .08); c.fill();
    },
    carte(s) {
      c.fillStyle = '#3C6FB0'; rr(-s, -s * .62, s * 2, s * 1.24, s * .14); c.fill();
      c.fillStyle = '#5B8FD0'; c.fillRect(-s, -s * .3, s * 2, s * .2);
      c.fillStyle = '#E9C46A'; rr(-s * .75, -s * .05, s * .42, s * .32, s * .06); c.fill();
      c.fillStyle = 'rgba(255,255,255,.7)'; [0, .12, .24].forEach(dx => { c.fillRect(s * (.05 + dx * 2), s * .3, s * .2, s * .07); });
    },
    pain(s) {
      c.fillStyle = '#C98A45'; ell(0, 0, s, s * .45); c.fill();
      c.strokeStyle = '#E9B36E'; c.lineWidth = s * .09; c.lineCap = 'round'; [-.45, 0, .45].forEach(x => line(x * s - s * .12, -s * .2, x * s + s * .12, s * .15));
    },
    miel(s) {
      c.fillStyle = '#F2A93B'; rr(-s * .6, -s * .5, s * 1.2, s * 1.3, s * .25); c.fill();
      c.fillStyle = '#C07A3A'; rr(-s * .7, -s * .85, s * 1.4, s * .4, s * .1); c.fill();
      c.fillStyle = '#FFF3D6'; rr(-s * .4, -s * .15, s * .8, s * .5, s * .08); c.fill();
    },
    fromage(s) {
      c.fillStyle = '#F4D35E'; poly([[-s, s * .5], [s, s * .5], [s, -s * .1], [-s * .6, -s * .6]]); c.fill();
      c.fillStyle = '#E3B93C'; [[-.3, .1, .14], [.35, .15, .1], [.6, -.02, .08]].forEach(([x, y, r]) => { circ(x * s, y * s, r * s); c.fill(); });
    },
    vis(s) {
      c.fillStyle = '#8C96A3'; rr(-s * .45, -s * .9, s * .9, s * .3, s * .08); c.fill();
      c.fillStyle = '#A9B2BA'; poly([[-s * .18, -s * .6], [s * .18, -s * .6], [s * .12, s * .6], [0, s * .95], [-s * .12, s * .6]]); c.fill();
      c.strokeStyle = '#5D6875'; c.lineWidth = s * .06; [-.4, -.15, .1, .35].forEach(y => line(-s * .2, y * s, s * .2, y * s + s * .1));
      c.strokeStyle = '#5D6875'; line(-s * .15, -s * .75, s * .15, -s * .75);
    },
    toile(s) {
      c.fillStyle = '#4E7FA8'; rr(-s, -s * .45, s * 2, s * .9, s * .12); c.fill();
      c.strokeStyle = '#7FA8CC'; c.lineWidth = s * .08; line(-s, 0, s, 0);
      c.fillStyle = '#D9E6F0'; [-.75, .75].forEach(x => { circ(x * s, -s * .25, s * .08); c.fill(); });
      c.strokeStyle = '#9CC8E8'; c.lineWidth = s * .08; c.lineCap = 'round'; [-.4, .2].forEach(x => line(x * s, -s * .9, x * s - s * .1, -s * .65));
    },
    poulie(s) {
      c.strokeStyle = '#5D6875'; c.lineWidth = s * .12; line(0, -s, 0, -s * .35);
      c.fillStyle = '#8C96A3'; circ(0, 0, s * .55); c.fill(); c.fillStyle = '#5D6875'; circ(0, 0, s * .18); c.fill();
      c.strokeStyle = '#B98552'; c.lineWidth = s * .08; line(-s * .55, 0, -s * .55, s); line(s * .55, 0, s * .55, s * .7);
    },
    poutre(s) {
      c.fillStyle = '#A8733F'; rr(-s * 1.2, -s * .25, s * 2.4, s * .5, s * .06); c.fill();
      c.strokeStyle = '#7A5230'; c.lineWidth = s * .06; line(-s * 1.1, 0, s * 1.1, -s * .05);
    },
    fanions(s) {
      c.strokeStyle = INK; c.lineWidth = s * .05; c.beginPath(); c.moveTo(-s * 1.1, -s * .5); c.quadraticCurveTo(0, -s * .1, s * 1.1, -s * .5); c.stroke();
      ['#D64541', '#F4C542', '#3C7DD9', '#6CC4A1', '#E8589A'].forEach((col, i) => {
        const x = -s * .9 + i * s * .45, y = -s * .45 + Math.sin((i + .5) / 5 * Math.PI) * s * .28;
        c.fillStyle = col; poly([[x - s * .18, y], [x + s * .18, y], [x, y + s * .5]]); c.fill();
      });
    },
    lanterne(s) {
      c.strokeStyle = INK; c.lineWidth = s * .07; c.beginPath(); c.arc(0, -s * .75, s * .22, Math.PI, 0); c.stroke();
      c.fillStyle = '#5D6875'; rr(-s * .45, -s * .75, s * .9, s * .18, s * .05); c.fill(); rr(-s * .45, s * .6, s * .9, s * .18, s * .05); c.fill();
      c.fillStyle = '#FFE08A'; rr(-s * .38, -s * .57, s * .76, s * 1.17, s * .08); c.fill();
      c.fillStyle = '#F4A43C'; ell(0, 0, s * .12, s * .22); c.fill();
    },
    maison(s) {
      c.fillStyle = '#F4EEE4'; rr(-s * .8, -s * .3, s * 1.6, s * 1.1, s * .06); c.fill();
      c.fillStyle = CLAY; poly([[-s, -s * .2], [0, -s], [s, -s * .2]]); c.fill();
      c.fillStyle = '#8A5A2E'; rr(-s * .2, s * .2, s * .4, s * .6, s * .15); c.fill();
    },
    paquet(s) {
      c.fillStyle = '#6FA3C9'; rr(-s * .8, -s * .6, s * 1.6, s * 1.3, s * .1); c.fill();
      c.fillStyle = '#F4D35E'; c.fillRect(-s * .12, -s * .6, s * .24, s * 1.3); c.fillRect(-s * .8, -s * .05, s * 1.6, s * .22);
      c.strokeStyle = '#F4D35E'; c.lineWidth = s * .12; c.beginPath(); c.ellipse(-s * .25, -s * .75, s * .25, s * .14, -.4, 0, Math.PI * 2); c.stroke(); c.beginPath(); c.ellipse(s * .25, -s * .75, s * .25, s * .14, .4, 0, Math.PI * 2); c.stroke();
    },
    horloge(s) {
      c.fillStyle = '#FFFFFF'; circ(0, 0, s * .85); c.fill(); c.strokeStyle = INK; c.lineWidth = s * .1; c.stroke();
      c.lineCap = 'round'; line(0, 0, 0, -s * .55); line(0, 0, s * .4, s * .1);
    },
    muscle(s) { // énergie : un éclair
      c.fillStyle = '#F4C542'; poly([[s * .15, -s], [-s * .55, s * .1], [-s * .05, s * .1], [-s * .2, s], [s * .55, -s * .15], [s * .05, -s * .15]]); c.fill();
    },
    etoile(s) {
      c.fillStyle = '#F4C542'; c.beginPath();
      for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? s * .4 : s; c.lineTo(Math.cos(a) * r, Math.sin(a) * r); }
      c.closePath(); c.fill();
    },
    jeton(s) { token(0, 0, s, 1, 1); },
  };
  function item(name, x, y, s, a = 1, rot = 0) {
    if (!ITEMS[name]) throw new Error('objet inconnu : ' + name);
    if (a <= 0) return;
    const k = pop(a);
    alpha(Math.min(1, a * 1.8), () => { c.translate(x, y); c.scale(k, k); if (rot) c.rotate(rot); ITEMS[name](s); });
  }
  M.ITEMS = ITEMS; M.item = item;

  // Jeton d'argile. spin (−1 → 1) écrase le jeton horizontalement pour le faire tourner.
  function token(x, y, r, bake = 1, mark = 1, spin = 1) {
    const sx = Math.max(.08, Math.abs(spin));
    const col = mix(RAW, CLAY, bake), rim = mix('#7F7368', '#9E4B28', bake);
    c.save(); c.translate(x, y); c.scale(sx, 1);
    c.fillStyle = rim; circ(0, r * .1, r); c.fill();
    c.fillStyle = col; circ(0, 0, r); c.fill();
    c.strokeStyle = rim; c.lineWidth = r * .07; circ(0, 0, r * .78); c.stroke();
    if (mark > 0 && spin > 0) alpha(mark, () => {
      c.fillStyle = c.strokeStyle = '#F6DCC8'; c.lineWidth = r * .09; c.lineCap = 'round';
      for (let k = 0; k < 4; k++) { c.rotate(Math.PI / 2); line(0, 0, 0, -r * .52); c.fillRect(r * .03, -r * .52, r * .17, r * .3); }
      circ(0, 0, r * .1); c.fill();
    });
    if (bake > .9 && r > 14) {
      const g = (TT * .45 + x * .0007 + y * .0011) % 3.2;
      if (g < .7) { c.save(); circ(0, 0, r); c.clip(); c.rotate(-.6); c.fillStyle = 'rgba(255,255,255,.32)'; c.fillRect(lerp(-r * 1.6, r * 1.6, g / .7) - r * .16, -r * 2, r * .32, r * 4); c.restore(); }
    }
    c.restore();
  }
  // Rangée de jetons (n jetons, centrés en x), qui flottent doucement.
  function tokens(n, x, y, r, o = {}) {
    const gap = o.gap ?? r * 2.25, a = o.a ?? 1;
    if (a <= 0) return;
    const k = pop(a);
    alpha(Math.min(1, a * 1.8), () => { for (let i = 0; i < n; i++) token(x + (i - (n - 1) / 2) * gap * k, y + Math.sin(TT * 2.2 + i * .7) * 1.6, r * k); });
  }
  function gear(x, y, r, teeth, ang, col) {
    c.save(); c.translate(x, y); c.rotate(ang); c.fillStyle = col; c.beginPath();
    for (let i = 0; i < teeth * 2; i++) {
      const a0 = i * Math.PI / teeth, R = i % 2 ? r * .78 : r;
      c.lineTo(Math.cos(a0 - .12) * R, Math.sin(a0 - .12) * R); c.lineTo(Math.cos(a0 + .12) * R, Math.sin(a0 + .12) * R);
    }
    c.closePath(); c.fill(); c.restore();
  }
  Object.assign(M, { token, tokens, gear, sparkle, burst, pop, rnd, easeOutBack, easeOutBounce });

  // ---------- décors ----------
  function windmill(x, y, k, ang) {
    c.fillStyle = '#F4F0E8'; c.strokeStyle = '#D6CEBF'; c.lineWidth = 3 * k;
    poly([[x - 42 * k, y], [x + 42 * k, y], [x + 28 * k, y - 175 * k], [x - 28 * k, y - 175 * k]]); c.fill(); c.stroke();
    c.fillStyle = '#B55D3C'; poly([[x - 38 * k, y - 170 * k], [x + 38 * k, y - 170 * k], [x, y - 222 * k]]); c.fill();
    c.fillStyle = '#8A5A2E'; rr(x - 13 * k, y - 50 * k, 26 * k, 50 * k, 13 * k); c.fill();
    c.save(); c.translate(x, y - 178 * k); c.rotate(ang);
    for (let i = 0; i < 4; i++) {
      c.rotate(Math.PI / 2);
      c.strokeStyle = '#7B6A58'; c.lineWidth = 5 * k; line(0, 0, 0, -125 * k);
      c.fillStyle = '#FFFFFF'; c.fillRect(2 * k, -125 * k, 26 * k, 92 * k);
      c.strokeStyle = '#A9B2B6'; c.lineWidth = 2 * k; c.strokeRect(2 * k, -125 * k, 26 * k, 92 * k);
    }
    c.fillStyle = '#7B6A58'; circ(0, 0, 8 * k); c.fill();
    c.restore();
  }
  function cloud(x, y, k) {
    c.fillStyle = 'rgba(190,210,222,.45)'; ell(x + 50 * k, y + 34 * k, 110 * k, 16 * k); c.fill();
    c.fillStyle = '#FFFFFF';
    [[0, 10, 42], [40, -14, 46], [88, 0, 40], [128, 14, 30], [60, 18, 44]].forEach(([dx, dy, r_]) => { circ(x + dx * k, y + dy * k, r_ * k); c.fill(); });
    c.fillStyle = 'rgba(200,218,230,.5)'; c.beginPath(); c.ellipse(x + 64 * k, y + 30 * k, 90 * k, 14 * k, 0, 0, Math.PI); c.fill();
  }
  function bird(x, y, s, flap) {
    c.strokeStyle = 'rgba(43,46,51,.75)'; c.lineWidth = 3.5; c.lineCap = 'round';
    const w = Math.sin(flap) * s * .45;
    c.beginPath(); c.moveTo(x - s, y - w); c.quadraticCurveTo(x - s * .45, y - s * .35 - w * .3, x, y); c.quadraticCurveTo(x + s * .45, y - s * .35 - w * .3, x + s, y - w); c.stroke();
  }
  function tuft(x, y, k, col) {
    c.fillStyle = col;
    for (let i = -2; i <= 2; i++) { const sw = Math.sin(TT * 1.4 + x * .02 + i) * 3 * k; c.beginPath(); c.moveTo(x + i * 5 * k - 3 * k, y); c.quadraticCurveTo(x + i * 6 * k + sw * .5, y - 14 * k, x + i * 8 * k + sw, y - (18 + Math.abs(i) * -3) * k); c.quadraticCurveTo(x + i * 6 * k + sw * .5 + 2 * k, y - 12 * k, x + i * 5 * k + 3 * k, y); c.fill(); }
  }
  let FG = null;
  function sky(o = {}) {
    FG = { dusk: o.dusk || 0 };
    const ang = (o.ang ?? .35) + TT * .3, dusk = o.dusk || 0;
    const g = c.createLinearGradient(0, 0, 0, GROUND);
    g.addColorStop(0, mix('#8FC2E4', '#E48E6A', dusk)); g.addColorStop(.55, mix('#CBE4F0', '#F4BE92', dusk)); g.addColorStop(1, mix('#F2F7EC', '#FBE3C6', dusk));
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    // soleil
    const sx = 1600, sy = 150 + dusk * 300;
    const sg = c.createRadialGradient(sx, sy, 20, sx, sy, 320); sg.addColorStop(0, 'rgba(255,240,190,.9)'); sg.addColorStop(1, 'rgba(255,240,190,0)');
    c.fillStyle = sg; circ(sx, sy, 320); c.fill();
    alpha(.14, () => { c.translate(sx, sy); c.rotate(TT * .04); c.fillStyle = '#FFF6D6'; for (let i = 0; i < 12; i++) { c.rotate(Math.PI / 6); poly([[0, 0], [-26, -420], [26, -420]]); c.fill(); } });
    c.fillStyle = mix('#FFE8A0', '#FFB36B', dusk); circ(sx, sy, 60); c.fill();
    c.fillStyle = 'rgba(255,255,255,.5)'; circ(sx - 16, sy - 18, 22); c.fill();
    // nuages qui dérivent
    for (let i = 0; i < 6; i++) { const sp = 7 + i * 3.5, k = .7 + rnd(i + 3) * .8; cloud(((rnd(i) * 2600 + TT * sp) % 2700) - 350, 70 + rnd(i + 9) * 230, k); }
    // oiseaux
    for (let i = 0; i < 3; i++) { const bx = ((TT * 110 + i * 60) % 3400) - 400, by = 230 + i * 26 + Math.sin(TT * 1.5 + i) * 10; if (bx > -50 && bx < W + 50) bird(bx, by, 14 - i * 2, TT * 9 + i); }
    if (o.mountains) {
      c.fillStyle = '#A9BFCD'; poly([[500, GROUND - 120], [900, GROUND - 520], [1180, GROUND - 260], [1380, GROUND - 440], [1800, GROUND - 120]]); c.fill();
      c.fillStyle = 'rgba(255,255,255,.18)'; poly([[900, GROUND - 520], [1180, GROUND - 260], [1060, GROUND - 200], [980, GROUND - 330]]); c.fill();
      c.fillStyle = '#F4F8FA'; poly([[830, GROUND - 450], [900, GROUND - 520], [975, GROUND - 440], [930, GROUND - 455], [880, GROUND - 430]]); c.fill();
      poly([[1330, GROUND - 400], [1380, GROUND - 440], [1430, GROUND - 395], [1395, GROUND - 405]]); c.fill();
    }
    // collines lointaines
    c.fillStyle = mix('#B7D1C6', '#D9B8A0', dusk * .6);
    c.beginPath(); c.moveTo(0, GROUND - 170); c.bezierCurveTo(300, GROUND - 300, 640, GROUND - 150, 980, GROUND - 230); c.bezierCurveTo(1300, GROUND - 300, 1600, GROUND - 190, W, GROUND - 260); c.lineTo(W, GROUND); c.lineTo(0, GROUND); c.fill();
    c.fillStyle = mix('#A6C4B2', '#C9A892', dusk * .6);
    for (let i = 0; i < 26; i++) { const tx = i * 78 + rnd(i + 40) * 30, ty = GROUND - 185 - Math.sin(i * .6) * 40; circ(tx, ty, 18 + rnd(i) * 10); c.fill(); }
    if (o.village !== false) [[190, GROUND - 175, .32], [300, GROUND - 190, .28], [560, GROUND - 170, .3], [760, GROUND - 188, .26]].forEach(([hx, hy, k]) => house(hx, hy, k));
    if (o.mills !== false) { windmill(1390, GROUND - 150, .55, ang); windmill(1570, GROUND - 175, .63, ang + .5); windmill(1750, GROUND - 150, .5, ang + 1.1); }
    // colline proche et sol
    const hg = c.createLinearGradient(0, GROUND - 250, 0, GROUND); hg.addColorStop(0, mix('#BBD7A2', '#D8C08F', dusk * .5)); hg.addColorStop(1, mix('#A9CB8F', '#C9AE7E', dusk * .5));
    c.fillStyle = hg;
    c.beginPath(); c.moveTo(0, GROUND - 110); c.bezierCurveTo(420, GROUND - 250, 820, GROUND - 60, 1220, GROUND - 170);
    c.bezierCurveTo(1480, GROUND - 240, 1760, GROUND - 150, W, GROUND - 190); c.lineTo(W, GROUND); c.lineTo(0, GROUND); c.closePath(); c.fill();
    const gg = c.createLinearGradient(0, GROUND, 0, H); gg.addColorStop(0, mix('#CFE3B6', '#E3CFA6', dusk * .5)); gg.addColorStop(1, mix('#B9D39C', '#CDB88E', dusk * .5));
    c.fillStyle = gg; c.fillRect(0, GROUND, W, H - GROUND);
    c.fillStyle = 'rgba(120,150,90,.35)'; c.fillRect(0, GROUND, W, 5);
    c.fillStyle = 'rgba(236,226,200,.55)'; c.beginPath(); c.moveTo(0, GROUND + 70); c.bezierCurveTo(600, GROUND + 40, 1200, GROUND + 110, W, GROUND + 60); c.lineTo(W, GROUND + 120); c.bezierCurveTo(1200, GROUND + 170, 600, GROUND + 100, 0, GROUND + 130); c.fill();
    for (let i = 0; i < 22; i++) tuft(40 + i * 88 + rnd(i + 20) * 40, GROUND + 10 + rnd(i + 70) * 30, .9 + rnd(i) * .5, i % 2 ? '#97BF7C' : '#A7CB8C');
    for (let i = 0; i < 12; i++) { const fx = rnd(i + 90) * W, fy = GROUND + 20 + rnd(i + 91) * 40; c.fillStyle = ['#F4D35E', '#FFFFFF', '#E8589A'][i % 3]; circ(fx, fy, 4); c.fill(); }
  }
  // Premier plan (dessiné après les personnages) : herbes hautes, pollen, lumière chaude.
  function foreground() {
    for (let i = 0; i < 48; i++) {
      const x = i * 42 + rnd(i) * 30, h = 26 + rnd(i + 50) * 38, sw = Math.sin(TT * 1.6 + i * .7) * 6;
      c.fillStyle = i % 3 ? '#8DB874' : '#7FAE67';
      c.beginPath(); c.moveTo(x - 8, H); c.quadraticCurveTo(x + sw * .5, H - h * .5, x + sw, H - h); c.quadraticCurveTo(x + sw * .5 + 3, H - h * .5, x + 8, H); c.fill();
      if (i % 11 === 0) { c.fillStyle = '#F4D35E'; circ(x + sw, H - h, 6); c.fill(); }
    }
    for (let i = 0; i < 16; i++) {
      const px = (rnd(i) * W + TT * (12 + rnd(i + 3) * 18)) % W, py = 240 + rnd(i + 7) * 560 + Math.sin(TT * .8 + i) * 22;
      c.fillStyle = `rgba(255,248,215,${.35 + .3 * Math.sin(TT * 2 + i)})`; circ(px, py, 2.5 + rnd(i + 11) * 2.5); c.fill();
    }
    const lg = c.createRadialGradient(1600, 150, 50, 1600, 150, 1500);
    lg.addColorStop(0, `rgba(255,225,160,${.16 + FG.dusk * .15})`); lg.addColorStop(1, 'rgba(255,225,160,0)');
    c.fillStyle = lg; c.fillRect(0, 0, W, H);
  }
  function paper() {
    FG = null;
    c.fillStyle = '#F7F5EF'; c.fillRect(0, 0, W, H);
    [['rgba(255,214,140,.13)', 300, 220, 260], ['rgba(160,205,230,.12)', 1640, 860, 300], ['rgba(190,220,170,.12)', 1620, 180, 220], ['rgba(240,170,150,.09)', 260, 900, 240]].forEach(([col, x, y, r_], i) => {
      c.fillStyle = col; circ(x + Math.sin(TT * .3 + i) * 40, y + Math.cos(TT * .25 + i) * 30, r_); c.fill();
    });
    c.strokeStyle = 'rgba(200,196,184,.35)'; c.lineWidth = 1.5;
    for (let x = 0; x <= W; x += 60) line(x, 0, x, H);
    for (let y = 0; y <= H; y += 60) line(0, y, W, y);
    for (let i = 0; i < 12; i++) { const px = (rnd(i) * W + TT * 8) % W, py = (rnd(i + 5) * H + TT * 5) % H; c.fillStyle = 'rgba(192,100,58,.18)'; circ(px, py, 3); c.fill(); }
  }
  function stall(x, k, awn) {
    const w = 360 * k, top = GROUND - 470 * k;
    c.fillStyle = '#8A5A2E';
    c.fillRect(x - w / 2 + 8 * k, top + 40 * k, 14 * k, GROUND - top - 40 * k);
    c.fillRect(x + w / 2 - 22 * k, top + 40 * k, 14 * k, GROUND - top - 40 * k);
    const n = 6, sw = w / n;
    for (let i = 0; i < n; i++) {
      c.fillStyle = i % 2 ? '#FBF8F1' : awn;
      c.fillRect(x - w / 2 + i * sw, top, sw + .5, 56 * k);
      circ(x - w / 2 + (i + .5) * sw, top + 56 * k, sw / 2); c.fill();
    }
  }
  function counter(x, k) {
    const w = 380 * k;
    c.fillStyle = '#C89A67'; rr(x - w / 2, GROUND - 150 * k, w, 150 * k, 6 * k); c.fill();
    c.strokeStyle = 'rgba(110,70,30,.22)'; c.lineWidth = 3 * k;
    for (let y = GROUND - 110 * k; y < GROUND; y += 40 * k) line(x - w / 2 + 10 * k, y, x + w / 2 - 10 * k, y);
    c.fillStyle = '#A87B4E'; rr(x - w / 2 - 10 * k, GROUND - 162 * k, w + 20 * k, 24 * k, 6 * k); c.fill();
    return GROUND - 162 * k;
  }
  // Étal complet : auvent, marchand derrière, comptoir. Renvoie la hauteur du dessus du comptoir.
  function shop(x, k, awn, who, o = {}) {
    stall(x, k, awn);
    if (who) actor(who, x + 20 * k, GROUND - 8, 375 * k, { face: -1, ...o });
    return counter(x, k);
  }
  function house(x, y, k) {
    c.fillStyle = '#F4EEE4'; rr(x - 110 * k, y - 150 * k, 220 * k, 150 * k, 6 * k); c.fill();
    c.strokeStyle = '#D6CEBF'; c.lineWidth = 4 * k; c.stroke();
    c.fillStyle = CLAY; poly([[x - 140 * k, y - 140 * k], [x, y - 260 * k], [x + 140 * k, y - 140 * k]]); c.fill();
    c.fillStyle = '#8A5A2E'; rr(x - 28 * k, y - 90 * k, 56 * k, 90 * k, 26 * k); c.fill();
    c.fillStyle = '#BFDDEA'; rr(x + 45 * k, y - 115 * k, 45 * k, 45 * k, 6 * k); c.fill(); rr(x - 90 * k, y - 115 * k, 45 * k, 45 * k, 6 * k); c.fill();
  }
  Object.assign(M, { windmill, sky, paper, stall, counter, shop, house });

  // ---------- signalisation ----------
  function shadow(blur = 18, y = 8, a = .16) { c.shadowColor = `rgba(40,50,60,${a})`; c.shadowBlur = blur; c.shadowOffsetY = y; }
  function bubble(x, y, w, h, tx, ty, a) {
    if (a <= 0) return;
    const k = pop(a);
    alpha(Math.min(1, a * 2), () => {
      c.translate(tx, ty); c.scale(k, k); c.translate(-tx, -ty);
      shadow();
      c.fillStyle = '#FFFFFF'; c.strokeStyle = INK; c.lineWidth = 4;
      for (let i = 0; i < 3; i++) { const p = .2 + i * .22; circ(lerp(tx, x, p), lerp(ty, y + h / 2 * Math.sign(ty - y), p), 7 + i * 4); c.fill(); c.stroke(); }
      rr(x - w / 2, y - h / 2, w, h, Math.min(h / 2, 60)); c.fill(); c.stroke();
    });
  }
  function cross(x, y, r, a = 1) {
    if (a <= 0) return;
    const k = pop(a);
    alpha(Math.min(1, a * 2), () => { c.translate(x, y); c.scale(k, k); c.strokeStyle = RED; c.lineWidth = r * .22; c.lineCap = 'round'; line(-r * .7, -r * .7, r * .7, r * .7); line(r * .7, -r * .7, -r * .7, r * .7); });
  }
  function check(x, y, r, a = 1) {
    if (a <= 0) return;
    const k = pop(a);
    alpha(Math.min(1, a * 2), () => {
      c.translate(x, y); c.scale(k, k); shadow(10, 4, .2);
      c.fillStyle = GREEN; circ(0, 0, r); c.fill(); c.shadowColor = 'transparent';
      c.strokeStyle = '#FFFFFF'; c.lineWidth = r * .22; c.lineCap = 'round'; c.lineJoin = 'round';
      c.beginPath(); c.moveTo(-r * .45, r * .02); c.lineTo(-r * .1, r * .38); c.lineTo(r * .5, -r * .35); c.stroke();
    });
    if (a > 0 && a < 1) burst(x, y, a, r * .9, '#8FE0B0');
  }
  function arrow(x1, y1, x2, y2, o = {}) {
    const { col = INK, lw = 8, p = 1, a = 1, cut1 = 0, cut2 = 0, head = 26 } = o;
    if (p <= 0 || a <= 0) return;
    const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L;
    const sx = x1 + ux * cut1, sy = y1 + uy * cut1, ex = x2 - ux * cut2, ey = y2 - uy * cut2;
    const q = easeOutBack(clamp(p)), px = lerp(sx, ex, q), py = lerp(sy, ey, q);
    alpha(a, () => {
      c.strokeStyle = c.fillStyle = col; c.lineWidth = lw; c.lineCap = 'round';
      line(sx, sy, px - ux * head * .6, py - uy * head * .6);
      poly([[px, py], [px - ux * head - uy * head * .55, py - uy * head + ux * head * .55], [px - ux * head + uy * head * .55, py - uy * head - ux * head * .55]]); c.fill();
    });
  }
  function glow(x, y, r, a) {
    alpha(a, () => {
      const g = c.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, 'rgba(255,205,80,.55)'); g.addColorStop(1, 'rgba(255,205,80,0)');
      c.fillStyle = g; circ(x, y, r); c.fill();
    });
  }
  function bigText(txt, x, y, size, col, a = 1, weight = 600) {
    if (a <= 0) return;
    const k = pop(a);
    alpha(Math.min(1, a * 1.8), () => {
      c.translate(x, y); c.scale(k, k); shadow(12, 5, .14);
      c.fillStyle = col; c.font = `${weight} ${size}px ${FD}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(txt, 0, 0);
    });
  }
  function panel(x, y, w, h, a = 1) {
    alpha(a, () => { shadow(28, 12, .14); c.fillStyle = '#FFFFFF'; rr(x, y, w, h, 28); c.fill(); c.shadowColor = 'transparent'; c.strokeStyle = '#E3E6DE'; c.lineWidth = 2; c.stroke(); });
  }
  // Pastille ronde avec un objet dedans.
  function chip(name, x, y, r, o = {}) {
    const a = o.a ?? 1;
    if (a <= 0) return;
    const k = pop(a);
    alpha(Math.min(1, a * 1.8), () => {
      c.translate(x, y); c.scale(k, k); shadow(12, 5, .15);
      c.fillStyle = '#FFFFFF'; circ(0, 0, r); c.fill(); c.shadowColor = 'transparent';
      c.strokeStyle = o.ring || '#CBD2C8'; c.lineWidth = r * .08; c.stroke();
      ITEMS[name](r * .6);
    });
  }
  // Déplacement d'un objet en arc, avec traînée d'étincelles.
  function fly(name, x1, y1, x2, y2, p, s, arc = 120) {
    if (p <= 0 || p >= 1) return;
    const pos = q => [lerp(x1, x2, ease(q)), lerp(y1, y2, ease(q)) - Math.sin(q * Math.PI) * arc];
    for (let j = 1; j <= 4; j++) { const q = p - j * .04; if (q > 0) { const [tx, ty] = pos(q); sparkle(tx, ty, s * .22 * (1 - j / 5), .7 * (1 - j / 5)); } }
    const [x, y] = pos(p);
    item(name, x, y, s, 1, Math.sin(p * Math.PI) * .35);
  }
  function flyTokens(n, x1, y1, x2, y2, p, r = 26, arc = 100) {
    const pos = q => [lerp(x1, x2, ease(q)), lerp(y1, y2, ease(q)) - Math.sin(q * Math.PI) * arc];
    for (let k = 0; k < n; k++) {
      const raw = p * (1 + .12 * (n - 1)) - k * .12, q = clamp(raw);
      if (q > 0 && q < 1) {
        for (let j = 1; j <= 5; j++) { const qq = q - j * .035; if (qq > 0) { const [tx, ty] = pos(qq); sparkle(tx, ty, r * .4 * (1 - j / 6), .8 * (1 - j / 6)); } }
        const [x, y] = pos(q); token(x, y, r, 1, 1, Math.cos(q * Math.PI * 4));
      }
      if (raw > 1 && raw < 1.3 && p < 1) burst(x2, y2, (raw - 1) / .3, r);
    }
  }
  Object.assign(M, { bubble, cross, check, arrow, glow, bigText, panel, chip, fly, flyTokens, shadow });

  // Médaillon d'un personnage (tête et épaules dans un cercle).
  function node(who, x, y, r, o = {}) {
    const P = CAST[who], a = o.a ?? 1;
    if (a <= 0) return;
    const k = pop(a);
    alpha(Math.min(1, a * 1.8), () => {
      c.translate(x, y); c.scale(k, k); c.translate(-x, -y);
      if (o.hl) glow(x, y, r * 1.8, o.hl);
      shadow(14, 6, .16); c.fillStyle = '#FFFFFF'; circ(x, y, r); c.fill(); c.shadowColor = 'transparent';
      c.save(); circ(x, y, r); c.clip();
      c.fillStyle = mix(P.shirt, '#FFFFFF', .75); c.fillRect(x - r, y - r, 2 * r, 2 * r);
      c.fillStyle = P.shirt; ell(x, y + r * .95, r * .75, r * .55); c.fill();
      if (P.apron) { c.fillStyle = P.apron; ell(x, y + r * 1.05, r * .45, r * .5); c.fill(); }
      c.translate(x, y - r * .12); const hs = r * .5 / KIND[P.kind]; c.scale(hs, hs);
      const bt = (TT * .85 + hashStr(who) * 3) % 3.9;
      head(P, talk(who), { blink: bt < .15 ? Math.sin(bt / .15 * Math.PI) : 0, mood: spk(who) ? (/!/.test(CUR.text) ? '!' : '') : '' });
      c.restore();
      c.strokeStyle = P.ring; c.lineWidth = r * .09; circ(x, y, r); c.stroke();
      if (o.badge) chip(o.badge, x + r * .74, y + r * .74, r * .38);
      if (o.got) chip(o.got, x - r * .74, y - r * .74, r * .38, { ring: GREEN });
    });
  }
  M.node = node;


  // ---------- effets ----------
  function rain(a) {
    alpha(a, () => {
      c.strokeStyle = 'rgba(200,220,240,.55)'; c.lineWidth = 3; c.lineCap = 'round';
      for (let i = 0; i < 140; i++) { const x = (rnd(i) * W * 1.3 + TT * 300) % (W * 1.3) - W * .15, y = (rnd(i + 50) * H + TT * (900 + rnd(i + 9) * 300)) % H; line(x, y, x - 14, y + 34); }
    });
  }
  function flash(a) { alpha(a, () => { c.fillStyle = '#FFFFFF'; c.fillRect(0, 0, W, H); }); }
  function lightning(x, a) {
    alpha(a, () => {
      c.strokeStyle = '#FFF8C8'; c.lineWidth = 8; c.lineJoin = 'round'; c.shadowColor = '#FFF3A0'; c.shadowBlur = 30;
      c.beginPath(); let y = 0, xx = x; c.moveTo(xx, y); for (let i = 0; i < 7; i++) { xx += (rnd(i + x) - .5) * 120; y += 80; c.lineTo(xx, y); } c.stroke();
    });
  }
  function confetti(t, a = 1, n = 80) {
    const cols = ['#E8589A', '#F4C542', '#3C7DD9', '#2F9E62', '#C0643A', '#7A5BC4'];
    alpha(a, () => {
      for (let i = 0; i < n; i++) {
        const x = rnd(i) * W + Math.sin(t * 2 + i) * 30, y = -40 + ((t * (160 + rnd(i + 3) * 160) + rnd(i + 7) * 1200) % (H + 80));
        c.save(); c.translate(x, y); c.rotate(t * (2 + rnd(i) * 3) + i); c.scale(1, Math.cos(t * 5 + i)); c.fillStyle = cols[i % cols.length]; c.fillRect(-8, -5, 16, 10); c.restore();
      }
    });
  }
  // Assombrit tout sauf un cercle lumineux autour de (x, y).
  function spotlight(x, y, r, a) {
    alpha(a, () => {
      const g = c.createRadialGradient(x, y, r * .7, x, y, r * 1.5);
      g.addColorStop(0, 'rgba(15,20,30,0)'); g.addColorStop(1, 'rgba(15,20,30,.55)');
      c.fillStyle = g; c.fillRect(0, 0, W, H);
    });
  }
  // Rayons lumineux tournants derrière un objet important.
  function rays(x, y, r, a, col = 'rgba(255,220,120,.35)') {
    alpha(a, () => { c.translate(x, y); c.rotate(TT * .5); c.fillStyle = col; for (let i = 0; i < 14; i++) { c.rotate(Math.PI / 7); poly([[0, 0], [-r * .12, -r], [r * .12, -r]]); c.fill(); } });
  }
  Object.assign(M, { rain, flash, lightning, confetti, spotlight, rays });

  // ---------- répliques ----------
  let CUR = null, TT = 0, CUR_T = 0;
  function talk(who) {
    if (!CUR || CUR.who !== who || CUR_T > CUR.d - .8) return 0;
    return clamp((.55 + .45 * Math.sin(TT * 17)) * (.65 + .35 * Math.sin(TT * 5.3)));
  }
  const spk = who => (CUR && CUR.who === who && CUR_T < CUR.d - .5) ? 1 : 0;
  Object.assign(M, { talk, spk, now: () => TT });

  // ---------- épisodes et chronologie ----------
  const WPS = 2.3, EPISODES = [], DUREES = {};
  M.episode = ep => EPISODES.push(ep);
  M.durees = (numero, d) => { DUREES[numero] = d; };

  function titleScene(ep) {
    const cast = ep.generique || ['sacha', 'naya'];
    const TITLE = 'Le Village des Trois Moulins';
    return {
      id: 'titre', title: 'Titre', phase: 'Générique', lines: [], tail: 7, cam: false,
      draw(t) {
        sky({ ang: t * .5 });
        // pluie de jetons qui rebondissent
        for (let i = 0; i < 18; i++) {
          const t0 = .3 + i * .11, tt = t - t0; if (tt < 0) continue;
          const x = 140 + rnd(i + 1) * 1640, floor = GROUND + 60 + rnd(i + 30) * 50, g = 2600;
          const fall = Math.sqrt(2 * (floor + 80) / g), v = g * fall * .42;
          let y, spin;
          if (tt < fall) { y = -80 + .5 * g * tt * tt; spin = Math.cos(tt * 9 + i); }
          else { const b = tt - fall; y = floor - Math.max(0, v * b - .5 * g * b * b); spin = b < 2 * v / g ? Math.cos(b * 12) : 1; if (b > 0 && b < .25) burst(x, floor, b / .25, 22); }
          token(x, y, 24, 1, 1, spin);
        }
        // personnages qui sautent dans le cadre puis saluent
        cast.forEach((w, i) => {
          const p = clamp((t - .8 - i * .25) / .6), k = CAST[w].kind;
          const y = GROUND + 40 + (1 - easeOutBack(p)) * 420;
          if (p > 0) person(w, 960 + (i - (cast.length - 1) / 2) * 260, y, k === 'adult' ? 360 : k === 'teen' ? 330 : 270, { face: i < cast.length / 2 ? 1 : -1, up: t > 2.2 && k !== 'adult', open: t > 2.2 && t < 3.4 ? .6 + .4 * Math.sin(t * 14) : 0 });
        });
        // titre lettre par lettre
        c.font = `700 118px ${FD}`; c.textBaseline = 'middle'; c.textAlign = 'left';
        const widths = [...TITLE].map(ch => c.measureText(ch).width), total = widths.reduce((a, b) => a + b, 0);
        let x = 960 - total / 2;
        [...TITLE].forEach((ch, j) => {
          const p = clamp((t - .4 - j * .035) / .55);
          if (p > 0) {
            const y = 250 - (1 - easeOutBounce(p)) * 380, rot = (1 - p) * (rnd(j) - .5) * .8;
            c.save(); c.translate(x + widths[j] / 2, y); c.rotate(rot); c.globalAlpha = Math.min(1, p * 3);
            c.lineJoin = 'round'; c.strokeStyle = INK; c.lineWidth = 16; c.strokeText(ch, -widths[j] / 2, 0);
            c.fillStyle = j < 11 ? '#FFF6E6' : '#FFE0A8'; c.fillText(ch, -widths[j] / 2, 0);
            c.restore();
          }
          x += widths[j];
        });
        for (let i = 0; i < 7; i++) { const tw = Math.sin(t * 3 + i * 1.7); if (t > 1.6) sparkle(960 - total / 2 + rnd(i + 60) * total, 170 + rnd(i + 61) * 170, 16 * Math.max(0, tw), Math.max(0, tw)); }
        // pastille « Épisode N » et titre de l'épisode
        const e = clamp((t - 1.7) / .5);
        if (e > 0) alpha(Math.min(1, e * 2), () => {
          const k = pop(e); c.translate(960, 385); c.scale(k, k); shadow(14, 6, .2);
          c.fillStyle = CLAY; rr(-150, -36, 300, 72, 36); c.fill(); c.shadowColor = 'transparent';
          c.fillStyle = '#FFFFFF'; c.font = `600 42px ${FD}`; c.textAlign = 'center'; c.fillText(`Épisode ${ep.numero}`, 0, 2);
        });
        const s = clamp((t - 2.2) / .6);
        if (s > 0) alpha(Math.min(1, s * 2), () => {
          const k = pop(s); c.translate(960, 480); c.scale(k, k); c.font = `600 66px ${FD}`; const w = c.measureText(ep.titre).width;
          shadow(20, 8, .15); c.fillStyle = 'rgba(255,255,255,.92)'; rr(-w / 2 - 40, -54, w + 80, 108, 54); c.fill(); c.shadowColor = 'transparent';
          c.fillStyle = INK; c.textAlign = 'center'; c.fillText(ep.titre, 0, 4);
        });
      },
    };
  }
  function endScene(ep) {
    return {
      id: 'fin', title: 'Fin', phase: 'Générique', lines: [], tail: 6, cam: false,
      draw(t) {
        paper();
        const cols = ['#E8589A', '#F4C542', '#3C7DD9', '#2F9E62', '#C0643A', '#7A5BC4'];
        for (let i = 0; i < 90; i++) {
          const x = rnd(i) * W + Math.sin(t * 2 + i) * 30, y = -40 + ((t * (160 + rnd(i + 3) * 160) + rnd(i + 7) * 1200) % (H + 80));
          c.save(); c.translate(x, y); c.rotate(t * (2 + rnd(i) * 3) + i); c.scale(1, Math.cos(t * 5 + i)); c.fillStyle = cols[i % cols.length]; c.fillRect(-8, -5, 16, 10); c.restore();
        }
        bigText(ep.suivant ? 'À suivre' : 'Fin de la série', 960, 390, 56, CLAY, clamp((t - .2) / .5));
        bigText(ep.suivant || "Merci d'avoir visité le Village des Trois Moulins", 960, 490, 70, INK, clamp((t - .5) / .6));
        const k = clamp((t - .9) / .6);
        if (k > 0) { token(960, 650, 70 * pop(k), 1, 1, Math.cos(t * 3)); burst(960, 650, clamp((t - 1) / .8), 80); }
      },
    };
  }
  function build(ep) {
    if (ep.built) return ep;
    const d = DUREES[ep.numero] || {};
    ep.scenes = [titleScene(ep), ...ep.scenes, endScene(ep)];
    let T = 0, n = 0;
    ep.lines = [];
    for (const S of ep.scenes) {
      S.start = T; S.L = {};
      let t = S.lead || 0;
      for (const l of S.lines) {
        n++; l.n = n;
        const spoken = d[n] ?? l.text.split(/\s+/).length / WPS;
        l.d = spoken + .9 + (l.pad || 0);
        S.L[l.id] = { s: t, e: t + l.d };
        l.gs = S.start + t;
        ep.lines.push(l);
        t += l.d;
      }
      S.dur = t + (S.tail || 0);
      T += S.dur;
    }
    ep.T = T; ep.built = true; ep.voix = !!DUREES[ep.numero];
    return ep;
  }

  function wrap(ctx, text, max) {
    const words = text.split(' '), out = [];
    let cur = '';
    for (const w of words) {
      const test = cur ? cur + ' ' + w : w;
      if (ctx.measureText(test).width > max && cur) { out.push(cur); cur = w; } else cur = test;
    }
    if (cur) out.push(cur);
    return out;
  }
  function captions() {
    if (!CUR) return;
    const P = CAST[CUR.who], ctx = d;
    const a = clamp(CUR_T / .25) * clamp((CUR.d - CUR_T) / .25);
    if (a <= 0) return;
    ctx.save(); ctx.globalAlpha = a;
    ctx.font = `400 42px ${FB}`;
    const lines = wrap(ctx, CUR.text, 1480);
    const lw = Math.max(...lines.map(s => ctx.measureText(s).width), 360);
    const pad = 28, lh = 56, bh = pad * 2 + 40 + lines.length * lh, bw = lw + pad * 2;
    const x0 = (W - bw) / 2, y0 = H - 36 - bh + (1 - a) * 12;
    ctx.fillStyle = 'rgba(22,24,28,.82)'; ctx.beginPath(); ctx.roundRect(x0, y0, bw, bh, 24); ctx.fill();
    ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    ctx.fillStyle = P.cap; ctx.beginPath(); ctx.arc(x0 + pad + 9, y0 + pad + 14, 9, 0, Math.PI * 2); ctx.fill();
    ctx.font = `600 30px ${FD}`; ctx.fillText(P.name, x0 + pad + 28, y0 + pad - 2);
    ctx.fillStyle = '#FFFFFF'; ctx.font = `400 42px ${FB}`;
    lines.forEach((s, i) => ctx.fillText(s, x0 + pad, y0 + pad + 42 + i * lh));
    ctx.restore();
  }

  let EP = null, SHAKE = 0, CAMOFF = false;
  M.shake = v => { SHAKE = Math.max(SHAKE, v); };
  M.fg = on => { FG = on ? (FG || { dusk: 0 }) : null; };
  function setCur(t) { CUR = EP.lines.find(l => t >= l.gs && t < l.gs + l.d) || null; CUR_T = CUR ? t - CUR.gs : 0; }
  function drawWorld(S, lt) {
    for (const k in POS) delete POS[k];
    SHAKE = 0; FG = null; CAMOFF = S.cam === false;
    c.save(); c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineCap = 'butt'; c.setLineDash([]);
    S.draw(lt, S.L, S);
    c.restore();
    if (FG) { c.save(); foreground(); c.restore(); }
    PREV = { ...POS };
  }
  // Caméra : lente poussée dans chaque scène, et recadrage doux sur le personnage qui parle.
  function camera(S, lt) {
    let z = 1.012 + .04 * ease(clamp(lt / Math.max(5, S.dur))), cx = W / 2, cy = H / 2;
    if (!CAMOFF) {
      const target = who => who && who !== 'narr' && POS[who] ? [lerp(W / 2, POS[who].x, .34), lerp(H / 2, POS[who].y + 40, .25), .065] : [W / 2, H / 2, 0];
      const t = S.start + lt;
      const inScene = EP.lines.filter(l => l.gs >= S.start - 1e-6 && l.gs < S.start + S.dur);
      let A, B, k;
      if (CUR) {
        const i = inScene.indexOf(CUR), prev = i > 0 ? inScene[i - 1] : null;
        A = target(prev && prev.who); B = target(CUR.who); k = ease(clamp(CUR_T / 1.2));
      } else {
        const last = inScene.filter(l => l.gs + l.d <= t).pop();
        A = target(last && last.who); B = [W / 2, H / 2, 0]; k = last ? ease(clamp((t - last.gs - last.d) / 1.6)) : 1;
      }
      cx = lerp(A[0], B[0], k); cy = lerp(A[1], B[1], k); z += lerp(A[2], B[2], k);
    }
    const hw = W / 2 / z, hh = H / 2 / z;
    cx = clamp(cx, hw, W - hw); cy = clamp(cy, hh, H - hh);
    if (SHAKE) { cx += Math.sin(TT * 53) * SHAKE; cy += Math.cos(TT * 41) * SHAKE; }
    return [cx, cy, z];
  }
  function compose(S, lt) {
    const [cx, cy, z] = camera(S, lt);
    d.setTransform(z, 0, 0, z, W / 2 - cx * z, H / 2 - cy * z);
    d.imageSmoothingEnabled = true; d.imageSmoothingQuality = 'high';
    d.drawImage(wcv, 0, 0);
    d.setTransform(1, 0, 0, 1, 0, 0);
    const g = d.createRadialGradient(W / 2, H / 2, H * .42, W / 2, H / 2, H * 1.05);
    g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(25,35,30,.3)');
    d.fillStyle = g; d.fillRect(0, 0, W, H);
  }
  function renderAt(t, subs = true) {
    t = clamp(t, 0, EP.T - 1e-3);
    let si = EP.scenes.findIndex(S => t < S.start + S.dur);
    if (si < 0) si = EP.scenes.length - 1;
    const S = EP.scenes[si], lt = t - S.start, TR = .8;
    const wipe = si > 0 && lt < TR;
    if (wipe) {
      const Pv = EP.scenes[si - 1], plt = Pv.dur - .01;
      TT = Pv.start + plt; setCur(TT);
      drawWorld(Pv, plt); compose(Pv, plt);
      pc.setTransform(1, 0, 0, 1, 0, 0); pc.drawImage(cv, 0, 0);
    }
    TT = t; setCur(t);
    drawWorld(S, lt); compose(S, lt);
    if (wipe) {
      const p = ease(lt / TR), R = Math.max(1, p * Math.hypot(W, H) / 2 * 1.02);
      d.save(); d.beginPath(); d.rect(0, 0, W, H); d.arc(W / 2, H / 2, R, 0, Math.PI * 2, true); d.clip('evenodd'); d.drawImage(pcv, 0, 0); d.restore();
      d.strokeStyle = '#FFF6E6'; d.lineWidth = 18 * (1 - p) + 4; d.beginPath(); d.arc(W / 2, H / 2, R, 0, Math.PI * 2); d.stroke();
      d.strokeStyle = CLAY; d.lineWidth = 6; d.beginPath(); d.arc(W / 2, H / 2, R + 12 * (1 - p) + 4, 0, Math.PI * 2); d.stroke();
    }
    if (subs) captions();
    return si;
  }

  const fmt = s => Math.floor(s / 60) + ':' + String(Math.floor(s % 60)).padStart(2, '0');
  function script(ep) {
    const out = [`# Épisode ${ep.numero} · ${ep.titre} — voix off`, '',
      `Durée totale : ${fmt(ep.T)} (${ep.T.toFixed(1)} s). Timecodes générés depuis l'animation${ep.voix ? ', calés sur la voix enregistrée' : ''}.`, ''];
    for (const S of ep.scenes) {
      if (!S.lines.length) continue;
      out.push(`## ${fmt(S.start)} · ${S.title} (${S.phase})`, '');
      for (const l of S.lines) out.push(`- \`${fmt(l.gs)}\` **${CAST[l.who].name}** : ${l.text}`);
      out.push('');
    }
    return out.join('\n');
  }

  // ---------- page et lecteur ----------
  const CSS = `
  :root { --bg:#EDF0EA; --surface:#FFFFFF; --ink:#22262A; --muted:#59625C; --line:#D3DAD0; --accent:#B4552F; --accent-ink:#FFFFFF; color-scheme:light; }
  @media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { --bg:#141718; --surface:#1F2426; --ink:#E7EBE6; --muted:#9CA59F; --line:#343B3D; --accent:#E3875F; --accent-ink:#1A1A1A; color-scheme:dark; } }
  :root[data-theme="dark"] { --bg:#141718; --surface:#1F2426; --ink:#E7EBE6; --muted:#9CA59F; --line:#343B3D; --accent:#E3875F; --accent-ink:#1A1A1A; color-scheme:dark; }
  body { background:var(--bg); color:var(--ink); font:17px/1.55 "Atkinson Hyperlegible", Verdana, sans-serif; }
  .wrap { max-width:1100px; margin:0 auto; padding-inline:16px; padding-block:28px 56px; display:grid; gap:28px; }
  .eyebrow { margin:0; font:700 13px/1.2 "Atkinson Hyperlegible", Verdana, sans-serif; letter-spacing:.09em; text-transform:uppercase; color:var(--accent); }
  h1 { margin:6px 0 10px; font:600 clamp(30px,5.2vw,50px)/1.08 "Fredoka","Trebuchet MS",sans-serif; text-wrap:balance; }
  h2 { margin:0 0 12px; font:600 22px/1.2 "Fredoka","Trebuchet MS",sans-serif; }
  .lede { margin:0; max-width:65ch; color:var(--muted); }
  .eps { display:flex; flex-wrap:wrap; gap:8px; margin:0; padding:0; list-style:none; }
  .eps button { font:600 15px/1 "Fredoka","Trebuchet MS",sans-serif; border:1px solid var(--line); background:var(--surface); color:var(--ink); border-radius:999px; padding:9px 14px; cursor:pointer; }
  .eps button[aria-current="true"] { background:var(--accent); border-color:var(--accent); color:var(--accent-ink); }
  .stage { border-radius:18px; overflow:hidden; background:#F6F7F2; box-shadow:0 0 0 1px var(--line), 0 14px 34px rgba(0,0,0,.13); }
  .stage canvas { display:block; width:100%; max-width:100%; height:auto; aspect-ratio:16/9; }
  .controls { display:flex; align-items:center; gap:14px; flex-wrap:wrap; margin-top:16px; }
  #play { font:600 17px/1 "Fredoka","Trebuchet MS",sans-serif; background:var(--accent); color:var(--accent-ink); border:0; border-radius:999px; padding:12px 24px; min-width:104px; cursor:pointer; }
  #play:focus-visible, .chap button:focus-visible, .eps button:focus-visible, input:focus-visible { outline:3px solid var(--accent); outline-offset:3px; }
  #seek { flex:1 1 220px; accent-color:var(--accent); }
  .tc { font-variant-numeric:tabular-nums; color:var(--muted); }
  .toggles { display:flex; gap:8px 22px; flex-wrap:wrap; margin-top:10px; color:var(--muted); font-size:15px; }
  .toggles label { display:inline-flex; gap:8px; align-items:center; cursor:pointer; }
  .toggles input { accent-color:var(--accent); }
  .cols { display:grid; grid-template-columns:1.45fr 1fr; gap:32px; align-items:start; }
  @media (max-width:760px) { .cols { grid-template-columns:1fr; } }
  #chapters { list-style:none; padding:0; margin:0; display:grid; gap:2px; }
  .chap button { width:100%; display:grid; grid-template-columns:52px 1fr; gap:12px; text-align:left; padding:10px 12px; border:0; border-radius:10px; background:transparent; color:inherit; font:inherit; cursor:pointer; }
  .chap button:hover, .chap.on button { background:var(--surface); }
  .chap.on .tc { color:var(--accent); font-weight:700; }
  .chap .phase { display:block; font-size:13px; color:var(--muted); }
  .fiche { display:grid; gap:16px; margin:0; }
  .fiche dt { font-size:12px; letter-spacing:.08em; text-transform:uppercase; color:var(--muted); }
  .fiche dd { margin:3px 0 0; }`;

  M.demarrer = () => document.body ? start() : document.addEventListener('DOMContentLoaded', start);
  function start() {
    const style = document.createElement('style'); style.textContent = CSS; document.head.appendChild(style);
    const main = document.createElement('main'); main.className = 'wrap';
    main.innerHTML = `
      <header>
        <p class="eyebrow" id="eyebrow"></p>
        <h1 id="titre"></h1>
        <p class="lede">Animatique dessinée en code. Le rythme suit le script de voix off : sans voix enregistrée, les sous-titres et une voix de synthèse d'aperçu permettent de juger le montage.</p>
      </header>
      <ul class="eps" id="eps" aria-label="Épisodes"></ul>
      <section aria-label="Lecteur">
        <div class="stage" id="stage"></div>
        <div class="controls">
          <button id="play" type="button">Lire</button>
          <input id="seek" type="range" min="0" max="1000" step="1" value="0" aria-label="Position dans l'épisode">
          <span id="time" class="tc">0:00 / 0:00</span>
        </div>
        <div class="toggles">
          <label><input type="checkbox" id="subs" checked> Sous-titres</label>
          <label><input type="checkbox" id="voice"> Voix de synthèse (aperçu)</label>
        </div>
      </section>
      <section class="cols">
        <div><h2>Déroulé</h2><ol id="chapters"></ol></div>
        <div><h2>Fiche</h2><dl class="fiche">
          <div><dt>Notion</dt><dd id="f-notion"></dd></div>
          <div><dt>Objectif</dt><dd id="f-objectif"></dd></div>
          <div><dt>Durée</dt><dd><span id="f-duree" class="tc"></span> pour une cible de <span id="f-cible"></span></dd></div>
          <div><dt>Dispositif visuel</dt><dd id="f-dispositif"></dd></div>
        </dl></div>
      </section>`;
    document.body.appendChild(main);
    const $ = id => document.getElementById(id);
    $('stage').appendChild(cv);
    cv.setAttribute('aria-label', 'Animation de l\'épisode');
    const btn = $('play'), seek = $('seek'), time = $('time'), subs = $('subs'), voice = $('voice'), list = $('chapters'), eps = $('eps');
    let playing = false, cur = 0, t0 = 0, tStart = 0, lastLine = null, lastScene = -1;
    EPISODES.sort((a, b) => a.numero - b.numero);
    if (EPISODES.length < 2) eps.hidden = true;

    function select(i) {
      pause();
      EP = build(EPISODES[i]); cur = 0; lastScene = -1;
      $('eyebrow').textContent = `Le Village des Trois Moulins · Épisode ${EP.numero}`;
      $('titre').textContent = EP.titre;
      $('f-notion').textContent = EP.notion; $('f-objectif').textContent = EP.objectif;
      $('f-duree').textContent = fmt(EP.T) + (EP.voix ? ' (voix enregistrée)' : ''); $('f-cible').textContent = EP.cible;
      $('f-dispositif').textContent = EP.dispositif;
      [...eps.children].forEach((li, k) => li.firstChild.setAttribute('aria-current', k === i ? 'true' : 'false'));
      list.innerHTML = '';
      EP.scenes.forEach(S => {
        if (S.id === 'fin') return;
        const li = document.createElement('li'); li.className = 'chap';
        const b = document.createElement('button'); b.type = 'button';
        b.innerHTML = `<span class="tc">${fmt(S.start)}</span><span>${S.title}<span class="phase">${S.phase}</span></span>`;
        b.addEventListener('click', () => { cur = S.start + .01; if (playing) { tStart = cur; t0 = performance.now(); stopVoice(); } draw(); });
        li.appendChild(b); list.appendChild(li);
      });
      draw();
    }
    EPISODES.forEach((ep, i) => {
      const li = document.createElement('li'), b = document.createElement('button');
      b.type = 'button'; b.textContent = `${ep.numero} · ${ep.titre}`;
      b.addEventListener('click', () => { select(i); try { location.hash = 'ep' + ep.numero; } catch (e) {} });
      li.appendChild(b); eps.appendChild(li);
    });

    function stopVoice() { try { speechSynthesis.cancel(); } catch (e) {} lastLine = null; }
    function speak() {
      if (!voice.checked || !playing || CUR === lastLine) return;
      lastLine = CUR;
      try {
        speechSynthesis.cancel();
        if (CUR) {
          const u = new SpeechSynthesisUtterance(CUR.text);
          u.lang = 'fr-FR';
          const fr = speechSynthesis.getVoices().find(v => v.lang && v.lang.startsWith('fr'));
          if (fr) u.voice = fr;
          speechSynthesis.speak(u);
        }
      } catch (e) {}
    }
    function draw() {
      const si = renderAt(cur === 0 && !playing ? 3.5 : cur, subs.checked); // au repos : l'image-titre complète
      seek.value = Math.round(cur / EP.T * 1000);
      time.textContent = `${fmt(cur)} / ${fmt(EP.T)}`;
      if (si !== lastScene) { [...list.children].forEach((li, i) => li.classList.toggle('on', i === si)); lastScene = si; }
    }
    function tick(now) {
      if (!playing) return;
      cur = tStart + (now - t0) / 1000;
      if (cur >= EP.T) { cur = EP.T; pause(); }
      draw(); speak();
      if (playing) requestAnimationFrame(tick);
    }
    function play() { if (cur >= EP.T - .05) cur = 0; playing = true; tStart = cur; t0 = performance.now(); btn.textContent = 'Pause'; requestAnimationFrame(tick); }
    function pause() { playing = false; btn.textContent = 'Lire'; stopVoice(); }
    btn.addEventListener('click', () => playing ? pause() : play());
    seek.addEventListener('input', () => { cur = seek.value / 1000 * EP.T; if (playing) { tStart = cur; t0 = performance.now(); stopVoice(); } draw(); });
    subs.addEventListener('change', draw);
    voice.addEventListener('change', () => { if (!voice.checked) stopVoice(); });
    document.addEventListener('keydown', e => {
      if (e.code === 'Space' && !/INPUT|BUTTON/.test(document.activeElement.tagName)) { e.preventDefault(); playing ? pause() : play(); }
    });

    const fromHash = EPISODES.findIndex(ep => location.hash === '#ep' + ep.numero);
    select(fromHash >= 0 ? fromHash : 0);
    const ready = Promise.race([
      Promise.all([document.fonts.load(`600 60px ${FD}`), document.fonts.load(`500 60px ${FD}`), document.fonts.load(`700 60px ${FD}`), document.fonts.load(`400 42px ${FB}`)]),
      new Promise(r => setTimeout(r, 4000)),
    ]);
    window.EP = {
      ready: false,
      get T() { return EP.T; },
      script: () => script(EP),
      lignes: () => EP.lines.map(l => ({ n: l.n, who: l.who, gs: l.gs, d: l.d })),
      frame(t, withSubs) { renderAt(t, withSubs); return cv.toDataURL('image/jpeg', .92).split(',')[1]; },
    };
    ready.then(() => { draw(); window.EP.ready = true; });
  }
})();
