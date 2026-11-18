/**
 * BeatFlow Studio - ChannelRack Component
 * Authentic FL Studio pattern step-sequencer with per-track volume, pan, mute, solo.
 */

export class ChannelRackUI {
    constructor(container, sequencer, audioEngine, drumSynth, samplerEngine) {
        this.container = container;
        this.sequencer = sequencer;
        this.audioEngine = audioEngine;
        this.drumSynth = drumSynth;
        this.samplerEngine = samplerEngine;

        this.trackConfigs = [
            { id: 'bass',    name: '808 Sub Bass',    color: '#ff0055', mixerId: 6 },
            { id: 'kick',    name: 'Punch Kick',      color: '#ff3366', mixerId: 1 },
            { id: 'snare',   name: 'Snare Drum',      color: '#00e5ff', mixerId: 2 },
            { id: 'clap',    name: 'Hand Clap',       color: '#a855f7', mixerId: 3 },
            { id: 'hat',     name: 'Closed Hi-Hat',   color: '#ff9900', mixerId: 4 },
            { id: 'openhat', name: 'Open Hi-Hat',     color: '#ffcc00', mixerId: 5 },
            { id: 'sample',  name: 'Vocal Chop / Pad', color: '#00ff88', mixerId: 7 }
        ];

        this.initDOM();
    }

    initDOM() {
        this.container.innerHTML = `
            <div class="panel-header">
                <div class="panel-title">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
                    Channel Rack (Step Sequencer)
                </div>
                <div class="header-actions">
                    <span style="font-size: 0.85rem; color: var(--text-muted);">16 Steps (1 Mesure)</span>
                </div>
            </div>
            <div class="channel-rack-list" id="rack-list"></div>
        `;

        this.renderRackRows();
    }

    renderRackRows() {
        const list = this.container.querySelector('#rack-list');
        list.innerHTML = '';
        const pattern = this.sequencer.getActivePattern();

        this.trackConfigs.forEach(tConfig => {
            const row = document.createElement('div');
            row.className = 'channel-rack-row';
            row.dataset.trackId = tConfig.id;

            // Track Header (Mute, Solo, Vol, Pan, Name)
            const header = document.createElement('div');
            header.className = 'channel-header';
            header.innerHTML = `
                <div class="channel-indicators">
                    <button class="btn-mute" title="Mute">M</button>
                    <button class="btn-solo" title="Solo">S</button>
                </div>
                <div class="channel-knob" title="Volume">
                    <input type="range" class="mini-vol" min="0" max="1.5" value="1.0" step="0.05">
                </div>
                <div class="channel-name" style="border-left: 3px solid ${tConfig.color}">
                    <span>${tConfig.name}</span>
                </div>
            `;

            // Mute / Solo Handlers
            const btnMute = header.querySelector('.btn-mute');
            btnMute.addEventListener('click', () => {
                const isMuted = !btnMute.classList.contains('active');
                btnMute.classList.toggle('active', isMuted);
                this.audioEngine.setTrackMute(tConfig.mixerId, isMuted);
            });

            const volSlider = header.querySelector('.mini-vol');
            volSlider.addEventListener('input', (e) => {
                this.audioEngine.setTrackVolume(tConfig.mixerId, parseFloat(e.target.value));
            });

            // 16 Step Buttons
            const stepsContainer = document.createElement('div');
            stepsContainer.className = 'channel-steps';

            for (let i = 0; i < 16; i++) {
                const stepBtn = document.createElement('button');
                stepBtn.className = 'channel-step-btn';
                stepBtn.dataset.step = i;
                stepBtn.dataset.trackId = tConfig.id;

                // Beat grouping visual separation
                if (Math.floor(i / 4) % 2 === 1) {
                    stepBtn.classList.add('step-alt-group');
                }

                // Initial state
                if (pattern[tConfig.id] && pattern[tConfig.id][i]) {
                    stepBtn.classList.add('step-on');
                    stepBtn.style.backgroundColor = tConfig.color;
                    stepBtn.style.borderColor = tConfig.color;
                }

                stepBtn.addEventListener('click', () => {
                    const isOn = this.sequencer.toggleStep(tConfig.id, i);
                    stepBtn.classList.toggle('step-on', isOn);
                    if (isOn) {
                        stepBtn.style.backgroundColor = tConfig.color;
                        stepBtn.style.borderColor = tConfig.color;
                        this.previewTrackSound(tConfig.id);
                    } else {
                        stepBtn.style.backgroundColor = '';
                        stepBtn.style.borderColor = '';
                    }
                });

                stepsContainer.appendChild(stepBtn);
            }

            row.appendChild(header);
            row.appendChild(stepsContainer);
            list.appendChild(row);
        });
    }

    previewTrackSound(trackId) {
        this.audioEngine.init();
        const track = this.audioEngine.getTrack(this.trackConfigs.find(c => c.id === trackId).mixerId);
        const dest = track ? track.gainNode : this.audioEngine.masterGain;

        switch (trackId) {
            case 'kick':    this.drumSynth.playKick(dest); break;
            case 'snare':   this.drumSynth.playSnare(dest); break;
            case 'clap':    this.drumSynth.playClap(dest); break;
            case 'hat':     this.drumSynth.playHiHat(dest, undefined, false); break;
            case 'openhat': this.drumSynth.playHiHat(dest, undefined, true); break;
            case 'bass':    this.drumSynth.play808(dest); break;
            case 'sample':  this.samplerEngine.playSlice(0, dest); break;
        }
    }

    highlightStep(stepIndex) {
        const allSteps = this.container.querySelectorAll('.channel-step-btn');
        allSteps.forEach(btn => {
            const isCurrent = parseInt(btn.dataset.step) === stepIndex;
            btn.classList.toggle('step-current-head', isCurrent);
        });
    }
}
