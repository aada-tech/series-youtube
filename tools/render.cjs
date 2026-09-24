// Exporte un épisode animé en MP4 (image par image) et génère son script de voix off.
//
//   node tools/render.cjs episodes/ep01 [--fps 25] [--no-subs] [--script-only] [--muet]
//
// Si l'épisode a une voix (episodes/epNN/audio/ : un fichier NN-personnage.wav par réplique et durees.js),
// l'animation suit la durée réelle de chaque réplique et l'audio est mixé dans la vidéo (sauf avec --muet).
// Nécessite Playwright (Chromium) et ffmpeg. Le chemin de ffmpeg peut être fourni via FFMPEG.
// Dans un conteneur cloud : NODE_PATH=$(npm root -g) NODE_USE_ENV_PROXY=1 node tools/render.cjs ...
// Les polices Google sont téléchargées par Node (qui suit HTTPS_PROXY avec NODE_USE_ENV_PROXY=1
// et NODE_EXTRA_CA_CERTS) puis servies à Chromium.
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const { chromium } = require('playwright');

const args = process.argv.slice(2);
const dir = args.find(a => !a.startsWith('--')) || 'episodes/ep01';
const flag = name => args.includes(name);
const opt = (name, def) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : def; };
const fps = Number(opt('--fps', 25));
const subs = !flag('--no-subs');
const ffmpeg = process.env.FFMPEG || 'ffmpeg';
const name = path.basename(dir);
const out = opt('--out', path.join('out', `${name}${subs ? '-sous-titres' : ''}.mp4`));

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.route(/fonts\.(googleapis|gstatic)\.com/, async route => {
    const req = route.request();
    const res = await fetch(req.url(), { headers: { 'user-agent': req.headers()['user-agent'] } });
    await route.fulfill({
      status: res.status,
      headers: { 'content-type': res.headers.get('content-type') || 'application/octet-stream', 'access-control-allow-origin': '*' },
      body: Buffer.from(await res.arrayBuffer()),
    });
  });
  await page.goto('file://' + path.resolve(dir, 'index.html'));
  await page.waitForFunction(() => window.EP && window.EP.ready, null, { timeout: 20000 });

  const script = await page.evaluate(() => window.EP.script());
  fs.writeFileSync(path.join(dir, 'voix-off.md'), script + '\n');
  console.log(`Script écrit dans ${path.join(dir, 'voix-off.md')}`);
  if (flag('--script-only')) return browser.close();

  const T = await page.evaluate(() => window.EP.T);
  const frames = Math.ceil(T * fps);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  const ff = spawn(ffmpeg, ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-c:v', 'mjpeg', '-framerate', String(fps), '-i', '-',
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '20', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', out], { stdio: ['pipe', 'inherit', 'inherit'] });
  const done = new Promise((res, rej) => ff.on('close', code => code === 0 ? res() : rej(new Error('ffmpeg a échoué (' + code + ')'))));

  for (let i = 0; i < frames; i++) {
    const b64 = await page.evaluate(([t, s]) => window.EP.frame(t, s), [i / fps, subs]);
    if (!ff.stdin.write(Buffer.from(b64, 'base64'))) await new Promise(r => ff.stdin.once('drain', r));
    if (i % (fps * 20) === 0) console.log(`${Math.round(i / fps)} s / ${Math.round(T)} s`);
  }
  ff.stdin.end();
  await done;

  const audioDir = path.join(dir, 'audio');
  const wavs = fs.existsSync(audioDir) ? fs.readdirSync(audioDir).filter(f => /^\d+-.+\.wav$/.test(f)) : [];
  if (wavs.length && !flag('--muet')) {
    const lignes = await page.evaluate(() => window.EP.lignes());
    const inputs = [], filters = [];
    for (const l of lignes) {
      const f = wavs.find(w => Number(w.split('-')[0]) === l.n);
      if (!f) { console.warn(`Pas d'audio pour la réplique ${l.n}`); continue; }
      inputs.push('-i', path.join(audioDir, f));
      const ms = Math.round(l.gs * 1000);
      filters.push(`[${inputs.length / 2}:a]adelay=${ms}:all=1[a${inputs.length / 2}]`);
    }
    const n = inputs.length / 2;
    const graph = filters.join(';') + ';' + Array.from({ length: n }, (_, i) => `[a${i + 1}]`).join('') + `amix=inputs=${n}:normalize=0[voix]`;
    const muxed = out.replace(/\.mp4$/, '.voix.mp4');
    await new Promise((res, rej) => spawn(ffmpeg, ['-y', '-loglevel', 'error', '-i', out, ...inputs, '-filter_complex', graph,
      '-map', '0:v', '-map', '[voix]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-t', String(T), muxed], { stdio: 'inherit' })
      .on('close', code => code === 0 ? res() : rej(new Error('mixage audio échoué (' + code + ')'))));
    fs.renameSync(muxed, out);
    console.log(`Voix mixée : ${n} répliques`);
  }
  await browser.close();
  console.log(`Vidéo écrite dans ${out} (${T.toFixed(1)} s, ${fps} i/s)`);
})().catch(e => { console.error(e); process.exit(1); });
