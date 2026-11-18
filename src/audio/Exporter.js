/**
 * BeatFlow Studio - Audio Exporter
 * Renders patterns and songs offline and encodes lossless WAV files.
 */

export class AudioExporter {
    static async exportSongToWAV(audioEngine, sequencer, samplerEngine, drumSynth, numBars = 4) {
        const bpm = audioEngine.bpm;
        const sampleRate = 48000;
        const secondsPerBeat = 60.0 / bpm;
        const totalDuration = numBars * 4 * secondsPerBeat;
        const totalFrames = Math.ceil(totalDuration * sampleRate);

        const offlineCtx = new OfflineAudioContext(2, totalFrames, sampleRate);
        const offlineMaster = offlineCtx.createGain();
        offlineMaster.connect(offlineCtx.destination);

        // Schedule all patterns
        const stepsPerBar = 16;
        const totalSteps = numBars * stepsPerBar;
        const secondsPer16th = secondsPerBeat / 4.0;

        for (let s = 0; s < totalSteps; s++) {
            const patternStep = s % 16;
            const stepTime = s * secondsPer16th;

            // Trigger steps according to active sequence
            const seq = sequencer.getActivePattern();
            if (seq.kick[patternStep]) drumSynth.playKick(offlineMaster, stepTime);
            if (seq.snare[patternStep]) drumSynth.playSnare(offlineMaster, stepTime);
            if (seq.hat[patternStep]) drumSynth.playHiHat(offlineMaster, stepTime, false);
            if (seq.openhat[patternStep]) drumSynth.playHiHat(offlineMaster, stepTime, true);
            if (seq.clap[patternStep]) drumSynth.playClap(offlineMaster, stepTime);
            if (seq.bass[patternStep]) drumSynth.play808(offlineMaster, stepTime, 36);

            // Sample chops
            if (seq.sample[patternStep] && samplerEngine.audioBuffer) {
                const sliceIdx = seq.sampleSlice ? seq.sampleSlice[patternStep] : 0;
                samplerEngine.playSlice(sliceIdx, offlineMaster, seq.samplePitch ? seq.samplePitch[patternStep] : 0, stepTime);
            }
        }

        const renderedBuffer = await offlineCtx.startRendering();
        return this.audioBufferToWavBlob(renderedBuffer);
    }

    static audioBufferToWavBlob(buffer) {
        const numChannels = buffer.numberOfChannels;
        const sampleRate = buffer.sampleRate;
        const format = 1; // PCM
        const bitDepth = 16;

        let result;
        if (numChannels === 2) {
            result = this.interleave(buffer.getChannelData(0), buffer.getChannelData(1));
        } else {
            result = buffer.getChannelData(0);
        }

        const bytesPerSample = bitDepth / 8;
        const blockAlign = numChannels * bytesPerSample;
        const dataByteLength = result.length * bytesPerSample;
        const headerByteLength = 44;
        const totalByteLength = headerByteLength + dataByteLength;

        const arrayBuffer = new ArrayBuffer(totalByteLength);
        const view = new DataView(arrayBuffer);

        // RIFF chunk descriptor
        this.writeString(view, 0, 'RIFF');
        view.setUint32(4, 36 + dataByteLength, true);
        this.writeString(view, 8, 'WAVE');

        // FMT sub-chunk
        this.writeString(view, 12, 'fmt ');
        view.setUint32(16, 16, true);
        view.setUint16(20, format, true);
        view.setUint16(22, numChannels, true);
        view.setUint32(24, sampleRate, true);
        view.setUint32(28, sampleRate * blockAlign, true);
        view.setUint16(32, blockAlign, true);
        view.setUint16(34, bitDepth, true);

        // DATA sub-chunk
        this.writeString(view, 36, 'data');
        view.setUint32(40, dataByteLength, true);

        // Float to PCM 16-bit
        let offset = 44;
        for (let i = 0; i < result.length; i++) {
            let s = Math.max(-1, Math.min(1, result[i]));
            view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
            offset += 2;
        }

        return new Blob([view], { type: 'audio/wav' });
    }

    static interleave(left, right) {
        const length = left.length + right.length;
        const result = new Float32Array(length);
        let inputIndex = 0;
        for (let i = 0; i < length; ) {
            result[i++] = left[inputIndex];
            result[i++] = right[inputIndex];
            inputIndex++;
        }
        return result;
    }

    static writeString(view, offset, string) {
        for (let i = 0; i < string.length; i++) {
            view.setUint8(offset + i, string.charCodeAt(i));
        }
    }
}

export const Exporter = AudioExporter;

