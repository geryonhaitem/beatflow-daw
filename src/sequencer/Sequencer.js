/**
 * BeatFlow Studio - Sequencer & Project State Model
 * Pattern model, Piano roll note container, Playlist arrangement & JSON persistence.
 */

export class Sequencer {
    constructor() {
        this.patterns = new Map();
        this.activePatternId = 1;

        // Initialize Pattern 1
        this.createPattern(1, "Pattern 1");

        // Playlist Arrangement
        // Array of { patternId, trackIndex, startBar, numBars }
        this.playlistArrangement = [
            { patternId: 1, trackIndex: 0, startBar: 0, numBars: 4 }
        ];

        // Mode: 'pattern' (loops active pattern) or 'song' (plays playlist arrangement)
        this.playMode = 'pattern';
    }

    createPattern(id, name = `Pattern ${id}`) {
        const pattern = {
            id,
            name,
            lengthSteps: 16,
            // 16-step triggers (1 = on, 0 = off)
            kick:     [1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0],
            snare:    [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
            clap:     [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            hat:      [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0],
            openhat:  [0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0],
            bass:     [1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0],
            sample:   [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0],
            sampleSlice: [0, 0, 0, 0, 1, 0, 0, 0, 2, 0, 0, 0, 3, 0, 0, 0],
            samplePitch: [0, 0, 0, 0, 2, 0, 0, 0, 4, 0, 0, 0, 0, 0, 0, 0],

            // Piano Roll Notes (Array of { id, pitch, startStep, durationSteps, velocity })
            pianoRollNotes: [
                { id: 'n1', pitch: 60, startStep: 0, durationSteps: 4, velocity: 0.8 },
                { id: 'n2', pitch: 64, startStep: 0, durationSteps: 4, velocity: 0.7 },
                { id: 'n3', pitch: 67, startStep: 0, durationSteps: 4, velocity: 0.75 },
                { id: 'n4', pitch: 62, startStep: 4, durationSteps: 4, velocity: 0.8 },
                { id: 'n5', pitch: 65, startStep: 4, durationSteps: 4, velocity: 0.75 }
            ]
        };

        this.patterns.set(id, pattern);
        return pattern;
    }

    getActivePattern() {
        if (!this.patterns.has(this.activePatternId)) {
            this.createPattern(this.activePatternId);
        }
        return this.patterns.get(this.activePatternId);
    }

    toggleStep(trackName, stepIndex) {
        const pat = this.getActivePattern();
        if (pat && pat[trackName]) {
            pat[trackName][stepIndex] = pat[trackName][stepIndex] ? 0 : 1;
            return pat[trackName][stepIndex];
        }
        return 0;
    }

    addPianoRollNote(note) {
        const pat = this.getActivePattern();
        note.id = 'note_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4);
        pat.pianoRollNotes.push(note);
        return note;
    }

    removePianoRollNote(noteId) {
        const pat = this.getActivePattern();
        pat.pianoRollNotes = pat.pianoRollNotes.filter(n => n.id !== noteId);
    }

    toJSON() {
        return {
            version: '1.0.0',
            activePatternId: this.activePatternId,
            patterns: Array.from(this.patterns.entries()),
            playlistArrangement: this.playlistArrangement,
            playMode: this.playMode
        };
    }

    fromJSON(jsonObj) {
        if (!jsonObj) return;
        this.activePatternId = jsonObj.activePatternId || 1;
        this.patterns = new Map(jsonObj.patterns || []);
        this.playlistArrangement = jsonObj.playlistArrangement || [];
        this.playMode = jsonObj.playMode || 'pattern';
    }
}
