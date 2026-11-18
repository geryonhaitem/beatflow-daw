/**
 * BeatFlow Studio - PianoRoll Component
 * Interactive visual MIDI note grid editor with note creation, deletion, and real-time playback.
 */

export class PianoRollUI {
    constructor(container, sequencer, audioEngine, subSynth) {
        this.container = container;
        this.sequencer = sequencer;
        this.audioEngine = audioEngine;
        this.subSynth = subSynth;

        this.notes = [
            { pitch: 72, name: 'C5' },
            { pitch: 71, name: 'B4' },
            { pitch: 70, name: 'A#4', isBlack: true },
            { pitch: 69, name: 'A4' },
            { pitch: 68, name: 'G#4', isBlack: true },
            { pitch: 67, name: 'G4' },
            { pitch: 66, name: 'F#4', isBlack: true },
            { pitch: 65, name: 'F4' },
            { pitch: 64, name: 'E4' },
            { pitch: 63, name: 'D#4', isBlack: true },
            { pitch: 62, name: 'D4' },
            { pitch: 61, name: 'C#4', isBlack: true },
            { pitch: 60, name: 'C4' },
            { pitch: 59, name: 'B3' },
            { pitch: 57, name: 'A3' },
            { pitch: 55, name: 'G3' },
            { pitch: 53, name: 'F3' },
            { pitch: 52, name: 'E3' },
            { pitch: 50, name: 'D3' },
            { pitch: 48, name: 'C3' }
        ];

        this.initDOM();
    }

    initDOM() {
        this.container.innerHTML = `
            <div class="panel-header">
                <div class="panel-title">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18V5l12-2v13"></path><circle cx="6" cy="18" r="3"></circle><circle cx="18" cy="16" r="3"></circle></svg>
                    Piano Roll (Mélodie & Accords Synthé)
                </div>
                <div class="header-actions">
                    <span style="font-size: 0.85rem; color: var(--text-muted);">Clic gauche: poser/enlever | Clic droit: supprimer</span>
                </div>
            </div>

            <div class="pianoroll-viewport">
                <!-- Piano Keys Column -->
                <div class="pianoroll-keys" id="piano-keys-col"></div>

                <!-- Note Grid -->
                <div class="pianoroll-grid" id="piano-grid-area"></div>
            </div>
        `;

        this.renderPianoRoll();
    }

    renderPianoRoll() {
        const keysCol = this.container.querySelector('#piano-keys-col');
        const gridArea = this.container.querySelector('#piano-grid-area');
        keysCol.innerHTML = '';
        gridArea.innerHTML = '';

        const pattern = this.sequencer.getActivePattern();

        this.notes.forEach(noteInfo => {
            // 1. Piano Key
            const keyEl = document.createElement('div');
            keyEl.className = `piano-key ${noteInfo.isBlack ? 'key-black' : 'key-white'}`;
            keyEl.dataset.pitch = noteInfo.pitch;
            keyEl.innerHTML = `<span>${noteInfo.name}</span>`;
            keyEl.addEventListener('mousedown', () => {
                this.audioEngine.init();
                this.subSynth.playNote(this.audioEngine.masterGain, noteInfo.pitch, undefined, 0.4);
            });
            keysCol.appendChild(keyEl);

            // 2. Grid Lane (16 Steps)
            const lane = document.createElement('div');
            lane.className = `pianoroll-lane ${noteInfo.isBlack ? 'lane-black' : ''}`;
            lane.dataset.pitch = noteInfo.pitch;

            for (let step = 0; step < 16; step++) {
                const cell = document.createElement('div');
                cell.className = 'grid-cell';
                cell.dataset.step = step;
                cell.dataset.pitch = noteInfo.pitch;

                if (Math.floor(step / 4) % 2 === 1) cell.classList.add('cell-alt-beat');

                // Check if a note exists at this pitch and step
                const existingNote = pattern.pianoRollNotes.find(n => n.pitch === noteInfo.pitch && n.startStep === step);
                if (existingNote) {
                    const noteBlock = document.createElement('div');
                    noteBlock.className = 'piano-note-block';
                    noteBlock.style.width = `${existingNote.durationSteps * 100}%`;
                    cell.appendChild(noteBlock);
                }

                // Click to toggle note
                cell.addEventListener('click', (e) => {
                    const existingIdx = pattern.pianoRollNotes.findIndex(n => n.pitch === noteInfo.pitch && n.startStep === step);
                    if (existingIdx !== -1) {
                        pattern.pianoRollNotes.splice(existingIdx, 1);
                        cell.innerHTML = '';
                    } else {
                        const newNote = {
                            id: 'n_' + Date.now(),
                            pitch: noteInfo.pitch,
                            startStep: step,
                            durationSteps: 2,
                            velocity: 0.8
                        };
                        pattern.pianoRollNotes.push(newNote);
                        const noteBlock = document.createElement('div');
                        noteBlock.className = 'piano-note-block';
                        noteBlock.style.width = `${newNote.durationSteps * 100}%`;
                        cell.appendChild(noteBlock);

                        this.audioEngine.init();
                        this.subSynth.playNote(this.audioEngine.masterGain, noteInfo.pitch, undefined, 0.3);
                    }
                });

                // Context menu right-click to delete
                cell.addEventListener('contextmenu', (e) => {
                    e.preventDefault();
                    const existingIdx = pattern.pianoRollNotes.findIndex(n => n.pitch === noteInfo.pitch && n.startStep === step);
                    if (existingIdx !== -1) {
                        pattern.pianoRollNotes.splice(existingIdx, 1);
                        cell.innerHTML = '';
                    }
                });

                lane.appendChild(cell);
            }
            gridArea.appendChild(lane);
        });
    }

    highlightStep(stepIndex) {
        const allCells = this.container.querySelectorAll('.grid-cell');
        allCells.forEach(cell => {
            const isCurrent = parseInt(cell.dataset.step) === stepIndex;
            cell.classList.toggle('step-head-active', isCurrent);
        });
    }
}
