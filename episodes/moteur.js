// Moteur d'animation commun aux épisodes du Village des Trois Moulins.
// Chaque épisode s'enregistre avec Moteur.episode({...}) puis la page appelle Moteur.demarrer().
// Si une voix a été générée (audio/durees.js), la durée de chaque réplique suit l'audio réel.
(() => {
  const M = window.Moteur = {};
  const W = 1920, H = 1080, GROUND = 860;
  const cv = document.createElement('canvas');
  cv.width = W; cv.height = H;
  const c = cv.getContext('2d');
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

  function head(P, open) {
    const r = KIND[P.kind];
    c.fillStyle = P.hair;
    if (P.style === 'tail') { ell(-r * .95, r * .2, r * .36, r * .62); c.fill(); }
    if (P.style === 'bun') { circ(0, -r * 1.08, r * .42); c.fill(); }
    if (P.style === 'curly') for (const a of [-2.7, -2.15, -1.57, -1, -.45]) { circ(Math.cos(a) * r * .95, Math.sin(a) * r * .95 + r * .08, r * .4); c.fill(); }
    if (P.style !== 'bald') { circ(0, -r * .12, r * 1.04); c.fill(); }
    c.fillStyle = P.skin; circ(0, r * .06, r * .94); c.fill();
    if (P.style === 'bald') { c.fillStyle = P.hair; circ(-r * .9, -r * .05, r * .26); c.fill(); circ(r * .9, -r * .05, r * .26); c.fill(); }
    if (P.beard) { c.fillStyle = P.hair; c.beginPath(); c.arc(0, r * .15, r * .86, .08 * Math.PI, .92 * Math.PI); c.closePath(); c.fill(); }
    c.fillStyle = INK; circ(-r * .35, 0, r * .1); c.fill(); circ(r * .35, 0, r * .1); c.fill();
    if (P.glasses) { c.strokeStyle = INK; c.lineWidth = r * .07; circ(-r * .35, 0, r * .24); c.stroke(); circ(r * .35, 0, r * .24); c.stroke(); line(-r * .11, 0, r * .11, 0); }
    c.fillStyle = 'rgba(225,105,85,.25)'; circ(-r * .56, r * .33, r * .16); c.fill(); circ(r * .56, r * .33, r * .16); c.fill();
    if (open > .08) { c.fillStyle = '#7A2E2E'; ell(0, r * .5, r * .2, r * .05 + open * r * .17); c.fill(); }
    else { c.strokeStyle = P.beard ? '#F3E3D3' : INK; c.lineWidth = r * .08; c.lineCap = 'round'; c.beginPath(); c.arc(0, r * .28, r * .22, .2 * Math.PI, .8 * Math.PI); c.stroke(); }
  }

  // Personnage debout, pieds en (x, y), hauteur h. Renvoie la main avant et le haut de la tête.
  function person(who, x, y, h, o = {}) {
    const P = CAST[who], r = KIND[P.kind], s = h / 100, f = o.face || 1;
    const adult = P.kind === 'adult';
    const legTop = adult ? -42 : -38, bodyTop = -100 + 2 * r - 3, bw = adult ? 34 : 30;
    const sw = o.walk ? Math.sin(o.walk) * 7 : 0, bob = o.walk ? Math.abs(Math.cos(o.walk)) * 1.6 : 0;
    c.save(); c.translate(x, y); c.scale(s * f, s);
    if (o.hl) { c.fillStyle = `rgba(255,200,70,${.5 * o.hl})`; ell(0, 0, 38, 7.5); c.fill(); }
    c.fillStyle = 'rgba(40,55,40,.13)'; ell(0, 0, 24, 4.5); c.fill();
    c.translate(0, -bob);
    c.lineCap = 'round';
    c.strokeStyle = '#3E4A5C'; c.lineWidth = 8;
    line(-6, legTop, -6 + sw, -3); line(6, legTop, 6 - sw, -3);
    c.fillStyle = INK; ell(-4 + sw, -2, 6.5, 3.6); c.fill(); ell(8 - sw, -2, 6.5, 3.6); c.fill();
    c.strokeStyle = P.shirt; c.lineWidth = 7;
    const back = o.both ? [-bw / 2 - 15, bodyTop + 9] : [-bw / 2 - 3 - sw * .4, legTop + 4];
    line(-bw / 2 + 3, bodyTop + 6, back[0], back[1]);
    c.fillStyle = P.skin; circ(back[0], back[1], 4); c.fill();
    c.fillStyle = P.shirt; rr(-bw / 2, bodyTop, bw, legTop - bodyTop + 4, 9); c.fill();
    if (P.apron) { c.fillStyle = P.apron; rr(-bw / 2 + 5, bodyTop + 10, bw - 10, legTop - bodyTop + 6, 4); c.fill(); }
    const hand = o.up ? [bw / 2 + 8, bodyTop - 16] : o.reach ? [bw / 2 + 15, bodyTop + 9] : [bw / 2 + 3 + sw * .4, legTop + 4];
    c.strokeStyle = P.shirt; c.lineWidth = 7; line(bw / 2 - 3, bodyTop + 6, hand[0], hand[1]);
    c.fillStyle = P.skin; circ(hand[0], hand[1], 4); c.fill();
    c.save(); c.translate(0, -100 + r); if (o.tilt) c.rotate(o.tilt); head(P, o.open || 0); c.restore();
    c.restore();
    return { hx: x + f * hand[0] * s, hy: y + (hand[1] - bob) * s, top: y - h, x };
  }
  // Personnage standard d'une scène : bouche et halo suivent la réplique en cours.
  function actor(who, x, y, h, o = {}) { return person(who, x, y, h, { open: talk(who), hl: spk(who), ...o }); }
  Object.assign(M, { head, person, actor, KIND });

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
  function item(name, x, y, s, a = 1, rot = 0) { if (!ITEMS[name]) throw new Error('objet inconnu : ' + name); alpha(a, () => { c.translate(x, y); if (rot) c.rotate(rot); ITEMS[name](s); }); }
  M.ITEMS = ITEMS; M.item = item;

  function token(x, y, r, bake = 1, mark = 1) {
    const col = mix(RAW, CLAY, bake), rim = mix('#7F7368', '#9E4B28', bake);
    c.fillStyle = rim; circ(x, y + r * .09, r); c.fill();
    c.fillStyle = col; circ(x, y, r); c.fill();
    c.strokeStyle = rim; c.lineWidth = r * .07; circ(x, y, r * .78); c.stroke();
    if (mark > 0) alpha(mark, () => {
      c.translate(x, y); c.fillStyle = c.strokeStyle = '#F6DCC8'; c.lineWidth = r * .09; c.lineCap = 'round';
      for (let k = 0; k < 4; k++) { c.rotate(Math.PI / 2); line(0, 0, 0, -r * .52); c.fillRect(r * .03, -r * .52, r * .17, r * .3); }
      circ(0, 0, r * .1); c.fill();
    });
  }
  // Rangée ou pile de jetons (n jetons, centrés en x).
  function tokens(n, x, y, r, o = {}) {
    const gap = o.gap ?? r * 2.25, a = o.a ?? 1;
    alpha(a, () => { for (let i = 0; i < n; i++) token(x + (i - (n - 1) / 2) * gap, y, r); });
  }
  function gear(x, y, r, teeth, ang, col) {
    c.save(); c.translate(x, y); c.rotate(ang); c.fillStyle = col; c.beginPath();
    for (let i = 0; i < teeth * 2; i++) {
      const a0 = i * Math.PI / teeth, R = i % 2 ? r * .78 : r;
      c.lineTo(Math.cos(a0 - .12) * R, Math.sin(a0 - .12) * R); c.lineTo(Math.cos(a0 + .12) * R, Math.sin(a0 + .12) * R);
    }
    c.closePath(); c.fill(); c.restore();
  }
  Object.assign(M, { token, tokens, gear });

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
  function sky(o = {}) {
    const ang = o.ang ?? .35, dusk = o.dusk || 0;
    const g = c.createLinearGradient(0, 0, 0, GROUND);
    g.addColorStop(0, mix('#CDE2EC', '#F2B98C', dusk)); g.addColorStop(1, mix('#EEF4EA', '#F8E2C8', dusk));
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    if (o.mountains) {
      c.fillStyle = '#AFC3CF'; poly([[500, GROUND - 120], [900, GROUND - 520], [1180, GROUND - 260], [1380, GROUND - 440], [1800, GROUND - 120]]); c.fill();
      c.fillStyle = '#F4F8FA'; poly([[830, GROUND - 450], [900, GROUND - 520], [975, GROUND - 440], [930, GROUND - 455], [880, GROUND - 430]]); c.fill();
      poly([[1330, GROUND - 400], [1380, GROUND - 440], [1430, GROUND - 395], [1395, GROUND - 405]]); c.fill();
    }
    if (o.mills !== false) { windmill(1390, GROUND - 150, .55, ang); windmill(1570, GROUND - 175, .63, ang + .5); windmill(1750, GROUND - 150, .5, ang + 1.1); }
    c.fillStyle = '#C3D9AE';
    c.beginPath(); c.moveTo(0, GROUND - 110); c.bezierCurveTo(420, GROUND - 250, 820, GROUND - 60, 1220, GROUND - 170);
    c.bezierCurveTo(1480, GROUND - 240, 1760, GROUND - 150, W, GROUND - 190); c.lineTo(W, GROUND); c.lineTo(0, GROUND); c.closePath(); c.fill();
    c.fillStyle = '#D5E4BF'; c.fillRect(0, GROUND, W, H - GROUND);
    c.fillStyle = '#B3CB97'; c.fillRect(0, GROUND, W, 6);
  }
  function paper() {
    c.fillStyle = PAPER; c.fillRect(0, 0, W, H);
    c.strokeStyle = '#E3E8DF'; c.lineWidth = 2;
    for (let x = 0; x <= W; x += 60) line(x, 0, x, H);
    for (let y = 0; y <= H; y += 60) line(0, y, W, y);
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
  function bubble(x, y, w, h, tx, ty, a) {
    alpha(a, () => {
      c.fillStyle = '#FFFFFF'; c.strokeStyle = INK; c.lineWidth = 4;
      for (let i = 0; i < 3; i++) { const p = .2 + i * .22; circ(lerp(tx, x, p), lerp(ty, y + h / 2 * Math.sign(ty - y), p), 7 + i * 4); c.fill(); c.stroke(); }
      rr(x - w / 2, y - h / 2, w, h, Math.min(h / 2, 60)); c.fill(); c.stroke();
    });
  }
  function cross(x, y, r, a = 1) {
    alpha(a, () => { c.strokeStyle = RED; c.lineWidth = r * .2; c.lineCap = 'round'; line(x - r * .7, y - r * .7, x + r * .7, y + r * .7); line(x + r * .7, y - r * .7, x - r * .7, y + r * .7); });
  }
  function check(x, y, r, a = 1) {
    alpha(a, () => {
      c.fillStyle = GREEN; circ(x, y, r); c.fill();
      c.strokeStyle = '#FFFFFF'; c.lineWidth = r * .22; c.lineCap = 'round'; c.lineJoin = 'round';
      c.beginPath(); c.moveTo(x - r * .45, y + r * .02); c.lineTo(x - r * .1, y + r * .38); c.lineTo(x + r * .5, y - r * .35); c.stroke();
    });
  }
  function arrow(x1, y1, x2, y2, o = {}) {
    const { col = INK, lw = 8, p = 1, a = 1, cut1 = 0, cut2 = 0, head = 26 } = o;
    if (p <= 0 || a <= 0) return;
    const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L;
    const sx = x1 + ux * cut1, sy = y1 + uy * cut1, ex = x2 - ux * cut2, ey = y2 - uy * cut2;
    const px = lerp(sx, ex, p), py = lerp(sy, ey, p);
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
    alpha(a, () => { c.fillStyle = col; c.font = `${weight} ${size}px ${FD}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(txt, x, y); });
  }
  function panel(x, y, w, h, a = 1) {
    alpha(a, () => { c.fillStyle = '#FFFFFF'; rr(x, y, w, h, 28); c.fill(); c.strokeStyle = '#D7DDD3'; c.lineWidth = 3; c.stroke(); });
  }
  // Pastille ronde avec un objet dedans (étiquette d'objet ou de prix).
  function chip(name, x, y, r, o = {}) {
    alpha(o.a ?? 1, () => {
      c.fillStyle = '#FFFFFF'; circ(x, y, r); c.fill();
      c.strokeStyle = o.ring || '#CBD2C8'; c.lineWidth = r * .08; c.stroke();
      item(name, x, y, r * .6);
    });
  }
  // Déplacement d'un objet le long d'une courbe entre deux points.
  function fly(name, x1, y1, x2, y2, p, s, arc = 120) {
    if (p <= 0 || p >= 1) return;
    item(name, lerp(x1, x2, p), lerp(y1, y2, p) - Math.sin(p * Math.PI) * arc, s);
  }
  function flyTokens(n, x1, y1, x2, y2, p, r = 26, arc = 100) {
    for (let k = 0; k < n; k++) {
      const q = clamp(p * (1 + .12 * (n - 1)) - k * .12);
      if (q > 0 && q < 1) token(lerp(x1, x2, ease(q)), lerp(y1, y2, ease(q)) - Math.sin(q * Math.PI) * arc, r);
    }
  }
  Object.assign(M, { bubble, cross, check, arrow, glow, bigText, panel, chip, fly, flyTokens });

  // Médaillon d'un personnage (tête et épaules dans un cercle).
  function node(who, x, y, r, o = {}) {
    const P = CAST[who];
    alpha(o.a ?? 1, () => {
      if (o.hl) glow(x, y, r * 1.8, o.hl);
      c.fillStyle = '#FFFFFF'; circ(x, y, r); c.fill();
      c.save(); circ(x, y, r); c.clip();
      c.fillStyle = P.shirt; ell(x, y + r * .95, r * .75, r * .55); c.fill();
      if (P.apron) { c.fillStyle = P.apron; ell(x, y + r * 1.05, r * .45, r * .5); c.fill(); }
      c.translate(x, y - r * .12); const hs = r * .5 / KIND[P.kind]; c.scale(hs, hs); head(P, talk(who));
      c.restore();
      c.strokeStyle = P.ring; c.lineWidth = r * .09; circ(x, y, r); c.stroke();
      if (o.badge) chip(o.badge, x + r * .74, y + r * .74, r * .38);
      if (o.got) chip(o.got, x - r * .74, y - r * .74, r * .38, { ring: GREEN });
    });
  }
  M.node = node;

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
    return {
      id: 'titre', title: 'Titre', phase: 'Générique', lines: [], tail: 6.5,
      draw(t) {
        sky({ ang: .35 + t * .18 });
        cast.forEach((w, i) => person(w, 960 + (i - (cast.length - 1) / 2) * 260, GROUND + 40, CAST[w].kind === 'adult' ? 360 : CAST[w].kind === 'teen' ? 330 : 270, { face: i < cast.length / 2 ? 1 : -1 }));
        bigText('Le Village des Trois Moulins', 960, 300, 104, INK, prog(t, .3, 1));
        bigText(`Épisode ${ep.numero}`, 960, 405, 50, CLAY, prog(t, .9, 1));
        bigText(ep.titre, 960, 480, 64, INK, prog(t, 1.2, 1), 500);
      },
    };
  }
  function endScene(ep) {
    return {
      id: 'fin', title: 'Fin', phase: 'Générique', lines: [], tail: 5,
      draw(t) {
        paper();
        bigText(ep.suivant ? 'À suivre' : 'Fin de la série', 960, 420, 52, CLAY, prog(t, .2, .8));
        bigText(ep.suivant || 'Merci d\'avoir visité le Village des Trois Moulins', 960, 510, 68, INK, prog(t, .5, .8));
        alpha(prog(t, .9, .8), () => token(960, 650, 50));
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

  function wrap(text, max) {
    const words = text.split(' '), out = [];
    let cur = '';
    for (const w of words) {
      const test = cur ? cur + ' ' + w : w;
      if (c.measureText(test).width > max && cur) { out.push(cur); cur = w; } else cur = test;
    }
    if (cur) out.push(cur);
    return out;
  }
  function captions() {
    if (!CUR) return;
    const P = CAST[CUR.who];
    const a = clamp(CUR_T / .25) * clamp((CUR.d - CUR_T) / .25);
    alpha(a, () => {
      c.font = `400 42px ${FB}`;
      const lines = wrap(CUR.text, 1480);
      const lw = Math.max(...lines.map(s => c.measureText(s).width), 360);
      const pad = 28, lh = 56, bh = pad * 2 + 40 + lines.length * lh, bw = lw + pad * 2;
      const x0 = (W - bw) / 2, y0 = H - 36 - bh;
      c.fillStyle = 'rgba(22,24,28,.8)'; rr(x0, y0, bw, bh, 24); c.fill();
      c.textAlign = 'left'; c.textBaseline = 'top';
      c.fillStyle = P.cap; c.font = `600 30px ${FD}`; c.fillText(P.name, x0 + pad, y0 + pad - 2);
      c.fillStyle = '#FFFFFF'; c.font = `400 42px ${FB}`;
      lines.forEach((s, i) => c.fillText(s, x0 + pad, y0 + pad + 42 + i * lh));
    });
  }

  let EP = null;
  function renderAt(t, subs = true) {
    t = clamp(t, 0, EP.T - 1e-3);
    TT = t;
    let si = EP.scenes.findIndex(S => t < S.start + S.dur);
    if (si < 0) si = EP.scenes.length - 1;
    const S = EP.scenes[si], lt = t - S.start;
    CUR = EP.lines.find(l => t >= l.gs && t < l.gs + l.d) || null;
    CUR_T = CUR ? t - CUR.gs : 0;
    c.save(); c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineCap = 'butt'; c.setLineDash([]);
    S.draw(lt, S.L, S);
    c.restore();
    if (si > 0 && lt < .4) { c.fillStyle = PAPER; c.globalAlpha = 1 - lt / .4; c.fillRect(0, 0, W, H); c.globalAlpha = 1; }
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
