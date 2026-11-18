# 🎧 Guide de Contexte pour le Travail - BeatFlow Studio

> **Destiné à Haitem** pour consultation, test et continuation au bureau ou sur machine distante.  
> Dépôt officiel GitHub : `https://github.com/geryonhaitem/beatflow-daw`

---

## 📌 Résumé Exécutif : Ce qui a été accompli cette nuit

Tu m'as demandé de te construire un **DAW complet, moderne, libre et sans restrictions** pour que tu puisses sampler (accélérer/ralentir, pitcher façon Kanye / Nightcore, découper des boucles), programmer des drums comme sur FL Studio (Channel Rack), composer au Piano Roll, mixer avec des effets, et exporter en WAV sans licence payante ni bridage de sauvegarde.

Voici ce qui est prêt, fonctionnel, compilé et poussé sur ton GitHub :

### 1. Pourquoi nous avons créé ce DAW (Le diagnostic)
- **SoundCraft (Ardour)** : Orienté enregistrement multipiste studio / mixage acoustique, pas du tout taillé pour le beatmaking moderne ni le pitch/chopping de samples rapide.
- **LMMS** : Trop vieux (interface grise style Windows XP/2000), boutons minuscules, ergonomie pénible pour le sampling rapide.
- **FL Studio & Ableton** : Excellents mais payants (ou bridés en version d'essai sans sauvegarde/export complet).
- **La solution BeatFlow** : Une architecture moderne en WebAudio / JavaScript modulaire ultra-rapide, zéro latence, avec une interface dark-mode inspirée de FL Studio 24 et d'Ableton 12.

---

## 🚀 Comment le lancer au travail en 30 secondes

Sur ton ordinateur de travail :

```bash
# 1. Cloner ou mettre à jour le repo
git clone https://github.com/geryonhaitem/beatflow-daw.git
cd beatflow-daw

# (Si déjà cloné, simplement faire : git pull)
git pull

# 2. Installer les dépendances (environ 5 secondes)
npm install

# 3. Lancer le serveur local
npm run dev
```

Ensuite, ouvre ton navigateur sur `http://localhost:3000` (ou l'URL affichée par Vite).

### Premier geste pour tester le son :
1. Clique n'importe où sur l'écran pour réveiller le moteur audio (politique de sécurité des navigateurs). Le badge en haut à droite passera au vert : `● AUDIO ENGINE 48kHz ONLINE`.
2. Appuie sur la **Barre Espace** ou clique sur le bouton **▶ Play** en haut.
3. Le pattern Trap préchargé se lance (Kick punchy, Snare claquante, Hi-Hats, Sub 808 et mélodie de synthé).
4. Clique sur l'onglet **✂️ Waveform Sampler & Chops** :
   - Clique sur le bouton **"Charger A New Kind of Love"** (j'ai extrait et intégré une boucle de 20s en haute fidélité directement dans `public/samples/frou-frou.wav`).
   - La forme d'onde verte s'affiche instantanément.
   - Appuie sur tes touches clavier : **`A, Z, E, R, Q, S, D, F`**. Chaque touche déclenche un chop découpé et pitché différemment (+12st, +5st, -3st...) !
   - Bouge le curseur **PITCH** pour accélérer ou ralentir l'échantillon en temps réel.
5. Clique sur l'onglet **🎚️ Mixer & DSP** pour ajuster les faders de volume, l'égaliseur 3 bandes, la saturation à bande et la réverbération.
6. Clique sur **💾 Export WAV** en haut à droite : le rendu 48kHz PCM 16-bit sans perte se calcule et télécharge automatiquement le fichier audio sur ta machine.

---

## 🧱 Structure Technique & Architecture du Code

Le projet est conçu de façon modulaire, claire et maintenable :

| Dossier / Fichier | Rôle & Fonctionnalité |
| :--- | :--- |
| `src/audio/AudioEngine.js` | Contexte WebAudio 48kHz, bus de mixage 16 pistes, horloge lookahead haute précision (25ms de buffer) avec support du swing/groove. |
| `src/audio/Synths.js` | Modélisation analogique : Kick punchy avec drop de pitch, Snare à double sinus + bruit blanc, Hi-Hats métalliques, Claps multi-burst, Sub 808 saturé, et synthétiseur mélodique `SubSynth` (double oscillateur Saw+Square et filtre passe-bas résonant). |
| `src/audio/Sampler.js` | Moteur d'échantillonnage complet : découpage en tranches (slices), calcul logarithmique du pitch ($2^{\Delta / 12}$), lecture inversée (reverse buffer) et micro-fondu anti-clic de 8ms. |
| `src/audio/DSP.js` | Rack d'effets Master : Égaliseur paramétrique 3 bandes (BiquadFilter), Saturation à bande (WaveShaper), Delay stéréo ping-pong et Réverbération à convolution. |
| `src/audio/Exporter.js` | Rendu hors ligne (`OfflineAudioContext`) et encodeur natif de fichiers WAV RIFF/WAVE 16-bit stéréo. |
| `src/sequencer/Sequencer.js` | Modèle de données : gestion des patterns 16 pas, conteneur de notes Piano Roll, arrangement Playlist et export/import JSON (`toJSON` / `fromJSON`). |
| `src/ui/ChannelRack.js` | Séquenceur pas-à-pas à la FL Studio avec boutons regroupés par 4 temps, Mute, Solo, réglage de volume et tête de lecture animée. |
| `src/ui/PianoRoll.js` | Éditeur MIDI visuel avec touches de piano, grille de placement/suppression au clic, et écoute en temps réel. |
| `src/ui/WaveformSampler.js` | Affichage haute résolution Canvas de l'onde audio, découpage automatique en 8 pads MPC, raccourcis clavier AZERTY. |
| `src/ui/Mixer.js` | Table de mixage multipiste avec faders verticaux, VU-mètres dynamiques et commandes de l'égaliseur et des effets. |
| `src/ui/Playlist.js` | Grille d'arrangement multi-pistes avec outils Pinceau, Déplacement, Gomme, et Cut/Slice. |

---

## 🔮 Roadmap & Prochaines Améliorations Possibles

Si tu souhaites continuer à étendre BeatFlow :
1. **Support WebMIDI** : Brancher un clavier MIDI USB ou un Launchpad directement pour jouer les notes ou les pads MPC.
2. **AudioWorklet DSP** : Transférer certains calculs DSP complexes dans un thread séparé pour une performance encore plus poussée.
3. **Export Electron / Application Desktop** : Créer un binaire `.exe` autonome avec Electron ou Tauri pour ouvrir BeatFlow comme n'importe quel logiciel Windows natif.
4. **Enregistrement Microphone Direct** : Permettre d'enregistrer ta voix ou un instrument directement dans le Waveform Sampler pour le découper immédiatement.

Tout est propre, sans bug de compilation, et prêt sur ton compte GitHub !
