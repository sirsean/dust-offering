import { seededRandom } from './random.js';

// A smooth, coarse airflow field. Trigonometry is shared by every grain rather
// than repeated in the particle loop. This random stream never affects births
// or adhesion. Air velocity is in logical units/second, independent of display.
export class Air {
  constructor(config) {
    this.config = config;
    this.columns = Math.ceil(config.width / config.airCellSize) + 1;
    this.rows = Math.ceil(config.height / config.airCellSize) + 1;
    this.x = new Float32Array(this.columns * this.rows);
    this.y = new Float32Array(this.x.length);
    const random = seededRandom(config.seed ^ 0x6a09e667);
    this.phases = Array.from({ length: 4 }, () => random() * Math.PI * 2);
    this.advanceTo(0);
  }

  advanceTo(time) {
    const c = this.config;
    const [a, b, d, e] = this.phases;
    const gust =
      0.65 * Math.sin(time * 0.32 + a) + 0.35 * Math.sin(time * 0.81 + b);
    for (let row = 0; row < this.rows; row++) {
      const y = row * c.airCellSize;
      const across = Math.cos(y / 34 - time * 0.31 + e);
      const lift = Math.sin(y / 34 - time * 0.31 + e);
      for (let column = 0; column < this.columns; column++) {
        const x = column * c.airCellSize;
        const turn = x / 38 + time * 0.45 + d;
        const index = row * this.columns + column;
        this.x[index] =
          c.airSpeed * (0.7 * gust + 0.3 * Math.sin(turn) * across);
        this.y[index] = c.airLift * Math.cos(turn) * lift;
      }
    }
  }

  sample(x, y, result) {
    const gx = Math.max(
      0,
      Math.min(this.columns - 1.000001, x / this.config.airCellSize),
    );
    const gy = Math.max(
      0,
      Math.min(this.rows - 1.000001, y / this.config.airCellSize),
    );
    const column = Math.floor(gx),
      row = Math.floor(gy);
    const fx = gx - column,
      fy = gy - row;
    const i = row * this.columns + column;
    const j = i + this.columns;
    result.x =
      (this.x[i] * (1 - fx) + this.x[i + 1] * fx) * (1 - fy) +
      (this.x[j] * (1 - fx) + this.x[j + 1] * fx) * fy;
    result.y =
      (this.y[i] * (1 - fx) + this.y[i + 1] * fx) * (1 - fy) +
      (this.y[j] * (1 - fx) + this.y[j + 1] * fx) * fy;
    return result;
  }
}
