import { editableStone } from './geometry.js';

// This is a surface property, not collision geometry. Both adhesion and the
// visible coating read the same decaying field in fixed logical coordinates.
export class SurfaceTreatment {
  constructor(config) {
    this.config = config;
    this.cellSize = config.traceCellSize;
    this.columns = Math.ceil(config.width / this.cellSize);
    this.rows = Math.ceil(config.height / this.cellSize);
    this.strength = new Float32Array(this.columns * this.rows);
    this.updated = new Float64Array(this.strength.length);
    this.active = new Set();
    this.time = 0;
    this.version = 0;
  }

  advanceTo(time) {
    this.time = Math.max(this.time, time);
  }

  cellStrength(index) {
    const stored = this.strength[index];
    if (!stored) return 0;
    const value =
      stored *
      0.5 ** ((this.time - this.updated[index]) / this.config.traceHalfLife);
    return value >= this.config.traceMinStrength ? value : 0;
  }

  strengthAt(x, y) {
    if (!editableStone(x, y)) return 0;
    const gx = x / this.cellSize - 0.5;
    const gy = y / this.cellSize - 0.5;
    const left = Math.floor(gx),
      top = Math.floor(gy);
    const fx = gx - left,
      fy = gy - top;
    let value = 0;
    for (let row = 0; row < 2; row++)
      for (let column = 0; column < 2; column++) {
        const cx = left + column,
          cy = top + row;
        if (cx < 0 || cx >= this.columns || cy < 0 || cy >= this.rows) continue;
        value +=
          this.cellStrength(cy * this.columns + cx) *
          (column ? fx : 1 - fx) *
          (row ? fy : 1 - fy);
      }
    return value;
  }

  stamp(point, amount) {
    const radius = this.config.brushWidth / 2;
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
    let changed = false;
    for (let row = minY; row <= maxY; row++)
      for (let column = minX; column <= maxX; column++) {
        const x = (column + 0.5) * this.cellSize,
          y = (row + 0.5) * this.cellSize;
        if (!editableStone(x, y)) continue;
        const distance2 =
          ((x - point.x) ** 2 + (y - point.y) ** 2) / (radius * radius);
        if (distance2 >= 1) continue;
        const index = row * this.columns + column;
        const previous = this.cellStrength(index);
        const next = Math.min(
          this.config.traceMaxStrength,
          previous + amount * (1 - distance2) ** 2,
        );
        if (next <= previous) continue;
        this.strength[index] = next;
        this.updated[index] = this.time;
        this.active.add(index);
        changed = true;
      }
    return changed;
  }

  paint(a, b, { start = true } = {}) {
    let changed = start ? this.stamp(a, this.config.tracePassGain) : false;
    const length = Math.hypot(b.x - a.x, b.y - a.y);
    if (length > 0) {
      const radius = this.config.brushWidth / 2;
      const count = Math.ceil(length / (radius / 4));
      // Integrate coating by distance, not pointer-event count. The smooth
      // kernel's centre-line integral is 16r/15, normalizing one straight pass.
      const amount =
        (this.config.tracePassGain * (length / count) * 15) / (16 * radius);
      for (let i = 0; i < count; i++) {
        const t = (i + 0.5) / count;
        changed =
          this.stamp(
            { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t },
            amount,
          ) || changed;
      }
    }
    if (changed) this.version++;
  }

  visitVisibleCells(visit) {
    for (const index of this.active) {
      const value = this.cellStrength(index);
      if (value) visit(index, value);
      else {
        this.active.delete(index);
        this.strength[index] = 0;
      }
    }
  }

  snapshot() {
    return {
      time: this.time,
      cells: [...this.active]
        .sort((a, b) => a - b)
        .map((index) => [index, this.cellStrength(index)])
        .filter(([, strength]) => strength > 0),
    };
  }
}
