// Prépare tout ce qu'il faut pour publier la série sur YouTube, dans youtube/ :
//   miniatures (1280 × 720), bannière (2560 × 1440) et logo (800 × 800) de la chaîne, dessinés par youtube/visuels.html ;
//   sous-titres .srt de chaque épisode (minutage réel, après la génération des voix) ;
//   chapitres de chaque épisode (youtube/chapitres.json, repris dans les fiches).
//   Avec --apercus : extraits animés (GIF) pour le README, à partir des vidéos out/epNN.mp4.
//
//   node tools/youtube.cjs [--apercus]
const path = require('path');
const fs = require('fs');
const { execFileSync } = require('child_process');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'youtube');
const EPS = fs.readdirSync(path.join(ROOT, 'episodes')).filter(d => /^ep\d\d$/.test(d)).sort();
const ffmpeg = process.env.FFMPEG || 'ffmpeg';

const srtTime = s => {
  const ms = Math.round(s * 1000), h = Math.floor(ms / 3600000), m = Math.floor(ms / 60000) % 60, sec = Math.floor(ms / 1000) % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')},${String(ms % 1000).padStart(3, '0')}`;
};
const chapTime = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

  // Visuels
  await page.goto('file://' + path.join(OUT, 'visuels.html'));
  await page.evaluate(() => window.pret);
  fs.mkdirSync(path.join(OUT, 'miniatures'), { recursive: true });
  fs.mkdirSync(path.join(OUT, 'chaine'), { recursive: true });
  for (const ep of EPS) {
    const n = String(Number(ep.slice(2)));
    fs.writeFileSync(path.join(OUT, 'miniatures', `${ep}.jpg`), Buffer.from(await page.evaluate(n => window.exporter(n, 1280, 720), n), 'base64'));
  }
  fs.writeFileSync(path.join(OUT, 'chaine', 'banniere.jpg'), Buffer.from(await page.evaluate(() => window.exporter('banniere', 2560, 1440)), 'base64'));
  fs.writeFileSync(path.join(OUT, 'chaine', 'logo.png'), Buffer.from(await page.evaluate(() => window.exporter('logo', 800, 800, [510, 90, 900, 900])), 'base64'));
  console.log(`Visuels : ${EPS.length} miniatures, bannière, logo`);

  // Sous-titres et chapitres, depuis la chronologie de chaque épisode (calée sur la voix si elle existe).
  fs.mkdirSync(path.join(OUT, 'sous-titres'), { recursive: true });
  const chapitres = {};
  for (const ep of EPS) {
    await page.goto('file://' + path.join(ROOT, 'episodes', ep, 'index.html'));
    await page.waitForFunction(() => window.EP && window.EP.ready, null, { timeout: 20000 });
    const T = await page.evaluate(() => window.EP.T);
    const lignes = await page.evaluate(() => window.EP.lignes());
    const md = fs.readFileSync(path.join(ROOT, 'episodes', ep, 'voix-off.md'), 'utf8');
    const textes = [...md.matchAll(/^- `\d+:\d\d` \*\*(.+?)\*\* : (.+)$/gm)].map(m => ({ who: m[1], text: m[2] }));
    const srt = lignes.map((l, i) => {
      const t = textes[i] ? textes[i].text : '';
      return `${i + 1}\n${srtTime(l.gs)} --> ${srtTime(l.gs + Math.max(1, l.d - .6))}\n${t}\n`;
    }).join('\n');
    fs.writeFileSync(path.join(OUT, 'sous-titres', `${ep}.srt`), srt);
    // Chapitres : « ## 0:07 · Titre (phase) » dans voix-off.md, régénéré par render.cjs.
    const chaps = [...md.matchAll(/^## (\d+:\d\d) · (.+?) \((.+)\)$/gm)].map(m => ({ t: m[1], titre: m[2] }));
    if (chaps.length && chaps[0].t !== '0:00') chaps.unshift({ t: '0:00', titre: 'Générique' });
    chapitres[ep] = { duree: chapTime(T), chapitres: chaps };
  }
  fs.writeFileSync(path.join(OUT, 'chapitres.json'), JSON.stringify(chapitres, null, 2) + '\n');
  console.log(`Sous-titres et chapitres : ${EPS.length} épisodes`);
  await browser.close();

  // Fiches de publication, prêtes à copier dans YouTube Studio.
  const data = JSON.parse(fs.readFileSync(path.join(OUT, 'episodes.json'), 'utf8'));
  fs.mkdirSync(path.join(OUT, 'fiches'), { recursive: true });
  data.episodes.forEach((e, i) => {
    const ch = chapitres[e.id] || { duree: '?', chapitres: [] };
    const md = fs.readFileSync(path.join(ROOT, 'episodes', e.id, 'voix-off.md'), 'utf8');
    const naya = [...md.matchAll(/^- `\d+:\d\d` \*\*Naya\*\* : (.+)$/gm)].map(m => m[1]).slice(-2).join(' ');
    const date = new Date(data.lancement + 'T12:00:00Z'); date.setUTCDate(date.getUTCDate() + 7 * i);
    const jour = date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
    const suivant = data.episodes[i + 1];
    const description = [
      e.accroche, '',
      e.resume, '',
      '🎯 Ce que l\'enfant apprend :', ...e.objectifs.map(o => `• ${o}`), '',
      '💬 La question de Naya, à faire à la maison :', naya, '',
      '👨‍👩‍👧 Pour les parents et les enseignants :',
      `Série pour les 6-9 ans (cycle 2 : CP, CE1, CE2), épisode ${i + 1} sur ${data.episodes.length}. Regardez l'épisode ensemble, puis parlez de la question de Naya avec un exemple de la vie de tous les jours : c'est là que l'enfant retient le mieux. Aucune marque, aucune banque, aucune publicité dans la série.`, '',
      ...(ch.chapitres.length >= 3 ? ['⏱️ Chapitres :', ...ch.chapitres.map(c => `${c.t} ${c.titre}`), ''] : []),
      suivant ? `➡️ Épisode suivant : ${suivant.titre_serie} (publié le mercredi suivant)` : '🎉 C\'est le dernier épisode de la série ! Retrouvez les 7 épisodes dans la playlist.', '',
      `📺 ${data.serie} : 7 petits épisodes pour comprendre l'argent, du troc au budget.`,
      'Animation dessinée en code (JavaScript), voix de synthèse. Texte et pédagogie : bible pédagogique de la série.', '',
      data.hashtags.join(' '),
    ].join('\n');
    const tags = [...e.tags, ...data.tags_communs];
    const fiche = [
      `# Épisode ${i + 1} · ${e.titre_serie}`, '',
      `![Miniature](../miniatures/${e.id}.jpg)`, '',
      '| Réglage | Valeur |', '| :--- | :--- |',
      `| Publication | ${jour} à ${data.heure} (programmée) |`,
      `| Durée | ${ch.duree} |`,
      `| Vidéo | \`out/${e.id}.mp4\` (\`node tools/render.cjs episodes/${e.id} --no-subs\`) |`,
      `| Miniature | \`youtube/miniatures/${e.id}.jpg\` |`,
      `| Sous-titres | \`youtube/sous-titres/${e.id}.srt\` (français) |`,
      '| Public | **Oui, cette vidéo est conçue pour les enfants** |',
      '| Catégorie | Éducation |',
      '| Langue | Français |',
      `| Playlist | ${data.serie} |`, '',
      '## Titre', '', '```', e.titre, '```', '',
      '## Description', '', '```', description, '```', '',
      '## Tags', '', '```', tags.join(', '), '```', '',
    ].join('\n');
    fs.writeFileSync(path.join(OUT, 'fiches', `${e.id}.md`), fiche);
    if (e.titre.length > 100) console.warn(`Titre trop long (${e.titre.length} caractères) : ${e.id}`);
    if (tags.join(', ').length > 500) console.warn(`Tags trop longs : ${e.id}`);
  });
  console.log(`Fiches : youtube/fiches/ (${data.episodes.length})`);

  // Tableau des épisodes du README (entre les marqueurs episodes:debut et episodes:fin).
  const readme = path.join(ROOT, 'README.md');
  const rows = data.episodes.map((e, i) => `| <img src="docs/apercus/${e.id}.gif" width="240" alt="Extrait de l'épisode ${i + 1}"> | **${i + 1} · ${e.titre_serie}**<br>[voir l'épisode](episodes/${e.id}/index.html) · [fiche YouTube](youtube/fiches/${e.id}.md) | ${e.objectifs[0]} | ${(chapitres[e.id] || {}).duree || ''} |`);
  const table = ['<!-- episodes:debut -->', '| | Épisode | Ce qu\'on apprend | Durée |', '| :---: | :--- | :--- | :---: |', ...rows, '<!-- episodes:fin -->'].join('\n');
  fs.writeFileSync(readme, fs.readFileSync(readme, 'utf8').replace(/<!-- episodes:debut -->[\s\S]*<!-- episodes:fin -->/, table));

  // Extraits animés pour le README (GIF 480 px, 4 s, palette optimisée).
  if (process.argv.includes('--apercus')) {
    const dir = path.join(ROOT, 'docs', 'apercus');
    fs.mkdirSync(dir, { recursive: true });
    const moments = JSON.parse(fs.readFileSync(path.join(OUT, 'apercus.json'), 'utf8'));
    for (const ep of EPS) {
      const mp4 = path.join(ROOT, 'out', `${ep}.mp4`);
      if (!fs.existsSync(mp4)) { console.warn(`Pas de vidéo ${mp4}`); continue; }
      execFileSync(ffmpeg, ['-y', '-loglevel', 'error', '-ss', String(moments[ep] || 30), '-t', '4', '-i', mp4,
        '-vf', 'fps=12,scale=480:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=96[p];[b][p]paletteuse=dither=bayer:bayer_scale=4',
        path.join(dir, `${ep}.gif`)]);
    }
    console.log('Extraits animés écrits dans docs/apercus/');
    // Planche des miniatures pour les README.
    execFileSync(ffmpeg, ['-y', '-loglevel', 'error', '-pattern_type', 'glob', '-i', path.join(OUT, 'miniatures', '*.jpg'),
      '-vf', 'scale=480:-1,pad=iw+8:ih+8:4:4:white,tile=4x2:color=white', '-frames:v', '1', '-q:v', '3', path.join(ROOT, 'docs', 'miniatures.jpg')]);

    // Bande-annonce : un extrait de chaque épisode, voix de la narratrice, carton final.
    const tmp = path.join(ROOT, 'out', 'bande-annonce'); fs.mkdirSync(tmp, { recursive: true });
    const texte = "Bienvenue au Village des Trois Moulins ! Ici, Sacha, Milo et Naya découvrent à quoi sert l'argent. "
      + "Pourquoi a-t-on inventé la monnaie ? D'où viennent les pièces ? Besoin, ou envie ? Et la carte bancaire… est-elle vraiment magique ? "
      + "Sept petites aventures pour comprendre l'argent, du troc jusqu'au budget. Un nouvel épisode, chaque mercredi !";
    execFileSync(path.join(ROOT, '.venv', 'bin', 'edge-tts'), ['--voice', 'fr-FR-DeniseNeural', '--rate', '+4%', '--text', texte, '--write-media', path.join(tmp, 'voix.mp3')]);
    const parts = [];
    EPS.forEach((ep, i) => {
      const mp4 = path.join(ROOT, 'out', `${ep}.mp4`); if (!fs.existsSync(mp4)) return;
      const f = path.join(tmp, `${i}.mp4`);
      execFileSync(ffmpeg, ['-y', '-loglevel', 'error', '-ss', String(moments[ep] || 30), '-t', '4.2', '-i', mp4, '-an',
        '-vf', 'fps=25,scale=1920:1080,fade=t=in:st=0:d=0.3,fade=t=out:st=3.9:d=0.3', '-c:v', 'libx264', '-crf', '20', '-pix_fmt', 'yuv420p', f]);
      parts.push(f);
    });
    const fin = path.join(tmp, 'fin.mp4');
    execFileSync(ffmpeg, ['-y', '-loglevel', 'error', '-loop', '1', '-t', '5', '-i', path.join(OUT, 'chaine', 'banniere.jpg'),
      '-vf', 'fps=25,scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080,fade=t=in:st=0:d=0.4', '-c:v', 'libx264', '-crf', '20', '-pix_fmt', 'yuv420p', fin]);
    parts.push(fin);
    fs.writeFileSync(path.join(tmp, 'liste.txt'), parts.map(p => `file '${p}'`).join('\n'));
    execFileSync(ffmpeg, ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', path.join(tmp, 'liste.txt'), '-i', path.join(tmp, 'voix.mp3'),
      '-filter_complex', '[1:a]adelay=600:all=1,apad[a]', '-map', '0:v', '-map', '[a]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart',
      path.join(ROOT, 'out', 'bande-annonce.mp4')]);
    console.log('Bande-annonce écrite dans out/bande-annonce.mp4');
  }
})().catch(e => { console.error(e); process.exit(1); });
