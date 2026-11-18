# ⚡ BeatFlow Studio (v1.0 Pro DAW)

> **The Modern, Free, and Unrestricted Open-Source DAW for Beatmakers & Producers.**  
> Inspired by the speed of **FL Studio**, the sampling power of **Serato / MPC**, and the sleek ergonomics of **Ableton Live 12**.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green.svg)](https://nodejs.org/)
[![Vite](https://img.shields.io/badge/Bundler-Vite-purple.svg)](https://vitejs.dev/)
[![WebAudio](https://img.shields.io/badge/Audio-48kHz%20Stereo-cyan.svg)](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)

---

## 🎯 Why BeatFlow Studio?

Commercial DAWs like FL Studio and Ableton Live lock saving, exporting, or full features behind €200–€500 paywalls. Older open-source alternatives like LMMS suffer from dated, cluttered 2000s interfaces, lack intuitive modern sample pitching/chopping, and make simple hip-hop / trap / lo-fi beatmaking frustrating.

**BeatFlow Studio** was engineered from the ground up to solve this:
- **Instant Pitch & Chop**: Drop any audio file, pitch it up (+12 st Nightcore / Kanye chipmunk style) or down (-12 st slow & reverb), slice it automatically into 8 MPC pads, and jam with your QWERTY keyboard (`A, Z, E, R, Q, S, D, F`).
- **Channel Rack Step Sequencer**: Authentic FL Studio 16-step grid grouped into 4-beat bars for kicks, snares, claps, hi-hat rolls, and 808 sub bass.
- **Visual Piano Roll**: Draw chords, basslines, and melodies with smooth snap and real-time synth preview.
- **8-Track Mixer & Master DSP Rack**: Volume faders, dB meters, pan, 3-Band Parametric EQ, Tape Saturation, Ping-Pong Delay, and Algorithmic Reverb.
- **Playlist Arranger**: Timeline grid to paint patterns, song blocks, audio clips, and loop regions.
- **Lossless WAV Exporter**: Studio-grade 48kHz 16-bit stereo WAV export without any trial watermarks or export restrictions.
- **Zero Install Hassle**: Runs natively in the browser with ultra-low latency, or packagable as an Electron desktop app.

---

## 🚀 Quick Start (Pull & Run)

```bash
# 1. Clone the repository
git clone https://github.com/geryonhaitem/beatflow-daw.git
cd beatflow-daw

# 2. Install dependencies (instant lightweight Vite setup)
npm install

# 3. Start the DAW in development mode
npm run dev
```

Open your browser at `http://localhost:3000` (or `http://localhost:5173`).  
Click anywhere to initialize the **48kHz Audio Engine**, press the **Spacebar** or click **▶ Play**, and the built-in trap demo beat will start blasting!

---

## 🎹 Views & Modules

### 1. 🎛️ Channel Rack (Step Sequencer)
- 16 steps per pattern, grouped into 4 distinct beat colors.
- Individual track controls: **Mute (M)**, **Solo (S)**, **Volume slider**, **Pan**.
- Modeled analog drum synths:
  - **Punch Kick**: 160 Hz -> 45 Hz dual pitch drop with click transient.
  - **Snare Drum**: Dual-sine body (185 Hz) + highpass white noise wire burst.
  - **Hand Clap**: Triple-burst micro-delays (12ms) with resonant bandpass body.
  - **Closed & Open Hi-Hats**: Highpass filtered metallic crunch with adjustable decays.
  - **808 Sub Bass**: Pure sine with pitch-punch attack and warm cubic saturation.

### 2. ✂️ Waveform Sampler & MPC Chops
- Drag & Drop any `.wav`, `.mp3`, or `.ogg` audio file onto the waveform canvas.
- Built-in one-click button: **"Charger A New Kind of Love"** loads a pre-packaged 20-second vocal loop.
- **Pitch / Speed Slider**: Real-time semitone pitch shifting (-12 st to +12 st) using sample rate scaling ($2^{\Delta \text{semi} / 12}$).
- **Reverse Mode**: Play buffer backwards with 1 click.
- **8 Tactile MPC Pads**: Mapped directly to keyboard keys:
  - `A` = Chop 1 (-3 st)
  - `Z` = Chop 2 (-1 st)
  - `E` = Chop 3 (Original pitch)
  - `R` = Chop 4 (+2 st)
  - `Q` = Chop 5 (+3 st)
  - `S` = Chop 6 (+5 st)
  - `D` = Chop 7 (+7 st)
  - `F` = Chop 8 (+12 st Octave Up)
- **Anti-Click Micro Envelopes**: Automatic 8ms linear fade-in and fade-out on every chop to eliminate harsh zero-crossing clicks.

### 3. 🎹 Piano Roll
- Melodic grid editor covering octaves C3 to C5 with clear piano key styling.
- Left-click to place or resize notes; right-click to delete.
- Powered by **SubSynth**: Dual-oscillator (Sawtooth + Square detuned by +7 cents) running into a 24dB resonant lowpass filter with ADSR envelope.

### 4. 🎚️ Mixer & Master FX (DSP Rack)
- 8 channel strips with animated real-time peak meters:
  - Master, Kick (1), Snare (2), Clap (3), Hi-Hat (4), Open Hat (5), 808 Bass (6), Sampler (7), Synth (8).
- **Master DSP Rack**:
  - **3-Band Parametric EQ**: Low shelf (100 Hz), Mid peaking (1.2 kHz, Q=1.0), High shelf (8 kHz).
  - **Tape Saturation**: Soft-clipping cubic wave shaper for analog warmth.
  - **Ping-Pong Delay**: Tempo-synced delay with feedback and wet level.
  - **Algorithmic Reverb**: Synthetic impulse response convolution reverb.

### 5. 📜 Playlist Arranger
- Multi-track timeline for arranging full songs.
- Tools: **Draw (Pencil)**, **Move/Select**, **Erase**, and **Slice/Cut**.
- Magnetic snap-to-grid (1 Bar, 1/2 Bar, 1/4 Bar, or Free).
- Visual playhead synced with the audio engine's master transport.

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| `Space` | Play / Pause playback |
| `A, Z, E, R, Q, S, D, F` | Trigger MPC Sampler Slices 1 through 8 |
| `Left Click` | Draw step / note / block |
| `Right Click` | Erase note / block |

---

## 🛠️ Project Structure

```
beatflow-daw/
├── index.html                  # Main DAW application frame
├── package.json                # Dependencies & Vite scripts
├── vite.config.js              # Fast HMR & port 3000 config
├── public/
│   └── samples/
│       └── frou-frou.wav       # Pre-packaged 20s vocal loop for sampling
├── docs/
│   ├── ARCHITECTURE.md         # Detailed audio graph & scheduling engine
│   └── CONTEXT_POUR_LE_TRAVAIL.md # Guide for reviewing and running at work
└── src/
    ├── main.js                 # App initialization, routing & transport
    ├── style.css               # Modern dark-mode glassmorphic theme
    ├── audio/
    │   ├── AudioEngine.js      # 48kHz WebAudio routing & lookahead scheduler
    │   ├── Synths.js           # Analog 808, Kick, Snare, Hats, Clap & SubSynth
    │   ├── Sampler.js          # Slicing, reverse, semitone pitch & anti-click
    │   ├── DSP.js              # 3-Band EQ, Saturation, Delay, Reverb
    │   └── Exporter.js         # OfflineAudioContext 48kHz lossless WAV encoder
    ├── sequencer/
    │   └── Sequencer.js        # Pattern model, note store & JSON serializer
    └── ui/
        ├── ChannelRack.js      # FL-style step sequencer UI
        ├── PianoRoll.js        # MIDI visual note editor UI
        ├── WaveformSampler.js  # Canvas waveform, slice overlay & MPC pads
        ├── Mixer.js            # Faders, VU meters & FX rack UI
        └── Playlist.js         # Timeline song arrangement UI
```

---

## 📜 License

MIT License. Free to use, modify, distribute, and sample without restrictions.
