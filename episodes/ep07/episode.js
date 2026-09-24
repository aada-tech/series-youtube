// Épisode 7 · Le Grand Chantier de la Cabane
(() => {
  const { c, W, H, GROUND, INK, RED, GREEN, CLAY, PAPER, BLUE, CAST, clamp, lerp, ease, prog, lin, win, rr, circ, ell, line, poly, alpha,
    person, actor, item, token, tokens, sky, paper, bubble, cross, check, arrow, glow, bigText, panel, chip, node, fly, flyTokens, FD ,
    sparkle, burst, pop, rnd, rays } = Moteur;

  function tree(x, y, k) {
    c.fillStyle = '#8A5A2E'; rr(x - 16 * k, y - 160 * k, 32 * k, 160 * k, 8 * k); c.fill();
    c.fillStyle = '#6FA36B'; circ(x, y - 220 * k, 90 * k); c.fill(); circ(x - 70 * k, y - 170 * k, 60 * k); c.fill(); circ(x + 70 * k, y - 175 * k, 65 * k); c.fill();
    c.fillStyle = '#86B97E'; circ(x - 25 * k, y - 250 * k, 45 * k); c.fill();
  }
  function foret() { [[120, 1], [330, .8], [1600, .9], [1800, 1.1], [1460, .7]].forEach(([x, k]) => tree(x, GROUND + 10, k)); }
  function oiseau(x, y, s, a) { alpha(a, () => { c.strokeStyle = INK; c.lineWidth = 4; c.lineCap = 'round'; c.beginPath(); c.moveTo(x - s, y); c.quadraticCurveTo(x - s / 2, y - s * .6, x, y); c.quadraticCurveTo(x + s / 2, y - s * .6, x + s, y); c.stroke(); }); }

  // Cabane sur pilotis. p : avancement du chantier (0 → 1). broken : poutre cassée.
  function cabane(x, p, o = {}) {
    const k = o.k || 1, base = GROUND + 10, floorY = base - 220 * k, w = 420 * k;
    const sketch = o.sketch || 0;
    if (sketch) alpha(sketch, () => { c.setLineDash([12, 10]); c.strokeStyle = '#9AA3A8'; c.lineWidth = 4; rr(x - w / 2, floorY - 220 * k, w, 220 * k, 6); c.stroke(); poly([[x - w / 2 - 30 * k, floorY - 210 * k], [x, floorY - 340 * k], [x + w / 2 + 30 * k, floorY - 210 * k]]); c.stroke(); line(x - w / 2 + 20 * k, floorY, x - w / 2 + 20 * k, base); line(x + w / 2 - 20 * k, floorY, x + w / 2 - 20 * k, base); c.setLineDash([]); });
    const s1 = clamp(p / .25), s2 = clamp((p - .25) / .25), s3 = clamp((p - .5) / .25), s4 = clamp((p - .75) / .25);
    c.fillStyle = '#8A5A2E';
    [-1, 1].forEach(sd => { if (s1 > 0) c.fillRect(x + sd * (w / 2 - 20 * k) - 12 * k, base - (base - floorY + 20 * k) * s1, 24 * k, (base - floorY + 20 * k) * s1); });
    if (s2 > 0) {
      alpha(s2, () => {
        c.fillStyle = '#C98E55'; rr(x - w / 2 - 20 * k, floorY - 10 * k, w + 40 * k, 26 * k, 6); c.fill();
        // poutre maîtresse
        if (o.broken) {
          c.fillStyle = '#A8733F'; c.save(); c.translate(x - w / 2, floorY + 30 * k); c.rotate(.12); c.fillRect(0, 0, w / 2 - 6, 22 * k); c.restore();
          c.save(); c.translate(x + w / 2, floorY + 30 * k); c.rotate(-.12); c.fillRect(-(w / 2 - 6), 0, w / 2 - 6, 22 * k); c.restore();
          c.strokeStyle = RED; c.lineWidth = 5; poly([[x - 14, floorY + 20 * k], [x + 6, floorY + 40 * k], [x - 6, floorY + 52 * k], [x + 14, floorY + 70 * k]]); c.stroke();
        } else { c.fillStyle = o.newBeam ? '#C98E55' : '#A8733F'; c.fillRect(x - w / 2, floorY + 30 * k, w, 22 * k); }
      });
    }
    if (s3 > 0) alpha(s3, () => {
      for (let i = 0; i < 7; i++) { c.fillStyle = i % 2 ? '#C98E55' : '#B98552'; c.fillRect(x - w / 2 + i * w / 7, floorY - 200 * k * s3, w / 7 + 1, 200 * k * s3); }
      c.fillStyle = '#5E7F96'; rr(x - 60 * k, floorY - 150 * k, 120 * k, 90 * k, 10); c.fill();
    });
    if (s4 > 0) alpha(s4, () => {
      c.fillStyle = '#4E7FA8'; poly([[x - w / 2 - 40 * k, floorY - 190 * k], [x, floorY - 330 * k], [x + w / 2 + 40 * k, floorY - 190 * k]]); c.fill();
      c.strokeStyle = '#7FA8CC'; c.lineWidth = 6; line(x - w / 4, floorY - 260 * k, x + w / 4, floorY - 260 * k);
    });
    // échelle
    if (s2 > .5) { c.strokeStyle = '#8A5A2E'; c.lineWidth = 8; line(x + w / 2 + 40 * k, base, x + w / 2 - 10 * k, floorY); line(x + w / 2 + 80 * k, base, x + w / 2 + 30 * k, floorY); for (let i = 1; i < 6; i++) { const q = i / 6; line(lerp(x + w / 2 + 40 * k, x + w / 2 - 10 * k, q), lerp(base, floorY, q), lerp(x + w / 2 + 80 * k, x + w / 2 + 30 * k, q), lerp(base, floorY, q)); } }
    if (o.flags) alpha(o.flags, () => item('fanions', x, floorY - 210 * k, 200 * k));
    if (o.lantern) alpha(o.lantern, () => item('lanterne', x - w / 2 + 40 * k, floorY - 60 * k, 40 * k));
    return { floorY, top: floorY - 330 * k };
  }

  // Budget en blocs : la colonne des ressources (30 jetons) et la pile des dépenses.
  const U = 15;
  const POSTES = [['vis', 6, '#8C96A3'], ['toile', 8, '#4E7FA8'], ['poulie', 6, '#6B7682'], ['reserve', 5, GREEN], ['fanions', 3, '#E8589A']];
  function budget(x, y, o = {}) {
    const res = 30;
    alpha(o.a ?? 1, () => {
      // ressources
      c.fillStyle = '#EFE7DA'; rr(x - 330, y - res * U - 20, 200, res * U + 20, 14); c.fill();
      for (let i = 0; i < Math.round(res * (o.res ?? 1)); i++) { c.fillStyle = i % 2 ? '#C0643A' : '#D0764C'; c.fillRect(x - 320, y - (i + 1) * U, 180, U - 2); }
      token(x - 230, y + 45, 26);
      // ligne de hauteur maximale
      c.setLineDash([14, 10]); c.strokeStyle = CLAY; c.lineWidth = 4; line(x - 340, y - res * U, x + 340, y - res * U); c.setLineDash([]);
      // dépenses
      let h = 0;
      POSTES.forEach(([n, v, col], i) => {
        const p = o.postes ? o.postes[i] : 1;
        if (p <= 0) return;
        const yy = y - (h + v) * U;
        alpha(p, () => {
          if (n === 'reserve') {
            c.fillStyle = 'rgba(47,158,98,.25)'; c.fillRect(x + 100, yy, 180, v * U - 2);
            c.save(); c.beginPath(); c.rect(x + 100, yy, 180, v * U - 2); c.clip(); c.strokeStyle = GREEN; c.lineWidth = 4;
            for (let d = -100; d < 300; d += 20) line(x + 100 + d, yy + v * U, x + 100 + d + 80, yy - 10); c.restore();
            if (o.used) { c.fillStyle = '#A8733F'; c.fillRect(x + 100, yy, 180 * o.used, v * U - 2); }
            chip(o.used >= 1 ? 'poutre' : 'etoile', x + 330, yy + v * U / 2, 30, { ring: GREEN });
          } else {
            c.fillStyle = col; c.fillRect(x + 100, yy, 180, v * U - 2);
            chip(n, x + 330, yy + v * U / 2, 30);
          }
        });
        h += v * p;
      });
      if (o.ghost) alpha(o.ghost, () => { const yy = y - (28 + 4) * U; c.setLineDash([8, 8]); c.strokeStyle = RED; c.lineWidth = 4; c.strokeRect(x + 100, yy, 180, 4 * U); c.setLineDash([]); chip('lanterne', x + 330, yy + 2 * U, 30, { ring: RED }); });
    });
  }
  function wind(t, a) { alpha(a, () => { c.strokeStyle = 'rgba(120,140,150,.7)'; c.lineWidth = 6; c.lineCap = 'round'; for (let i = 0; i < 7; i++) { const x = ((t * 900 + i * 380) % 2400) - 300, y = 180 + i * 90; c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + 90, y - 30, x + 180, y); c.stroke(); } }); }
  const walk = (t, a, d) => { const p = prog(t, a, d); return [p, p > 0 && p < 1 ? t * 9 : 0]; };

  const scenes = [
    {
      id: 'projet', title: 'Le projet de cabane', phase: 'Interrogation initiale', lead: .6, tail: 1.4,
      lines: [
        { id: 'N1', who: 'narr', text: "Grand jour au Village des Trois Moulins : les enfants vont construire une cabane d'observation, pour regarder les oiseaux et les renards de la forêt.", pad: .8 },
        { id: 'N2', who: 'narr', text: "Chacun a apporté sa réserve d'entraide. Tous ensemble, ils réunissent trente jetons.", pad: 2 },
        { id: 'S1', who: 'sacha', text: 'Trente jetons ! On va faire la plus belle cabane du monde, avec des fanions, une lanterne, une balançoire…', pad: .4 },
        { id: 'M1', who: 'milo', text: "Doucement, Sacha. D'abord, il faut qu'elle tienne debout.", pad: .4 },
        { id: 'NY0', who: 'naya', text: "Avant d'acheter quoi que ce soit, on fait un plan. Sur le papier, les erreurs ne coûtent rien.", pad: .6 },
        { id: 'N3', who: 'narr', text: "Comment construire une cabane solide, belle… et qui ne coûte pas plus que ce qu'on a ?", pad: 1.2 },
      ],
      draw(t, L) {
        sky({ mills: false }); foret();
        cabane(1150, 0, { sketch: prog(t, L.N1.s + 2, 1) });
        oiseau(1300, 250, 26, 1); oiseau(1380, 300, 20, 1);
        actor('naya', 260, GROUND + 40, 330);
        actor('milo', 440, GROUND + 40, 285);
        const s = actor('sacha', 620, GROUND + 40, 270, { up: t > L.S1.s && t < L.S1.e });
        const g = lin(t, L.N2.s + 1.5, 2.5);
        for (let i = 0; i < 30; i++) { const q = clamp(g * 2 - i * .033); if (q > 0) token(lerp(440 + (i % 3 - 1) * 180, 300 + (i % 10) * 58, ease(q)), lerp(GROUND - 200, 150 + Math.floor(i / 10) * 60, ease(q)) - Math.sin(q * Math.PI) * 60, 22); }
        bigText('30', 900, 210, 70, CLAY, prog(t, L.N2.s + 4.2, .4), 700);
        const b = win(t, L.S1.s + .5, L.S1.e + .2, .35);
        bubble(620, s.top - 150, 380, 170, 620, s.top - 12, b);
        item('fanions', 520, s.top - 150, 50, b); item('lanterne', 640, s.top - 150, 40, b); chip('etoile', 740, s.top - 150, 32, { a: b });
        bigText('?', 1150, 330, 110, CLAY, prog(t, L.N3.s + .4, .5), 700);
      },
    },
    {
      id: 'tableau', title: 'Le budget de Milo', phase: 'Mise en situation', lead: .4, tail: 1.6,
      lines: [
        { id: 'NY1', who: 'naya', text: 'Milo, tu veux bien dessiner notre budget ?', pad: .4 },
        { id: 'M2', who: 'milo', text: "Dans la première colonne, ce qu'on a : trente jetons. Dans la deuxième, ce qui est obligatoire pour que la cabane soit solide et sûre.", pad: .8 },
        { id: 'N4', who: 'narr', text: "Des vis pour la structure : six jetons. Une toile étanche pour le toit : huit jetons. Des poulies pour hisser les planches : six jetons.", pad: 1.2 },
        { id: 'M3', who: 'milo', text: "Vingt jetons d'obligatoire. Et je garde cinq jetons de côté, en réserve de secours, au cas où quelque chose tournerait mal.", pad: .8 },
        { id: 'S2', who: 'sacha', text: 'Et la décoration, alors ? Il reste cinq jetons !', pad: .2 },
        { id: 'M4', who: 'milo', text: "La décoration, ça ne sert à rien. On devrait tout garder.", pad: .4 },
        { id: 'NY2', who: 'naya', text: "Milo, une cabane, c'est aussi un endroit où l'on a envie de venir. Sacha, qu'est-ce qui te ferait le plus plaisir ?", pad: .4 },
        { id: 'S3', who: 'sacha', text: 'Des fanions de toutes les couleurs, pour trois jetons ! Et la lanterne… elle en coûte quatre.', pad: 1.4 },
        { id: 'N5', who: 'narr', text: 'Les blocs de dépenses montent… mais la pile ne doit jamais dépasser la hauteur des ressources. La lanterne attendra.', pad: 1.4 },
      ],
      draw(t, L) {
        paper();
        c.fillStyle = '#B98552'; rr(560, 60, 1060, 880, 26); c.fill(); c.fillStyle = '#F4F0E8'; rr(590, 90, 1000, 820, 18); c.fill();
        const n4 = L.N4, d = (n4.e - n4.s - 1.2) / 3;
        const postes = [prog(t, n4.s + .5, .6), prog(t, n4.s + d + .5, .6), prog(t, n4.s + 2 * d + .5, .6), prog(t, L.M3.s + 3, .6), prog(t, L.S3.s + 1.2, .6)];
        budget(1090, 760, { res: prog(t, L.M2.s + 1, 1.5), postes, ghost: win(t, L.S3.s + 3.5, L.N5.e, .4) });
        cross(1420, 760 - 30 * U - 30, 30, win(t, L.N5.s + 3, L.N5.e, .3));
        actor('milo', 380, GROUND + 60, 300, { reach: t > L.M2.s && t < L.M3.e });
        actor('sacha', 1760, GROUND + 60, 280, { face: -1 });
        actor('naya', 190, GROUND + 60, 330);
      },
    },
    {
      id: 'chantier', title: 'Le chantier', phase: 'Mise en situation', lead: .4, tail: 1.6,
      lines: [
        { id: 'N6', who: 'narr', text: "Le chantier commence. Chacun fait ce qu'il sait faire : Naya visse la structure, Sacha hisse les planches avec les poulies, Milo vérifie le plan.", pad: 1.4 },
        { id: 'S5', who: 'sacha', text: 'Oh hisse ! Avec la poulie, les planches ne pèsent presque rien !', pad: .6 },
        { id: 'NY6a', who: 'naya', text: 'Une vis de plus ici… Voilà, le plancher est solide.', pad: .6 },
        { id: 'NY6', who: 'naya', text: "Milo, la prochaine planche va où ?", pad: .2 },
        { id: 'M5b', who: 'milo', text: "Côté gauche, juste au-dessus de la poutre. Et on a encore tous les jetons de la réserve.", pad: 1.4 },
        { id: 'N6b', who: 'narr', text: 'Jour après jour, la cabane prend forme : le plancher, les murs, puis la grande toile bleue du toit.', pad: 2 },
      ],
      draw(t, L) {
        sky({ mills: false }); foret();
        const p = prog(t, 0, L.N6b.e - .5);
        const cb = cabane(1000, p * .9);
        for (let i = 0; i < 5; i++) { const q = (t * 1.3 + rnd(i)) % 1; sparkle(820 + (rnd(i + 2) - .5) * 60, cb.floorY - 30 - q * 60, 10 * (1 - q), 1 - q); }
        const pulley = [1330, cb.floorY - 260];
        item('poulie', pulley[0], pulley[1], 50);
        c.strokeStyle = '#B98552'; c.lineWidth = 4; line(pulley[0] - 28, pulley[1], 1480, GROUND - 170); const hy = lerp(GROUND - 40, cb.floorY - 60, (t * .25) % 1); line(pulley[0] + 28, pulley[1], pulley[0] + 28, hy);
        item('planche', pulley[0] + 28, hy + 10, 36);
        actor('sacha', 1500, GROUND + 40, 270, { face: -1, up: true });
        const up = p * .9 > .55;
        actor('naya', up ? 820 : 640, up ? cb.floorY - 4 : GROUND + 40, 300, { reach: true });
        const m = actor('milo', 420, GROUND + 40, 285, { reach: true });
        c.fillStyle = '#EAF3F7'; rr(m.hx - 10, m.hy - 70, 110, 80, 6); c.fill(); c.strokeStyle = '#3C7DD9'; c.lineWidth = 3; rr(m.hx + 8, m.hy - 55, 70, 40, 3); c.stroke();
      },
    },
    {
      id: 'rafale', title: 'La rafale', phase: 'Mise en situation', lead: .4, tail: 1.6,
      lines: [
        { id: 'N7', who: 'narr', text: 'Mais un soir, une rafale de vent souffle sur la forêt… Crac ! La poutre principale se brise.', pad: 1.4 },
        { id: 'S4', who: 'sacha', text: 'Oh non ! Sans poutre, la cabane ne tient plus. Tout est fichu !', pad: .4 },
        { id: 'M5', who: 'milo', text: "Pas de panique. Une poutre neuve coûte cinq jetons. Et on a exactement… notre réserve de secours !", pad: .8 },
        { id: 'N8', who: 'narr', text: 'Les cinq jetons de secours paient une poutre neuve. Le lendemain, le chantier reprend, sans rien retirer au reste du budget.', pad: 2 },
        { id: 'NY7', who: 'naya', text: "Cette réserve n'a servi à rien pendant des jours… jusqu'au soir où elle a tout sauvé.", pad: .4 },
        { id: 'S7', who: 'sacha', text: 'Je comprends pourquoi Milo y tenait autant !', pad: .2 },
        { id: 'M7', who: 'milo', text: 'Et moi, je comprends pourquoi les fanions comptaient autant pour toi.', pad: 1 },
      ],
      draw(t, L) {
        const fixed = t > L.N8.s + 3.5;
        sky({ mills: false, dusk: fixed ? .2 : .6 }); foret();
        const crack = t > L.N7.s + 3.2;
        const storm = win(t, L.N7.s + .3, L.M5.s + 2, .8);
        alpha(storm * .5, () => { c.fillStyle = '#2B3346'; c.fillRect(0, 0, W, H); });
        wind(t, win(t, L.N7.s + .5, L.N7.s + 5, .6));
        Moteur.rain(storm);
        const boom = L.N7.s + 3.2;
        Moteur.lightning(1180, t > boom - .15 && t < boom + .25 ? 1 : 0);
        Moteur.flash(t > boom - .1 && t < boom + .2 ? .7 * (1 - (t - boom + .1) / .3) : 0);
        if (t > boom && t < boom + .7) Moteur.shake(16 * (1 - (t - boom) / .7));
        burst(1000, GROUND - 170, clamp((t - boom) / .9), 90, '#FFB0A8');
        cabane(1000, .9, { broken: crack && !fixed, newBeam: fixed });
        actor('sacha', 520, GROUND + 40, 270, { up: t > L.S4.s && t < L.S4.e });
        actor('milo', 330, GROUND + 40, 285);
        actor('naya', 160, GROUND + 40, 330);
        alpha(prog(t, L.M5.s + .5, .6), () => {
          panel(1330, 50, 560, 560);
          c.save(); c.translate(1590, 520); c.scale(.66, .66); c.translate(-1090, -760);
          budget(1090, 760, { used: lin(t, L.N8.s + .8, 2.4) });
          c.restore();
        });
        fly('poutre', 1600, 400, 1000, 700, lin(t, L.N8.s + 2.6, 1.2), 60, 100);
      },
    },
    {
      id: 'fin', title: 'La cabane terminée', phase: 'Formalisation', lead: .4, tail: 1.6,
      lines: [
        { id: 'N9', who: 'narr', text: 'La cabane est terminée ! Solide, étanche, décorée de fanions… et payée sans dépasser les trente jetons.', pad: 1.2 },
        { id: 'N10', who: 'narr', text: 'Le soir venu, tout le village vient visiter la cabane. Du haut de la plateforme, on voit enfin les renards sortir de la forêt.', pad: 1.2 },
        { id: 'NY3', who: 'naya', text: "Vous avez tout utilisé : la monnaie pour échanger, le travail pour gagner des jetons, les boîtes verte et rouge pour choisir…", pad: .4 },
        { id: 'NY4', who: 'naya', text: "…le choix invisible, la patience des bocaux, la prudence avec la carte. Et un budget, avec une réserve pour les imprévus.", pad: 1 },
        { id: 'M6', who: 'milo', text: 'Et la lanterne ? On pourrait en faire notre prochain projet, dans un nouveau bocal !', pad: .4 },
        { id: 'S6', who: 'sacha', text: "Et cette fois, c'est moi qui compte les semaines !", pad: 1 },
      ],
      draw(t, L) {
        sky({ mills: false }); foret();
        Moteur.rays(1000, GROUND - 330, 700, prog(t, 0, 1.5) * .5);
        cabane(1000, 1, { flags: 1 });
        for (let i = 0; i < 4; i++) { const t0 = L.N9.s + .5 + i * 1.3 + (i > 1 ? 2 : 0), q = clamp((t - t0) / 1.2); const fx = 500 + i * 330, fy = 180 + rnd(i) * 120; if (q > 0 && q < .35) sparkle(fx, lerp(900, fy, q / .35), 10, 1); burst(fx, fy, clamp((q - .35) / .65), 120, ['#F4C542', '#E8589A', '#3C7DD9', '#6CC4A1'][i]); }
        Moteur.confetti(t, win(t, L.N9.s, L.N10.e, .6) * .9, 70);
        [[1250, 200], [1340, 250], [760, 180]].forEach(([x, y], i) => oiseau(x + Math.sin(t + i) * 30, y + Math.cos(t * 1.3 + i) * 10, 24, 1));
        actor('sacha', 1480, GROUND + 40, 270, { face: -1, up: t < L.N9.e });
        actor('milo', 1640, GROUND + 40, 285, { face: -1 });
        actor('naya', 1800, GROUND + 40, 330, { face: -1 });
        const icons = ['jeton', 'muscle', 'trousse', 'cerfvolant', 'engrenage', 'carte', 'toile'];
        icons.forEach((n, i) => {
          const a = i < 3 ? prog(t, L.NY3.s + 1.5 + i * 2, .5) : prog(t, L.NY4.s + .5 + (i - 3) * 2, .5);
          chip(n, 240 + i * 130, 150, 50, { a, ring: i === 6 ? GREEN : '#CBD2C8' });
        });
        const lan = prog(t, L.M6.s + 1, .6);
        alpha(lan, () => { bubble(1640, 470, 200, 150, 1640, 560, 1); item('lanterne', 1640, 470, 44); });
      },
    },
    {
      id: 'question', title: 'Ton projet en famille', phase: 'Question ouverte', lead: .5, tail: 2,
      lines: [
        { id: 'NY5', who: 'naya', text: 'À toi, maintenant ! Avec ta famille, choisis un petit projet : un pique-nique, une sortie, un cadeau.', pad: 1 },
        { id: 'NY6', who: 'naya', text: "Fais la liste de ce qui est obligatoire, de ce qui fait plaisir… et n'oublie pas une petite réserve pour les imprévus !", pad: 1.4 },
      ],
      draw(t, L) {
        sky({ mills: false }); foret();
        actor('naya', 960, GROUND + 40, 360);
        [['panier', 480, 330], ['maison', 480, 540], ['paquet', 1440, 330]].forEach(([n, x, y], i) => chip(n, x, y, 72, { a: prog(t, L.NY5.s + 2 + i * .8, .5) }));
        const q = prog(t, L.NY6.s + .8, .6);
        alpha(q, () => { panel(1300, 470, 300, 260); [[GREEN, 'Obligatoire'], ['#E8589A', 'Plaisir'], [GREEN, 'Réserve']].forEach(([col, lab], i) => { c.fillStyle = col; if (i === 2) { c.globalAlpha *= .35; } rr(1330, 500 + i * 76, 60, 56, 8); c.fill(); c.globalAlpha = q; check(1470, 528 + i * 76, 22, prog(t, L.NY6.s + 2 + i * 1.2, .4)); }); });
      },
    },
  ];

  Moteur.episode({
    numero: 7,
    titre: 'Le Grand Chantier de la Cabane',
    notion: 'Budget global, aléas et coopération',
    objectif: 'Élaborer et piloter un budget équilibré intégrant des imprévus.',
    cible: '6 min 00 s',
    dispositif: "Le budget en blocs superposés : la pile des dépenses ne dépasse jamais la hauteur des ressources, et le bloc de secours remplace la poutre brisée.",
    suivant: null,
    generique: ['milo', 'sacha', 'naya'],
    scenes,
  });
})();
