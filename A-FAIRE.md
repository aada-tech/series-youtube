# Où on en est

## Déjà fait

- La [bible pédagogique](bible-pedagogique.md) : les 7 épisodes, les personnages et le cadre.
- L'**épisode 1** (*L'Énigme des Pommes et des Briques*, 4 min 30) :
  - l'animatique complète dans [`episodes/ep01/index.html`](episodes/ep01/index.html), qu'on peut prévisualiser dans le navigateur ;
  - le [script de voix off](episodes/ep01/voix-off.md) : 31 répliques, 8 personnages ;
  - l'export vidéo avec sous-titres (`tools/render.cjs`, voir le [README](README.md)).
- Le script des voix [`tools/voix_voxcpm.py`](tools/voix_voxcpm.py) (VoxCPM2, open source).

## Ce qu'il reste à faire : les voix

On n'a pas pu les faire dans le cloud : Hugging Face y est bloqué et il n'y a pas de GPU. Il faut donc les faire en local (sur un Mac Apple Silicon ou un PC avec une carte NVIDIA).

1. **Installer** (à la racine du dépôt) :

   ```sh
   python3 -m venv .venv && source .venv/bin/activate
   pip install voxcpm soundfile
   ```

   Au premier lancement, le modèle `openbmb/VoxCPM2` est téléchargé depuis Hugging Face (plusieurs Go).

2. **Écouter les essais** : chaque personnage dit sa première réplique avec 4 graines différentes.

   ```sh
   python tools/voix_voxcpm.py essais episodes/ep01
   ```

   Les extraits sont écrits dans `out/voix/essais/<personnage>-seed<N>.wav`. Personnages : `narr`, `sacha`, `naya`, `milo`, `menuisier`, `forgeronne`, `bergere`, `meunier`.
   Pour refaire un seul personnage : `python tools/voix_voxcpm.py essais episodes/ep01 sacha`.
   Si aucune version ne convient, on modifie sa description dans `ROLES`, en haut du script, puis on relance.

3. **Choisir une voix par personnage** (8 fois) :

   ```sh
   python tools/voix_voxcpm.py choisir episodes/ep01 sacha 3
   ```

   Chaque voix retenue est enregistrée dans `voix/` et servira pour toute la série.

4. **Générer toutes les répliques** :

   ```sh
   python tools/voix_voxcpm.py generer episodes/ep01
   ```

   Les fichiers sont écrits dans `episodes/ep01/audio/NN-<personnage>.wav`, avec un `manifest.json` qui donne la durée de chaque réplique.

5. **Pousser** `voix/` et `episodes/ep01/audio/` sur la branche.

## Ensuite

- Caler les durées de l'animation sur l'audio réel (grâce au `manifest.json`).
- Faire l'export final sans sous-titres, avec le son.
- Passer à l'épisode 2.
