import { editableStone, touchesStone } from './geometry.js';

// This is a surface property, not collision geometry. Both adhesion and the
// visible coating read the same decaying field in fixed logical coordinates.
export class SurfaceTreatment {
  constructor(config) {
    this.config = config;
    this.cellSize = config.traceCellSize;
    this.columns = Math.ceil(config.width / this.cellSize);
    this.rows = Math.ceil(config.height / this.cellSize);
    this.strength = new Float32Array(this.columns * this.rows);
    // A double-angle orientation tensor treats an uphill and downhill stroke
    // as the same groove. Crossing strokes can cancel direction, not strength.
    this.orientationCos = new Float32Array(this.strength.length);
    this.orientationSin = new Float32Array(this.strength.length);
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

  sampleAt(x, y, out = {}) {
    out.strength = 0;
    out.x = 0;
    out.y = 1;
    out.coherence = 0;
    if (!editableStone(x, y)) return out;
    const gx = x / this.cellSize - 0.5,
      gy = y / this.cellSize - 0.5;
    const left = Math.floor(gx),
      top = Math.floor(gy);
    const fx = gx - left,
      fy = gy - top;
    let cosine = 0,
      sine = 0;
    for (let row = 0; row < 2; row++)
      for (let column = 0; column < 2; column++) {
        const cx = left + column,
          cy = top + row;
        if (cx < 0 || cx >= this.columns || cy < 0 || cy >= this.rows) continue;
        const index = cy * this.columns + cx;
        const value = this.cellStrength(index);
        if (!value) continue;
        const weight = (column ? fx : 1 - fx) * (row ? fy : 1 - fy);
        const decayWeight = (weight * value) / this.strength[index];
        out.strength += weight * value;
        cosine += this.orientationCos[index] * decayWeight;
        sine += this.orientationSin[index] * decayWeight;
      }
    const aligned = Math.hypot(cosine, sine);
    if (aligned > 1e-6 && out.strength > 0) {
      const angle = Math.atan2(sine, cosine) / 2;
      out.x = Math.cos(angle);
      out.y = Math.sin(angle);
      if (out.y < 0) {
        out.x = -out.x;
        out.y = -out.y;
      }
      out.coherence = Math.min(1, aligned / out.strength);
    }
    return out;
  }

  stamp(point, amount, cosine = 0, sine = 0) {
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
        // Keep edge-overlapping texels; rendering clips them to the exact
        // triangle, and physics samples only points on the actual stone.
        if (
          !editableStone(x, y) &&
          !touchesStone({ x, y }, { x, y }, this.cellSize * Math.SQRT1_2)
        )
          continue;
        const distance2 =
          ((x - point.x) ** 2 + (y - point.y) ** 2) / (radius * radius);
        if (distance2 >= 1) continue;
        const index = row * this.columns + column;
        const previous = this.cellStrength(index);
        const deposited = amount * (1 - distance2) ** 2;
        const next = Math.min(
          this.config.traceMaxStrength,
          previous + deposited,
        );
        const decay = previous ? previous / this.strength[index] : 0;
        const capped = next / (previous + deposited);
        this.orientationCos[index] =
          (this.orientationCos[index] * decay + deposited * cosine) * capped;
        this.orientationSin[index] =
          (this.orientationSin[index] * decay + deposited * sine) * capped;
        this.strength[index] = next;
        this.updated[index] = this.time;
        this.active.add(index);
        changed = true;
      }
    return changed;
  }

  paint(a, b, { start = true } = {}) {
    const length = Math.hypot(b.x - a.x, b.y - a.y);
    const tx = length ? (b.x - a.x) / length : 0;
    const ty = length ? (b.y - a.y) / length : 0;
    const cosine = tx * tx - ty * ty,
      sine = 2 * tx * ty;
    let changed = start
      ? this.stamp(a, this.config.tracePassGain, cosine, sine)
      : false;
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
            cosine,
            sine,
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
        this.orientationCos[index] = 0;
        this.orientationSin[index] = 0;
      }
    }
  }

  snapshot() {
    return {
      time: this.time,
      cells: [...this.active]
        .sort((a, b) => a - b)
        .map((index) => {
          const strength = this.cellStrength(index);
          const decay = strength / this.strength[index];
          return [
            index,
            strength,
            this.orientationCos[index] * decay,
            this.orientationSin[index] * decay,
          ];
        })
        .filter(([, strength]) => strength > 0),
    };
  }
}
