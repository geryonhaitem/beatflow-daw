/**
 * BeatFlow DAW - Main Application Controller
 * Next-Gen Open-Source Digital Audio Workstation
 */

import { AudioEngine } from './audio/AudioEngine.js';
import { DrumSynth, SubSynth } from './audio/Synths.js';
import { SamplerEngine } from './audio/Sampler.js';
import { FXChain, DSPChain } from './audio/DSP.js';
import { AudioExporter, Exporter } from './audio/Exporter.js';
import { Sequencer } from './sequencer/Sequencer.js';

import { ChannelRackUI } from './ui/ChannelRack.js';
import { PianoRollUI } from './ui/PianoRoll.js';
import { WaveformSamplerUI } from './ui/WaveformSampler.js';
import { MixerUI } from './ui/Mixer.js';
import { PlaylistUI } from './ui/Playlist.js';

class BeatFlowApp {
  constructor() {
    this.audioEngine = null;
    this.drumSynth = null;
    this.subSynth = null;
    this.samplerEngine = null;
    this.fxChain = null;
    this.sequencer = null;

    this.activeTab = 'rack';
    this.playMode = 'pattern';
    this.isPlaying = false;
    this.metronomeEnabled = false;

    this.init();
  }

  async init() {
    this.sequencer = new Sequencer();
    
    // Setup UI shells
    this.setupLayout();
    this.setupTransportListeners();
    this.setupTabNavigation();

    // Prepare audio components on first user interaction (browser autoplay policy)
    const startAudio = async () => {
      if (!this.audioEngine) {
        await this.initializeAudio();
      }
      window.removeEventListener('click', startAudio);
      window.removeEventListener('keydown', startAudio);
    };
    window.addEventListener('click', startAudio, { once: true });
    window.addEventListener('keydown', startAudio, { once: true });
  }

  async initializeAudio() {
    this.audioEngine = new AudioEngine();
    this.audioEngine.init();

    this.fxChain = new FXChain(this.audioEngine.ctx);
    this.drumSynth = new DrumSynth(this.audioEngine.ctx);
    this.subSynth = new SubSynth(this.audioEngine.ctx);
    this.samplerEngine = new SamplerEngine(this.audioEngine.ctx);

    // Pre-load a warm melodic Rhodes chord into the sampler
    this.generateDemoVocalSample();

    // Hook scheduler step tick for UI playheads
    this.audioEngine.onStepTick = (step) => {
      this.channelRackUI?.updatePlayhead?.(step);
      this.pianoRollUI?.updatePlayhead?.(step);
      if (step % 16 === 0) {
        this.playlistUI?.updatePlayhead?.(Math.floor(step / 16));
      }
    };

    // Initialize UI Views
    this.initViews();

    const banner = document.getElementById('audio-status-badge');
    if (banner) {
      banner.textContent = '● AUDIO ENGINE 48kHz ONLINE';
      banner.className = 'status-badge online';
    }
  }

  setupLayout() {
    const appEl = document.getElementById('app');
    appEl.innerHTML = `
      <header class="daw-header">
        <div class="brand-section">
          <svg class="brand-logo" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#e0e2ec" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
          </svg>
          <div class="brand-titles">
            <span class="brand-name">BEATFLOW STUDIO</span>
            <span class="brand-tag">DESKTOP WORKSTATION</span>
          </div>
        </div>

        <!-- Central Transport Controls -->
        <div class="transport-bar">
          <button id="btn-mode-toggle" class="btn-toggle active" title="Toggle Pattern / Song Mode">PAT</button>
          <div class="transport-buttons">
            <button id="btn-play" class="btn-transport play" title="Play / Pause (Space)">PLAY</button>
            <button id="btn-stop" class="btn-transport stop" title="Stop">STOP</button>
            <button id="btn-record" class="btn-transport rec" title="Record">REC</button>
          </div>

          <div class="tempo-control">
            <label for="bpm-input">BPM</label>
            <input type="number" id="bpm-input" value="130" min="40" max="240" step="1" />
            <div class="bpm-tap" id="btn-bpm-tap" title="Tap Tempo">TAP</div>
          </div>

          <div class="swing-control">
            <label for="swing-slider">SWING</label>
            <input type="range" id="swing-slider" min="0" max="60" value="0" />
            <span id="swing-val">0%</span>
          </div>

          <button id="btn-metronome" class="btn-text-toggle" title="Metronome">METRO</button>
        </div>

        <!-- Master Meter & Actions -->
        <div class="header-right">
          <div class="status-badge standby" id="audio-status-badge">DSP ENGINE STANDBY</div>
          <button id="btn-demo-load" class="btn-action demo" title="Reset Demo Project">DEMO BEAT</button>
          <button id="btn-export-wav" class="btn-action export" title="Export Lossless WAV">EXPORT WAV</button>
          <button id="btn-save-project" class="btn-action save" title="Save Project JSON">SAVE</button>
          <button id="btn-load-project" class="btn-action load" title="Load Project JSON">OPEN</button>
          <input type="file" id="file-project-loader" accept=".json" style="display:none;" />
        </div>
      </header>

      <!-- View Switcher Tabs -->
      <nav class="daw-nav">
        <button class="nav-tab active" data-tab="rack">CHANNEL RACK</button>
        <button class="nav-tab" data-tab="pianoroll">PIANO ROLL</button>
        <button class="nav-tab" data-tab="sampler">AUDIO SAMPLER</button>
        <button class="nav-tab" data-tab="mixer">MIXER</button>
        <button class="nav-tab" data-tab="playlist">PLAYLIST</button>
      </nav>

      <!-- Main Workspace Views -->
      <main class="daw-workspace">
        <section id="view-rack" class="workspace-view active"></section>
        <section id="view-pianoroll" class="workspace-view"></section>
        <section id="view-sampler" class="workspace-view"></section>
        <section id="view-mixer" class="workspace-view"></section>
        <section id="view-playlist" class="workspace-view"></section>
      </main>

      <!-- Global notification toast -->
      <div id="daw-toast" class="daw-toast hidden"></div>
    `;
  }

  generateDemoVocalSample() {
    if (!this.audioEngine || !this.audioEngine.ctx) return;
    const ctx = this.audioEngine.ctx;
    const sr = ctx.sampleRate;
    const duration = 2.0;
    const buffer = ctx.createBuffer(2, sr * duration, sr);

    const left = buffer.getChannelData(0);
    const right = buffer.getChannelData(1);

    const f1 = 261.63; // C4
    const f2 = 329.63; // E4
    const f3 = 392.00; // G4
    const f4 = 493.88; // B4

    for (let i = 0; i < buffer.length; i++) {
      const t = i / sr;
      const env = Math.exp(-t * 1.5) * (1 - Math.exp(-t * 50));
      const s1 = Math.sin(2 * Math.PI * f1 * t);
      const s2 = Math.sin(2 * Math.PI * f2 * t + 0.1);
      const s3 = Math.sin(2 * Math.PI * f3 * t + 0.2);
      const s4 = Math.sin(2 * Math.PI * f4 * t + 0.3);
      
      const sample = (s1 * 0.4 + s2 * 0.3 + s3 * 0.25 + s4 * 0.2) * env;
      left[i] = sample;
      right[i] = sample * (1 + 0.05 * Math.sin(t * 8));
    }

    this.samplerEngine.loadBuffer(buffer, 'Rhodes Chord Vibe.wav');
  }

  initViews() {
    const rackEl = document.getElementById('view-rack');
    const pianoEl = document.getElementById('view-pianoroll');
    const samplerEl = document.getElementById('view-sampler');
    const mixerEl = document.getElementById('view-mixer');
    const playlistEl = document.getElementById('view-playlist');

    this.channelRackUI = new ChannelRackUI(
      rackEl,
      this.sequencer,
      this.audioEngine,
      this.drumSynth,
      this.samplerEngine
    );

    this.pianoRollUI = new PianoRollUI(
      pianoEl,
      this.sequencer,
      this.audioEngine,
      this.subSynth
    );

    this.waveformSamplerUI = new WaveformSamplerUI(
      samplerEl,
      this.samplerEngine,
      this.audioEngine,
      7
    );

    this.mixerUI = new MixerUI(
      mixerEl,
      this.audioEngine,
      this.fxChain
    );

    this.playlistUI = new PlaylistUI(
      playlistEl,
      this.sequencer,
      this.audioEngine,
      (bar) => {
        if (this.audioEngine) {
          this.audioEngine.currentStep = Math.floor(bar * 16);
        }
      }
    );
  }

  handleSchedulerEvents(step, audioTime) {
    const pat = this.sequencer.getActivePattern();
    if (!pat) return;

    // 1. Kick (Track 1)
    if (pat.kick[step]) {
      this.drumSynth.playKick(this.audioEngine.getTrackInput(1), audioTime);
    }
    // 2. Snare (Track 2)
    if (pat.snare[step]) {
      this.drumSynth.playSnare(this.audioEngine.getTrackInput(2), audioTime);
    }
    // 3. Clap (Track 3)
    if (pat.clap[step]) {
      this.drumSynth.playClap(this.audioEngine.getTrackInput(3), audioTime);
    }
    // 4. Closed Hi-Hat (Track 4)
    if (pat.hat[step]) {
      this.drumSynth.playHiHat(this.audioEngine.getTrackInput(4), audioTime, false);
    }
    // 5. Open Hi-Hat (Track 5)
    if (pat.openhat[step]) {
      this.drumSynth.playHiHat(this.audioEngine.getTrackInput(5), audioTime, true);
    }
    // 6. 808 Sub Bass (Track 6)
    if (pat.bass[step]) {
      this.drumSynth.play808(this.audioEngine.getTrackInput(6), audioTime, 36, 0.7);
    }
    // 7. Sampler Chop (Track 7)
    if (pat.sample[step] && this.samplerEngine.audioBuffer) {
      const sliceIdx = pat.sampleSlice ? pat.sampleSlice[step] : 0;
      const semitones = pat.samplePitch ? pat.samplePitch[step] : 0;
      this.samplerEngine.playSlice(sliceIdx, this.audioEngine.getTrackInput(7), semitones, audioTime);
    }

    // 8. Piano Roll SubSynth Notes (Track 8)
    const activeNotes = pat.pianoRollNotes.filter(n => n.startStep === step);
    activeNotes.forEach(note => {
      const secondsPer16th = 60.0 / this.audioEngine.bpm / 4.0;
      const dur = note.durationSteps * secondsPer16th;
      this.subSynth.playNote(this.audioEngine.getTrackInput(8), note.pitch, audioTime, dur, note.velocity || 0.8);
    });

    // Metronome click
    if (this.metronomeEnabled && step % 4 === 0) {
      this.playMetronomeClick(step === 0, audioTime);
    }
  }

  playMetronomeClick(isDownbeat, time) {
    const osc = this.audioEngine.ctx.createOscillator();
    const gain = this.audioEngine.ctx.createGain();
    osc.frequency.setValueAtTime(isDownbeat ? 1200 : 800, time);
    gain.gain.setValueAtTime(0.3, time);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.04);
    osc.connect(gain);
    gain.connect(this.audioEngine.masterGain);
    osc.start(time);
    osc.stop(time + 0.045);
  }

  setupTransportListeners() {
    const playBtn = document.getElementById('btn-play');
    const stopBtn = document.getElementById('btn-stop');
    const bpmInput = document.getElementById('bpm-input');
    const swingSlider = document.getElementById('swing-slider');
    const swingVal = document.getElementById('swing-val');
    const metroBtn = document.getElementById('btn-metronome');
    const modeBtn = document.getElementById('btn-mode-toggle');
    const exportBtn = document.getElementById('btn-export-wav');
    const saveBtn = document.getElementById('btn-save-project');
    const loadBtn = document.getElementById('btn-load-project');
    const fileLoader = document.getElementById('file-project-loader');
    const demoBtn = document.getElementById('btn-demo-load');

    playBtn?.addEventListener('click', () => this.togglePlay());
    stopBtn?.addEventListener('click', () => this.stop());

    bpmInput?.addEventListener('change', (e) => {
      const bpm = parseInt(e.target.value, 10);
      if (bpm >= 40 && bpm <= 240) {
        if (this.audioEngine) this.audioEngine.setBpm(bpm);
      }
    });

    swingSlider?.addEventListener('input', (e) => {
      const swing = parseInt(e.target.value, 10) / 100;
      swingVal.textContent = `${e.target.value}%`;
      if (this.audioEngine) this.audioEngine.setSwing(swing);
    });

    metroBtn?.addEventListener('click', () => {
      this.metronomeEnabled = !this.metronomeEnabled;
      metroBtn.classList.toggle('active', this.metronomeEnabled);
      this.showToast(`Metronome: ${this.metronomeEnabled ? 'ON' : 'OFF'}`);
    });

    modeBtn?.addEventListener('click', () => {
      this.playMode = this.playMode === 'pattern' ? 'song' : 'pattern';
      modeBtn.textContent = this.playMode === 'pattern' ? 'PAT' : 'SONG';
      modeBtn.classList.toggle('song-mode', this.playMode === 'song');
      this.showToast(`Mode: ${this.playMode.toUpperCase()}`);
    });

    exportBtn?.addEventListener('click', () => this.exportSongToWav());
    saveBtn?.addEventListener('click', () => this.saveProject());
    loadBtn?.addEventListener('click', () => fileLoader.click());
    fileLoader?.addEventListener('change', (e) => this.loadProjectFile(e.target.files[0]));
    demoBtn?.addEventListener('click', () => {
      this.sequencer.createPattern(1, 'Pattern 1');
      this.channelRackUI?.renderRackRows();
      this.pianoRollUI?.renderNotes();
      this.showToast('Demo Pattern Reloaded!');
    });

    // Spacebar keyboard play/pause shortcut
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Space' && e.target.tagName !== 'INPUT') {
        e.preventDefault();
        this.togglePlay();
      }
    });
  }

  async togglePlay() {
    if (!this.audioEngine) {
      await this.initializeAudio();
    }
    
    if (this.isPlaying) {
      this.stop();
    } else {
      this.isPlaying = true;
      document.getElementById('btn-play').classList.add('playing');
      document.getElementById('btn-play').textContent = '⏸';
      this.audioEngine.startPlayback((step, audioTime) => {
        this.handleSchedulerEvents(step, audioTime);
      });
    }
  }

  stop() {
    if (!this.audioEngine) return;
    this.audioEngine.stopPlayback();
    this.isPlaying = false;
    document.getElementById('btn-play').classList.remove('playing');
    document.getElementById('btn-play').textContent = '▶';
    this.channelRackUI?.updatePlayhead?.(-1);
    this.pianoRollUI?.updatePlayhead?.(-1);
    this.playlistUI?.updatePlayhead?.(0);
  }

  setupTabNavigation() {
    const tabs = document.querySelectorAll('.nav-tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const target = tab.dataset.tab;
        this.switchTab(target);
      });
    });
  }

  switchTab(tabName) {
    this.activeTab = tabName;
    document.querySelectorAll('.nav-tab').forEach(t => {
      t.classList.toggle('active', t.dataset.tab === tabName);
    });
    document.querySelectorAll('.workspace-view').forEach(v => {
      v.classList.toggle('active', v.id === `view-${tabName}`);
    });

    // Redraw canvases when views become visible
    if (tabName === 'pianoroll') this.pianoRollUI?.renderNotes?.();
    if (tabName === 'playlist') {
      this.playlistUI?.drawRuler?.();
      this.playlistUI?.drawGrid?.();
    }
    if (tabName === 'sampler') this.waveformSamplerUI?.drawWaveform?.();
  }

  async exportSongToWav() {
    if (!this.audioEngine || !this.sequencer) {
      this.showToast('⚠️ Click anywhere to start audio engine first');
      return;
    }
    this.showToast('Rendering Studio WAV 48kHz...');

    try {
      const wavBlob = await AudioExporter.exportSongToWAV(
        this.audioEngine,
        this.sequencer,
        this.samplerEngine,
        this.drumSynth,
        4
      );

      // Trigger automatic download in browser
      const url = URL.createObjectURL(wavBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `BeatFlow_Banger_${Date.now()}.wav`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      this.showToast('✅ WAV Export Complete! File downloaded.');
    } catch (err) {
      console.error(err);
      this.showToast('❌ Export failed: ' + err.message);
    }
  }

  saveProject() {
    const data = this.sequencer.toJSON();
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `BeatFlow_Project_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    this.showToast('💾 Project saved to JSON!');
  }

  loadProjectFile(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const projectData = JSON.parse(e.target.result);
        this.sequencer.fromJSON(projectData);
        this.channelRackUI?.renderRackRows();
        this.pianoRollUI?.renderNotes();
        this.showToast(`📂 Project loaded: ${file.name}`);
      } catch (err) {
        this.showToast('❌ Failed to parse project file');
      }
    };
    reader.readAsText(file);
  }

  showToast(msg) {
    const toast = document.getElementById('daw-toast');
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.remove('hidden');
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => {
      toast.classList.add('hidden');
    }, 3500);
  }
}

// Bootstrap application on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  window.beatFlowApp = new BeatFlowApp();
});
