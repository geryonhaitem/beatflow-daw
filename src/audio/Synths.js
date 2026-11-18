/**
 * BeatFlow Studio - Synths & Drum Generation
 * High quality analog-modeled drum synthesizers and melodic instruments.
 */

export class DrumSynth {
    constructor(ctx) {
        this.ctx = ctx;
    }

    play808(destination, time = this.ctx.currentTime, pitchNote = 36, length = 0.8) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        // Base frequency calculation (MIDI note to Hz)
        const baseFreq = 440 * Math.pow(2, (pitchNote - 69) / 12);

        // Pitch drop envelope for punch
        osc.frequency.setValueAtTime(baseFreq * 2.5, time);
        osc.frequency.exponentialRampToValueAtTime(baseFreq, time + 0.06);

        // Soft saturation wave shaper
        const shaper = this.ctx.createWaveShaper();
        shaper.curve = this.createDistortionCurve(15);

        // Amplitude ADSR
        gain.gain.setValueAtTime(1.0, time);
        gain.gain.exponentialRampToValueAtTime(0.0001, time + length);

        osc.connect(shaper);
        shaper.connect(gain);
        gain.connect(destination);

        osc.start(time);
        osc.stop(time + length);
    }

    playKick(destination, time = this.ctx.currentTime, punch = 1.0) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        // Punchy pitch drop: 160Hz -> 45Hz
        osc.frequency.setValueAtTime(160 * punch, time);
        osc.frequency.exponentialRampToValueAtTime(45, time + 0.08);

        // Click transient
        const click = this.ctx.createOscillator();
        const clickGain = this.ctx.createGain();
        click.frequency.setValueAtTime(300, time);
        clickGain.gain.setValueAtTime(0.5, time);
        clickGain.gain.exponentialRampToValueAtTime(0.001, time + 0.02);
        click.connect(clickGain);
        clickGain.connect(destination);
        click.start(time);
        click.stop(time + 0.02);

        // Main body
        gain.gain.setValueAtTime(1.0, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.32);

        osc.connect(gain);
        gain.connect(destination);

        osc.start(time);
        osc.stop(time + 0.32);
    }

    playSnare(destination, time = this.ctx.currentTime) {
        // 1. Noise component (snares)
        const bufferSize = this.ctx.sampleRate * 0.22;
        const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1;
        }

        const whiteNoise = this.ctx.createBufferSource();
        whiteNoise.buffer = noiseBuffer;

        const noiseFilter = this.ctx.createBiquadFilter();
        noiseFilter.type = 'highpass';
        noiseFilter.frequency.value = 1000;

        const noiseEnvelope = this.ctx.createGain();
        noiseEnvelope.gain.setValueAtTime(0.9, time);
        noiseEnvelope.gain.exponentialRampToValueAtTime(0.001, time + 0.22);

        whiteNoise.connect(noiseFilter);
        noiseFilter.connect(noiseEnvelope);
        noiseEnvelope.connect(destination);
        whiteNoise.start(time);

        // 2. Body Tone component
        const toneOsc = this.ctx.createOscillator();
        const toneGain = this.ctx.createGain();
        toneOsc.frequency.setValueAtTime(185, time);
        toneOsc.frequency.exponentialRampToValueAtTime(80, time + 0.1);

        toneGain.gain.setValueAtTime(0.6, time);
        toneGain.gain.exponentialRampToValueAtTime(0.001, time + 0.12);

        toneOsc.connect(toneGain);
        toneGain.connect(destination);

        toneOsc.start(time);
        toneOsc.stop(time + 0.12);
    }

    playHiHat(destination, time = this.ctx.currentTime, isOpen = false) {
        const decayTime = isOpen ? 0.28 : 0.055;
        const bufferSize = this.ctx.sampleRate * decayTime;
        const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1;
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = noiseBuffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = 7500;

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.55, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + decayTime);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(destination);

        noise.start(time);
    }

    playClap(destination, time = this.ctx.currentTime) {
        // Multi-tap clap bursts
        const burstTimes = [0, 0.012, 0.024];
        burstTimes.forEach(tOffset => {
            const bufferSize = this.ctx.sampleRate * 0.015;
            const b = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
            const data = b.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

            const n = this.ctx.createBufferSource();
            n.buffer = b;
            const g = this.ctx.createGain();
            g.gain.setValueAtTime(0.7, time + tOffset);
            g.gain.exponentialRampToValueAtTime(0.01, time + tOffset + 0.015);

            const f = this.ctx.createBiquadFilter();
            f.type = 'bandpass';
            f.frequency.value = 1200;

            n.connect(f);
            f.connect(g);
            g.connect(destination);
            n.start(time + tOffset);
        });

        // Tail burst
        const tailSize = this.ctx.sampleRate * 0.25;
        const tailBuffer = this.ctx.createBuffer(1, tailSize, this.ctx.sampleRate);
        const tailData = tailBuffer.getChannelData(0);
        for (let i = 0; i < tailSize; i++) tailData[i] = Math.random() * 2 - 1;

        const tail = this.ctx.createBufferSource();
        tail.buffer = tailBuffer;
        const tailFilter = this.ctx.createBiquadFilter();
        tailFilter.type = 'bandpass';
        tailFilter.frequency.value = 1400;

        const tailGain = this.ctx.createGain();
        tailGain.gain.setValueAtTime(0.8, time + 0.035);
        tailGain.gain.exponentialRampToValueAtTime(0.001, time + 0.26);

        tail.connect(tailFilter);
        tailFilter.connect(tailGain);
        tailGain.connect(destination);
        tail.start(time + 0.035);
    }

    createDistortionCurve(amount) {
        const k = typeof amount === 'number' ? amount : 50;
        const n_samples = 44100;
        const curve = new Float32Array(n_samples);
        const deg = Math.PI / 180;
        for (let i = 0; i < n_samples; ++i) {
            const x = (i * 2) / n_samples - 1;
            curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
        }
        return curve;
    }
}

export class SubSynth {
    constructor(ctx) {
        this.ctx = ctx;
    }

    playNote(destination, midiNote = 60, time = this.ctx.currentTime, duration = 0.5, velocity = 0.8) {
        const osc1 = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const filter = this.ctx.createBiquadFilter();
        const ampGain = this.ctx.createGain();

        const freq = 440 * Math.pow(2, (midiNote - 69) / 12);

        // Osc 1: Sawtooth
        osc1.type = 'sawtooth';
        osc1.frequency.setValueAtTime(freq, time);

        // Osc 2: Square (detuned by +7 cents for warm thickness)
        osc2.type = 'square';
        osc2.frequency.setValueAtTime(freq * 1.004, time);

        // Resonant Lowpass Filter with envelope
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(freq * 4.5, time);
        filter.frequency.exponentialRampToValueAtTime(freq * 1.2, time + duration);
        filter.Q.value = 4.0;

        // ADSR Envelope
        ampGain.gain.setValueAtTime(0.0001, time);
        ampGain.gain.linearRampToValueAtTime(velocity * 0.7, time + 0.015); // Attack
        ampGain.gain.exponentialRampToValueAtTime(velocity * 0.45, time + 0.15); // Decay
        ampGain.gain.setValueAtTime(velocity * 0.45, time + duration - 0.05); // Sustain
        ampGain.gain.exponentialRampToValueAtTime(0.0001, time + duration + 0.1); // Release

        osc1.connect(filter);
        osc2.connect(filter);
        filter.connect(ampGain);
        ampGain.connect(destination);

        osc1.start(time);
        osc2.start(time);
        osc1.stop(time + duration + 0.1);
        osc2.stop(time + duration + 0.1);
    }
}
