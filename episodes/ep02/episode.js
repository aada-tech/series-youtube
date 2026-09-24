// Épisode 2 · D'où Viennent les Pièces ?
(() => {
  const { c, W, H, GROUND, INK, RED, GREEN, CLAY, PAPER, CAST, clamp, lerp, ease, prog, lin, win, rr, circ, ell, line, poly, alpha,
    person, actor, item, token, tokens, sky, paper, bubble, cross, check, arrow, glow, bigText, panel, chip, node, fly, flyTokens } = Moteur;

  // Armoire commune : levier à droite, bac en bas. open > 0 montre les casiers à l'intérieur.
  const OWNERS = ['bergere', 'meunier', 'maraichere', 'menuisier', 'forgeronne', 'milo', 'naya', 'sacha', 'mecanicienne'];
  function armoire(x, k, o = {}) {
    const w = 300 * k, h = 440 * k, top = GROUND - h;
    c.fillStyle = 'rgba(40,55,40,.13)'; ell(x, GROUND, w * .6, 14 * k); c.fill();
    c.fillStyle = '#6B7682'; rr(x - w / 2, top, w, h, 16 * k); c.fill();
    c.fillStyle = '#8C96A3'; rr(x - w / 2 + 14 * k, top + 14 * k, w - 28 * k, h - 120 * k, 10 * k); c.fill();
    const open = o.open || 0;
    if (open > 0) {
      const gx = x - w / 2 + 28 * k, gy = top + 28 * k, cw = (w - 56 * k) / 3, ch = (h - 148 * k) / 3;
      OWNERS.forEach((who, i) => {
        const cx = gx + (i % 3) * cw, cy = gy + Math.floor(i / 3) * ch;
        alpha(open, () => {
          c.fillStyle = '#3F4852'; rr(cx + 4 * k, cy + 4 * k, cw - 8 * k, ch - 8 * k, 6 * k); c.fill();
          c.fillStyle = CAST[who].ring; rr(cx + 4 * k, cy + 4 * k, cw - 8 * k, 12 * k, 4 * k); c.fill();
          const n = (o.casiers && o.casiers[who]) ?? 0;
          if (o.hl === who) { c.strokeStyle = '#FFD166'; c.lineWidth = 6 * k; rr(cx + 2 * k, cy + 2 * k, cw - 4 * k, ch - 4 * k, 8 * k); c.stroke(); }
          for (let j = 0; j < Math.floor(n); j++) token(cx + cw * .25 + (j % 3) * cw * .25, cy + ch * .45 + Math.floor(j / 3) * 26 * k, 11 * k);
        });
      });
      alpha(1 - open, () => { c.fillStyle = '#8C96A3'; rr(x - w / 2 + 14 * k, top + 14 * k, w - 28 * k, h - 120 * k, 10 * k); c.fill(); });
    }
    alpha(1 - open, () => token(x, top + 150 * k, 46 * k));
    // bac
    c.fillStyle = '#4A525C'; rr(x - 70 * k, GROUND - 90 * k, 140 * k, 50 * k, 10 * k); c.fill();
    c.fillStyle = '#2E343A'; rr(x - 58 * k, GROUND - 82 * k, 116 * k, 26 * k, 6 * k); c.fill();
    // levier
    const px = x + w / 2 + 6 * k, py = top + 200 * k, a = -1.1 + (o.lever || 0) * 1.6;
    c.fillStyle = '#4A525C'; circ(px, py, 16 * k); c.fill();
    c.strokeStyle = '#4A525C'; c.lineWidth = 14 * k; c.lineCap = 'round';
    line(px, py, px + Math.cos(a) * 110 * k, py + Math.sin(a) * 110 * k);
    c.fillStyle = RED; circ(px + Math.cos(a) * 110 * k, py + Math.sin(a) * 110 * k, 18 * k); c.fill();
    return { tray: [x, GROUND - 70 * k], lever: [px + Math.cos(a) * 110 * k, py + Math.sin(a) * 110 * k], top };
  }

  // Jauge d'énergie et de temps.
  function jauge(x, y, h, fill, a = 1) {
    alpha(a, () => {
      const w = 90;
      c.fillStyle = '#FFFFFF'; rr(x - w / 2, y, w, h, w / 2); c.fill();
      c.strokeStyle = INK; c.lineWidth = 5; c.stroke();
      c.save(); rr(x - w / 2 + 8, y + 8, w - 16, h - 16, (w - 16) / 2); c.clip();
      const fh = (h - 16) * clamp(fill);
      const g = c.createLinearGradient(0, y + h, 0, y);
      g.addColorStop(0, '#F4C542'); g.addColorStop(1, '#F29B3A');
      c.fillStyle = g; c.fillRect(x - w / 2, y + h - 8 - fh, w, fh);
      c.restore();
      item('horloge', x - 36, y - 46, 26); item('muscle', x + 8, y - 50, 26); item('etoile', x + 50, y - 46, 24);
    });
  }

  function potager(x0, x1) {
    for (let r = 0; r < 3; r++) {
      const y = GROUND + 30 + r * 55;
      c.fillStyle = '#8A6A4A'; rr(x0 + r * 20, y - 16, x1 - x0 - r * 40, 32, 16); c.fill();
      for (let x = x0 + 50 + r * 20; x < x1 - 40 - r * 20; x += 110) item(r === 1 ? 'carotte' : 'salade', x, y - 22, r === 1 ? 26 : 28);
    }
  }

  const walk = (t, a, d) => { const p = prog(t, a, d); return [p, p > 0 && p < 1 ? t * 9 : 0]; };

  const scenes = [
    {
      id: 'armoire', title: "L'armoire du village", phase: 'Interrogation initiale', lead: .6, tail: 2,
      lines: [
        { id: 'N1', who: 'narr', text: 'Sur la place du village, il y a une grande armoire en métal, avec un levier sur le côté.' },
        { id: 'N2', who: 'narr', text: 'La bergère tire le levier… et hop ! Trois jetons tombent dans le bac.', pad: 1.2 },
        { id: 'S1', who: 'sacha', text: "Waouh ! Il suffit de tirer le levier pour avoir des jetons ? Alors je vais en prendre plein, pour acheter tous les jeux du marché !" },
        { id: 'M1', who: 'milo', text: "Attends, Sacha. Cette armoire n'est sûrement pas remplie à l'infini." },
        { id: 'S2', who: 'sacha', text: 'Bien sûr que si ! Regarde, les jetons sortent tout seuls !', pad: .4 },
        { id: 'N2b', who: 'narr', text: "Sacha imagine déjà une armoire magique, qui déborde de jetons et ne se vide jamais.", pad: 1.2 },
        { id: 'N3', who: 'narr', text: "Mais d'où viennent vraiment ces jetons ?", pad: 1 },
      ],
      draw(t, L) {
        sky();
        const lever = win(t, L.N2.s + .8, L.N2.s + 2.6, .4);
        const A = armoire(1240, 1.1, { lever });
        const drop = lin(t, L.N2.s + 1.4, .7);
        if (drop > 0 && t < L.N2.s + 3.2) tokens(3, A.tray[0], lerp(A.tray[1] - 120, A.tray[1] - 8, ease(drop)), 16, { gap: 34 });
        flyTokens(3, A.tray[0], A.tray[1] - 8, 1480, GROUND - 190, lin(t, L.N2.s + 3.2, 1), 16, 60);
        const b = actor('bergere', 1560, GROUND + 20, 380, { face: -1, reach: lever > 0 });
        if (t > L.N2.s + 4.2) tokens(3, b.hx - 10, b.hy - 10, 14, { gap: 16 });
        actor('milo', 360, GROUND + 40, 285);
        const s = actor('sacha', 620, GROUND + 40, 270, { up: t > L.S1.s && t < L.S2.e });
        const d = win(t, L.N2b.s + .3, L.N2b.e, .4);
        bubble(620, 360, 380, 220, 620, GROUND - 250, d);
        alpha(d, () => { for (let i = 0; i < 12; i++) token(500 + (i % 4) * 80, 300 + Math.floor(i / 4) * 55 + Math.sin(t * 3 + i) * 6, 22); });
        bigText('?', 1240, 330, 150, CLAY, prog(t, L.N3.s + .3, .5), 700);
      },
    },
    {
      id: 'potager', title: 'Au potager', phase: 'Mise en situation', lead: .4, tail: 1.2,
      lines: [
        { id: 'NY1', who: 'naya', text: "Venez, tous les deux. On va suivre les jetons à l'envers, jusqu'à leur point de départ." },
        { id: 'N4', who: 'narr', text: 'La maraîchère travaille au potager depuis le lever du soleil. Elle bine la terre, elle sème, et elle protège ses salades de la grêle.', pad: 1.4 },
        { id: 'NY2', who: 'naya', text: "Regardez cette jauge. Elle se remplit avec son temps, son effort, et tout ce qu'elle sait faire.", pad: .6 },
        { id: 'M3', who: 'milo', text: "Elle a commencé bien avant nous, et elle n'a toujours pas fini !", pad: .6 },
        { id: 'N5', who: 'narr', text: 'Quand les légumes sont prêts, la bergère vient les acheter. Et la jauge se transforme… en jetons.', pad: 2.2 },
        { id: 'S3', who: 'sacha', text: "Oh ! Ses jetons, elle les a gagnés en faisant pousser des légumes pour les autres.", pad: .6 },
        { id: 'NY2b', who: 'naya', text: 'Et ce n\'est pas fini. Regardez où vont ces jetons maintenant.', pad: .6 },
      ],
      draw(t, L) {
        sky({ dusk: .25 * (1 - prog(t, 0, L.N4.s + 3)) });
        potager(1080, 1900);
        const [pk, wk] = walk(t, .2, 2.4);
        actor('naya', lerp(-120, 330, pk), GROUND + 40, 320, { walk: wk });
        actor('sacha', lerp(-300, 470, pk), GROUND + 40, 270, { walk: wk });
        actor('milo', lerp(-460, 610, pk), GROUND + 40, 285, { walk: wk });
        const n4 = L.N4, third = (n4.e - n4.s - 1.4) / 3;
        const act = [0, 1, 2].map(i => win(t, n4.s + 1.5 + i * third * .9, n4.s + 1.5 + (i + 1) * third * .9 + .2, .3));
        const m = actor('maraichere', 1250, GROUND + 20, 380, { face: -1, reach: act[0] > 0 || act[1] > 0 });
        if (act[0] > 0) item('binette', m.hx - 30, m.hy + 20, 50, act[0]);
        chip('binette', 1250, 360, 54, { a: act[0] }); chip('graines', 1250, 360, 54, { a: act[1] }); chip('bache', 1250, 360, 54, { a: act[2] });
        const fill = lerp(0, 1, prog(t, n4.s + 1, n4.e - n4.s + 1)) * (1 - lin(t, L.N5.s + 2.6, 2.4));
        jauge(880, 330, 420, fill, prog(t, n4.s + .6, .6));
        glow(880, 540, 260, win(t, L.NY2.s, L.NY2.e, .4) * .8);
        const [pb, wb] = walk(t, L.N5.s, 2.4);
        const b = actor('bergere', lerp(2100, 1620, pb), GROUND + 30, 380, { face: -1, walk: wb });
        fly('legumes', 1210, GROUND - 180, b.hx, b.hy - 20, lin(t, L.N5.s + 2.6, 1.4), 46);
        if (t > L.N5.s + 4) item('legumes', b.hx, b.hy - 20, 46);
        else if (t < L.N5.s + 2.6 && t > L.N5.s + 1) item('legumes', 1180, GROUND - 180, 46);
        flyTokens(4, 880, 520, m.hx, m.hy, lin(t, L.N5.s + 2.8, 2.2), 20, 140);
        if (t > L.N5.s + 5.2) tokens(4, m.hx - 30, m.hy - 12, 13, { gap: 15 });
      },
    },
    {
      id: 'moulin', title: 'Au moulin', phase: 'Mise en situation', lead: .4, tail: 1.2,
      lines: [
        { id: 'N6', who: 'narr', text: 'Le lendemain, la maraîchère porte son blé au moulin. Le meunier le transforme en farine.', pad: .8 },
        { id: 'MU1', who: 'meunier', text: 'Moudre le blé, c\'est mon métier. Il faut savoir régler les meules, et surveiller le vent toute la journée.', pad: .8 },
        { id: 'N7', who: 'narr', text: 'Lui aussi a une jauge : son temps, sa force, son savoir-faire. Et la maraîchère le paie avec ses jetons.', pad: 2 },
        { id: 'M2', who: 'milo', text: "Donc les jetons passent de main en main… et chaque fois, quelqu'un a rendu un service ou fabriqué quelque chose.", pad: .8 },
      ],
      draw(t, L) {
        sky({ mills: false });
        Moteur.windmill(1480, GROUND + 10, 1.9, .3 + prog(t, L.N6.s + 2, 4) * 2.4);
        const [pm, wm] = walk(t, L.N6.s + .2, 2.6);
        const m = actor('maraichere', lerp(-150, 1000, pm), GROUND + 30, 380, { walk: wm, reach: true });
        const toMill = lin(t, L.N6.s + 3.2, 1.2);
        if (toMill <= 0) item('ble', m.hx + 10, m.hy - 30, 40);
        fly('ble', m.hx + 10, m.hy - 30, 1330, GROUND - 170, toMill, 40, 80);
        const mu = actor('meunier', 1330, GROUND + 20, 380, { face: -1 });
        const fill = prog(t, L.N6.s + 3.6, L.N7.s - L.N6.s);
        jauge(1720, 300, 380, fill * (1 - lin(t, L.N7.s + 4, 1.5)), prog(t, L.N6.s + 3, .6));
        fly('farine', 1300, GROUND - 170, m.hx + 10, m.hy - 30, lin(t, L.N7.s + 4, 1.4), 44, 80);
        if (t > L.N7.s + 5.4) item('farine', m.hx + 10, m.hy - 30, 44);
        flyTokens(3, m.hx, m.hy, mu.hx, mu.hy, lin(t, L.N7.s + 4.2, 1.6), 18, 90);
        const f = prog(t, L.M2.s, .6);
        alpha(f, () => {
          panel(560, 70, 800, 230);
          node('bergere', 680, 185, 70, { badge: 'legumes' });
          node('maraichere', 960, 185, 70, { badge: 'farine' });
          node('meunier', 1240, 185, 70);
          arrow(680, 185, 960, 185, { col: GREEN, lw: 7, head: 22, cut1: 80, cut2: 80 });
          arrow(960, 185, 1240, 185, { col: GREEN, lw: 7, head: 22, cut1: 80, cut2: 80 });
          const q = (t - L.M2.s) % 3 / 3;
          token(lerp(760, 880, q), 185, 16); token(lerp(1040, 1160, q), 185, 16);
        });
      },
    },
    {
      id: 'casiers', title: "Dans l'armoire", phase: 'Formalisation', lead: .4, tail: 1.4,
      lines: [
        { id: 'NY3', who: 'naya', text: "Et l'armoire, alors ? Regardez à l'intérieur.", pad: 1 },
        { id: 'N8', who: 'narr', text: 'Chaque habitant y a son propre casier. La bergère y a rangé les jetons gagnés en vendant sa laine.', pad: 1.2 },
        { id: 'N9', who: 'narr', text: "Quand elle tire le levier, l'armoire lui rend ses propres jetons. Pas un de plus.", pad: 1.4 },
        { id: 'S4', who: 'sacha', text: "Et moi, je n'ai jamais rien déposé… Alors mon casier est vide.", pad: 1.4 },
        { id: 'NY4', who: 'naya', text: "Exactement. L'armoire garde l'argent. Elle ne le fabrique pas.", pad: .8 },
        { id: 'M4', who: 'milo', text: 'Donc, pour retirer des jetons, il faut d\'abord en avoir déposé. Et pour en déposer, il faut d\'abord en avoir gagné.', pad: .8 },
      ],
      draw(t, L) {
        sky();
        const open = prog(t, L.NY3.s + 1, 1.2);
        const dep = lin(t, L.N8.s + 2.2, 1.8), take = lin(t, L.N9.s + 1.4, 1.2);
        const casiers = { meunier: 5, maraichere: 6, menuisier: 3, forgeronne: 4, milo: 7, naya: 2, mecanicienne: 2, sacha: 0, bergere: Math.round(4 * dep) - (take > 0 ? 3 : 0) };
        const hl = t > L.N8.s && t < L.N9.e ? 'bergere' : t > L.S4.s && t < L.S4.e + 1 ? 'sacha' : null;
        const sLever = win(t, L.S4.s + 1.4, L.S4.s + 3, .3), bLever = win(t, L.N9.s + .6, L.N9.s + 2.2, .3);
        const A = armoire(960, 1.45, { open, casiers, hl, lever: Math.max(sLever, bLever) });
        const bw = prog(t, L.N9.e - .6, 1.6);
        const b = actor('bergere', lerp(1420, 1800, bw), GROUND + 30, 380, { face: bw > 0 && bw < 1 ? 1 : -1, walk: bw > 0 && bw < 1 ? t * 9 : 0, reach: bLever > 0 || (dep > 0 && dep < 1) });
        flyTokens(4, b.hx, b.hy, 800, 330, dep, 16, 120);
        flyTokens(3, 820, 330, A.tray[0], A.tray[1] - 8, take, 16, 40);
        const sw = prog(t, L.S4.s - .2, 1.6);
        actor('sacha', lerp(560, 1330, sw), GROUND + 40, 270, { face: sw >= 1 ? -1 : 1, walk: sw > 0 && sw < 1 ? t * 9 : 0, reach: sLever > 0 });
        actor('milo', 410, GROUND + 40, 285);
        actor('naya', 250, GROUND + 40, 320);
        cross(A.tray[0], A.tray[1] - 60, 50, win(t, L.S4.s + 2.4, L.S4.e + .6, .3));
        glow(960, 420, 420, win(t, L.NY4.s, L.NY4.e, .5) * .6);
      },
    },
    {
      id: 'recap', title: "D'où viennent les pièces", phase: 'Formalisation', lead: .4, tail: 1.4,
      lines: [
        { id: 'N10', who: 'narr', text: 'Voilà d\'où viennent les pièces : du travail. Du temps, de l\'effort, et des compétences mises au service des autres.', pad: 1 },
        { id: 'N11', who: 'narr', text: "Les jetons circulent ensuite de main en main, et l'armoire les garde en sécurité pour leurs propriétaires.", pad: 1 },
        { id: 'NY5b', who: 'naya', text: 'Chaque métier demande du temps pour apprendre. C\'est aussi pour cela que le travail a de la valeur.', pad: .8 },
        { id: 'S5', who: 'sacha', text: 'Alors, si je veux des jetons, moi aussi, je peux proposer mon aide au potager !', pad: .8 },
      ],
      draw(t, L) {
        paper();
        const a1 = prog(t, .2, .6), a2 = prog(t, L.N10.s + 3.5, .6), a3 = prog(t, L.N11.s, .6), a4 = prog(t, L.N11.s + 3, .6);
        jauge(330, 300, 360, 1 - lin(t, L.N10.s + 4, 2) * .8, a1);
        arrow(420, 480, 600, 480, { lw: 10, head: 30, p: a2 });
        alpha(a2, () => { tokens(3, 720, 480, 30); });
        arrow(840, 480, 1000, 480, { lw: 10, head: 30, p: a3 });
        alpha(a3, () => { node('maraichere', 1100, 400, 60); node('meunier', 1100, 580, 60); arrow(1100, 400, 1100, 580, { col: GREEN, lw: 6, head: 20, cut1: 66, cut2: 66 }); });
        arrow(1200, 480, 1360, 480, { lw: 10, head: 30, p: a4 });
        alpha(a4, () => { c.save(); c.translate(1560, 640); c.scale(.6, .6); c.translate(-1560, -GROUND); armoire(1560, 1.1, {}); c.restore(); });
        const s = prog(t, L.S5.s, .5);
        alpha(s, () => { node('sacha', 960, 800, 80, { badge: 'binette' }); });
      },
    },
    {
      id: 'question', title: 'À toi de chercher', phase: 'Question ouverte', lead: .5, tail: 2,
      lines: [
        { id: 'NY5', who: 'naya', text: "À toi, maintenant ! Autour de toi, qui travaille ? Quel service rend cette personne, ou qu'est-ce qu'elle fabrique ?", pad: 1.2 },
        { id: 'NY6', who: 'naya', text: 'Et toi, quel service pourrais-tu rendre à ta famille ou à tes amis ?', pad: 1 },
      ],
      draw(t, L) {
        sky();
        actor('naya', 960, GROUND + 40, 360);
        ['binette', 'planche', 'pain', 'clous'].forEach((n, i) => chip(n, 360 + (i % 2) * 170, 360 + Math.floor(i / 2) * 170, 66, { a: prog(t, L.NY5.s + 1.5 + i * .5, .5) }));
        const q = prog(t, L.NY6.s + .8, .6);
        alpha(q, () => { actor('sacha', 1450, GROUND + 40, 270, { face: -1 }); chip('etoile', 1450, 420, 70, { ring: '#F4C542' }); });
      },
    },
  ];

  Moteur.episode({
    numero: 2,
    titre: "D'où Viennent les Pièces ?",
    notion: 'Travail, valeur ajoutée et rémunération',
    objectif: "Relier la monnaie au temps, à l'effort et aux compétences fournies.",
    cible: '5 min 00 s',
    dispositif: "Une jauge d'énergie et de temps se remplit pendant que les artisans travaillent, puis se condense en jetons de paiement.",
    suivant: 'Épisode 3 · La Boîte Rouge et la Boîte Verte',
    generique: ['milo', 'sacha', 'naya'],
    scenes,
  });
})();
