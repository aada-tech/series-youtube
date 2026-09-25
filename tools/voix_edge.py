"""Voix des personnages avec les voix neurales françaises de Microsoft Edge (gratuit, sans clé ni GPU).

Installation :
    python3 -m venv .venv && .venv/bin/pip install edge-tts

Génération (chaque réplique de voix-off.md, avec la voix de son personnage définie dans ROLES) :
    .venv/bin/python tools/voix_edge.py episodes/ep01            # un épisode
    .venv/bin/python tools/voix_edge.py episodes/ep0*            # toute la série
    .venv/bin/python tools/voix_edge.py --essais episodes/ep05   # première réplique de chaque personnage, dans out/voix/edge/

→ episodes/epNN/audio/NN-<personnage>.wav, manifest.json et durees.js (comme tools/voix_voxcpm.py) :
  l'animation se cale sur la durée réelle de chaque réplique et tools/render.cjs mixe la voix dans la vidéo.
  Une réplique déjà générée avec le même texte et la même voix est sautée.

Nécessite ffmpeg (conversion en WAV et mesure des durées).
Pour une chaîne monétisée, les mêmes voix existent sur Azure Speech (niveau gratuit F0, usage commercial autorisé).
"""
import asyncio
import hashlib
import json
import re
import subprocess
import sys
import tempfile
from pathlib import Path

import edge_tts

ROOT = Path(__file__).resolve().parent.parent

# Nom affiché dans voix-off.md -> (clé, voix Edge, débit, hauteur).
ROLES = {
    "Narratrice": ("narr", "fr-FR-DeniseNeural", "+0%", "+0Hz"),
    "Sacha": ("sacha", "fr-FR-EloiseNeural", "+8%", "+0Hz"),
    "Naya": ("naya", "fr-FR-VivienneMultilingualNeural", "-5%", "+25Hz"),
    "Milo": ("milo", "fr-FR-EloiseNeural", "-8%", "-14Hz"),
    "Le menuisier": ("menuisier", "fr-FR-HenriNeural", "-5%", "-8Hz"),
    "La forgeronne": ("forgeronne", "fr-BE-CharlineNeural", "+5%", "+0Hz"),
    "La bergère": ("bergere", "fr-CH-ArianeNeural", "-5%", "+0Hz"),
    "Le meunier": ("meunier", "fr-FR-RemyMultilingualNeural", "-5%", "-12Hz"),
    "La maraîchère": ("maraichere", "fr-CA-SylvieNeural", "+0%", "+0Hz"),
    "L'artisan nomade": ("marchand", "fr-BE-GerardNeural", "+5%", "+0Hz"),
    "La mécanicienne": ("mecanicienne", "fr-CH-ArianeNeural", "+6%", "-10Hz"),
    "L'épicière": ("epiciere", "fr-BE-CharlineNeural", "+0%", "+15Hz"),
}


def die(msg):
    print(msg, file=sys.stderr)
    sys.exit(1)


def lines(ep_dir):
    md = (ep_dir / "voix-off.md").read_text(encoding="utf-8")
    out = []
    for i, (tc, who, text) in enumerate(re.findall(r"^- `(\d+:\d\d)` \*\*(.+?)\*\* : (.+)$", md, re.M), 1):
        if who not in ROLES:
            die(f"Personnage inconnu dans {ep_dir.name}/voix-off.md : {who} (ajoutez-le à ROLES)")
        out.append({"n": i, "tc": tc, "who": who, "text": text})
    return out


def seconds(path):
    out = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(path)],
                         capture_output=True, text=True, check=True).stdout
    return round(float(out), 3)


async def say(text, who, wav):
    _, voice, rate, pitch = ROLES[who]
    with tempfile.NamedTemporaryFile(suffix=".mp3") as mp3:
        await edge_tts.Communicate(text, voice, rate=rate, pitch=pitch).save(mp3.name)
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", mp3.name, "-ac", "1", "-ar", "24000", str(wav)], check=True)


async def generer(ep_dir):
    audio = ep_dir / "audio"
    audio.mkdir(exist_ok=True)
    manifest_path = audio / "manifest.json"
    manifest = json.loads(manifest_path.read_text(encoding="utf-8")) if manifest_path.exists() else {}
    todo = lines(ep_dir)
    names = []
    for l in todo:
        role = ROLES[l["who"]][0]
        name = f"{l['n']:02d}-{role}.wav"
        names.append(name)
        key = hashlib.md5(json.dumps([l["text"], ROLES[l["who"]]], ensure_ascii=False).encode()).hexdigest()
        if manifest.get(name, {}).get("hash") == key and (audio / name).exists():
            continue
        await say(l["text"], l["who"], audio / name)
        manifest[name] = {"hash": key, "role": role, "voice": ROLES[l["who"]][1], "text": l["text"], "seconds": seconds(audio / name)}
        print(f"{ep_dir.name} {l['tc']} {name} ({manifest[name]['seconds']} s)")
    for stale in set(manifest) - set(names):
        manifest.pop(stale)
        (audio / stale).unlink(missing_ok=True)
    manifest = {k: manifest[k] for k in sorted(manifest)}
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    numero = int(re.sub(r"\D", "", ep_dir.name) or 0)
    d = {str(l["n"]): manifest[n]["seconds"] for l, n in zip(todo, names)}
    (audio / "durees.js").write_text(f"Moteur.durees({numero}, {json.dumps(d)});\n", encoding="utf-8")
    print(f"{ep_dir.name} : {len(d)} répliques, {sum(d.values()):.0f} s de voix")


async def essais(ep_dir):
    firsts = {}
    for l in lines(ep_dir):
        firsts.setdefault(l["who"], l)
    out = ROOT / "out/voix/edge"
    out.mkdir(parents=True, exist_ok=True)
    for who, l in firsts.items():
        path = out / f"{ep_dir.name}-{ROLES[who][0]}.wav"
        await say(l["text"], who, path)
        print(path.relative_to(ROOT))


if __name__ == "__main__":
    args = sys.argv[1:]
    test = "--essais" in args
    dirs = [Path(a) for a in args if not a.startswith("--")] or [ROOT / "episodes/ep01"]
    for d in dirs:
        asyncio.run(essais(d) if test else generer(d))
