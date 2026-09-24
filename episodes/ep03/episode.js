// Épisode 3 · La Boîte Rouge et la Boîte Verte
(() => {
  const { c, W, H, GROUND, INK, RED, GREEN, CLAY, PAPER, CAST, clamp, lerp, ease, prog, lin, win, rr, circ, ell, line, poly, alpha,
    person, actor, item, token, tokens, sky, paper, stall, bubble, cross, check, arrow, glow, bigText, panel, chip, node, fly, flyTokens, FD ,
    sparkle, burst, pop, rnd, rays } = Moteur;

  // Six articles du marché : trois besoins (boîte verte), trois envies (boîte rouge).
  const NEEDS = [['eau', 2], ['galettes', 3], ['trousse', 3]];
  const WANTS = [['toupie', 3], ['bonbons', 2], ['longuevue', 5]];
  const ALL = [...NEEDS, ...WANTS];

  function table(x0, x1, who, o = {}) {
    const top = GROUND - 190;
    c.fillStyle = '#8A5A2E'; c.fillRect(x0 + 20, GROUND - 520, 16, 520 - 190); c.fillRect(x1 - 36, GROUND - 520, 16, 520 - 190);
    const n = 10, sw = (x1 - x0) / n;
    for (let i = 0; i < n; i++) { c.fillStyle = i % 2 ? '#FBF8F1' : '#C2577A'; c.fillRect(x0 + i * sw, GROUND - 560, sw + .5, 56); circ(x0 + (i + .5) * sw, GROUND - 504, sw / 2); c.fill(); }
    if (who) actor(who, (x0 + x1) / 2 + 40, GROUND - 8, 470, { face: -1 });
    c.fillStyle = '#C89A67'; rr(x0, top, x1 - x0, 190, 8); c.fill();
    c.fillStyle = '#A87B4E'; rr(x0 - 12, top - 14, x1 - x0 + 24, 26, 8); c.fill();
    return top - 14;
  }
  // Boîte ouverte colorée (vue de face).
  function box(x, y, col, items, a = 1, hl = 0) {
    alpha(a, () => {
      if (hl) glow(x, y - 60, 260, hl);
      c.fillStyle = col; poly([[x - 190, y - 130], [x + 190, y - 130], [x + 160, y + 60], [x - 160, y + 60]]); c.fill();
      items.forEach(([n, p], i) => item(n, x - 110 + i * 110, y - 150 + (p ? 0 : 0), 44));
      c.fillStyle = col; poly([[x - 200, y - 110], [x + 200, y - 110], [x + 170, y + 70], [x - 170, y + 70]]); c.fill();
      c.fillStyle = 'rgba(255,255,255,.18)'; poly([[x - 200, y - 110], [x + 200, y - 110], [x + 195, y - 80], [x - 195, y - 80]]); c.fill();
    });
  }
  function priceTag(n, x, y, a = 1) { alpha(a, () => tokens(n, x, y, 12, { gap: 22 })); }
  function warn(x, y, r, a) {
    alpha(a, () => {
      c.fillStyle = '#F4A43C'; c.lineJoin = 'round'; c.strokeStyle = '#F4A43C'; c.lineWidth = r * .2;
      poly([[x, y - r], [x + r * 1.05, y + r * .75], [x - r * 1.05, y + r * .75]]); c.fill(); c.stroke();
      bigText('!', x, y + r * .05, r * 1.3, '#FFFFFF', 1, 700);
    });
  }
  const walk = (t, a, d) => { const p = prog(t, a, d); return [p, p > 0 && p < 1 ? t * 9 : 0]; };

  const scenes = [
    {
      id: 'depart', title: 'Préparer la randonnée', phase: 'Interrogation initiale', lead: .6, tail: 1.4,
      lines: [
        { id: 'N1', who: 'narr', text: "Demain, l'équipe part en randonnée dans la montagne. Une grande marche, du matin jusqu'au soir.", pad: .6 },
        { id: 'NY1', who: 'naya', text: 'Voici dix jetons pour préparer le ravitaillement. Choisissez bien : c\'est tout ce que nous avons.', pad: 1.4 },
        { id: 'S0', who: 'sacha', text: 'Dix jetons ! On est riches !', pad: .4 },
        { id: 'M0', who: 'milo', text: 'Dix jetons pour toute une journée de marche… Il va falloir compter.', pad: .4 },
        { id: 'N2', who: 'narr', text: 'Mais comment choisir, quand tout fait envie ?', pad: 1 },
      ],
      draw(t, L) {
        sky({ mountains: true, mills: false });
        actor('naya', 1250, GROUND + 40, 330, { face: -1, reach: t > L.NY1.s && t < L.NY1.e });
        actor('milo', 820, GROUND + 40, 285);
        actor('sacha', 640, GROUND + 40, 270);
        const g = lin(t, L.NY1.s + 1.2, 1.8);
        for (let i = 0; i < 10; i++) {
          const q = clamp(g * 1.8 - i * .08);
          if (q > 0) token(lerp(1200, 560 + i * 60, ease(q)), lerp(GROUND - 200, 300, ease(q)) - Math.sin(q * Math.PI) * 80, 24, 1, 1, q < 1 ? Math.cos(q * Math.PI * 4) : 1);
          if (q > 0 && q < 1) sparkle(lerp(1200, 560 + i * 60, ease(q)), lerp(GROUND - 200, 300, ease(q)) - Math.sin(q * Math.PI) * 80 + 30, 10, .7);
        }
        bigText('?', 960, 170, 110, CLAY, prog(t, L.N2.s + .3, .5), 700);
      },
    },
    {
      id: 'marche', title: 'Au marché', phase: 'Mise en situation', lead: .4, tail: 1.4,
      lines: [
        { id: 'E1', who: 'epiciere', text: 'Bonjour les enfants ! Tout est à vendre. Le prix est indiqué sous chaque article.', pad: .6 },
        { id: 'S1', who: 'sacha', text: "Regarde, Milo ! Une toupie qui s'allume, des bonbons acidulés, et une longue-vue en cuivre ! Avec dix jetons, on prend tout ça !", pad: .4 },
        { id: 'M1', who: 'milo', text: "Non ! Pour la marche, il nous faut de l'eau, des galettes pour l'énergie, et une trousse de secours si quelqu'un se blesse.", pad: .4 },
        { id: 'S2', who: 'sacha', text: "Mais c'est beaucoup moins amusant !", pad: .2 },
        { id: 'M1b', who: 'milo', text: "Amusant, peut-être. Mais en haut de la montagne, ta toupie ne te donnera pas à boire !", pad: .4 },
        { id: 'N3', who: 'narr', text: 'Le ton monte entre les deux garçons. Naya a une idée pour trancher, sans se fâcher.', pad: 1 },
      ],
      draw(t, L) {
        sky({ mountains: true, mills: false });
        const top = table(760, 1800, 'epiciere');
        ALL.forEach(([n, p], i) => {
          const x = 850 + i * 170;
          const hs = (i >= 3 && t > L.S1.s + .5 && t < L.S2.e) ? 1 : (i < 3 && t > L.M1.s + .5 && t < L.M1b.e) ? 1 : 0;
          glow(x, top - 50, 110, hs);
          if (hs) sparkle(x + 40 * Math.sin(t * 3 + i), top - 100 + 20 * Math.cos(t * 4 + i), 12 * (.5 + .5 * Math.sin(t * 6 + i)), 1);
          item(n, x, top - 50, 50);
          priceTag(p, x, top + 70);
        });
        actor('naya', 170, GROUND + 40, 330, { hl: 0 });
        actor('milo', 560, GROUND + 40, 285, { reach: t > L.M1.s && t < L.M1b.e });
        actor('sacha', 380, GROUND + 40, 270, { reach: t > L.S1.s && t < L.S2.e, up: t > L.S2.s && t < L.S2.e });
        tokens(10, 460, 200, 18, { gap: 42 });
      },
    },
    {
      id: 'boites', title: 'Deux boîtes', phase: 'Formalisation', lead: .4, tail: 1.4,
      lines: [
        { id: 'NY2', who: 'naya', text: "On va faire deux boîtes. Dans la boîte verte, ce dont on a absolument besoin : sans ça, notre santé ou notre sécurité sont en danger.", pad: .6 },
        { id: 'NY3', who: 'naya', text: 'Dans la boîte rouge, ce qui fait plaisir, mais dont on peut se passer sans danger.', pad: .6 },
        { id: 'NY4', who: 'naya', text: 'Pour chaque objet, posons-nous la même question : que se passe-t-il si nous ne l\'avons pas ?', pad: .8 },
        { id: 'N4', who: 'narr', text: "L'eau ? Sans eau, on a soif, et on ne peut plus marcher. Boîte verte.", pad: .8 },
        { id: 'N5', who: 'narr', text: "Les galettes ? Sans elles, plus d'énergie pour grimper. Boîte verte.", pad: .8 },
        { id: 'N6', who: 'narr', text: "La trousse de secours ? Si quelqu'un se blesse, il faut pouvoir le soigner. Boîte verte.", pad: .8 },
        { id: 'N7', who: 'narr', text: 'La toupie, les bonbons, la longue-vue ? Ce serait agréable… mais sans eux, personne n\'est en danger. Boîte rouge.', pad: 1.2 },
        { id: 'S3b', who: 'sacha', text: "D'accord… La boîte rouge, ce n'est pas interdit. C'est juste moins urgent.", pad: .6 },
      ],
      draw(t, L) {
        paper();
        const GX = 520, RX = 1400, BY = 860;
        const steps = [['eau', L.N4, 0], ['galettes', L.N5, 0], ['trousse', L.N6, 0]];
        const inGreen = steps.filter(([, l]) => t > l.e - .6).map(([n]) => [n]);
        const inRed = t > L.N7.e - .6 ? WANTS.map(([n]) => [n]) : [];
        box(GX, BY, GREEN, inGreen, prog(t, L.NY2.s + .5, .6), win(t, L.NY2.s + .5, L.NY2.e, .4) * .7);
        box(RX, BY, RED, inRed, prog(t, L.NY3.s + .3, .6), win(t, L.NY3.s + .3, L.NY3.e, .4) * .7);
        const qa = prog(t, L.NY4.s + 1, .6);
        alpha(qa, () => {
          panel(460, 60, 1000, 110);
          c.fillStyle = INK; c.font = `600 50px ${FD}`; c.textAlign = 'center'; c.textBaseline = 'middle';
          c.fillText('Que se passe-t-il si nous ne l\'avons pas ?', 960, 116);
        });
        steps.forEach(([n, l]) => {
          const show = lin(t, l.s, .5), drop = lin(t, l.e - 1.6, 1);
          if (show <= 0 || drop >= 1) return;
          const x = lerp(960, GX, ease(drop)), y = lerp(380, BY - 150, ease(drop));
          item(n, x, y, lerp(90, 44, drop));
          warn(1150, 380, 60 * (1 + .08 * Math.sin(t * 10)), win(t, l.s + 1.2, l.e - 1.6, .3));
          burst(GX, BY - 160, clamp((t - (l.e - .6)) / .7), 70, '#8FE0B0');
        });
        const s7 = lin(t, L.N7.s, .5), d7 = lin(t, L.N7.e - 1.8, 1.1);
        if (s7 > 0 && d7 < 1) WANTS.forEach(([n], i) => {
          const x0 = 780 + i * 180, y0 = 380;
          item(n, lerp(x0, RX - 110 + i * 110, ease(d7)), lerp(y0, BY - 150, ease(d7)), lerp(70, 44, d7));
        });
        check(1150, 520, 50, win(t, L.N7.s + 3, L.N7.e - 1.8, .3));
        burst(RX, BY - 160, clamp((t - (L.N7.e - .7)) / .7), 80, '#FFB0A8');
      },
    },
    {
      id: 'calcul', title: "L'ordre compte", phase: 'Formalisation', lead: .4, tail: 2,
      lines: [
        { id: 'S3', who: 'sacha', text: "Et si on avait tout dépensé dans la boîte rouge d'abord ?", pad: .4 },
        { id: 'NY5', who: 'naya', text: 'Compte avec moi. La toupie, les bonbons et la longue-vue coûtent dix jetons. Il ne resterait plus rien pour l\'eau, les galettes et la trousse.', pad: 1.6 },
        { id: 'N8', who: 'narr', text: "Alors l'équipe paie d'abord la boîte verte : deux, plus trois, plus trois… huit jetons. Il en reste deux.", pad: 1.6 },
        { id: 'M2', who: 'milo', text: "Deux jetons… c'est exactement le prix des bonbons !", pad: 1.2 },
        { id: 'S4', who: 'sacha', text: 'Des bonbons pour fêter le sommet ! Tout le monde sera content.', pad: .4 },
        { id: 'N9', who: 'narr', text: "Se faire plaisir, ça compte aussi. Il suffit de s'occuper d'abord de ce qui est vital.", pad: .8 },
      ],
      draw(t, L) {
        paper();
        const xs = ALL.map((_, i) => 300 + i * 264 + (i >= 3 ? 60 : 0));
        alpha(1, () => {
          c.fillStyle = 'rgba(47,158,98,.12)'; rr(170, 440, 800, 300, 30); c.fill();
          c.fillStyle = 'rgba(214,69,65,.12)'; rr(1010, 440, 800, 300, 30); c.fill();
        });
        const phaseA = t < L.N8.s;
        // Phase A : les dix jetons partent dans la boîte rouge.
        const a = lin(t, L.NY5.s + 1, 3);
        const b = lin(t, L.N8.s + 1, 4), m = lin(t, L.M2.s + .8, 1.4);
        ALL.forEach(([n, p], i) => {
          const x = xs[i];
          item(n, x, 540, 56);
          priceTag(p, x, 660);
          const paidA = phaseA && a >= (i >= 3 ? (i - 2) / 3 : 2);
          const paidB = !phaseA && (i < 3 ? b >= (i + 1) / 3 : n === 'bonbons' && m >= 1);
          if (paidA || paidB) check(x + 60, 480, 26);
          if (phaseA && a >= 1 && i < 3) cross(x, 540, 46);
        });
        // réserve de jetons en haut
        const left = phaseA ? 10 - Math.floor(a * 10 + 1e-6) : 10 - Math.floor(b * 8 + 1e-6) - (m >= 1 ? 2 : 0);
        tokens(Math.max(0, left), 960, 230, 26, { gap: 64 });
        bigText(String(Math.max(0, left)), 960, 330, 60, CLAY, 1, 700);
        glow(xs[4], 540, 160, win(t, L.M2.s, L.S4.e, .4) * .8);
        rays(xs[4], 540, 260, win(t, L.M2.s + 1, L.S4.e, .4) * .6);
        if (phaseA && a >= 1 && t < L.NY5.s + 4.6) Moteur.shake(4);
      },
    },
    {
      id: 'question', title: 'À toi de trier', phase: 'Question ouverte', lead: .5, tail: 2,
      lines: [
        { id: 'N10', who: 'narr', text: "Le lendemain, au sommet, l'équipe boit, reprend des forces… et partage les bonbons.", pad: 1 },
        { id: 'S5', who: 'sacha', text: "Quelle vue ! Et heureusement qu'on avait de l'eau : j'avais tellement soif en montant.", pad: .6 },
        { id: 'M5', who: 'milo', text: 'Et les bonbons, finalement… c\'était une très bonne idée.', pad: .8 },
        { id: 'NY6', who: 'naya', text: 'À toi, maintenant ! La prochaine fois que tu fais les courses avec ta famille, regarde dans le panier.', pad: .6 },
        { id: 'NY7', who: 'naya', text: "Qu'est-ce qui irait dans la boîte verte ? Et qu'est-ce qui irait dans la boîte rouge ?", pad: 1 },
      ],
      draw(t, L) {
        sky({ mountains: true, mills: false });
        const sum = 1 - prog(t, L.NY6.s - .3, .8);
        alpha(sum, () => {
          actor('milo', 780, GROUND + 40, 285); actor('sacha', 960, GROUND + 40, 270, { up: true }); actor('naya', 1280, GROUND + 40, 330, { face: -1 });
          item('eau', 700, GROUND - 120, 30); item('bonbons', 1030, GROUND - 190, 36);
          Moteur.confetti(t, .8, 40);
        });
        alpha(1 - sum, () => {
          actor('naya', 960, GROUND + 40, 360);
          box(470, 860, GREEN, [['pain'], ['eau']], prog(t, L.NY7.s + .6, .5));
          box(1450, 860, RED, [['bonbons'], ['toupie']], prog(t, L.NY7.s + 2, .5));
          item('panier', 960, 330, 80, prog(t, L.NY6.s + 2, .6));
        });
      },
    },
  ];

  Moteur.episode({
    numero: 3,
    titre: 'La Boîte Rouge et la Boîte Verte',
    notion: 'Distinction fondamentale entre besoins et envies',
    objectif: 'Hiérarchiser les dépenses entre vital et optionnel.',
    cible: '4 min 45 s',
    dispositif: "Chaque objet passe devant la même question, « Que se passe-t-il si nous ne l'avons pas ? », puis rejoint la boîte verte ou la boîte rouge selon ses conséquences pratiques.",
    suivant: "Épisode 4 · L'Aventure du Choix Invisible",
    generique: ['milo', 'sacha', 'naya'],
    scenes,
  });
})();
