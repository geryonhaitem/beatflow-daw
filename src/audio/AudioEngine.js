/**
 * BeatFlow Studio - AudioEngine
 * Ultra-low latency WebAudio routing graph and high-precision lookahead scheduler.
 */

export class AudioEngine {
    constructor() {
        this.ctx = null;
        this.masterGain = null;
        this.masterAnalyser = null;
        this.tracks = new Map();
        this.numTracks = 16;
        
        // Sequencer & Clock State
        this.bpm = 130;
        this.isPlaying = false;
        this.currentStep = 0;
        this.totalSteps = 16;
        this.swing = 0.0; // 0.0 to 1.0 (triplet/shuffle feel)
        
        // Lookahead clock variables
        this.lookaheadMs = 25.0;
        this.scheduleAheadTime = 0.1; // 100ms
        this.nextNoteTime = 0.0;
        this.timerID = null;

        // Callback hooks
        this.onStepTick = null;
        this.onPlayStateChange = null;
    }

    init() {
        if (this.ctx) return;

        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioContextClass({
            latencyHint: 'interactive',
            sampleRate: 48000
        });

        // Master Bus
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(0.85, this.ctx.currentTime);

        this.masterAnalyser = this.ctx.createAnalyser();
        this.masterAnalyser.fftSize = 256;
        this.masterAnalyser.smoothingTimeConstant = 0.8;

        this.masterGain.connect(this.masterAnalyser);
        this.masterAnalyser.connect(this.ctx.destination);

        // Initialize Mixer Tracks (1 to 16)
        for (let i = 1; i <= this.numTracks; i++) {
            this.createTrack(i);
        }
    }

    createTrack(trackId) {
        const gainNode = this.ctx.createGain();
        gainNode.gain.setValueAtTime(1.0, this.ctx.currentTime);

        const panNode = this.ctx.createStereoPanner ? this.ctx.createStereoPanner() : null;
        const analyser = this.ctx.createAnalyser();
        analyser.fftSize = 128;

        // Routing: input -> gain -> pan -> analyser -> masterGain
        if (panNode) {
            gainNode.connect(panNode);
            panNode.connect(analyser);
        } else {
            gainNode.connect(analyser);
        }
        analyser.connect(this.masterGain);

        this.tracks.set(trackId, {
            id: trackId,
            gainNode,
            panNode,
            analyser,
            volume: 1.0,
            pan: 0.0,
            isMuted: false,
            isSolo: false,
            fxChain: []
        });
    }

    getTrack(trackId) {
        return this.tracks.get(trackId);
    }

    setTrackVolume(trackId, vol) {
        const t = this.getTrack(trackId);
        if (!t) return;
        t.volume = Math.max(0, Math.min(1.5, vol));
        if (!t.isMuted) {
            t.gainNode.gain.setTargetAtTime(t.volume, this.ctx.currentTime, 0.015);
        }
    }

    setTrackPan(trackId, pan) {
        const t = this.getTrack(trackId);
        if (!t || !t.panNode) return;
        t.pan = Math.max(-1, Math.min(1, pan));
        t.panNode.pan.setTargetAtTime(t.pan, this.ctx.currentTime, 0.015);
    }

    setTrackMute(trackId, isMuted) {
        const t = this.getTrack(trackId);
        if (!t) return;
        t.isMuted = isMuted;
        const targetVol = isMuted ? 0 : t.volume;
        t.gainNode.gain.setTargetAtTime(targetVol, this.ctx.currentTime, 0.01);
    }

    setMasterVolume(vol) {
        if (!this.masterGain) return;
        this.masterGain.gain.setTargetAtTime(Math.max(0, Math.min(1.2, vol)), this.ctx.currentTime, 0.015);
    }

    setBpm(bpm) {
        this.bpm = Math.max(30, Math.min(300, bpm));
    }

    setSwing(swing) {
        this.swing = Math.max(0, Math.min(1.0, swing));
    }

    getTrackInput(trackId) {
        const t = this.getTrack(trackId);
        return t ? t.gainNode : (this.masterGain || (this.ctx && this.ctx.destination));
    }

    // --- High-Precision Lookahead Scheduler ---

    async startPlayback(getEventsForStep) {
        this.init();
        if (this.ctx.state === 'suspended') {
            await this.ctx.resume();
        }

        if (this.isPlaying) return;

        this.isPlaying = true;
        this.currentStep = 0;
        this.nextNoteTime = this.ctx.currentTime;
        this.getEventsForStep = getEventsForStep;

        if (this.onPlayStateChange) this.onPlayStateChange(true);

        this.schedulerLoop();
    }

    stopPlayback() {
        this.isPlaying = false;
        if (this.timerID) {
            clearTimeout(this.timerID);
            this.timerID = null;
        }
        if (this.onPlayStateChange) this.onPlayStateChange(false);
    }

    schedulerLoop() {
        if (!this.isPlaying) return;

        while (this.nextNoteTime < this.ctx.currentTime + this.scheduleAheadTime) {
            this.scheduleStep(this.currentStep, this.nextNoteTime);
            this.advanceStep();
        }

        this.timerID = setTimeout(() => this.schedulerLoop(), this.lookaheadMs);
    }

    advanceStep() {
        // Calculate 16th note duration in seconds: (60 / BPM) / 4
        const secondsPer16th = 60.0 / this.bpm / 4.0;
        
        // Apply swing to odd steps (1, 3, 5, 7...)
        const isOddStep = (this.currentStep % 2 !== 0);
        const swingOffset = isOddStep ? (secondsPer16th * this.swing * 0.33) : 0;

        this.nextNoteTime += secondsPer16th + swingOffset;
        this.currentStep = (this.currentStep + 1) % this.totalSteps;
    }

    scheduleStep(stepIndex, audioTime) {
        // Notify UI on precise audio schedule
        const delayMs = Math.max(0, (audioTime - this.ctx.currentTime) * 1000);
        setTimeout(() => {
            if (this.isPlaying && this.onStepTick) {
                this.onStepTick(stepIndex);
            }
        }, delayMs);

        // Dispatch step events to instruments
        if (this.getEventsForStep) {
            this.getEventsForStep(stepIndex, audioTime);
        }
    }
}
