/**
 * BeatFlow Studio - Mixer Component
 * Multi-channel mixing console with volume faders, peak meters, pan and insert effects rack.
 */

export class MixerUI {
    constructor(container, audioEngine, fxChain) {
        this.container = container;
        this.audioEngine = audioEngine;
        this.fxChain = fxChain;

        this.channels = [
            { id: 'master', name: 'Master', color: '#00ff88', isMaster: true },
            { id: 1, name: 'Kick', color: '#ff3366' },
            { id: 2, name: 'Snare', color: '#00e5ff' },
            { id: 3, name: 'Clap', color: '#a855f7' },
            { id: 4, name: 'Hi-Hat', color: '#ff9900' },
            { id: 5, name: 'Open Hat', color: '#ffcc00' },
            { id: 6, name: '808 Bass', color: '#ff0055' },
            { id: 7, name: 'Sampler', color: '#00ff88' }
        ];

        this.initDOM();
        this.startMeterLoop();
    }

    initDOM() {
        this.container.innerHTML = `
            <div class="panel-header">
                <div class="panel-title">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="4" y1="21" x2="4" y2="14"></line><line x1="4" y1="10" x2="4" y2="3"></line><line x1="12" y1="21" x2="12" y2="12"></line><line x1="12" y1="8" x2="12" y2="3"></line><line x1="20" y1="21" x2="20" y2="16"></line><line x1="20" y1="12" x2="20" y2="3"></line><line x1="1" y1="14" x2="7" y2="14"></line><line x1="9" y1="8" x2="15" y2="8"></line><line x1="17" y1="16" x2="23" y2="16"></line></svg>
                    Mixer & Master FX Rack
                </div>
                <div class="header-actions">
                    <span style="font-size: 0.85rem; color: var(--text-muted);">Console 8 Pistes avec Effets Intégrés</span>
                </div>
            </div>

            <div class="mixer-workspace">
                <!-- Mixer Faders Row -->
                <div class="mixer-strips-row" id="mixer-strips"></div>

                <!-- Master FX Rack -->
                <div class="fx-rack-panel">
                    <div class="fx-rack-title">Master FX Rack (DSP)</div>
                    <div class="fx-controls-grid">
                        <div class="fx-control">
                            <span>BASS (EQ LOW)</span>
                            <input type="range" id="eq-low" min="-12" max="12" value="0" step="1">
                        </div>
                        <div class="fx-control">
                            <span>AIR (EQ HIGH)</span>
                            <input type="range" id="eq-high" min="-12" max="12" value="0" step="1">
                        </div>
                        <div class="fx-control">
                            <span>TAPE SATURATION</span>
                            <input type="range" id="drive-knob" min="0" max="1" value="0" step="0.05">
                        </div>
                        <div class="fx-control">
                            <span>REVERB SEND</span>
                            <input type="range" id="reverb-knob" min="0" max="0.8" value="0.15" step="0.05">
                        </div>
                        <div class="fx-control">
                            <span>STEREO DELAY</span>
                            <input type="range" id="delay-knob" min="0" max="0.7" value="0" step="0.05">
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.renderStrips();
        this.bindFXEvents();
    }

    renderStrips() {
        const row = this.container.querySelector('#mixer-strips');
        row.innerHTML = '';

        this.channels.forEach(ch => {
            const strip = document.createElement('div');
            strip.className = `mixer-strip ${ch.isMaster ? 'strip-master' : ''}`;
            strip.dataset.chId = ch.id;

            strip.innerHTML = `
                <div class="strip-header" style="color: ${ch.color}">${ch.name}</div>
                <div class="strip-body">
                    <div class="meter-wrapper">
                        <canvas class="vu-meter-canvas" width="10" height="120" id="meter-${ch.id}"></canvas>
                    </div>
                    <div class="fader-wrapper">
                        <input type="range" class="vertical-fader" min="0" max="1.5" value="${ch.isMaster ? '0.85' : '1.0'}" step="0.02" orient="vertical">
                    </div>
                </div>
                <div class="strip-footer">
                    <span class="fader-db-readout" id="db-${ch.id}">0.0 dB</span>
                </div>
            `;

            // Fader Event
            const fader = strip.querySelector('.vertical-fader');
            fader.addEventListener('input', (e) => {
                const val = parseFloat(e.target.value);
                const db = (20 * Math.log10(val || 0.0001)).toFixed(1);
                strip.querySelector(`#db-${ch.id}`).textContent = `${db} dB`;

                if (ch.isMaster) {
                    this.audioEngine.setMasterVolume(val);
                } else {
                    this.audioEngine.setTrackVolume(ch.id, val);
                }
            });

            row.appendChild(strip);
        });
    }

    bindFXEvents() {
        const eqLow = this.container.querySelector('#eq-low');
        const eqHigh = this.container.querySelector('#eq-high');
        const drive = this.container.querySelector('#drive-knob');
        const reverb = this.container.querySelector('#reverb-knob');
        const delay = this.container.querySelector('#delay-knob');

        const updateEQ = () => {
            if (this.fxChain) this.fxChain.setEQ(parseFloat(eqLow.value), 0, parseFloat(eqHigh.value));
        };

        eqLow.addEventListener('input', updateEQ);
        eqHigh.addEventListener('input', updateEQ);
        drive.addEventListener('input', (e) => this.fxChain && this.fxChain.setSaturation(parseFloat(e.target.value)));
        reverb.addEventListener('input', (e) => this.fxChain && this.fxChain.setReverbWet(parseFloat(e.target.value)));
        delay.addEventListener('input', (e) => this.fxChain && this.fxChain.setDelayWet(parseFloat(e.target.value)));
    }

    startMeterLoop() {
        const updateMeters = () => {
            if (this.audioEngine.ctx) {
                // Render Master meter
                this.drawChannelMeter('master', this.audioEngine.masterAnalyser);

                // Render Track meters
                this.channels.forEach(ch => {
                    if (!ch.isMaster) {
                        const track = this.audioEngine.getTrack(ch.id);
                        if (track && track.analyser) {
                            this.drawChannelMeter(ch.id, track.analyser);
                        }
                    }
                });
            }
            requestAnimationFrame(updateMeters);
        };
        requestAnimationFrame(updateMeters);
    }

    drawChannelMeter(channelId, analyserNode) {
        const canvas = this.container.querySelector(`#meter-${channelId}`);
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;

        const dataArray = new Uint8Array(analyserNode.frequencyBinCount);
        analyserNode.getByteFrequencyData(dataArray);

        // Calculate average volume peak
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
        const avg = sum / dataArray.length; // 0 to 255
        const pct = Math.min(1.0, (avg / 128));

        ctx.fillStyle = '#0a0a0f';
        ctx.fillRect(0, 0, width, height);

        // Meter gradient (green -> yellow -> red)
        const meterHeight = height * pct;
        const grad = ctx.createLinearGradient(0, height, 0, 0);
        grad.addColorStop(0.0, '#00ff88');
        grad.addColorStop(0.7, '#ffcc00');
        grad.addColorStop(1.0, '#ff0055');

        ctx.fillStyle = grad;
        ctx.fillRect(0, height - meterHeight, width, meterHeight);
    }
}
