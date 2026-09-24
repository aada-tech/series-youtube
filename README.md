# Le Village des Trois Moulins

Série éducative YouTube sur la monnaie et l'économie pour les 6-9 ans (cycle 2), en 7 épisodes de 4 à 6 minutes.

- [Bible pédagogique et scénarisation](bible-pedagogique.md) : fondements, cadre déontologique, ergonomie multimédia, personnages, curriculum, fiches des 7 épisodes et sources.
- `episodes/epNN/` : chaque épisode (scènes animées dans `episode.js`, page de lecture `index.html`, script `voix-off.md`).
- `episodes/moteur.js` : décors, personnages, objets, lecteur et chronologie, communs à toute la série.

| Épisode | Titre | Durée actuelle |
| :---: | :--- | :---: |
| 1 | L'Énigme des Pommes et des Briques | 4 min 30 |
| 2 | D'où Viennent les Pièces ? | 4 min 46 |
| 3 | La Boîte Rouge et la Boîte Verte | 4 min 31 |
| 4 | L'Aventure du Choix Invisible | 4 min 16 |
| 5 | Le Pouvoir de la Patience | 5 min 25 |
| 6 | La Carte Magique n'est pas Magique ! | 4 min 42 |
| 7 | Le Grand Chantier de la Cabane | 5 min 52 |

Sans voix, la durée de chaque réplique est estimée à partir de son nombre de mots. Une fois la voix générée, l'animation se cale sur la durée réelle de l'audio.

## Installation (en local)

```sh
npm install                  # Playwright
npx playwright install chromium
brew install ffmpeg          # ou tout autre ffmpeg dans le PATH
python3 -m venv .venv && source .venv/bin/activate && pip install voxcpm soundfile
```

## Ajouter la voix à un épisode

1. **Voix des personnages** (une seule fois pour la série, avec VoxCPM2, open source sous licence Apache-2.0) :

   ```sh
   python tools/voix_voxcpm.py essais episodes/ep01          # 4 variantes par personnage dans out/voix/essais/
   python tools/voix_voxcpm.py choisir episodes/ep01 sacha 3 # fixe la voix de Sacha dans voix/
   ```

   Pour un personnage qui n'apparaît qu'à partir d'un épisode suivant (Milo, la maraîchère, l'épicière…), lancer `essais` et `choisir` sur cet épisode.

2. **Répliques de l'épisode** :

   ```sh
   python tools/voix_voxcpm.py generer episodes/ep02
   ```

   Un fichier `audio/NN-personnage.wav` par réplique, plus `audio/durees.js` qui cale l'animation sur la voix.

3. **Vidéo finale** :

   ```sh
   node tools/render.cjs episodes/ep02 --no-subs   # out/ep02.mp4, voix mixée
   node tools/render.cjs episodes/ep02             # out/ep02-sous-titres.mp4
   ```

   `--muet` exporte sans la piste audio, `--script-only` régénère seulement `voix-off.md`, `FFMPEG=/chemin/vers/ffmpeg` choisit le binaire ffmpeg.

Alternative payante pour les voix : `tools/voix.mjs` (ElevenLabs).

## Autres commandes

- `python tools/page.py "episodes/ep08=Titre"` : crée la page d'un nouvel épisode.
- `python tools/assemble.py` : regroupe les 7 épisodes dans une seule page autonome (`out/site/serie.html`).
- Dans un conteneur cloud derrière un proxy : `NODE_PATH=$(npm root -g) NODE_USE_ENV_PROXY=1 node tools/render.cjs ...`.
