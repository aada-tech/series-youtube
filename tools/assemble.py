"""Assemble les 7 épisodes dans une seule page autonome (lecteur avec onglets) : out/site/serie.html."""
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
eps = sorted(ROOT.glob("episodes/ep*/episode.js"))
parts = [(ROOT / "episodes/moteur.js").read_text(encoding="utf-8")]
for ep in eps:
    parts.append(ep.read_text(encoding="utf-8"))
    durees = ep.parent / "audio" / "durees.js"
    if durees.exists():
        parts.append(durees.read_text(encoding="utf-8"))
parts.append("Moteur.demarrer();")
html = """<title>Le Village des Trois Moulins</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:wght@400;700&family=Fredoka:wght@500;600;700&display=swap">
""" + "".join(f"<script>\n{p}\n</script>\n" for p in parts)
out = ROOT / "out/site/serie.html"
out.parent.mkdir(parents=True, exist_ok=True)
out.write_text(html, encoding="utf-8")
print(f"{out.relative_to(ROOT)} : {len(eps)} épisodes, {len(html) // 1024} Ko")
