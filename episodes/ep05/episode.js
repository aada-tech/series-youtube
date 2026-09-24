// Épisode 5 · Le Pouvoir de la Patience
(() => {
  const { c, W, H, GROUND, INK, RED, GREEN, CLAY, PAPER, CAST, clamp, lerp, ease, prog, lin, win, rr, circ, ell, line, poly, alpha,
    person, actor, item, token, tokens, gear, sky, paper, shop, bubble, cross, check, arrow, glow, bigText, panel, chip, node, fly, flyTokens, FD } = Moteur;

  // Pompe à eau : p = 0 simple croquis au crayon, p = 1 objet fini et coloré.
  function pompe(x, y, k, p, water = 0) {
    const sketch = () => {
      rr(x - 70 * k, y - 200 * k, 140 * k, 200 * k, 20 * k);
      c.stroke();
      line(x + 70 * k, y - 170 * k, x + 190 * k, y - 170 * k); line(x + 190 * k, y - 170 * k, x + 190 * k, y - 120 * k);
      c.beginPath(); c.arc(x - 20 * k, y - 250 * k, 45 * k, 0, Math.PI * 2); c.stroke();
      c.beginPath(); c.arc(x + 45 * k, y - 265 * k, 30 * k, 0, Math.PI * 2); c.stroke();
    };
    c.save(); c.setLineDash([10 * k, 8 * k]); c.strokeStyle = '#8C96A3'; c.lineWidth = 4 * k; alpha(1 - p * .8, sketch); c.restore();
    alpha(p, () => {
      c.fillStyle = '#5E8FBF'; rr(x - 70 * k, y - 200 * k, 140 * k, 200 * k, 20 * k); c.fill();
      c.fillStyle = '#7FA8CC'; rr(x - 50 * k, y - 180 * k, 30 * k, 150 * k, 10 * k); c.fill();
      c.fillStyle = '#8C96A3'; rr(x + 60 * k, y - 185 * k, 130 * k, 30 * k, 12 * k); c.fill(); rr(x + 165 * k, y - 185 * k, 30 * k, 70 * k, 10 * k); c.fill();
      gear(x - 20 * k, y - 250 * k, 45 * k, 9, Moteur.now() * 1.5 * (water > 0 ? 1 : 0), '#C9A43A');
      gear(x + 45 * k, y - 265 * k, 30 * k, 7, -Moteur.now() * 2.2 * (water > 0 ? 1 : 0), '#8C96A3');
      c.fillStyle = '#5D6875'; circ(x - 20 * k, y - 250 * k, 10 * k); c.fill(); circ(x + 45 * k, y - 265 * k, 7 * k); c.fill();
    });
    if (water > 0) alpha(water, () => {
      c.strokeStyle = '#5DA9E9'; c.lineWidth = 12 * k; c.lineCap = 'round'; c.setLineDash([18 * k, 14 * k]); c.lineDashOffset = -Moteur.now() * 80;
      c.beginPath(); c.moveTo(x + 180 * k, y - 110 * k); c.quadraticCurveTo(x + 230 * k, y - 20 * k, x + 320 * k, y - 10 * k); c.stroke();
      c.setLineDash([]); c.lineDashOffset = 0;
    });
  }
  // Bocal de verre gradué contenant n jetons.
  function bocal(x, y, n, o = {}) {
    const w = o.w || 190, h = o.h || 260, top = y - h;
    alpha(o.a ?? 1, () => {
      if (o.hl) glow(x, y - h / 2, 220, o.hl);
      c.fillStyle = 'rgba(214,236,245,.55)'; rr(x - w / 2, top, w, h, 30); c.fill();
      c.save(); rr(x - w / 2, top, w, h, 30); c.clip();
      for (let j = 0; j < Math.floor(n); j++) token(x - w / 2 + 36 + (j % 4) * ((w - 72) / 3), y - 24 - Math.floor(j / 4) * 30, 20);
      c.restore();
      c.strokeStyle = '#9FBFCC'; c.lineWidth = 5; rr(x - w / 2, top, w, h, 30); c.stroke();
      c.fillStyle = o.lid || '#A8733F'; rr(x - w / 2 - 8, top - 26, w + 16, 30, 10); c.fill();
      if (o.grad) { c.strokeStyle = 'rgba(80,110,125,.5)'; c.lineWidth = 3; for (let g = 1; g <= o.grad; g++) { const gy = y - 10 - g * (h - 30) / o.grad; line(x + w / 2 - 30, gy, x + w / 2 - 6, gy); } }
      if (o.icon) chip(o.icon, x, y + 58, 40, { ring: o.lid });
    });
  }
  const JARS = [['figurine', '#E8589A'], ['engrenage', '#C9A43A'], ['etoile', GREEN]];
  const walk = (t, a, d) => { const p = prog(t, a, d); return [p, p > 0 && p < 1 ? t * 9 : 0]; };

  const scenes = [
    {
      id: 'kit', title: "À l'atelier de mécanique", phase: 'Interrogation initiale', lead: .6, tail: 1.4,
      lines: [
        { id: 'N1', who: 'narr', text: "À l'atelier de mécanique, la mécanicienne expose un kit d'engrenages pour construire une pompe à eau automatique.", pad: .8 },
        { id: 'S1', who: 'sacha', text: "Avec ça, je pourrais arroser tout le potager sans porter un seul seau ! Combien ça coûte ?", pad: .2 },
        { id: 'MC1', who: 'mecanicienne', text: 'Douze jetons. Toutes les pièces sont dans la boîte, avec le plan de montage.', pad: .6 },
        { id: 'N2', who: 'narr', text: 'Douze jetons ! Sacha en gagne quatre par semaine, en aidant à nettoyer les ateliers.', pad: .8 },
        { id: 'S2', who: 'sacha', text: "Douze… c'est beaucoup trop. Je n'y arriverai jamais. Autant acheter des figurines cette semaine.", pad: .8 },
        { id: 'N3', who: 'narr', text: 'Est-ce vraiment impossible ? Ou est-ce seulement… long ?', pad: 1.2 },
      ],
      draw(t, L) {
        sky();
        const top = shop(1320, 1.25, '#546E8C', 'mecanicienne');
        gear(1180, top - 50, 44, 9, t * .6, '#C9A43A'); gear(1250, top - 70, 30, 7, -t * .9, '#8C96A3');
        c.fillStyle = '#E9D7B0'; rr(1340, top - 110, 160, 110, 10); c.fill(); c.save(); c.translate(1420, top - 20); c.scale(.28, .28); c.translate(-1420, -(top - 20)); pompe(1420, top - 20, 1, .15); c.restore();
        tokens(12, 1320, top + 80, 11, { gap: 20, a: prog(t, L.MC1.s, .5) });
        actor('milo', 380, GROUND + 40, 285);
        const s = actor('sacha', 640, GROUND + 40, 270, { up: t > L.S1.s && t < L.S1.e });
        const w = win(t, L.N2.s + 3, L.S2.e, .4);
        alpha(w, () => { tokens(4, 640, s.top - 50, 16, { gap: 36 }); });
        const b = win(t, L.S2.s + 2.5, L.S2.e + .4, .35);
        bubble(640, s.top - 170, 260, 150, 640, s.top - 12, b); item('figurine', 590, s.top - 170, 40, b); item('figurine', 690, s.top - 170, 40, b);
        bigText('?', 960, 250, 110, CLAY, prog(t, L.N3.s + .4, .5), 700);
      },
    },
    {
      id: 'bocaux', title: 'Les trois bocaux', phase: 'Mise en situation', lead: .4, tail: 1.4,
      lines: [
        { id: 'M1', who: 'milo', text: 'Attends ! Moi, j\'utilise trois bocaux. Le premier, pour les petites envies de la semaine.', pad: .6 },
        { id: 'M2', who: 'milo', text: "Le deuxième, pour un grand projet. Et le troisième, c'est une réserve d'entraide : pour aider quelqu'un, ou pour faire face à un imprévu.", pad: .8 },
        { id: 'M2b', who: 'milo', text: "D'ailleurs, moi, je mets presque tout dans le bocal du projet. Je ne dépense jamais rien !", pad: .4 },
        { id: 'NY1', who: 'naya', text: "Chacun fait comme il veut, Milo. Sacha, combien veux-tu mettre dans chaque bocal ? C'est toi qui décides.", pad: .6 },
        { id: 'S3', who: 'sacha', text: 'Deux jetons pour la pompe, un pour mes petites envies, et un pour l\'entraide.', pad: 1.4 },
        { id: 'S3c', who: 'sacha', text: 'Et si je mets mes quatre jetons dans la pompe, ça ira deux fois plus vite !', pad: .4 },
        { id: 'M3a', who: 'milo', text: "Oui, mais alors plus de petites envies, et plus rien pour aider quelqu'un.", pad: .4 },
        { id: 'NY1b', who: 'naya', text: "C'est possible aussi. Il n'y a pas une seule bonne façon de faire : à toi de trouver l'équilibre qui te convient.", pad: .6 },
        { id: 'S3d', who: 'sacha', text: 'Alors je garde mon partage : deux, un, un.', pad: .8 },
        { id: 'NY2', who: 'naya', text: 'Deux jetons par semaine, pour un projet de douze. Combien de semaines faut-il ?', pad: .4 },
        { id: 'M3', who: 'milo', text: 'Deux, quatre, six, huit, dix, douze… Six semaines !', pad: 1.6 },
      ],
      draw(t, L) {
        sky();
        c.fillStyle = '#A87B4E'; rr(560, GROUND - 190, 900, 30, 10); c.fill(); c.fillStyle = '#8A5A2E'; c.fillRect(600, GROUND - 160, 24, 160); c.fillRect(1396, GROUND - 160, 24, 160);
        const ap = [lin(t, L.M1.s + 2.5, .6), lin(t, L.M2.s + .5, .6), lin(t, L.M2.s + 4, .6)];
        const split = lin(t, L.S3.s + 1, 3);
        JARS.forEach(([ic, lid], i) => {
          const x = 760 + i * 250;
          const n = i === 0 ? (split > .6 ? 1 : 0) : i === 1 ? (split > .3 ? 2 : 0) : (split > .9 ? 1 : 0);
          bocal(x, GROUND - 200, n, { a: ap[i], lid, icon: ic, h: 220, w: 170, hl: i === 1 ? win(t, L.M2.s, L.M2.s + 3, .3) * .6 : 0 });
        });
        actor('milo', 300, GROUND + 40, 285, { reach: t > L.M1.s && t < L.M2b.e });
        const s = actor('sacha', 1650, GROUND + 40, 270, { face: -1 });
        actor('naya', 1840, GROUND + 40, 320, { face: -1 });
        const cnt = lin(t, L.M3.s + .3, 3.2);
        for (let i = 0; i < 6; i++) if (cnt > i / 6) alpha(1, () => { tokens(2, 520 + i * 180, 200, 20, { gap: 44 }); bigText(String((i + 1) * 2), 520 + i * 180, 270, 40, CLAY, 1, 700); });
        check(1650, 180, 44, prog(t, L.M3.s + 3.6, .4));
      },
    },
    {
      id: 'semaines', title: 'Semaine après semaine', phase: 'Formalisation', lead: .4, tail: 1.6,
      lines: [
        { id: 'N4', who: 'narr', text: "Première semaine : Sacha nettoie les établis et range les outils. Quatre jetons ! Deux pour la pompe, un pour ses envies, un pour l'entraide.", pad: 1.2 },
        { id: 'N4b', who: 'narr', text: 'Deuxième semaine, même travail, même partage. Le bocal du projet contient déjà quatre jetons.', pad: 1.2 },
        { id: 'N5', who: 'narr', text: "Troisième semaine : au marché, Sacha voit une figurine à deux jetons. Il la paie avec son bocal des petites envies.", pad: .8 },
        { id: 'S3a', who: 'sacha', text: "J'aurais pu prendre les jetons de la pompe pour en acheter une autre… Mais non. Ma pompe d'abord !", pad: .8 },
        { id: 'N6', who: 'narr', text: 'Quatrième semaine : le bocal du projet continue de monter… et la pompe se dessine, trait après trait.', pad: 1.2 },
        { id: 'N6b', who: 'narr', text: "Cinquième semaine : un orage renverse la clôture de la bergère. Sacha ouvre son bocal d'entraide, et l'aide à racheter du bois.", pad: .8 },
        { id: 'B1', who: 'bergere', text: 'Merci, Sacha ! Sans toi, mes moutons se seraient échappés dans la forêt.', pad: .8 },
        { id: 'S3b', who: 'sacha', text: 'Et le bocal de la pompe, je n\'y ai pas touché. Plus qu\'une semaine !', pad: .8 },
        { id: 'N7', who: 'narr', text: 'Sixième semaine : douze jetons !', pad: 1.6 },
      ],
      draw(t, L) {
        paper();
        const starts = [L.N4.s, L.N4b.s, L.N5.s, L.N6.s, L.N6b.s, L.N7.s].map(v => v + .8);
        const week = starts.filter(v => t >= v).length;
        const phase = week ? clamp((t - starts[week - 1]) / 1.6) : 0;
        const t0 = starts[0];
        for (let i = 0; i < 6; i++) {
          const x = 460 + i * 200, on = i < week;
          c.fillStyle = on ? '#FFFFFF' : '#EEF1EC'; rr(x - 80, 70, 160, 110, 16); c.fill();
          c.strokeStyle = i === week - 1 ? CLAY : '#D7DDD3'; c.lineWidth = i === week - 1 ? 6 : 3; c.stroke();
          bigText(String(i + 1), x, 125, 56, on ? INK : '#B6BDB8', 1, 600);
        }
        const done = week - (phase < 1 && week > 0 ? 1 : 0);
        const envies = Math.max(0, done - (t > L.N5.s + 5 ? 2 : 0)), projet = done * 2, entraide = done - (t > L.N6b.s + 5.5 ? 3 : 0);
        bocal(560, 820, envies, { lid: JARS[0][1], icon: JARS[0][0], h: 280, w: 200, hl: win(t, L.N5.s + 1, L.N5.e, .4) * .6 });
        bocal(960, 820, projet, { lid: JARS[1][1], icon: JARS[1][0], h: 420, w: 220, grad: 6, hl: win(t, L.N6.s, L.N6.e, .4) * .6 });
        bocal(1360, 820, entraide, { lid: JARS[2][1], icon: JARS[2][0], h: 280, w: 200 });
        if (week > 0 && phase < 1) {
          const q = phase;
          [[560, 1], [960, 2], [1360, 1]].forEach(([x, n]) => flyTokens(n, 960, 230, x, 560, q, 18, 40));
        }
        const f = lin(t, L.N5.s + 3.6, 1.4);
        if (f > 0 && f < 1) flyTokens(2, 560, 700, 280, 380, f, 18, 60);
        if (t > L.N5.s + 4.9) item('figurine', 280, 380, 60, prog(t, L.N5.s + 4.9, .4));
        const g = lin(t, L.N6b.s + 4, 1.5);
        alpha(prog(t, L.N6b.s + 2, .5), () => node('bergere', 1640, 330, 70, { badge: 'planche' }));
        if (g > 0 && g < 1) flyTokens(3, 1360, 700, 1640, 330, g, 18, 60);
        pompe(1680, 820, .8, projet / 12);
        glow(960, 500, 300, win(t, L.N7.s, L.N7.e + 1, .5));
      },
    },
    {
      id: 'pompe', title: 'La pompe du potager', phase: 'Formalisation', lead: .4, tail: 1.4,
      lines: [
        { id: 'N7b', who: 'narr', text: "Sacha achète le kit. Avec Milo, il assemble les engrenages en suivant le plan, pièce après pièce.", pad: 1.4 },
        { id: 'S4', who: 'sacha', text: "Je l'ai fait ! Et regarde : l'eau monte toute seule jusqu'au potager !", pad: 1 },
        { id: 'NY3', who: 'naya', text: 'Tu as attendu six semaines. Sans ces six semaines de patience, cette pompe n\'existerait pas.', pad: .6 },
        { id: 'N8', who: 'narr', text: "Mettre de côté une partie de ce qu'on gagne, c'est ce qu'on appelle épargner. Cela permet d'atteindre des projets qu'on ne pourrait pas s'offrir d'un seul coup.", pad: 1 },
        { id: 'M4', who: 'milo', text: "Et ma réserve d'entraide… je crois que je vais l'utiliser pour acheter des graines pour le potager de tout le monde.", pad: 1 },
      ],
      draw(t, L) {
        sky();
        for (let r = 0; r < 2; r++) for (let x = 1250 + r * 30; x < 1880; x += 105) item('salade', x, GROUND + 40 + r * 60, 30);
        pompe(980, GROUND + 10, 1.15, prog(t, L.N7b.s + 1, L.N7b.e - L.N7b.s), prog(t, L.S4.s + .8, 1));
        const s = actor('sacha', 640, GROUND + 40, 280, { up: t > L.S4.s && t < L.S4.e });
        actor('naya', 400, GROUND + 40, 330);
        const m = actor('milo', 1700, GROUND + 40, 285, { face: -1, reach: t > L.M4.s });
        alpha(prog(t, L.M4.s + 1.5, .5), () => item('graines', m.hx - 10, m.hy - 20, 34));
      },
    },
    {
      id: 'question', title: 'Ton grand projet', phase: 'Question ouverte', lead: .5, tail: 2,
      lines: [
        { id: 'NY4', who: 'naya', text: 'À toi, maintenant ! Y a-t-il un grand projet dont tu rêves ?', pad: 1 },
        { id: 'NY5', who: 'naya', text: "Combien coûte-t-il ? Et combien de semaines faudrait-il pour y arriver, en mettant un peu de côté chaque semaine ?", pad: 1.2 },
        { id: 'NY6', who: 'naya', text: "Tu peux dessiner ton propre bocal, avec des traits pour compter les semaines. Chaque trait te rapproche de ton projet.", pad: 1.2 },
      ],
      draw(t, L) {
        sky();
        actor('naya', 960, GROUND + 40, 360);
        alpha(prog(t, L.NY4.s + 1.5, .6), () => { bubble(1450, 380, 300, 220, 1100, 600, 1); item('paquet', 1450, 380, 70); });
        const q = prog(t, L.NY5.s + 1, .6);
        alpha(q, () => { bocal(480, 700, Math.min(12, Math.floor(lin(t, L.NY5.s + 1.5, 5) * 12)), { lid: '#C9A43A', icon: 'engrenage', h: 360, w: 200, grad: 6 }); });
      },
    },
  ];

  Moteur.episode({
    numero: 5,
    titre: 'Le Pouvoir de la Patience',
    notion: 'Gratification différée et épargne de projet',
    objectif: "Structurer l'épargne de moyen terme via la méthode des bocaux.",
    cible: '5 min 30 s',
    dispositif: "Accélération du temps : les jetons s'accumulent semaine après semaine dans un bocal gradué, pendant que le croquis de la pompe devient un objet réel.",
    suivant: "Épisode 6 · La Carte Magique n'est pas Magique !",
    generique: ['milo', 'sacha', 'naya'],
    scenes,
  });
})();
