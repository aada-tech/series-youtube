# Le Village des Trois Moulins

Série éducative YouTube sur la monnaie et l'économie pour les 6-9 ans (cycle 2), en 7 épisodes de 4 à 6 minutes.

- [Bible pédagogique et scénarisation](bible-pedagogique.md) : fondements, cadre déontologique, ergonomie multimédia, personnages, curriculum, fiches des 7 épisodes et sources.
- [Épisode 1 · L'Énigme des Pommes et des Briques](episodes/ep01/index.html) : animatique dessinée en code (canvas), avec son [script de voix off](episodes/ep01/voix-off.md).

> Source de la bible : « Mini-Série Éducation Financière Enfants » (PDF, 13 pages).

## Fabriquer un épisode

Chaque épisode est une page HTML autonome : les répliques, leur durée et les scènes animées vivent dans le même fichier. Le rythme de l'image découle donc directement du texte de la voix off.

1. **Prévisualiser** : ouvrir `episodes/epNN/index.html` dans un navigateur (sous-titres et voix de synthèse d'aperçu disponibles).
2. **Exporter la vidéo et le script** (Playwright + Chromium + ffmpeg) :

   ```sh
   NODE_PATH=$(npm root -g) NODE_USE_ENV_PROXY=1 node tools/render.cjs episodes/ep01          # MP4 sous-titré dans out/
   NODE_PATH=$(npm root -g) NODE_USE_ENV_PROXY=1 node tools/render.cjs episodes/ep01 --no-subs
   NODE_PATH=$(npm root -g) NODE_USE_ENV_PROXY=1 node tools/render.cjs episodes/ep01 --script-only
   ```

   `FFMPEG=/chemin/vers/ffmpeg` permet de choisir le binaire ffmpeg. Les vidéos sont écrites dans `out/` (non versionné).
3. **Voix off** (en local, pas dans le cloud) avec VoxCPM2, modèle open source sous licence Apache-2.0 qui crée les voix à partir d'une description écrite : `python tools/voix_voxcpm.py essais episodes/ep01`, puis `choisir <épisode> <personnage> <seed>` pour fixer la voix de chaque personnage dans `voix/`, puis `generer`. Pousser ensuite `voix/` et `episodes/ep01/audio/` : les durées de l'animation seront calées sur l'audio avant l'export final sans sous-titres. (Alternative payante : `tools/voix.mjs` avec ElevenLabs.)
