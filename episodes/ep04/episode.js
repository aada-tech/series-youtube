// Épisode 4 · L'Aventure du Choix Invisible
(() => {
  const { c, W, H, GROUND, INK, RED, GREEN, CLAY, PAPER, CAST, clamp, lerp, ease, prog, lin, win, rr, circ, ell, line, poly, alpha,
    person, actor, item, token, tokens, sky, paper, shop, bubble, cross, check, arrow, glow, bigText, panel, chip, node, fly, flyTokens } = Moteur;

  // Balance à deux plateaux. tilt > 0 fait descendre le plateau de gauche.
  function balance(x, py, tilt, left, right) {
    c.fillStyle = '#8A6A4A'; rr(x - 140, 930, 280, 40, 14); c.fill();
    c.fillStyle = '#A8733F'; rr(x - 16, py, 32, 930 - py, 10); c.fill();
    const a = -tilt * .22, L = 380;
    const ends = [-1, 1].map(sd => [x + sd * L * Math.cos(a), py + sd * L * Math.sin(a)]);
    c.strokeStyle = '#7A5230'; c.lineWidth = 22; c.lineCap = 'round'; line(ends[0][0], ends[0][1], ends[1][0], ends[1][1]);
    c.fillStyle = '#C9A43A'; circ(x, py, 22); c.fill();
    [left, right].forEach((pl, i) => {
      const [ex, ey] = ends[i], pyy = ey + 230;
      c.strokeStyle = '#9AA3A8'; c.lineWidth = 4; line(ex, ey, ex - 120, pyy); line(ex, ey, ex + 120, pyy);
      c.fillStyle = '#C9A43A'; c.beginPath(); c.ellipse(ex, pyy, 150, 34, 0, 0, Math.PI); c.fill();
      c.fillStyle = '#E2BD4E'; ell(ex, pyy, 150, 16); c.fill();
      alpha(pl.a, () => { item(pl.item, ex, pyy - 70, 70); });
      if (pl.ghost > 0) alpha(pl.ghost, () => { c.setLineDash([10, 10]); c.strokeStyle = '#9AA3A8'; c.lineWidth = 4; circ(ex, pyy - 70, 90); c.stroke(); c.setLineDash([]); });
      for (let k = 0; k < (pl.tokens || 0); k++) token(ex - 80 + k * 40, pyy - 12, 18);
    });
    return ends.map(([ex, ey]) => [ex, ey + 218]);
  }
  function tableau(x, y, a) { // petite toile peinte (la montagne de la randonnée)
    alpha(a, () => {
      c.fillStyle = '#8A5A2E'; rr(x - 110, y - 80, 220, 160, 8); c.fill();
      c.fillStyle = '#EAF3F7'; c.fillRect(x - 96, y - 66, 192, 132);
      c.fillStyle = '#AFC3CF'; poly([[x - 96, y + 50], [x - 20, y - 40], [x + 30, y + 10], [x + 60, y - 20], [x + 96, y + 50]]); c.fill();
      c.fillStyle = '#F4F8FA'; poly([[x - 35, y - 22], [x - 20, y - 40], [x - 5, y - 22]]); c.fill();
      c.fillStyle = '#C3D9AE'; c.fillRect(x - 96, y + 40, 192, 26);
    });
  }
  const walk = (t, a, d) => { const p = prog(t, a, d); return [p, p > 0 && p < 1 ? t * 9 : 0]; };

  const scenes = [
    {
      id: 'pecule', title: 'Cinq jetons', phase: 'Interrogation initiale', lead: .6, tail: 1.2,
      lines: [
        { id: 'N1', who: 'narr', text: 'Sacha a aidé au potager toute la semaine. Pour son travail, la maraîchère lui donne cinq jetons.', pad: 1.4 },
        { id: 'S1', who: 'sacha', text: 'Cinq jetons, rien qu\'à moi ! Je les ai bien gagnés.', pad: .4 },
        { id: 'MA1', who: 'maraichere', text: 'Merci pour ton aide, Sacha. Mes salades n\'ont jamais été aussi belles !', pad: .4 },
        { id: 'M0', who: 'milo', text: 'Cinq jetons… Moi, je les rangerais tout de suite dans ma boîte, bien à l\'abri.', pad: .4 },
        { id: 'S1b', who: 'sacha', text: 'Pas moi ! Je vais trouver quelque chose de génial au marché.', pad: .6 },
        { id: 'N2', who: 'narr', text: "Le jour même, au marché, l'artisan nomade vient d'installer son étal.", pad: .8 },
      ],
      draw(t, L) {
        sky();
        for (let r = 0; r < 2; r++) for (let x = 1100 + r * 30; x < 1850; x += 110) item('salade', x, GROUND + 40 + r * 60, 30);
        const m = actor('maraichere', 1200, GROUND + 20, 380, { face: -1, reach: t > L.N1.s + 2 && t < L.N1.s + 5 });
        const s = actor('sacha', 800, GROUND + 40, 270, { up: t > L.S1.s && t < L.S1.e });
        actor('milo', 560, GROUND + 40, 285);
        flyTokens(5, m.hx, m.hy, 800, GROUND - 330, lin(t, L.N1.s + 2.4, 2), 18, 120);
        if (t > L.N1.s + 4.6) tokens(5, 800, GROUND - 330, 18, { gap: 42 });
      },
    },
    {
      id: 'etal', title: "L'étal de l'artisan", phase: 'Mise en situation', lead: .4, tail: 1.4,
      lines: [
        { id: 'N3', who: 'narr', text: 'Deux objets attirent son regard : un coffret de pinceaux pour peindre, et un cerf-volant pour les jours de grand vent. Chacun coûte cinq jetons.', pad: 1 },
        { id: 'AN2', who: 'marchand', text: 'Ces pinceaux viennent de la ville des peintres, et ce cerf-volant a traversé trois vallées avant d\'arriver ici !', pad: .6 },
        { id: 'S2', who: 'sacha', text: 'Je veux les deux ! Vous pouvez me faire une avance ? Ou alors je prends le coffret maintenant, et le cerf-volant tout de suite après !', pad: .4 },
        { id: 'AN1', who: 'marchand', text: "Une avance ? Je repars demain matin, mon garçon. Ici, on paie ce que l'on achète.", pad: .4 },
        { id: 'M1', who: 'milo', text: 'Sacha, compte tes jetons. Tu en as cinq. Le coffret en coûte cinq. Il t\'en restera combien ?', pad: .6 },
        { id: 'S3', who: 'sacha', text: 'Euh… zéro.', pad: .8 },
        { id: 'M2', who: 'milo', text: 'Avec zéro jeton, pas de cerf-volant. Tes jetons ne peuvent pas servir deux fois.', pad: .8 },
      ],
      draw(t, L) {
        sky();
        const top = shop(1300, 1.25, '#2E8C8C', 'marchand');
        item('pinceaux', 1190, top - 50, 58); item('cerfvolant', 1420, top - 70, 58);
        tokens(5, 1190, top + 70, 12, { gap: 22 }); tokens(5, 1420, top + 70, 12, { gap: 22 });
        glow(1190, top - 50, 120, win(t, L.N3.s + 1.5, L.N3.s + 5, .4)); glow(1420, top - 60, 120, win(t, L.N3.s + 4.5, L.N3.e, .4));
        actor('milo', 380, GROUND + 40, 285, { reach: t > L.M1.s && t < L.M2.e });
        const s = actor('sacha', 640, GROUND + 40, 270, { up: t > L.S2.s && t < L.S2.e });
        const b = win(t, L.S2.s + .3, L.S2.e, .35);
        bubble(640, s.top - 130, 360, 170, 640, s.top - 12, b);
        item('pinceaux', 560, s.top - 130, 40, b); item('cerfvolant', 720, s.top - 140, 40, b);
        // Compter : les cinq jetons vont sur le prix du coffret.
        const k = lin(t, L.M1.s + 3.5, 2);
        const mine = t < L.M1.s + 3.5 ? 5 : 0;
        if (t > L.N3.s && mine) tokens(5, 640, s.top - 40, 16, { gap: 36 });
        if (k > 0 && k < 1) flyTokens(5, 640, s.top - 40, 1190, top - 130, k, 16, 60);
        if (k >= 1) { tokens(5, 1190, top - 130, 14, { gap: 30 }); bigText('0', 640, s.top - 40, 70, CLAY, 1, 700); }
        cross(1420, top - 70, 70, prog(t, L.M2.s + .6, .4));
      },
    },
    {
      id: 'balance', title: 'Le choix invisible', phase: 'Formalisation', lead: .4, tail: 1.4,
      lines: [
        { id: 'NY1', who: 'naya', text: "Tu vois, Sacha, chaque fois qu'on choisit quelque chose, on renonce à autre chose. C'est ce que j'appelle le choix invisible.", pad: .6 },
        { id: 'S5', who: 'sacha', text: 'Un choix invisible ? Mais je ne vois rien du tout !', pad: .4 },
        { id: 'NY1b', who: 'naya', text: 'Justement. Regarde bien cette balance.', pad: 1 },
        { id: 'NY2', who: 'naya', text: 'Si tu poses tes cinq jetons sur les pinceaux… le cerf-volant disparaît. Ce que tu laisses de côté, c\'est le vrai prix de ton choix.', pad: 2.2 },
        { id: 'NY3', who: 'naya', text: 'Et si tu les poses sur le cerf-volant, ce sont les pinceaux qui s\'effacent.', pad: 2.2 },
        { id: 'M3b', who: 'milo', text: "On ne peut jamais garder les deux plateaux pleins en même temps.", pad: .6 },
        { id: 'NY4', who: 'naya', text: 'Alors, prends ton temps. Lequel compte le plus pour toi ?', pad: 1.2 },
      ],
      draw(t, L) {
        paper();
        const a = prog(t, L.NY2.s + 2, 1), back = prog(t, L.NY3.s, 1), b = prog(t, L.NY3.s + 1.2, 1), reset = prog(t, L.M3b.e, 1);
        const onLeft = a * (1 - back) * (1 - reset), onRight = b * (1 - reset);
        const tilt = onLeft - onRight;
        const fadeKite = prog(t, L.NY2.s + 3.2, 2) * (1 - back), fadeBrush = prog(t, L.NY3.s + 2.4, 2) * (1 - reset);
        const pl = balance(960, 330, tilt,
          { item: 'pinceaux', a: 1 - fadeBrush, ghost: fadeBrush, tokens: onLeft >= .99 ? 5 : 0 },
          { item: 'cerfvolant', a: 1 - fadeKite, ghost: fadeKite, tokens: onRight >= .99 ? 5 : 0 });
        const mid = [960, 190];
        const moving = (p, dst) => { if (p > 0 && p < 1) for (let k = 0; k < 5; k++) token(lerp(mid[0] - 80 + k * 40, dst[0] - 80 + k * 40, ease(p)), lerp(mid[1], dst[1] - 12, ease(p)), 18); };
        if (onLeft < .01 && onRight < .01) for (let k = 0; k < 5; k++) token(mid[0] - 80 + k * 40, mid[1], 18);
        moving(a < 1 && back === 0 ? a : 0, pl[0]);
        moving(b < 1 && reset === 0 ? b : 0, pl[1]);
        bigText('?', 960, 90, 90, CLAY, prog(t, L.NY4.s + .5, .5), 700);
        node('sacha', 190, 860, 80, { a: 1 });
        node('naya', 1730, 860, 80, { a: 1 });
      },
    },
    {
      id: 'choix', title: 'Sacha choisit', phase: 'Formalisation', lead: .4, tail: 1.4,
      lines: [
        { id: 'S4', who: 'sacha', text: "Je crois que… j'ai vraiment envie de peindre la montagne de notre randonnée. Je prends les pinceaux.", pad: 1.6 },
        { id: 'N4', who: 'narr', text: 'Sacha a choisi. Et il sait exactement ce qu\'il a laissé de côté : le cerf-volant.', pad: .8 },
        { id: 'S6', who: 'sacha', text: "Je suis un peu triste pour le cerf-volant… mais je suis content de mon choix.", pad: .8 },
        { id: 'M3', who: 'milo', text: 'Le cerf-volant, tu pourras peut-être l\'acheter plus tard, si tu gagnes d\'autres jetons.', pad: .6 },
        { id: 'N5', who: 'narr', text: 'Choisir, c\'est renoncer. Chaque jeton ne peut être dépensé qu\'une seule fois.', pad: 1 },
      ],
      draw(t, L) {
        sky();
        const top = shop(1400, 1.1, '#2E8C8C', 'marchand');
        const bought = t > L.S4.e - .6;
        if (!bought) item('pinceaux', 1300, top - 50, 50);
        item('cerfvolant', 1500, top - 60, 50, bought ? .35 : 1);
        const s = actor('sacha', 760, GROUND + 40, 280, { reach: bought && t < L.N4.e });
        const th = win(t, L.S4.s, L.S4.e - .8, .4);
        bubble(760, s.top - 150, 420, 210, 760, s.top - 12, th);
        const sw = (t - L.S4.s) % 3 < 1.5;
        tableau(760, s.top - 150, th * (sw ? 1 : 0)); alpha(th * (sw ? 0 : 1), () => item('cerfvolant', 760, s.top - 160, 60));
        flyTokens(5, s.hx, s.hy, 1330, top - 120, lin(t, L.S4.e - 1.4, 1.4), 16, 80);
        fly('pinceaux', 1300, top - 50, s.hx + 20, s.hy - 20, lin(t, L.S4.e - .6, 1), 50, 60);
        if (t > L.S4.e + .4) item('pinceaux', s.hx + 20, s.hy - 20, 44);
        actor('milo', 520, GROUND + 40, 285);
        glow(1500, top - 60, 140, win(t, L.N4.s + 3, L.N4.e, .4) * .6);
        tableau(360, 320, prog(t, L.N5.s, .8));
      },
    },
    {
      id: 'question', title: 'Ton choix invisible', phase: 'Question ouverte', lead: .5, tail: 2,
      lines: [
        { id: 'NY5', who: 'naya', text: "À toi, maintenant ! Souviens-toi d'un choix que tu as fait récemment : un jouet, un goûter, une activité.", pad: 1 },
        { id: 'NY6', who: 'naya', text: "Qu'as-tu laissé de côté ce jour-là ? C'était ton choix invisible.", pad: 1.2 },
        { id: 'NY7', who: 'naya', text: "Il n'y a pas de bon ou de mauvais choix. Il y a ce qui compte le plus pour toi, ce jour-là.", pad: 1.2 },
      ],
      draw(t, L) {
        sky();
        actor('naya', 960, GROUND + 40, 360);
        [['figurine', 440, 300], ['pain', 440, 520], ['cerfvolant', 1480, 300]].forEach(([n, x, y], i) => chip(n, x, y, 72, { a: prog(t, L.NY5.s + 2 + i * .8, .5) }));
        const g = prog(t, L.NY6.s + 1, .6);
        alpha(g, () => { c.setLineDash([12, 10]); c.strokeStyle = '#9AA3A8'; c.lineWidth = 5; circ(1480, 520, 72); c.stroke(); c.setLineDash([]); bigText('?', 1480, 522, 70, '#9AA3A8', 1, 700); });
      },
    },
  ];

  Moteur.episode({
    numero: 4,
    titre: "L'Aventure du Choix Invisible",
    notion: "Notion de rareté et coût d'opportunité",
    objectif: "Intégrer que choisir un bien implique d'en abandonner un autre.",
    cible: '4 min 15 s',
    dispositif: "Une balance à deux plateaux : dès que les cinq jetons se posent d'un côté, l'objet d'en face s'estompe jusqu'à disparaître.",
    suivant: 'Épisode 5 · Le Pouvoir de la Patience',
    generique: ['milo', 'sacha', 'naya'],
    scenes,
  });
})();
