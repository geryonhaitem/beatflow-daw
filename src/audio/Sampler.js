/**
 * BeatFlow Studio - Sampler Engine
 * Professional sample chopping, pitch shifting, transient slicing, and looping.
 */

export class SamplerEngine {
    constructor(ctx) {
        this.ctx = ctx;
        this.audioBuffer = null;
        this.reversedBuffer = null;
        this.fileName = "Aucun échantillon chargé";
        
        // Sample boundaries
        this.startOffset = 0.0; // in seconds
        this.endOffset = 0.0;   // in seconds
        this.loop = false;
        this.reverse = false;

        // Auto-chops (array of {start, duration, label})
        this.slices = [];
    }

    async loadFile(fileOrBlob) {
        const arrayBuffer = await fileOrBlob.arrayBuffer();
        this.audioBuffer = await this.ctx.decodeAudioData(arrayBuffer);
        this.fileName = fileOrBlob.name || "Échantillon Audio";
        this.startOffset = 0.0;
        this.endOffset = this.audioBuffer.duration;
        this.generateReversedBuffer();
        this.autoChop(8); // Auto-generate 8 default slices
        return this.audioBuffer;
    }

    loadBuffer(audioBuffer, name = "Sample") {
        this.audioBuffer = audioBuffer;
        this.fileName = name;
        this.startOffset = 0.0;
        this.endOffset = audioBuffer.duration;
        this.generateReversedBuffer();
        this.autoChop(8);
        return this.audioBuffer;
    }

    generateReversedBuffer() {
        if (!this.audioBuffer) return;
        const numChannels = this.audioBuffer.numberOfChannels;
        const length = this.audioBuffer.length;
        const sampleRate = this.audioBuffer.sampleRate;

        this.reversedBuffer = this.ctx.createBuffer(numChannels, length, sampleRate);
        for (let ch = 0; ch < numChannels; ch++) {
            const forward = this.audioBuffer.getChannelData(ch);
            const reverse = this.reversedBuffer.getChannelData(ch);
            for (let i = 0; i < length; i++) {
                reverse[i] = forward[length - 1 - i];
            }
        }
    }

    autoChop(numSlices = 8) {
        if (!this.audioBuffer) return;
        this.slices = [];
        const duration = this.endOffset - this.startOffset;
        const sliceDuration = duration / numSlices;

        for (let i = 0; i < numSlices; i++) {
            this.slices.push({
                index: i,
                start: this.startOffset + (i * sliceDuration),
                duration: sliceDuration,
                label: `Chop ${i + 1}`
            });
        }
    }

    playSlice(sliceIndex, destination, semitones = 0, time = this.ctx.currentTime) {
        if (!this.audioBuffer || !this.slices[sliceIndex]) return;
        const slice = this.slices[sliceIndex];
        this.playRange(slice.start, slice.duration, destination, semitones, time);
    }

    playRange(startTimeSec, durationSec, destination, semitones = 0, time = this.ctx.currentTime, velocity = 1.0) {
        if (!this.audioBuffer) return;

        const buffer = this.reverse ? this.reversedBuffer : this.audioBuffer;
        const source = this.ctx.createBufferSource();
        source.buffer = buffer;

        // Semitone pitch calculation (playback rate)
        // Rate = 2^(semitones / 12)
        const rate = Math.pow(2, semitones / 12);
        source.playbackRate.setValueAtTime(rate, time);

        // Anti-click micro envelope
        const gainNode = this.ctx.createGain();
        gainNode.gain.setValueAtTime(0.001, time);
        gainNode.gain.linearRampToValueAtTime(velocity, time + 0.008); // 8ms fade-in
        
        const effectiveDuration = durationSec / rate;
        gainNode.gain.setValueAtTime(velocity, time + effectiveDuration - 0.008);
        gainNode.gain.linearRampToValueAtTime(0.0001, time + effectiveDuration); // 8ms fade-out

        source.connect(gainNode);
        gainNode.connect(destination);

        source.start(time, startTimeSec, durationSec);
    }
}
