// Épisode 1 · L'Énigme des Pommes et des Briques
(() => {
  const { c, W, H, GROUND, INK, RED, GREEN, CLAY, PAPER, CAST, clamp, lerp, ease, prog, lin, win, mix, rr, circ, ell, line, alpha,
    person, item, token, sky, paper, stall, counter, house, bubble, cross, check, arrow, glow, bigText, node, talk, spk,
    sparkle, burst, pop, rnd, rays } = Moteur;

  function goods(kind, x, k) {
    const y = GROUND - 162 * k;
    if (kind === 'bois') { item('planche', x - 50 * k, y - 18 * k, 62 * k); item('planche', x + 40 * k, y - 48 * k, 62 * k); }
    if (kind === 'forge') {
      c.fillStyle = '#4A525C';
      c.beginPath(); c.moveTo(x - 140 * k, y - 70 * k); c.lineTo(x + 10 * k, y - 70 * k); c.lineTo(x - 10 * k, y - 40 * k); c.lineTo(x - 40 * k, y - 40 * k);
      c.lineTo(x - 30 * k, y); c.lineTo(x - 110 * k, y); c.lineTo(x - 100 * k, y - 40 * k); c.quadraticCurveTo(x - 140 * k, y - 45 * k, x - 140 * k, y - 70 * k); c.closePath(); c.fill();
      item('clous', x + 90 * k, y - 45 * k, 42 * k);
    }
    if (kind === 'laine') { item('laine', x - 85 * k, y - 36 * k, 38 * k); item('laine', x, y - 42 * k, 44 * k); item('laine', x + 85 * k, y - 36 * k, 38 * k); }
  }
  function crate(x, k = 1) {
    [[-60, -130], [-20, -140], [20, -132], [60, -138], [-40, -175], [0, -178], [40, -172]].forEach(([dx, dy]) => item('pomme', x + dx * k, GROUND + dy * k + 10 * k, 26 * k));
    c.fillStyle = '#B07A45'; rr(x - 95 * k, GROUND - 120 * k, 190 * k, 120 * k, 6 * k); c.fill();
    c.strokeStyle = '#8A5A2E'; c.lineWidth = 5 * k; line(x - 95 * k, GROUND - 80 * k, x + 95 * k, GROUND - 80 * k); line(x - 95 * k, GROUND - 40 * k, x + 95 * k, GROUND - 40 * k);
  }

  // ---------- schéma des échanges ----------
  const ORDER = ['sacha', 'forgeronne', 'meunier', 'menuisier', 'bergere'];
  const HAS = { sacha: 'panier', menuisier: 'planche', forgeronne: 'clous', bergere: 'laine', meunier: 'farine' };
  const WANTS = [['sacha', 'menuisier', 'planche'], ['menuisier', 'forgeronne', 'clous'], ['forgeronne', 'bergere', 'laine'], ['bergere', 'meunier', 'farine'], ['meunier', 'sacha', 'pomme']];
  function npos(who, cx, cy, R) {
    const a = -Math.PI / 2 + ORDER.indexOf(who) * 2 * Math.PI / 5;
    return [cx + R * Math.cos(a), cy + R * Math.sin(a)];
  }
  function net(cx, cy, R, nr, S) {
    alpha(S.a ?? 1, () => {
      if (S.spokes > 0) {
        c.strokeStyle = GREEN; c.lineWidth = nr * .11; c.lineCap = 'round';
        ORDER.forEach(w => {
          const [x, y] = npos(w, cx, cy, R), L = Math.hypot(x - cx, y - cy), ux = (x - cx) / L, uy = (y - cy) / L;
          const a0 = nr * .75, a1 = lerp(a0, L - nr * 1.02, S.spokes);
          line(cx + ux * a0, cy + uy * a0, cx + ux * a1, cy + uy * a1);
        });
      }
      WANTS.forEach(([a, b, it], i) => {
        const p = S.arrows?.[i] || 0, aa = S.arrowAlpha ?? 1;
        if (p <= 0 || aa <= 0) return;
        const [x1, y1] = npos(a, cx, cy, R), [x2, y2] = npos(b, cx, cy, R);
        const col = S.red ? mix('#2B2E33', RED, S.red) : INK;
        arrow(x1, y1, x2, y2, { col, lw: nr * .08, p, a: aa, cut1: nr * 1.05, cut2: nr * 1.12, head: nr * .3 });
        const lp = .3, lx = lerp(x1, x2, lp), ly = lerp(y1, y2, lp);
        alpha(aa * clamp((p - .3) / .2), () => {
          c.fillStyle = '#FFFFFF'; circ(lx, ly, nr * .32); c.fill(); c.strokeStyle = col; c.lineWidth = nr * .05; c.stroke();
          item(it, lx, ly, nr * .2);
        });
      });
      if (S.hub > 0) token(cx, cy, nr * .68 * S.hub, 1, 1);
      ORDER.forEach(w => { const [x, y] = npos(w, cx, cy, R); node(w, x, y, nr, { a: S.nodes?.[w] ?? 1, got: S.got?.[w], hl: S.hl?.[w] || 0, badge: HAS[w] }); });
    });
  }

  const scenes = [
    {
      id: 'village', title: 'Le village', phase: 'Interrogation initiale', lead: .6, tail: 1.2,
      lines: [
        { id: 'N1', who: 'narr', text: "Voici le Village des Trois Moulins. Ici, chacun fabrique quelque chose d'utile." },
        { id: 'N2', who: 'narr', text: 'Le menuisier scie des planches. La forgeronne forge des clous. La bergère file de la laine.', pad: .6 },
        { id: 'N3', who: 'narr', text: 'Et Sacha, lui, vient de cueillir un grand panier de pommes.', pad: .6 },
        { id: 'N4', who: 'narr', text: "Mais alors… comment obtient-on une chose que fabrique quelqu'un d'autre ?", pad: .8 },
      ],
      draw(t, L) {
        sky();
        const stalls = [['menuisier', 690, '#9B6A3E', 'bois'], ['forgeronne', 1150, '#4F5A66', 'forge'], ['bergere', 1610, '#5E9A5A', 'laine']];
        const n2 = L.N2, third = (n2.e - n2.s - 1.2) / 3;
        stalls.forEach(([who, x, awn, kind], i) => {
          const on = win(t, n2.s + i * third, n2.s + (i + 1) * third + (i === 2 ? 1.2 : .2), .25);
          glow(x, GROUND - 230, 330, on);
          stall(x, .9, awn);
          person(who, x + 10, GROUND - 8, 330, { face: -1 });
          counter(x, .9);
          goods(kind, x, .9);
        });
        const p = prog(t, L.N3.s, 2.6), x = lerp(-160, 290, p);
        const h = person('sacha', x, GROUND + 40, 270, { walk: p > 0 && p < 1 ? t * 9 : 0 });
        item('panier', h.hx + 12, h.hy - 4, 38);
        bigText('?', x, h.top - 70, 130, CLAY, prog(t, L.N4.s + .4, .5), 700);
      },
    },
    {
      id: 'menuisier', title: 'Chez le menuisier', phase: 'Mise en situation', lead: .8, tail: 1.2,
      lines: [
        { id: 'S1', who: 'sacha', text: 'Bonjour ! Je voudrais cette belle planche pour fabriquer un plateau de jeu.' },
        { id: 'S2', who: 'sacha', text: 'Je vous donne mes pommes en échange !', pad: .4 },
        { id: 'M1', who: 'menuisier', text: "Des pommes ? C'est gentil, mais mon atelier en est déjà plein.", pad: .4 },
        { id: 'M2', who: 'menuisier', text: "Moi, ce qu'il me faut, ce sont des clous.", pad: .6 },
      ],
      draw(t, L) {
        sky();
        const k = 1.25, sx = 1320;
        stall(sx, k, '#9B6A3E');
        person('menuisier', sx + 30, GROUND - 8, 470, { face: -1, open: talk('menuisier'), hl: 0 });
        counter(sx, k); goods('bois', sx, k);
        alpha(prog(t, L.M1.s + .6, .6), () => crate(1690));
        const h = person('sacha', 640, GROUND + 40, 300, { open: talk('sacha'), hl: spk('sacha'), reach: t > L.S2.s && t < L.M1.s + 1 });
        item('panier', h.hx + 14, h.hy + 6, 44);
        const b1 = win(t, L.S1.s + .4, L.S2.e, .35);
        bubble(640, h.top - 120, 250, 150, 640, h.top - 12, b1);
        item('planche', 640, h.top - 120, 62, b1);
        const fp = prog(t, L.S2.s + .5, 1.3);
        const ax = lerp(h.hx + 14, sx - 200, fp), ay = lerp(h.hy - 40, GROUND - 330, fp) - Math.sin(fp * Math.PI) * 120;
        item('pomme', ax, ay, 36, (t > L.S2.s + .5 ? 1 : 0) * (1 - prog(t, L.M1.s + .8, .5)));
        const bx = 900, by = GROUND - 560;
        const m1 = win(t, L.M1.s + .3, L.M1.e, .3), m2 = win(t, L.M2.s + .1, L.M2.e + 1.2, .3);
        bubble(bx, by, 300, 170, sx - 60, GROUND - 430, Math.max(m1, m2));
        item('pomme', bx - 45, by, 40, m1); item('pomme', bx + 45, by, 40, m1); cross(bx, by, 70, m1);
        item('clous', bx, by, 56, m2);
      },
    },
    {
      id: 'forgeronne', title: 'Chez la forgeronne', phase: 'Mise en situation', lead: .5, tail: 1.2,
      lines: [
        { id: 'N5', who: 'narr', text: 'Des clous ? Sacha file aussitôt chez la forgeronne.', pad: .8 },
        { id: 'S3', who: 'sacha', text: 'Bonjour ! Mes pommes contre quelques clous ?' },
        { id: 'F1', who: 'forgeronne', text: "Je n'ai pas besoin de pommes, Sacha. Je cherche de la laine, pour me faire des gants bien chauds.", pad: .6 },
      ],
      draw(t, L) {
        sky();
        const k = 1.25, sx = 1320;
        stall(sx, k, '#4F5A66');
        person('forgeronne', sx + 30, GROUND - 8, 450, { face: -1, open: talk('forgeronne') });
        counter(sx, k); goods('forge', sx, k);
        const p = prog(t, L.N5.s + .3, 2.6), x = lerp(-150, 640, p);
        const h = person('sacha', x, GROUND + 40, 300, { walk: p > 0 && p < 1 ? t * 9 : 0, open: talk('sacha'), hl: spk('sacha') });
        item('panier', h.hx + 14, h.hy + 6, 44);
        const b = win(t, L.S3.s + .2, L.S3.e + .3, .3);
        bubble(640, h.top - 120, 360, 150, 640, h.top - 12, b);
        item('pomme', 555, h.top - 120, 36, b);
        arrow(600, h.top - 120, 680, h.top - 120, { lw: 7, head: 22, a: b });
        item('clous', 730, h.top - 120, 42, b);
        const f = L.F1, mid = f.s + (f.e - f.s) * .4;
        const b1 = win(t, f.s + .2, mid, .3), b2 = win(t, mid, f.e + 1.2, .3);
        const bx = 900, by = GROUND - 560;
        bubble(bx, by, 280, 170, sx - 60, GROUND - 420, Math.max(b1, b2));
        item('pomme', bx, by, 44, b1); cross(bx, by, 70, b1);
        item('laine', bx, by, 58, b2);
      },
    },
    {
      id: 'blocage', title: 'La chaîne bloquée', phase: 'Mise en situation', lead: .8, tail: 1.8,
      lines: [
        { id: 'N6', who: 'narr', text: "De la laine ? C'est la bergère qui en a. Mais la bergère, elle, voudrait de la farine.", pad: .6 },
        { id: 'N7', who: 'narr', text: 'La farine, c\'est le meunier. Et le meunier… voudrait justement des pommes !', pad: .8 },
        { id: 'N8', who: 'narr', text: 'Pour que tout le monde soit content, il faudrait réunir les cinq au même endroit, au même moment, et que tous échangent en même temps.', pad: .6 },
        { id: 'N9', who: 'narr', text: 'Autant dire que c\'est presque impossible. Les échanges sont bloqués.', pad: .6 },
      ],
      draw(t, L) {
        paper();
        const squeeze = win(t, L.N8.s + .8, L.N8.e - .2, 1.2);
        const R = 330 * (1 - .3 * squeeze);
        const red = t > L.N9.s ? (.55 + .45 * Math.sin((t - L.N9.s) * 7)) * prog(t, L.N9.s, .5) : 0;
        if (t > L.N9.s && t < L.N9.s + .6) Moteur.shake(8 * (1 - (t - L.N9.s) / .6));
        glow(960, 500, 520, red * .25);
        net(960, 500, R, 86, {
          nodes: { sacha: prog(t, 0, .5), menuisier: prog(t, .2, .5), forgeronne: prog(t, .4, .5), bergere: prog(t, L.N6.s + 1.2, .5), meunier: prog(t, L.N7.s, .5) },
          arrows: [prog(t, .4, 1), prog(t, 1.1, 1), prog(t, L.N6.s + 1.5, 1), prog(t, L.N6.e - 1.8, 1), prog(t, L.N7.s + 2, 1)],
          red,
        });
      },
    },
    {
      id: 'naya', title: 'Naya et le troc', phase: 'Formalisation', lead: 1.6, tail: 1.2,
      lines: [
        { id: 'NY1', who: 'naya', text: "Sacha, tu viens de découvrir un très vieux problème. Échanger une chose directement contre une autre, ça s'appelle le troc." },
        { id: 'NY2', who: 'naya', text: "Le troc ne marche que si chacun veut exactement ce que l'autre possède.", pad: 2 },
        { id: 'NY3', who: 'naya', text: "Alors, réfléchis : et si tout le monde acceptait une même petite chose, qu'on pourrait ensuite redonner à n'importe qui ?", pad: .6 },
        { id: 'S4', who: 'sacha', text: 'Une chose que tout le monde accepte… Mais laquelle ?', pad: .6 },
      ],
      draw(t, L) {
        sky();
        const p = prog(t, .1, 2.2), nx = lerp(2100, 1180, p);
        person('naya', nx, GROUND + 40, 340, { face: -1, walk: p > 0 && p < 1 ? t * 8 : 0, open: talk('naya'), hl: spk('naya') });
        const h = person('sacha', 720, GROUND + 40, 300, { open: talk('sacha'), hl: spk('sacha') });
        item('panier', h.hx + 14, h.hy + 6, 44);
        const pa = win(t, L.NY2.s + .2, L.NY3.s + .5, .4);
        alpha(pa, () => {
          c.fillStyle = '#FFFFFF'; rr(460, 60, 1000, 420, 30); c.fill(); c.strokeStyle = '#D7DDD3'; c.lineWidth = 3; c.stroke();
          const r1 = 170, r2 = 370, xa = 620, xb = 1140;
          node('menuisier', xa, r1, 62, { badge: 'planche' }); node('forgeronne', xb, r1, 62, { badge: 'clous' });
          arrow(xa, r1 - 26, xb, r1 - 26, { col: GREEN, lw: 7, head: 24, cut1: 72, cut2: 72 });
          arrow(xb, r1 + 26, xa, r1 + 26, { col: GREEN, lw: 7, head: 24, cut1: 72, cut2: 72 });
          c.fillStyle = '#FFFFFF'; circ(880, r1 - 30, 24); c.fill(); item('clous', 880, r1 - 30, 17);
          circ(880, r1 + 30, 24); c.fill(); item('planche', 880, r1 + 30, 17);
          check(1340, r1, 42, prog(t, L.NY2.s + 1.4, .4));
          const q = prog(t, L.NY2.s + 2.6, .5);
          alpha(q, () => {
            node('menuisier', xa, r2, 62, { badge: 'planche' }); node('forgeronne', xb, r2, 62, { badge: 'clous' });
            arrow(xa, r2, xb, r2, { col: '#8A9290', lw: 7, head: 24, cut1: 72, cut2: 72 });
            c.fillStyle = '#FFFFFF'; circ(880, r2, 24); c.fill(); item('clous', 880, r2, 17);
            cross(1340, r2, 42, prog(t, L.NY2.s + 3.4, .4));
          });
        });
        const g = win(t, L.NY3.s + 2, L.S4.e + 1.2, .6);
        alpha(g, () => {
          glow(950, GROUND - 330, 170, 1);
          c.setLineDash([14, 12]); c.strokeStyle = CLAY; c.lineWidth = 7; circ(950, GROUND - 330, 72); c.stroke(); c.setLineDash([]);
          bigText('?', 950, GROUND - 326, 96, CLAY, 1, 700);
        });
      },
    },
    {
      id: 'jetons', title: "Les jetons d'argile", phase: 'Formalisation', lead: .4, tail: 1.2,
      lines: [
        { id: 'N10', who: 'narr', text: "Naya propose aux artisans des jetons en argile cuite.", pad: 1.6 },
        { id: 'N11', who: 'narr', text: 'Ils ont tous la même taille, et la même marque : celle du village.', pad: 2 },
        { id: 'N12', who: 'narr', text: "Tous les habitants se mettent d'accord : ces jetons, chacun les accepte.", pad: 2.4 },
      ],
      draw(t, L) {
        paper();
        const a = L.N10.s, b = L.N11.s, d = L.N12.s;
        // le four à argile
        const kiln = win(t, a - .6, b + .4, .6);
        alpha(kiln, () => {
          glow(960, 640, 420, .6 + .15 * Math.sin(t * 9));
          c.fillStyle = '#A5532E'; c.beginPath(); c.arc(960, 720, 270, Math.PI, 0); c.lineTo(1230, 800); c.lineTo(690, 800); c.closePath(); c.fill();
          c.strokeStyle = 'rgba(70,30,15,.3)'; c.lineWidth = 4;
          for (let r_ = 120; r_ < 270; r_ += 38) { c.beginPath(); c.arc(960, 720, r_, Math.PI, 0); c.stroke(); }
          c.fillStyle = '#2A1A12'; c.beginPath(); c.arc(960, 720, 140, Math.PI, 0); c.closePath(); c.fill();
          for (let i = 0; i < 11; i++) {
            const fx = 850 + i * 22, fh = 60 + 38 * Math.abs(Math.sin(t * 11 + i * 1.9));
            c.fillStyle = i % 2 ? '#FFB23E' : '#FF7A2E'; c.beginPath(); c.ellipse(fx, 720 - fh / 2, 16, fh / 2, 0, 0, Math.PI * 2); c.fill();
            c.fillStyle = '#FFE08A'; c.beginPath(); c.ellipse(fx, 720 - fh * .3, 7, fh * .25, 0, 0, Math.PI * 2); c.fill();
          }
          for (let i = 0; i < 10; i++) { const q = (t * .8 + rnd(i)) % 1; sparkle(900 + rnd(i + 4) * 120, 700 - q * 380, 8 * (1 - q), 1 - q, '#FFB23E'); }
          c.fillStyle = '#7E3F22'; rr(680, 790, 560, 40, 12); c.fill();
        });
        const bake = prog(t, a + .8, 2.4), rise = prog(t, a + 3.2, 1.1);
        const sp = prog(t, b + 2.6, 1.2), up = prog(t, d, .8);
        const y = lerp(lerp(690, 430, rise), 330, up);
        glow(960, y, 260, bake * (1 - rise * .6) * .9);
        const markT = b + .75, markOn = clamp((t - markT) / .08);
        rays(960, y, 460, win(t, markT, d + .8, .6) * (1 - sp * .5));
        for (let i = 0; i < 5; i++) {
          if (i === 2) continue;
          const xi = lerp(960, 960 + (i - 2) * 210, sp);
          alpha(sp, () => token(xi, y, 88, 1, 1, sp < 1 ? Math.cos(sp * Math.PI * 2) : 1));
          burst(xi, y, clamp((t - b - 3.6) / .7), 70);
        }
        token(960, y, lerp(lerp(78, 150, rise), 88, sp) * pop(prog(t, a - .2, .8)), bake, markOn);
        const s1 = prog(t, b + .2, .55), s2 = prog(t, b + 1.0, .6);
        const sy = lerp(-260, y - 190, s1) - s2 * 560;
        if (t > b && s2 < 1) {
          c.fillStyle = '#8A5A2E'; rr(925, sy - 170, 70, 180, 16); c.fill();
          c.fillStyle = '#6B4423'; rr(850, sy, 220, 40, 10); c.fill();
        }
        if (t > markT && t < markT + .35) Moteur.shake(14 * (1 - (t - markT) / .35));
        burst(960, y, clamp((t - markT) / .8), 130);
        const order = ['sacha', 'menuisier', 'forgeronne', 'bergere', 'meunier'];
        order.forEach((w, i) => {
          const x = 960 + (i - 2) * 230, ok = prog(t, d + 1 + i * .6, .4);
          node(w, x, 740, 72, { a: prog(t, d + .3 + i * .12, .6), badge: false, hl: ok * .6 });
          check(x + 52, 740 - 52, 26, ok);
        });
        Moteur.confetti(t, win(t, d + 4.2, L.N12.e + 2, .5), 70);
      },
    },
    {
      id: 'echange', title: 'Tout circule', phase: 'Formalisation', lead: 2.2, tail: 1.6,
      lines: [
        { id: 'N13', who: 'narr', text: 'Le meunier, qui voulait des pommes, achète le panier de Sacha pour trois jetons.', pad: 1.6 },
        { id: 'M3', who: 'menuisier', text: 'Ma planche contre trois jetons ? Marché conclu !', pad: 1.2 },
        { id: 'M4', who: 'menuisier', text: "Et avec ces jetons, j'irai acheter mes clous quand j'en aurai besoin.", pad: 1.4 },
        { id: 'N14', who: 'narr', text: 'La forgeronne pourra payer la bergère, la bergère pourra payer le meunier… Plus besoin d\'être tous là au même moment.', pad: 1.6 },
      ],
      draw(t, L) {
        paper();
        const cx = 960, cy = 500, R = 330, nr = 80;
        const T = [
          ['meunier', 'sacha', 'panier', L.N13.s + 1.4, 3],
          ['sacha', 'menuisier', 'planche', L.M3.s + .4, 2.6],
          ['menuisier', 'forgeronne', 'clous', L.M4.s + 1.6, 2.4],
          ['forgeronne', 'bergere', 'laine', L.N14.s + .3, 2.2],
          ['bergere', 'meunier', 'farine', L.N14.s + 2.8, 2.2],
        ];
        const got = {};
        T.forEach(([buyer, , it, s, d]) => { if (t >= s + d) got[buyer] = it; });
        rays(cx, cy, 380, prog(t, .9, 1.2) * .8);
        burst(cx, cy, clamp((t - .9) / .9), 90);
        net(cx, cy, R, nr, {
          arrows: [1, 1, 1, 1, 1], arrowAlpha: 1 - prog(t, .2, 1), red: 1,
          spokes: prog(t, .9, 1.2), hub: prog(t, .9, .8), got,
        });
        const via = (from, to, p) => {
          const [x1, y1] = npos(from, cx, cy, R), [x2, y2] = npos(to, cx, cy, R);
          return p < .5 ? [lerp(x1, cx, p * 2), lerp(y1, cy, p * 2)] : [lerp(cx, x2, p * 2 - 1), lerp(cy, y2, p * 2 - 1)];
        };
        T.forEach(([buyer, seller, it, s, d]) => {
          const p = lin(t, s, d);
          if (p <= 0 || p >= 1) return;
          for (let k = 0; k < 3; k++) {
            const q = clamp(p * 1.25 - k * .12);
            if (q > 0 && q < 1) { const [x, y] = via(buyer, seller, q); token(x, y, 26, 1, 1); }
          }
          const [ix, iy] = via(seller, buyer, ease(p));
          c.fillStyle = '#FFFFFF'; circ(ix, iy, 40); c.fill(); c.strokeStyle = GREEN; c.lineWidth = 4; c.stroke();
          item(it, ix, iy, 26);
        });
      },
    },
    {
      id: 'recap', title: "Ce qu'est la monnaie", phase: 'Formalisation', lead: .6, tail: 1.6,
      lines: [
        { id: 'N15', who: 'narr', text: "Voilà ce qu'est la monnaie : une chose que tout le monde accepte en échange.", pad: .6 },
        { id: 'N16', who: 'narr', text: "Elle évite d'avoir à trouver quelqu'un qui veut exactement ce qu'on a.", pad: .6 },
        { id: 'N17', who: 'narr', text: 'Et elle permet de comparer : une planche vaut trois jetons, un panier de pommes aussi.', pad: 1.4 },
      ],
      draw(t, L) {
        paper();
        const a = prog(t, 0, .6), dim = prog(t, L.N16.s + .3, .6);
        net(500, 360, 200, 50, { a: a * (1 - .55 * dim), arrows: [1, 1, 1, 1, 1], red: 1 });
        arrow(790, 360, 1130, 360, { lw: 14, head: 42, p: prog(t, .8, .8) });
        glow(1420, 360, 330, dim);
        net(1420, 360, 200, 50, { a: prog(t, 1.2, .6), spokes: 1, hub: 1 });
        const r1 = prog(t, L.N17.s + 1.8, .6), r2 = prog(t, L.N17.s + 3.4, .6);
        item('planche', 420, 800, 72, r1); bigText('=', 580, 800, 96, INK, r1);
        [680, 770, 860].forEach(x => alpha(r1, () => token(x, 800, 36)));
        item('panier', 1110, 790, 66, r2); bigText('=', 1260, 800, 96, INK, r2);
        [1360, 1450, 1540].forEach(x => alpha(r2, () => token(x, 800, 36)));
      },
    },
    {
      id: 'question', title: 'À toi de chercher', phase: 'Question ouverte', lead: .5, tail: 2,
      lines: [
        { id: 'NY4', who: 'naya', text: 'À toi, maintenant ! Chez toi, cherche un objet que ta famille a acheté.', pad: 1.2 },
        { id: 'NY5', who: 'naya', text: "S'il n'y avait pas de monnaie, qu'aurait-il fallu donner en échange ? Et à qui ?", pad: 1 },
      ],
      draw(t, L) {
        sky();
        person('naya', 960, GROUND + 40, 360, { open: talk('naya'), hl: spk('naya') });
        const hA = prog(t, L.NY4.s + 1.4, .6);
        glow(500, GROUND - 150, 260, hA * .8);
        alpha(hA, () => house(500, GROUND - 10, 1.1));
        alpha(prog(t, L.NY4.s + 3, .5), () => item('paquet', 500, GROUND - 330, 46));
        const q = prog(t, L.NY5.s + .6, .6);
        alpha(q, () => {
          item('paquet', 1300, GROUND - 300, 52);
          arrow(1370, GROUND - 318, 1520, GROUND - 318, { lw: 8, head: 26 });
          arrow(1520, GROUND - 282, 1370, GROUND - 282, { lw: 8, head: 26 });
          c.fillStyle = '#FFFFFF'; circ(1600, GROUND - 300, 58); c.fill(); c.strokeStyle = CLAY; c.lineWidth = 6; c.stroke();
          bigText('?', 1600, GROUND - 296, 80, CLAY, 1, 700);
        });
      },
    },
  ];


  Moteur.episode({
    numero: 1,
    titre: "L'Énigme des Pommes et des Briques",
    notion: "Le troc, ses limites et l'émergence de la monnaie",
    objectif: "Comprendre la monnaie comme intermédiaire universel d'échange.",
    cible: '4 min 30 s',
    dispositif: "Le schéma des envies s'emmêle et clignote en rouge sous le troc, puis se réorganise en tracés verts qui convergent vers le jeton commun.",
    suivant: "Épisode 2 · D'où viennent les pièces ?",
    generique: ['sacha', 'naya'],
    scenes,
  });
})();
