/**
 * BeatFlow Studio - WaveformSampler Component
 * High-definition waveform display, interactive slice handles, auto-chop and MPC pads.
 */

export class WaveformSamplerUI {
    constructor(container, samplerEngine, audioEngine, mixerTrackId = 7) {
        this.container = container;
        this.sampler = samplerEngine;
        this.audioEngine = audioEngine;
        this.mixerTrackId = mixerTrackId;
        this.semitoneOffset = 0;

        this.initDOM();
    }

    initDOM() {
        this.container.innerHTML = `
            <div class="panel-header">
                <div class="panel-title">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12h2l3-9 4 18 3-9h2l3 6 2-6h3"></path></svg>
                    Waveform Sampler (Découpe & Pitch)
                </div>
                <div class="header-actions">
                    <button class="btn-sm" id="btn-load-froufrou">Charger "A New Kind of Love"</button>
                    <button class="btn-sm" id="btn-open-file">Importer Audio...</button>
                    <button class="btn-sm" id="btn-autochop-8">Auto-Chop (8 Chops)</button>
                    <button class="btn-sm" id="btn-reverse">Reverse</button>
                </div>
            </div>

            <!-- Waveform Canvas Viewport -->
            <div class="waveform-viewport" id="waveform-dropzone">
                <canvas id="waveform-canvas"></canvas>
                <div class="slice-overlay" id="slice-overlay"></div>
                <div class="playhead" id="sampler-playhead"></div>
                <div class="drop-hint" id="waveform-hint">
                    <strong>Glisse ton fichier audio ici</strong> (WAV ou MP3)<br>
                    ou clique sur "Charger A New Kind of Love" ci-dessus
                </div>
            </div>

            <!-- Sampler Parameters Controls -->
            <div class="sampler-controls-row">
                <div class="knob-card">
                    <div class="knob-header">
                        <span>PITCH / VITESSE</span>
                        <span class="knob-val" id="pitch-display">0 st</span>
                    </div>
                    <input type="range" id="pitch-slider" min="-12" max="12" value="0" step="1">
                </div>

                <div class="knob-card">
                    <div class="knob-header">
                        <span>POINT DE DÉBUT</span>
                        <span class="knob-val" id="start-display">0.0 s</span>
                    </div>
                    <input type="range" id="start-slider" min="0" max="100" value="0" step="0.1">
                </div>

                <div class="knob-card">
                    <div class="knob-header">
                        <span>DURÉE DU CHOP</span>
                        <span class="knob-val" id="duration-display">Auto</span>
                    </div>
                    <input type="range" id="duration-slider" min="0.2" max="10" value="2.5" step="0.1">
                </div>
            </div>

            <!-- MPC Style Chop Pads Grid (8 Slices) -->
            <div class="pads-container" id="pads-grid"></div>
        `;

        this.canvas = this.container.querySelector('#waveform-canvas');
        this.canvasCtx = this.canvas.getContext('2d');
        this.dropzone = this.container.querySelector('#waveform-dropzone');
        this.hint = this.container.querySelector('#waveform-hint');
        this.overlay = this.container.querySelector('#slice-overlay');

        this.pitchSlider = this.container.querySelector('#pitch-slider');
        this.pitchDisplay = this.container.querySelector('#pitch-display');
        this.startSlider = this.container.querySelector('#start-slider');
        this.startDisplay = this.container.querySelector('#start-display');
        this.durationSlider = this.container.querySelector('#duration-slider');
        this.durationDisplay = this.container.querySelector('#duration-display');

        this.renderPads();
        this.bindEvents();
    }

    renderPads() {
        const grid = this.container.querySelector('#pads-grid');
        grid.innerHTML = '';
        const keys = ['A', 'Z', 'E', 'R', 'Q', 'S', 'D', 'F'];
        const pitches = [-3, -1, 0, 2, 3, 5, 7, 12];

        for (let i = 0; i < 8; i++) {
            const pad = document.createElement('div');
            pad.className = 'mpc-pad';
            pad.dataset.sliceIndex = i;
            pad.dataset.key = keys[i].toLowerCase();
            pad.dataset.pitch = pitches[i];

            const pitchLabel = pitches[i] >= 0 ? `+${pitches[i]} st` : `${pitches[i]} st`;
            pad.innerHTML = `
                <div class="pad-number">Chop ${i + 1} (${pitchLabel})</div>
                <div class="pad-shortcut">Touche ${keys[i]}</div>
            `;

            pad.addEventListener('mousedown', () => {
                this.triggerPad(i, pitches[i], pad);
            });
            grid.appendChild(pad);
        }
    }

    triggerPad(sliceIndex, pitchOffset = 0, padEl = null) {
        if (!this.sampler.audioBuffer) return;
        const track = this.audioEngine.getTrack(this.mixerTrackId);
        const destination = track ? track.gainNode : this.audioEngine.masterGain;

        const totalPitch = this.semitoneOffset + pitchOffset;
        this.sampler.playSlice(sliceIndex, destination, totalPitch);

        if (padEl) {
            padEl.classList.add('pad-active');
            setTimeout(() => padEl.classList.remove('pad-active'), 120);
        }
    }

    bindEvents() {
        // Drag and Drop Audio File
        this.dropzone.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.dropzone.classList.add('dragover');
        });

        this.dropzone.addEventListener('dragleave', () => this.dropzone.classList.remove('dragover'));

        this.dropzone.addEventListener('drop', async (e) => {
            e.preventDefault();
            this.dropzone.classList.remove('dragover');
            if (e.dataTransfer.files.length) {
                await this.loadAudio(e.dataTransfer.files[0]);
            }
        });

        // Click to place start point
        this.dropzone.addEventListener('click', (e) => {
            if (!this.sampler.audioBuffer) return;
            const rect = this.dropzone.getBoundingClientRect();
            const pct = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
            this.startSlider.value = pct;
            this.updateStart();
            this.triggerPad(0, 0);
        });

        // Controls
        this.pitchSlider.addEventListener('input', (e) => {
            this.semitoneOffset = parseInt(e.target.value);
            this.pitchDisplay.textContent = (this.semitoneOffset > 0 ? `+${this.semitoneOffset}` : `${this.semitoneOffset}`) + ' st';
        });

        this.startSlider.addEventListener('input', () => this.updateStart());
        this.durationSlider.addEventListener('input', (e) => {
            this.durationDisplay.textContent = `${e.target.value} s`;
            this.updateOverlay();
        });

        // Reverse Toggle
        this.container.querySelector('#btn-reverse').addEventListener('click', (e) => {
            this.sampler.reverse = !this.sampler.reverse;
            e.target.classList.toggle('active', this.sampler.reverse);
        });

        // Load Frou Frou loop
        this.container.querySelector('#btn-load-froufrou')?.addEventListener('click', async () => {
            try {
                const res = await fetch('/samples/frou-frou.wav');
                if (res.ok) {
                    const blob = await res.blob();
                    await this.loadAudio(blob);
                }
            } catch (err) {
                console.warn('Could not load /samples/frou-frou.wav', err);
            }
        });

        // Auto Chop 8
        this.container.querySelector('#btn-autochop-8').addEventListener('click', () => {
            if (!this.sampler.audioBuffer) return;
            this.sampler.autoChop(8);
            this.updateOverlay();
        });

        // Keyboard hotkeys A, Z, E, R, Q, S, D, F
        window.addEventListener('keydown', (e) => {
            if (e.target.tagName === 'INPUT') return;
            const key = e.key.toLowerCase();
            const pad = this.container.querySelector(`.mpc-pad[data-key="${key}"]`);
            if (pad && !pad.classList.contains('pad-active')) {
                const idx = parseInt(pad.dataset.sliceIndex);
                const pitch = parseInt(pad.dataset.pitch);
                this.triggerPad(idx, pitch, pad);
            }
        });

        // File pickers
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'audio/*';
        fileInput.style.display = 'none';
        document.body.appendChild(fileInput);

        this.container.querySelector('#btn-open-file').addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', async (e) => {
            if (e.target.files.length) await this.loadAudio(e.target.files[0]);
        });
    }

    async loadAudio(fileOrBlob) {
        this.audioEngine.init();
        await this.sampler.loadFile(fileOrBlob);
        this.drawWaveform();
        this.hint.style.display = 'none';
        this.updateStart();
    }

    updateStart() {
        if (!this.sampler.audioBuffer) return;
        const pct = parseFloat(this.startSlider.value);
        const sec = ((pct / 100) * this.sampler.audioBuffer.duration).toFixed(1);
        this.startDisplay.textContent = `${sec} s`;
        this.sampler.startOffset = parseFloat(sec);
        this.sampler.autoChop(8);
        this.updateOverlay();
    }

    updateOverlay() {
        if (!this.sampler.audioBuffer) return;
        const pctStart = parseFloat(this.startSlider.value);
        const durationSec = parseFloat(this.durationSlider.value);
        const pctWidth = (durationSec / this.sampler.audioBuffer.duration) * 100;

        this.overlay.style.display = 'block';
        this.overlay.style.left = `${pctStart}%`;
        this.overlay.style.width = `${Math.min(pctWidth, 100 - pctStart)}%`;
    }

    drawWaveform() {
        if (!this.sampler.audioBuffer) return;
        const width = this.dropzone.clientWidth || 800;
        const height = this.dropzone.clientHeight || 160;
        this.canvas.width = width;
        this.canvas.height = height;

        const data = this.sampler.audioBuffer.getChannelData(0);
        const step = Math.ceil(data.length / width);
        const amp = height / 2;

        this.canvasCtx.fillStyle = '#111218';
        this.canvasCtx.fillRect(0, 0, width, height);

        this.canvasCtx.beginPath();
        this.canvasCtx.strokeStyle = '#00ff88';
        this.canvasCtx.lineWidth = 1.5;

        for (let i = 0; i < width; i++) {
            let min = 1.0;
            let max = -1.0;
            for (let j = 0; j < step; j++) {
                const datum = data[(i * step) + j];
                if (datum < min) min = datum;
                if (datum > max) max = datum;
            }
            this.canvasCtx.moveTo(i, (1 + min) * amp);
            this.canvasCtx.lineTo(i, (1 + max) * amp);
        }
        this.canvasCtx.stroke();
    }
}
