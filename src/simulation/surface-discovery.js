import { editableStone, touchesStone } from './geometry.js';

// Persistent knowledge of the stone, separate from the fading grease field.
// This state never participates in contacts, adhesion, or seeded randomness.
export class SurfaceDiscovery {
  constructor(config) {
    this.config = config;
    this.cellSize = config.revealCellSize;
    this.columns = Math.ceil(config.width / this.cellSize);
    this.rows = Math.ceil(config.height / this.cellSize);
    this.levels = new Float32Array(this.columns * this.rows);
    this.paintable = new Uint8Array(this.levels.length);
    this.active = new Set();
    this.version = 0;
  }

  levelAt(x, y) {
    if (!editableStone(x, y)) return 0;
    const gx = x / this.cellSize - 0.5,
      gy = y / this.cellSize - 0.5;
    const left = Math.floor(gx),
      top = Math.floor(gy);
    const fx = gx - left,
      fy = gy - top;
    let level = 0;
    for (let row = 0; row < 2; row++)
      for (let column = 0; column < 2; column++) {
        const cx = left + column,
          cy = top + row;
        if (cx < 0 || cx >= this.columns || cy < 0 || cy >= this.rows) continue;
        level +=
          this.levels[cy * this.columns + cx] *
          (column ? fx : 1 - fx) *
          (row ? fy : 1 - fy);
      }
    return level;
  }

  stamp(point, radius, amount) {
    if (amount <= 0) return false;
    const minX = Math.max(0, Math.floor((point.x - radius) / this.cellSize));
    const maxX = Math.min(
      this.columns - 1,
      Math.floor((point.x + radius) / this.cellSize),
    );
    const minY = Math.max(0, Math.floor((point.y - radius) / this.cellSize));
    const maxY = Math.min(
      this.rows - 1,
      Math.floor((point.y + radius) / this.cellSize),
    );
    let changed = false,
      complete = true;
    for (let row = minY; row <= maxY; row++)
      for (let column = minX; column <= maxX; column++) {
        const x = (column + 0.5) * this.cellSize,
          y = (row + 0.5) * this.cellSize;
        const distance2 =
          ((x - point.x) ** 2 + (y - point.y) ** 2) / (radius * radius);
        if (distance2 >= 1) continue;
        const index = row * this.columns + column;
        // Cache edge-overlapping texels. The stone artwork clips them precisely.
        if (!this.paintable[index])
          this.paintable[index] = touchesStone(
            { x, y },
            { x, y },
            this.cellSize * Math.SQRT1_2,
          )
            ? 1
            : 2;
        if (this.paintable[index] === 2) continue;
        const previous = this.levels[index];
        const next = Math.min(1, previous + amount * (1 - distance2) ** 2);
        if (next < 1) complete = false;
        if (next > previous) {
          this.levels[index] = next;
          this.active.add(index);
          changed = true;
        }
      }
    if (changed) this.version++;
    return complete;
  }

  brush(a, b, { start = true } = {}) {
    const radius = this.config.revealBrushRadius;
    if (start) this.stamp(a, radius, this.config.revealBrushGain);
    const length = Math.hypot(b.x - a.x, b.y - a.y);
    if (!length) return;
    const count = Math.ceil(length / (radius / 4));
    const dose =
      (this.config.revealBrushGain * (length / count) * 15) / (16 * radius);
    for (let i = 0; i < count; i++) {
      const t = (i + 0.5) / count;
      this.stamp(
        { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t },
        radius,
        dose,
      );
    }
  }

  grainContact(a, b, seconds) {
    if (!touchesStone(a, b, this.config.grainRadius)) return true;
    const radius = this.config.revealGrainRadius;
    const count = Math.max(
      1,
      Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / (radius / 2)),
    );
    const dose = (this.config.revealGrainRate * seconds) / count;
    let complete = true;
    for (let i = 0; i < count; i++) {
      const t = (i + 0.5) / count;
      complete =
        this.stamp(
          { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t },
          radius,
          dose,
        ) && complete;
    }
    return complete;
  }

  updateGrains(grains, step) {
    for (const grain of grains) {
      const stationary = grain.x === grain.revealX && grain.y === grain.revealY;
      if (!stationary || !grain.revealComplete) {
        grain.revealComplete = this.grainContact(
          { x: grain.revealX, y: grain.revealY },
          grain,
          (step - grain.revealStep) / this.config.stepsPerSecond,
        );
      }
      grain.revealX = grain.x;
      grain.revealY = grain.y;
      grain.revealStep = step;
    }
  }

  snapshot() {
    return [...this.active]
      .sort((a, b) => a - b)
      .map((index) => [index, this.levels[index]]);
  }
}
