// Épisode 6 · La Carte Magique n'est pas Magique !
(() => {
  const { c, W, H, GROUND, INK, RED, GREEN, CLAY, PAPER, CAST, clamp, lerp, ease, prog, lin, win, rr, circ, ell, line, poly, alpha,
    person, actor, item, token, tokens, sky, paper, shop, stall, counter, bubble, cross, check, arrow, glow, bigText, panel, chip, node, fly, flyTokens, FD ,
    sparkle, burst, pop, rnd, rays } = Moteur;

  function ville() {
    const cols = ['#D9CBB8', '#C9B8A6', '#E3D6C3', '#BFB0A0', '#D2C1AD', '#C6D1D6'];
    [[0, 330], [210, 420], [380, 300], [600, 460], [820, 360], [1040, 430], [1260, 330], [1480, 480], [1700, 380]].forEach(([x, h], i) => {
      c.fillStyle = cols[i % cols.length]; c.fillRect(x, GROUND - h, 200, h);
      c.fillStyle = '#9FB8C6';
      for (let yy = GROUND - h + 40; yy < GROUND - 90; yy += 70) for (let xx = x + 30; xx < x + 180; xx += 60) c.fillRect(xx, yy, 34, 40);
    });
  }
  // Borne de paiement. state : 0 neutre, 1 accepté, -1 refusé.
  function borne(x, y, k, state = 0, price = 0) {
    c.fillStyle = '#3F4852'; rr(x - 60 * k, y - 110 * k, 120 * k, 110 * k, 16 * k); c.fill();
    c.fillStyle = state > 0 ? '#CFF1DC' : state < 0 ? '#F8D3D1' : '#DDE7EC'; rr(x - 46 * k, y - 96 * k, 92 * k, 50 * k, 8 * k); c.fill();
    if (state > 0) check(x, y - 71 * k, 18 * k); else if (state < 0) cross(x, y - 71 * k, 18 * k); else if (price) tokens(price, x, y - 71 * k, 7 * k, { gap: 15 * k });
    c.fillStyle = '#5D6875'; for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) { rr(x - 36 * k + i * 26 * k, y - 38 * k + j * 16 * k, 20 * k, 11 * k, 3 * k); c.fill(); }
  }
  function bip(x, y, p) {
    if (p <= 0 || p >= 1) return;
    alpha(1 - p, () => { c.strokeStyle = GREEN; c.lineWidth = 6; for (let i = 0; i < 3; i++) { circ(x, y, 30 + p * 80 + i * 22); c.stroke(); } });
  }
  // Réservoir d'un compte, vu en coupe.
  function reservoir(x, y, who, n, o = {}) {
    const w = 260, h = 190;
    if (o.hl) glow(x, y - h / 2, 240, o.hl);
    c.fillStyle = 'rgba(214,236,245,.6)'; rr(x - w / 2, y - h, w, h, 26); c.fill();
    c.save(); rr(x - w / 2, y - h, w, h, 26); c.clip();
    for (let j = 0; j < Math.max(0, Math.floor(n)); j++) token(x - w / 2 + 42 + (j % 5) * 44, y - 30 - Math.floor(j / 5) * 34, 19);
    c.restore();
    c.strokeStyle = '#7FA0AE'; c.lineWidth = 6; rr(x - w / 2, y - h, w, h, 26); c.stroke();
    node(who, x, y - h - 64, 54);
    bigText(String(Math.max(0, Math.floor(n))), x + w / 2 + 60, y - h / 2, 64, CLAY, 1, 700);
  }

  // Vue en coupe : en haut la boutique, en bas les comptes reliés par des tuyaux.
  // buys : [[objet, prix, instant]] ; un achat plus cher que le solde est refusé.
  function coupe(t, buys, o = {}) {
    const under = o.under ?? 1;
    let balance = 10, seller = 6, state = 0, price = 0;
    const flows = [], beeps = [];
    buys.forEach(([it, p, s]) => {
      const ok = balance >= p;
      if (t >= s) price = p;
      if (t >= s + .8 && t < s + 3.4) state = ok ? 1 : -1;
      if (ok) { flows.push([p, s + .9]); beeps.push(s); if (t >= s + 2.4) { balance -= p; seller += p; } }
    });
    c.fillStyle = PAPER; c.fillRect(0, 0, W, H);
    c.save(); c.translate(0, -330 * under);
    sky({ mills: false }); ville();
    const top = shop(1120, .9, '#C2577A', 'epiciere');
    borne(990, top, 1, state, price);
    const cur = buys.filter(([, , s]) => t >= s - 1).pop();
    if (cur) {
      const [it, p, s] = cur, refused = !beeps.includes(s);
      item(it, 1210, top - 40, 46, refused ? 1 : 1 - lin(t, s + 2.6, .6));
    }
    const client = actor('meunier', 780, GROUND - 10, 340, { reach: true });
    const cardIn = buys.some(([, , s]) => t > s - .6 && t < s + 1.6);
    item('carte', cardIn ? 950 : client.hx + 10, cardIn ? top - 70 : client.hy - 10, 30);
    beeps.forEach(s => bip(990, top - 70, lin(t, s + .1, .9)));
    c.restore();
    alpha(under, () => {
      c.fillStyle = PAPER; c.fillRect(0, 540, W, H - 540);
      c.strokeStyle = '#D7DDD3'; c.lineWidth = 4; line(0, 540, W, 540);
      c.strokeStyle = 'rgba(240,180,50,.9)'; c.lineWidth = 8; c.setLineDash([16, 12]); c.lineDashOffset = -t * 60;
      c.beginPath(); c.moveTo(990, 400); c.lineTo(990, 575); c.lineTo(640, 575); c.lineTo(640, 600); c.stroke(); c.setLineDash([]); c.lineDashOffset = 0;
      c.strokeStyle = '#9FBFCC'; c.lineWidth = 26; line(690, 820, 1230, 820);
      reservoir(560, 860, 'meunier', balance, { hl: o.hlClient || 0 });
      reservoir(1360, 860, 'epiciere', seller);
      flows.forEach(([p, s]) => { const q = lin(t, s, 1.5); if (q > 0 && q < 1) for (let j = 0; j < p; j++) { const qq = clamp(q * 1.6 - j * .12); if (qq > 0 && qq < 1) token(lerp(700, 1220, qq), 820, 16); } });
    });
    if (under > 0 && under < 1) { const yy = lerp(0, 1080, under); const g = c.createLinearGradient(0, yy - 60, 0, yy + 60); g.addColorStop(0, 'rgba(120,220,255,0)'); g.addColorStop(.5, 'rgba(170,240,255,.8)'); g.addColorStop(1, 'rgba(120,220,255,0)'); c.fillStyle = g; c.fillRect(0, yy - 60, W, 120); }
    const refused = buys.find(([, p, s]) => !beeps.includes(s) && t > s + .8 && t < s + 2);
    if (refused) { alpha(.22 * (1 + Math.sin(t * 20)) / 2, () => { c.fillStyle = RED; c.fillRect(0, 0, W, H); }); Moteur.shake(5); }
    Moteur.fg(false);
    return { balance };
  }
  const walk = (t, a, d) => { const p = prog(t, a, d); return [p, p > 0 && p < 1 ? t * 9 : 0]; };

  const scenes = [
    {
      id: 'bourg', title: 'Au bourg', phase: 'Interrogation initiale', lead: .6, tail: 1.4,
      lines: [
        { id: 'N1', who: 'narr', text: 'Aujourd\'hui, Naya emmène Sacha et Milo au bourg, la grande ville commerçante, de l\'autre côté de la rivière.', pad: .8 },
        { id: 'NY0', who: 'naya', text: 'Restez près de moi, le bourg est bien plus grand que notre village !', pad: .4 },
        { id: 'N2', who: 'narr', text: "Ici, les clients ne sortent pas de jetons. Ils approchent une carte d'une petite borne… bip ! Et ils repartent avec leurs achats.", pad: 1.6 },
        { id: 'S1', who: 'sacha', text: "Tu as vu ? Pas besoin de jetons ! Avec une carte, tout est gratuit !", pad: .2 },
        { id: 'S2', who: 'sacha', text: "Il m'en faut une. Comme ça, je pourrai acheter tout ce que je veux, autant que je veux !", pad: .4 },
        { id: 'M0', who: 'milo', text: "Gratuit ? Ça m'étonnerait. L'épicière ne donne pas son pain pour rien.", pad: .6 },
        { id: 'N3', who: 'narr', text: 'Alors, cette carte est-elle vraiment magique ?', pad: 1.2 },
      ],
      draw(t, L) {
        sky({ mills: false }); ville();
        const top = shop(1320, 1.05, '#C2577A', 'epiciere');
        borne(1190, top, 1.1, t > L.N2.s + 3.2 && t < L.N2.s + 5.5 ? 1 : 0, 3);
        const [pc, wc] = walk(t, L.N2.s, 2.6);
        const cl = actor('meunier', lerp(2100, 1560, pc), GROUND + 20, 380, { face: -1, walk: wc, reach: pc >= 1 && t < L.N2.s + 5 });
        item('carte', pc >= 1 && t > L.N2.s + 2.6 && t < L.N2.s + 4.6 ? 1150 : cl.hx - 10, pc >= 1 && t > L.N2.s + 2.6 && t < L.N2.s + 4.6 ? top - 80 : cl.hy - 10, 32);
        bip(1190, top - 80, lin(t, L.N2.s + 3, 1));
        if (t > L.N2.s + 4.5) item('pain', cl.hx - 10, cl.hy - 40, 40);
        actor('naya', 280, GROUND + 40, 330);
        actor('milo', 460, GROUND + 40, 285);
        const s = actor('sacha', 650, GROUND + 40, 270, { up: t > L.S1.s && t < L.S2.e });
        const b = win(t, L.S2.s + .4, L.S2.e + .2, .35);
        bubble(650, s.top - 150, 380, 190, 650, s.top - 12, b);
        ['toupie', 'longuevue', 'figurine', 'cerfvolant', 'bonbons', 'pinceaux'].forEach((n, i) => item(n, 530 + (i % 3) * 120, s.top - 190 + Math.floor(i / 3) * 80, 30, b));
        bigText('?', 960, 230, 110, CLAY, prog(t, L.N3.s + .4, .5), 700);
      },
    },
    {
      id: 'coupe', title: 'Ce que cache la borne', phase: 'Mise en situation', lead: .4, tail: 1.4, cam: false,
      lines: [
        { id: 'NY1', who: 'naya', text: 'Imaginons qu\'on puisse voir sous le magasin. Regardez bien ce qui se passe quand la borne fait bip.', pad: 1.2 },
        { id: 'NY2', who: 'naya', text: "La carte du meunier est reliée à son compte, comme par un tuyau. Dans ce compte, il y a l'argent qu'il a déjà gagné en travaillant au moulin.", pad: 1.2 },
        { id: 'N4', who: 'narr', text: 'Bip ! Le pain coûte trois jetons. Trois jetons quittent le compte du meunier… et arrivent dans celui de l\'épicière.', pad: 1.6 },
        { id: 'M1', who: 'milo', text: 'Il avait dix jetons. Il en reste sept. Exactement comme s\'il avait payé avec de vrais jetons !', pad: .6 },
        { id: 'N5', who: 'narr', text: 'Deuxième achat : un pot de miel, à cinq jetons. Bip ! Il en reste deux.', pad: 1.8 },
      ],
      draw(t, L) {
        coupe(t, [['pain', 3, L.N4.s + .6], ['miel', 5, L.N5.s + 1.6]], { under: prog(t, L.NY1.s + 1.5, 1), hlClient: win(t, L.NY2.s, L.NY2.e, .4) * .7 });
      },
    },
    {
      id: 'vide', title: 'Le compte vide', phase: 'Formalisation', lead: .4, tail: 1.4, cam: false,
      lines: [
        { id: 'N6', who: 'narr', text: 'Troisième achat : un beau fromage, à quatre jetons.', pad: .6 },
        { id: 'N7', who: 'narr', text: "Mais le compte n'en contient plus que deux. Le tuyau ne peut pas faire passer ce qui n'existe pas. La borne refuse.", pad: 1.4 },
        { id: 'S3', who: 'sacha', text: "Alors la carte ne crée pas d'argent… Elle va juste le chercher dans le compte !", pad: .4 },
        { id: 'NY3', who: 'naya', text: "Exactement. La carte, c'est une clé qui ouvre ton compte. Ce n'est pas une source d'argent.", pad: .6 },
        { id: 'E1', who: 'epiciere', text: 'Pas de souci, je vous le garde. Vous reviendrez le prendre quand votre compte sera de nouveau rempli.', pad: .8 },
      ],
      draw(t, L) {
        coupe(t + 100, [['pain', 3, -10], ['miel', 5, -5], ['fromage', 4, L.N6.s + 1.8 + 100]], { hlClient: win(t, L.N7.s, L.N7.s + 5, .4) * .7 });
        alpha(prog(t, L.S3.s + .5, .5) * (1 - prog(t, L.NY3.e, .5)), () => { panel(1400, 580, 400, 170); item('carte', 1500, 665, 50); arrow(1570, 665, 1660, 665, { lw: 7, head: 22 }); chip('jeton', 1720, 665, 40); });
      },
    },
    {
      id: 'remplir', title: 'Comment le compte se remplit', phase: 'Formalisation', lead: .4, tail: 1.4,
      lines: [
        { id: 'S3c', who: 'sacha', text: 'Mais alors, comment le compte du meunier se remplit-il ?', pad: .4 },
        { id: 'N9', who: 'narr', text: "Le meunier moud le blé pour tout le village. Chaque fois qu'un client le paie, les jetons arrivent dans son compte.", pad: 2.4 },
        { id: 'M3', who: 'milo', text: "Donc sa carte ne marche que parce qu'il a travaillé avant. Comme l'armoire du village !", pad: .6 },
        { id: 'NY3b', who: 'naya', text: "Oui. D'abord on gagne, ensuite on dépense. La carte ne change rien à cet ordre-là.", pad: 1 },
      ],
      draw(t, L) {
        paper();
        c.save(); c.translate(460, 720); c.scale(.8, .8); c.translate(-460, -GROUND); Moteur.windmill(460, GROUND, 1.4, t * .8); c.restore();
        node('meunier', 460, 800, 70);
        ['maraichere', 'bergere', 'menuisier'].forEach((w, i) => {
          const x = 960, y = 260 + i * 200;
          node(w, x, y, 62, { a: prog(t, L.N9.s + 1 + i * .8, .5), badge: 'farine' });
          const q = lin(t, L.N9.s + 2 + i * 1.6, 1.6);
          if (q > 0 && q < 1) flyTokens(3, x + 70, y, 1380, 700, q, 16, 60);
          burst(1400, 700, clamp((t - (L.N9.s + 3.6 + i * 1.6)) / .6), 50);
        });
        const n = 2 + Math.floor(lin(t, L.N9.s + 2, 4.8) * 9 + 1e-6);
        reservoir(1400, 800, 'meunier', n, {});
        arrow(1150, 700, 1250, 700, { lw: 6, head: 20, a: prog(t, L.M3.s, .5) });
        alpha(prog(t, L.M3.s, .5), () => item('carte', 1070, 700, 40));
      },
    },
    {
      id: 'invisible', title: "L'argent invisible", phase: 'Formalisation', lead: .4, tail: 1.4,
      lines: [
        { id: 'NY4', who: 'naya', text: "Avec des jetons dans la main, on voit tout de suite ce qu'il reste. Avec une carte, l'argent devient invisible.", pad: 1.4 },
        { id: 'M2', who: 'milo', text: 'Alors, avant de payer avec une carte, il faut vérifier combien il reste dans le compte.', pad: .6 },
        { id: 'S4', who: 'sacha', text: "Et compter dans sa tête, à chaque bip, comme si on donnait de vrais jetons.", pad: .6 },
        { id: 'N8b', who: 'narr', text: "Pour savoir où ils en sont, beaucoup d'adultes consultent le solde de leur compte, sur un écran ou sur un relevé.", pad: .8 },
        { id: 'N8', who: 'narr', text: "Payer avec une carte, c'est payer pour de vrai. L'argent quitte le compte, même quand on ne le voit pas bouger.", pad: 1.2 },
      ],
      draw(t, L) {
        paper();
        const n = 10 - Math.floor(lin(t, L.NY4.s + 1, 3) * 3 + 1e-6) * 1;
        panel(200, 180, 640, 520); panel(1080, 180, 640, 520);
        // à gauche : des jetons dans la main, visibles
        c.fillStyle = '#E9B48A'; ell(520, 560, 190, 70); c.fill();
        tokens(Math.max(0, n), 520, 500, 22, { gap: 30 });
        bigText(String(Math.max(0, n)), 520, 300, 80, CLAY, 1, 700);
        // à droite : la carte, et le solde caché puis vérifié
        item('carte', 1400, 360, 90);
        const peek = prog(t, L.M2.s + 1, .8);
        alpha(1 - peek, () => bigText('?', 1400, 560, 110, '#9AA3A8', 1, 700));
        alpha(peek, () => { borne(1400, 640, 1.4, 0, 0); bigText(String(Math.max(0, n)), 1400, 540, 60, CLAY, 1, 700); });
        node('milo', 1650, 800, 70, { a: prog(t, L.M2.s, .5) });
        node('sacha', 270, 800, 70, { a: prog(t, L.S4.s, .5) });
      },
    },
    {
      id: 'question', title: "Écoute le bip", phase: 'Question ouverte', lead: .5, tail: 2,
      lines: [
        { id: 'NY5', who: 'naya', text: "À toi, maintenant ! La prochaine fois qu'un adulte paie avec une carte, écoute bien le bip.", pad: 1 },
        { id: 'NY6', who: 'naya', text: "Et demande-lui : d'où vient cet argent ? Et où s'en va-t-il ?", pad: 1.4 },
      ],
      draw(t, L) {
        sky({ mills: false }); ville();
        actor('naya', 960, GROUND + 40, 360);
        alpha(prog(t, L.NY5.s + 1.5, .5), () => { borne(560, 520, 1.6, 0, 0); item('carte', 470, 360, 50); bip(560, 400, ((t - L.NY5.s) % 2) / 2); });
        alpha(prog(t, L.NY6.s + 1, .5), () => { chip('maison', 1360, 420, 70); arrow(1440, 420, 1560, 420, { lw: 8, head: 26 }); bigText('?', 1640, 420, 90, CLAY, 1, 700); });
      },
    },
  ];

  Moteur.episode({
    numero: 6,
    titre: "La Carte Magique n'est pas Magique !",
    notion: 'Dématérialisation et transactions numériques',
    objectif: 'Comprendre que la monnaie numérique correspond à un débit réel.',
    cible: '5 min 00 s',
    dispositif: "Une vue en coupe : en haut la carte touche la borne, en bas le compte relié par un tuyau lumineux baisse exactement du prix affiché.",
    suivant: 'Épisode 7 · Le Grand Chantier de la Cabane',
    generique: ['milo', 'sacha', 'naya'],
    scenes,
  });
})();
