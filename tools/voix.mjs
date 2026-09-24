// Casting et génération des voix d'un épisode avec l'API ElevenLabs (Node 18+, sans dépendance).
//
//   ELEVENLABS_API_KEY=... node tools/voix.mjs casting episodes/ep01
//       Cherche des voix françaises dans la bibliothèque partagée pour chaque personnage,
//       télécharge leurs extraits de présentation (gratuits) dans out/voix/casting/
//       et écrit la liste des candidates dans out/voix/casting.md.
//
//   ELEVENLABS_API_KEY=... node tools/voix.mjs essai episodes/ep01 sacha <voice_id>
//       Fait dire à une voix candidate la première réplique du personnage (consomme des crédits).
//
//   ELEVENLABS_API_KEY=... node tools/voix.mjs generer episodes/ep01
//       Génère un MP3 par réplique de voix-off.md avec les voix choisies dans
//       episodes/ep01/voix.json : { "narr": "<voice_id>", "sacha": "<voice_id>", ... }
//       Les fichiers sont écrits dans episodes/ep01/audio/ (NN-personnage.mp3).
import fs from 'node:fs';
import path from 'node:path';

const API = 'https://api.elevenlabs.io';
const KEY = process.env.ELEVENLABS_API_KEY;
const MODEL = process.env.ELEVENLABS_MODEL || 'eleven_multilingual_v2';
const [cmd, dir = 'episodes/ep01', ...rest] = process.argv.slice(2);

// Nom affiché dans voix-off.md -> clé du personnage, et critères de recherche dans la bibliothèque.
const ROLES = {
  narr:       { name: 'Narratrice',    gender: 'female', age: 'middle_aged', hint: 'narratrice chaleureuse, posée, claire' },
  sacha:      { name: 'Sacha',         gender: 'male',   age: 'young',       hint: 'enfant vif et enthousiaste (7 ans)' },
  naya:       { name: 'Naya',          gender: 'female', age: 'young',       hint: 'préadolescente calme et bienveillante (12 ans)' },
  menuisier:  { name: 'Le menuisier',  gender: 'male',   age: 'middle_aged', hint: 'homme grave et bonhomme' },
  forgeronne: { name: 'La forgeronne', gender: 'female', age: 'middle_aged', hint: 'femme franche et énergique' },
  bergere:    { name: 'La bergère',    gender: 'female', age: 'middle_aged', hint: 'femme douce' },
  meunier:    { name: 'Le meunier',    gender: 'male',   age: 'old',         hint: 'homme âgé, jovial' },
  milo:       { name: 'Milo',          gender: 'male',   age: 'young',       hint: 'enfant posé et précis (8 ans)' },
  maraichere: { name: 'La maraîchère', gender: 'female', age: 'middle_aged', hint: 'femme chaleureuse et joyeuse' },
  marchand:   { name: "L'artisan nomade", gender: 'male', age: 'middle_aged', hint: 'conteur vif, un peu théâtral' },
  mecanicienne: { name: 'La mécanicienne', gender: 'female', age: 'middle_aged', hint: 'femme claire et précise' },
  epiciere:   { name: "L'épicière",    gender: 'female', age: 'middle_aged', hint: 'commerçante accueillante' },
};
const byName = Object.fromEntries(Object.entries(ROLES).map(([k, r]) => [r.name, k]));

function die(msg) { console.error(msg); process.exit(1); }
if (!KEY) die('Définissez ELEVENLABS_API_KEY.');

async function api(p, opts = {}) {
  const res = await fetch(API + p, { ...opts, headers: { 'xi-api-key': KEY, 'content-type': 'application/json', ...(opts.headers || {}) } });
  if (!res.ok) throw new Error(`${opts.method || 'GET'} ${p} → ${res.status} ${await res.text()}`);
  return res;
}

// Lit les répliques de voix-off.md : "- `0:07` **Narratrice** : texte"
function lines() {
  const md = fs.readFileSync(path.join(dir, 'voix-off.md'), 'utf8');
  return [...md.matchAll(/^- `(\d+:\d\d)` \*\*(.+?)\*\* : (.+)$/gm)].map(([, tc, who, text], i) => {
    const role = byName[who];
    if (!role) die(`Personnage inconnu dans voix-off.md : ${who}`);
    return { n: i + 1, tc, role, text };
  });
}

async function tts(voiceId, text, file) {
  const body = { text, model_id: MODEL, voice_settings: { stability: 0.5, similarity_boost: 0.75, style: 0.3, use_speaker_boost: true } };
  const p = `/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`;
  let res;
  try { res = await api(p, { method: 'POST', body: JSON.stringify(body) }); }
  catch (e) {
    // Une voix de la bibliothèque partagée doit d'abord être ajoutée au compte.
    if (!/voice_not_found|404/.test(e.message)) throw e;
    const shared = await (await api(`/v1/shared-voices?voice_id=${voiceId}&page_size=1`)).json();
    const v = shared.voices?.[0];
    if (!v) throw e;
    await api(`/v1/voices/add/${v.public_owner_id}/${voiceId}`, { method: 'POST', body: JSON.stringify({ new_name: v.name }) });
    res = await api(p, { method: 'POST', body: JSON.stringify(body) });
  }
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, Buffer.from(await res.arrayBuffer()));
}

async function casting() {
  const used = new Set(lines().map(l => l.role));
  const out = ['# Casting des voix', '', `Épisode : ${dir}. Extraits dans out/voix/casting/.`, ''];
  for (const [key, r] of Object.entries(ROLES)) {
    if (!used.has(key)) continue;
    const q = new URLSearchParams({ language: 'fr', gender: r.gender, age: r.age, page_size: '6', sort: 'usage_character_count_1y' });
    const { voices = [] } = await (await api(`/v1/shared-voices?${q}`)).json();
    out.push(`## ${r.name} — ${r.hint}`, '');
    if (!voices.length) out.push('- Aucune voix trouvée avec ces critères.');
    for (const v of voices) {
      const file = path.join('out/voix/casting', `${key}-${v.voice_id}.mp3`);
      if (v.preview_url) {
        const res = await fetch(v.preview_url);
        if (res.ok) { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, Buffer.from(await res.arrayBuffer())); }
      }
      out.push(`- \`${v.voice_id}\` **${v.name}** (${[v.accent, v.age, v.gender, v.use_case].filter(Boolean).join(', ')}) : ${(v.description || '').replace(/\s+/g, ' ').slice(0, 160)}`);
    }
    out.push('');
  }
  fs.mkdirSync('out/voix', { recursive: true });
  fs.writeFileSync('out/voix/casting.md', out.join('\n'));
  console.log('Candidates listées dans out/voix/casting.md');
}

async function essai() {
  const [role, voiceId] = rest;
  if (!ROLES[role] || !voiceId) die('Usage : essai <dossier> <personnage> <voice_id>');
  const l = lines().find(x => x.role === role);
  if (!l) die(`${role} n'a pas de réplique dans cet épisode.`);
  const file = path.join('out/voix/essais', `${role}-${voiceId}.mp3`);
  await tts(voiceId, l.text, file);
  console.log(`Essai écrit dans ${file}`);
}

async function generer() {
  const cast = JSON.parse(fs.readFileSync(path.join(dir, 'voix.json'), 'utf8'));
  for (const l of lines()) {
    const voiceId = cast[l.role];
    if (!voiceId) die(`Aucune voix choisie pour « ${l.role} » dans voix.json.`);
    const file = path.join(dir, 'audio', `${String(l.n).padStart(2, '0')}-${l.role}.mp3`);
    if (fs.existsSync(file)) { console.log(`déjà fait : ${file}`); continue; }
    await tts(voiceId, l.text, file);
    console.log(`${l.tc} ${file}`);
  }
}

const cmds = { casting, essai, generer };
if (!cmds[cmd]) die('Commandes : casting | essai | generer (voir l\'en-tête du fichier).');
cmds[cmd]().catch(e => die(e.message));
