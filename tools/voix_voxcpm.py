"""Voix des personnages avec VoxCPM2 (open source, Apache-2.0), à lancer en local.

Installation (Mac Apple Silicon ou PC avec GPU NVIDIA) :
    python3 -m venv .venv && source .venv/bin/activate
    pip install voxcpm soundfile

1. Essais : chaque personnage dit sa première réplique avec plusieurs graines (seeds).
       python tools/voix_voxcpm.py essais episodes/ep01
   → out/voix/essais/<personnage>-seed<N>.wav

2. Choix : la version retenue devient la voix de référence du personnage pour toute la série.
       python tools/voix_voxcpm.py choisir episodes/ep01 sacha 3
   → voix/sacha.wav et voix/voix.json (à versionner)

3. Génération : chaque réplique de voix-off.md, dite avec la voix de référence.
       python tools/voix_voxcpm.py generer episodes/ep01
   → episodes/ep01/audio/NN-<personnage>.wav (une réplique déjà générée avec le même texte est sautée)
   → episodes/ep01/audio/durees.js : l'animation se cale sur la durée réelle de chaque réplique.

4. Vidéo finale avec la voix (Playwright et ffmpeg installés) :
       node tools/render.cjs episodes/ep01 --no-subs

Les voix sont créées à partir d'une description écrite (« voice design ») : aucune voix réelle,
et en particulier aucune voix d'enfant réelle, n'est clonée.
"""
import hashlib
import json
import re
import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
VOIX = ROOT / "voix"
CAST_FILE = VOIX / "voix.json"

# Nom affiché dans voix-off.md -> (clé, description de la voix pour VoxCPM2).
ROLES = {
    "Narratrice": ("narr", "A warm adult woman storyteller speaking French, calm, clear and friendly, measured pace"),
    "Sacha": ("sacha", "A lively 7-year-old boy speaking French, bright, cheerful and enthusiastic, slightly fast"),
    "Naya": ("naya", "A kind 12-year-old girl speaking French, calm, gentle and thoughtful, curious tone"),
    "Milo": ("milo", "A careful 8-year-old boy speaking French, precise and thoughtful, steady pace"),
    "Le menuisier": ("menuisier", "A middle-aged man speaking French, deep, round and good-natured voice"),
    "La forgeronne": ("forgeronne", "A strong adult woman speaking French, frank, energetic and cheerful"),
    "La bergère": ("bergere", "An adult woman speaking French, soft and gentle voice"),
    "Le meunier": ("meunier", "An older man speaking French, jovial and slightly husky voice"),
    "La maraîchère": ("maraichere", "An adult woman gardener speaking French, warm, grounded and cheerful"),
    "L'artisan nomade": ("marchand", "A traveling craftsman speaking French, lively storyteller voice, slightly theatrical"),
    "La mécanicienne": ("mecanicienne", "An adult woman mechanic speaking French, clear, confident and precise"),
    "L'épicière": ("epiciere", "A friendly adult woman shopkeeper speaking French, bright and welcoming"),
}
SEEDS = [1, 2, 3, 4]
GEN = dict(cfg_value=2.0, inference_timesteps=10)


def die(msg):
    print(msg, file=sys.stderr)
    sys.exit(1)


def lines(ep_dir):
    md = (ep_dir / "voix-off.md").read_text(encoding="utf-8")
    out = []
    for i, (tc, who, text) in enumerate(re.findall(r"^- `(\d+:\d\d)` \*\*(.+?)\*\* : (.+)$", md, re.M), 1):
        if who not in ROLES:
            die(f"Personnage inconnu dans voix-off.md : {who}")
        out.append({"n": i, "tc": tc, "role": ROLES[who][0], "who": who, "text": text})
    return out


def model():
    from voxcpm import VoxCPM
    return VoxCPM.from_pretrained("openbmb/VoxCPM2", load_denoiser=False)


def save(m, wav, path):
    import soundfile as sf
    path.parent.mkdir(parents=True, exist_ok=True)
    sf.write(str(path), wav, m.tts_model.sample_rate)


def load_cast():
    return json.loads(CAST_FILE.read_text(encoding="utf-8")) if CAST_FILE.exists() else {}


def essais(ep_dir, only=None):
    firsts = {}
    for l in lines(ep_dir):
        firsts.setdefault(l["role"], l)
    m = model()
    desc = {k: d for k, d in ROLES.values()}
    for role, l in firsts.items():
        if only and role != only:
            continue
        for seed in SEEDS:
            path = ROOT / "out/voix/essais" / f"{role}-seed{seed}.wav"
            wav = m.generate(text=f"({desc[role]}){l['text']}", seed=seed, **GEN)
            save(m, wav, path)
            print(path.relative_to(ROOT))


def choisir(ep_dir, role, seed):
    src = ROOT / "out/voix/essais" / f"{role}-seed{seed}.wav"
    if not src.exists():
        die(f"Essai introuvable : {src}")
    l = next((x for x in lines(ep_dir) if x["role"] == role), None)
    VOIX.mkdir(exist_ok=True)
    shutil.copy(src, VOIX / f"{role}.wav")
    cast = load_cast()
    desc = {k: d for k, d in ROLES.values()}
    cast[role] = {"description": desc[role], "seed": int(seed), "reference": f"{role}.wav", "transcript": l["text"]}
    CAST_FILE.write_text(json.dumps(cast, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Voix de {role} fixée : voix/{role}.wav")


def generer(ep_dir):
    cast = load_cast()
    todo = lines(ep_dir)
    missing = sorted({l["role"] for l in todo} - cast.keys())
    if missing:
        die("Voix non choisies : " + ", ".join(missing) + " (lancez « essais » puis « choisir »).")
    audio = ep_dir / "audio"
    manifest_path = audio / "manifest.json"
    manifest = json.loads(manifest_path.read_text(encoding="utf-8")) if manifest_path.exists() else {}
    m = None
    for l in todo:
        c = cast[l["role"]]
        name = f"{l['n']:02d}-{l['role']}.wav"
        key = hashlib.md5(json.dumps([l["text"], c], ensure_ascii=False).encode()).hexdigest()
        if manifest.get(name, {}).get("hash") == key and (audio / name).exists():
            print(f"déjà fait : {name}")
            continue
        m = m or model()
        ref = str(VOIX / c["reference"])
        wav = m.generate(text=l["text"], prompt_wav_path=ref, prompt_text=c["transcript"],
                         reference_wav_path=ref, seed=c["seed"], **GEN)
        save(m, wav, audio / name)
        manifest[name] = {"hash": key, "role": l["role"], "text": l["text"], "seconds": round(len(wav) / m.tts_model.sample_rate, 3)}
        manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        print(f"{l['tc']} {name} ({manifest[name]['seconds']} s)")
    write_durees(ep_dir, todo, manifest)


def write_durees(ep_dir, todo, manifest):
    numero = int(re.sub(r"\D", "", ep_dir.name) or 0)
    d = {}
    for l in todo:
        entry = manifest.get(f"{l['n']:02d}-{l['role']}.wav")
        if entry:
            d[str(l["n"])] = entry["seconds"]
    js = f"Moteur.durees({numero}, {json.dumps(d)});\n"
    (ep_dir / "audio" / "durees.js").write_text(js, encoding="utf-8")
    print(f"Durées écrites dans {ep_dir.name}/audio/durees.js ({len(d)} répliques)")


if __name__ == "__main__":
    args = sys.argv[1:]
    if not args or args[0] not in ("essais", "choisir", "generer"):
        die(__doc__)
    ep = ROOT / (args[1] if len(args) > 1 else "episodes/ep01")
    if args[0] == "essais":
        essais(ep, args[2] if len(args) > 2 else None)
    elif args[0] == "choisir":
        if len(args) < 4:
            die("Usage : choisir <épisode> <personnage> <seed>")
        choisir(ep, args[2], args[3])
    else:
        generer(ep)
