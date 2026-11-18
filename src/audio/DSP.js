/**
 * BeatFlow Studio - Studio Effects & DSP Nodes
 * Real-time audio processors: 3-Band Parametric EQ, Stereo Delay, Algorithmic Reverb & Tape Saturation.
 */

export class FXChain {
    constructor(ctx) {
        this.ctx = ctx;
        this.input = ctx.createGain();
        this.output = ctx.createGain();

        // 1. 3-Band Parametric EQ
        this.lowShelf = ctx.createBiquadFilter();
        this.lowShelf.type = 'lowshelf';
        this.lowShelf.frequency.value = 100;
        this.lowShelf.gain.value = 0;

        this.midPeak = ctx.createBiquadFilter();
        this.midPeak.type = 'peaking';
        this.midPeak.frequency.value = 1200;
        this.midPeak.Q.value = 1.0;
        this.midPeak.gain.value = 0;

        this.highShelf = ctx.createBiquadFilter();
        this.highShelf.type = 'highshelf';
        this.highShelf.frequency.value = 8000;
        this.highShelf.gain.value = 0;

        // 2. Tape Saturation
        this.shaper = ctx.createWaveShaper();
        this.shaper.curve = this.makeDistortionCurve(0);

        // 3. Stereo Ping-Pong / Tempo Delay
        this.delay = ctx.createDelay(2.0);
        this.delay.delayTime.value = 0.28; // ~8th note at 130 BPM
        this.delayFeedback = ctx.createGain();
        this.delayFeedback.gain.value = 0.35;
        this.delayWet = ctx.createGain();
        this.delayWet.gain.value = 0.0; // Disabled by default

        // 4. Algorithmic Reverb
        this.reverbConvolver = ctx.createConvolver();
        this.reverbConvolver.buffer = this.buildImpulseResponse(2.2, 2.0);
        this.reverbWet = ctx.createGain();
        this.reverbWet.gain.value = 0.0; // Disabled by default

        // Routing Graph
        this.input.connect(this.lowShelf);
        this.lowShelf.connect(this.midPeak);
        this.midPeak.connect(this.highShelf);
        this.highShelf.connect(this.shaper);

        // Dry path
        this.shaper.connect(this.output);

        // Delay path
        this.shaper.connect(this.delay);
        this.delay.connect(this.delayFeedback);
        this.delayFeedback.connect(this.delay);
        this.delay.connect(this.delayWet);
        this.delayWet.connect(this.output);

        // Reverb path
        this.shaper.connect(this.reverbConvolver);
        this.reverbConvolver.connect(this.reverbWet);
        this.reverbWet.connect(this.output);
    }

    setEQ(lowGainDb, midGainDb, highGainDb) {
        this.lowShelf.gain.setTargetAtTime(lowGainDb, this.ctx.currentTime, 0.02);
        this.midPeak.gain.setTargetAtTime(midGainDb, this.ctx.currentTime, 0.02);
        this.highShelf.gain.setTargetAtTime(highGainDb, this.ctx.currentTime, 0.02);
    }

    setSaturation(amount = 0) {
        this.shaper.curve = this.makeDistortionCurve(amount * 40);
    }

    setDelayWet(wet = 0.0) {
        this.delayWet.gain.setTargetAtTime(Math.max(0, Math.min(1, wet)), this.ctx.currentTime, 0.02);
    }

    setReverbWet(wet = 0.0) {
        this.reverbWet.gain.setTargetAtTime(Math.max(0, Math.min(1, wet)), this.ctx.currentTime, 0.02);
    }

    makeDistortionCurve(amount) {
        const k = amount;
        const n_samples = 44100;
        const curve = new Float32Array(n_samples);
        const deg = Math.PI / 180;
        for (let i = 0; i < n_samples; ++i) {
            const x = (i * 2) / n_samples - 1;
            curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
        }
        return curve;
    }

    buildImpulseResponse(durationSec, decayFactor) {
        const sampleRate = this.ctx.sampleRate;
        const length = sampleRate * durationSec;
        const impulse = this.ctx.createBuffer(2, length, sampleRate);
        const left = impulse.getChannelData(0);
        const right = impulse.getChannelData(1);

        for (let i = 0; i < length; i++) {
            const decay = Math.exp(-i / (sampleRate * (decayFactor / 4)));
            left[i] = (Math.random() * 2 - 1) * decay;
            right[i] = (Math.random() * 2 - 1) * decay;
        }
        return impulse;
    }
}

export const DSPChain = FXChain;

