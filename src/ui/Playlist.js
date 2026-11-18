/**
 * BeatFlow DAW - Playlist / Song Arranger
 * Multi-track timeline for arranging patterns, audio loops and clips.
 */
export class PlaylistUI {
  constructor(container, sequencer, audioEngine, onSeek) {
    this.container = container;
    this.sequencer = sequencer;
    this.audioEngine = audioEngine;
    this.onSeek = onSeek || (() => {});
    
    this.totalBars = 32;
    this.stepsPerBar = 16;
    this.trackCount = 8;
    this.pixelsPerBar = 96;
    this.trackHeight = 44;
    this.trackNames = [
      'Drum Pattern',
      'Bass 808',
      'Vocal Chop / Lead',
      'Chords / Harmony',
      'Perc & FX',
      'Audio Clip 1',
      'Audio Clip 2',
      'Automation / Extra'
    ];

    // Grid blocks: array of { trackIndex, startBar, lengthBars, color, name, patternId }
    this.blocks = [
      { trackIndex: 0, startBar: 0, lengthBars: 8, color: '#ff5c38', name: 'Drums Intro' },
      { trackIndex: 0, startBar: 8, lengthBars: 16, color: '#ff5c38', name: 'Drums Main Drop' },
      { trackIndex: 1, startBar: 4, lengthBars: 4, color: '#a855f7', name: '808 Sub Buildup' },
      { trackIndex: 1, startBar: 8, lengthBars: 16, color: '#a855f7', name: '808 Sub Drop' },
      { trackIndex: 2, startBar: 0, lengthBars: 24, color: '#06b6d4', name: 'Vocal Chops Pitch+3' },
      { trackIndex: 3, startBar: 8, lengthBars: 16, color: '#3b82f6', name: 'Synth Chords' },
      { trackIndex: 4, startBar: 7, lengthBars: 1, color: '#f59e0b', name: 'Snare Roll Riser' }
    ];

    this.currentBarPosition = 0;
    this.selectedBlock = null;

    this.render();
    this.setupListeners();
  }

  render() {
    this.container.innerHTML = `
      <div class="playlist-header">
        <div class="playlist-toolbar">
          <div class="playlist-tool-group">
            <button class="tool-btn active" id="pl-tool-pencil" title="Draw Block (P)">DRAW</button>
            <button class="tool-btn" id="pl-tool-select" title="Select / Move (S)">MOVE</button>
            <button class="tool-btn" id="pl-tool-erase" title="Erase Block (E)">ERASE</button>
            <button class="tool-btn" id="pl-tool-slice" title="Cut / Slice (C)">CUT</button>
          </div>
          <div class="playlist-snap-control">
            <label>Snap:</label>
            <select id="pl-snap" class="custom-select">
              <option value="1">1 Bar</option>
              <option value="0.5">1/2 Bar</option>
              <option value="0.25">1/4 Bar (1 Beat)</option>
              <option value="none">None</option>
            </select>
          </div>
          <div class="playlist-zoom-control">
            <button id="pl-zoom-out" class="icon-btn" title="Zoom Out">-</button>
            <span id="pl-zoom-level">100%</span>
            <button id="pl-zoom-in" class="icon-btn" title="Zoom In">+</button>
          </div>
          <div class="playlist-legend">
            <span class="legend-badge drop">DROP</span>
            <span class="legend-badge verse">VERSE</span>
            <span class="legend-badge hook">HOOK</span>
          </div>
        </div>
      </div>
      <div class="playlist-body">
        <div class="playlist-track-headers" id="pl-headers">
          ${this.trackNames.map((name, i) => `
            <div class="pl-track-header" data-track="${i}">
              <div class="pl-track-color-indicator" style="background: ${this.getTrackColor(i)}"></div>
              <div class="pl-track-info">
                <span class="pl-track-num">Trk ${i + 1}</span>
                <span class="pl-track-title">${name}</span>
              </div>
              <div class="pl-track-actions">
                <button class="btn-tiny pl-mute" title="Mute">M</button>
                <button class="btn-tiny pl-solo" title="Solo">S</button>
              </div>
            </div>
          `).join('')}
        </div>
        <div class="playlist-timeline-viewport" id="pl-viewport">
          <div class="playlist-ruler" id="pl-ruler">
            <canvas id="pl-ruler-canvas"></canvas>
          </div>
          <div class="playlist-grid-container" id="pl-grid-container">
            <canvas id="pl-grid-canvas"></canvas>
            <div class="playlist-playhead" id="pl-playhead"></div>
          </div>
        </div>
      </div>
    `;

    this.rulerCanvas = this.container.querySelector('#pl-ruler-canvas');
    this.gridCanvas = this.container.querySelector('#pl-grid-canvas');
    this.playheadEl = this.container.querySelector('#pl-playhead');
    this.viewportEl = this.container.querySelector('#pl-viewport');

    this.activeTool = 'pencil';
    this.snapValue = 1;

    this.resizeCanvases();
    this.drawRuler();
    this.drawGrid();
  }

  getTrackColor(i) {
    const colors = ['#ff5c38', '#a855f7', '#06b6d4', '#3b82f6', '#f59e0b', '#10b981', '#ec4899', '#64748b'];
    return colors[i % colors.length];
  }

  resizeCanvases() {
    const totalWidth = this.totalBars * this.pixelsPerBar;
    const totalHeight = this.trackCount * this.trackHeight;

    this.rulerCanvas.width = totalWidth;
    this.rulerCanvas.height = 28;
    this.rulerCanvas.style.width = `${totalWidth}px`;
    this.rulerCanvas.style.height = '28px';

    this.gridCanvas.width = totalWidth;
    this.gridCanvas.height = totalHeight;
    this.gridCanvas.style.width = `${totalWidth}px`;
    this.gridCanvas.style.height = `${totalHeight}px`;

    const gridContainer = this.container.querySelector('#pl-grid-container');
    gridContainer.style.width = `${totalWidth}px`;
    gridContainer.style.height = `${totalHeight}px`;
  }

  drawRuler() {
    const ctx = this.rulerCanvas.getContext('2d');
    const width = this.rulerCanvas.width;
    const height = this.rulerCanvas.height;

    ctx.fillStyle = '#18181f';
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = '#2d2d3a';
    ctx.lineWidth = 1;
    ctx.font = '10px Inter, sans-serif';
    ctx.fillStyle = '#8b8b9e';

    for (let bar = 0; bar <= this.totalBars; bar++) {
      const x = bar * this.pixelsPerBar;
      
      // Bar line
      ctx.beginPath();
      ctx.moveTo(x + 0.5, 0);
      ctx.lineTo(x + 0.5, height);
      ctx.stroke();

      if (bar < this.totalBars) {
        ctx.fillText(`${bar + 1}`, x + 6, 18);
        
        // Quarter beat ticks
        for (let beat = 1; beat < 4; beat++) {
          const bx = x + (beat * this.pixelsPerBar / 4);
          ctx.beginPath();
          ctx.moveTo(bx + 0.5, height - 6);
          ctx.lineTo(bx + 0.5, height);
          ctx.stroke();
        }
      }
    }
  }

  drawGrid() {
    const ctx = this.gridCanvas.getContext('2d');
    const width = this.gridCanvas.width;
    const height = this.gridCanvas.height;

    ctx.fillStyle = '#121217';
    ctx.fillRect(0, 0, width, height);

    // Track rows
    for (let t = 0; t < this.trackCount; t++) {
      const y = t * this.trackHeight;
      ctx.fillStyle = t % 2 === 0 ? '#14141a' : '#111116';
      ctx.fillRect(0, y, width, this.trackHeight);

      ctx.strokeStyle = '#23232c';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, y + this.trackHeight + 0.5);
      ctx.lineTo(width, y + this.trackHeight + 0.5);
      ctx.stroke();
    }

    // Vertical bar lines
    for (let bar = 0; bar <= this.totalBars; bar++) {
      const x = bar * this.pixelsPerBar;
      ctx.strokeStyle = bar % 4 === 0 ? '#2e2e3d' : '#1e1e27';
      ctx.lineWidth = bar % 4 === 0 ? 1.5 : 1;
      ctx.beginPath();
      ctx.moveTo(x + 0.5, 0);
      ctx.lineTo(x + 0.5, height);
      ctx.stroke();

      // Quarter beats
      for (let beat = 1; beat < 4; beat++) {
        const bx = x + (beat * this.pixelsPerBar / 4);
        ctx.strokeStyle = '#181820';
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(bx + 0.5, 0);
        ctx.lineTo(bx + 0.5, height);
        ctx.stroke();
      }
    }

    // Draw pattern / audio blocks
    this.blocks.forEach(block => {
      this.drawBlock(ctx, block);
    });
  }

  drawBlock(ctx, block) {
    const x = block.startBar * this.pixelsPerBar;
    const y = block.trackIndex * this.trackHeight;
    const w = block.lengthBars * this.pixelsPerBar;
    const h = this.trackHeight - 2;

    // Background gradient
    const grad = ctx.createLinearGradient(x, y, x, y + h);
    grad.addColorStop(0, block.color + 'dd');
    grad.addColorStop(1, block.color + '88');

    ctx.fillStyle = grad;
    this.roundRect(ctx, x + 1, y + 1, w - 2, h, 4);
    ctx.fill();

    // Border
    ctx.strokeStyle = block.color;
    ctx.lineWidth = 1.5;
    this.roundRect(ctx, x + 1, y + 1, w - 2, h, 4);
    ctx.stroke();

    // Block header / Title bar
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    this.roundRect(ctx, x + 1, y + 1, w - 2, 14, 3);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 10px Inter, sans-serif';
    ctx.fillText(block.name, x + 6, y + 11);

    // Decorative waveform or note pattern preview inside block
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    const midY = y + 14 + (h - 14) / 2;
    for (let px = x + 6; px < x + w - 6; px += 4) {
      const seed = Math.sin(px * 0.2) * (h - 18) * 0.4;
      ctx.moveTo(px, midY - seed);
      ctx.lineTo(px, midY + seed);
    }
    ctx.stroke();
  }

  roundRect(ctx, x, y, w, h, r) {
    if (w < 2 * r) r = w / 2;
    if (h < 2 * r) r = h / 2;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  setupListeners() {
    // Tool buttons
    const tools = ['pencil', 'select', 'erase', 'slice'];
    tools.forEach(tool => {
      const btn = this.container.querySelector(`#pl-tool-${tool}`);
      if (btn) {
        btn.addEventListener('click', () => {
          tools.forEach(t => this.container.querySelector(`#pl-tool-${t}`)?.classList.remove('active'));
          btn.classList.add('active');
          this.activeTool = tool;
        });
      }
    });

    // Snap dropdown
    const snapEl = this.container.querySelector('#pl-snap');
    snapEl?.addEventListener('change', (e) => {
      this.snapValue = e.target.value === 'none' ? 0.0625 : parseFloat(e.target.value);
    });

    // Zoom controls
    this.container.querySelector('#pl-zoom-in')?.addEventListener('click', () => {
      this.pixelsPerBar = Math.min(240, this.pixelsPerBar * 1.25);
      this.container.querySelector('#pl-zoom-level').textContent = `${Math.round((this.pixelsPerBar / 96) * 100)}%`;
      this.resizeCanvases();
      this.drawRuler();
      this.drawGrid();
    });

    this.container.querySelector('#pl-zoom-out')?.addEventListener('click', () => {
      this.pixelsPerBar = Math.max(48, this.pixelsPerBar / 1.25);
      this.container.querySelector('#pl-zoom-level').textContent = `${Math.round((this.pixelsPerBar / 96) * 100)}%`;
      this.resizeCanvases();
      this.drawRuler();
      this.drawGrid();
    });

    // Grid interaction (click to add/remove/edit)
    this.gridCanvas.addEventListener('mousedown', (e) => {
      const rect = this.gridCanvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const trackIndex = Math.floor(y / this.trackHeight);
      let rawBar = x / this.pixelsPerBar;
      let snapBar = Math.floor(rawBar / this.snapValue) * this.snapValue;

      if (trackIndex < 0 || trackIndex >= this.trackCount) return;

      // Find existing block
      const clickedBlockIndex = this.blocks.findIndex(b => 
        b.trackIndex === trackIndex && rawBar >= b.startBar && rawBar <= (b.startBar + b.lengthBars)
      );

      if (this.activeTool === 'erase' || e.button === 2) {
        if (clickedBlockIndex !== -1) {
          this.blocks.splice(clickedBlockIndex, 1);
          this.drawGrid();
        }
      } else if (this.activeTool === 'pencil') {
        if (clickedBlockIndex === -1) {
          // Add new 4-bar block
          this.blocks.push({
            trackIndex,
            startBar: snapBar,
            lengthBars: 4,
            color: this.getTrackColor(trackIndex),
            name: `${this.trackNames[trackIndex]} Part`
          });
          this.drawGrid();
        }
      } else if (this.activeTool === 'slice') {
        if (clickedBlockIndex !== -1) {
          const target = this.blocks[clickedBlockIndex];
          const splitPoint = snapBar;
          if (splitPoint > target.startBar && splitPoint < target.startBar + target.lengthBars) {
            const firstLength = splitPoint - target.startBar;
            const secondLength = (target.startBar + target.lengthBars) - splitPoint;
            
            target.lengthBars = firstLength;
            this.blocks.push({
              trackIndex: target.trackIndex,
              startBar: splitPoint,
              lengthBars: secondLength,
              color: target.color,
              name: target.name + ' (cut)'
            });
            this.drawGrid();
          }
        }
      }
    });

    // Ruler scrub / seek
    this.rulerCanvas.addEventListener('click', (e) => {
      const rect = this.rulerCanvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const bar = x / this.pixelsPerBar;
      this.updatePlayhead(bar);
      this.onSeek(bar);
    });

    // Disable context menu on canvas
    this.gridCanvas.addEventListener('contextmenu', e => e.preventDefault());
  }

  updatePlayhead(barPosition) {
    this.currentBarPosition = barPosition;
    const x = barPosition * this.pixelsPerBar;
    if (this.playheadEl) {
      this.playheadEl.style.transform = `translateX(${x}px)`;
    }
  }
}
