import { upwelling } from '../config/upwelling.js';
import { seededRandom } from '../simulation/random.js';
import { SurfaceTreatment } from '../simulation/surface-treatment.js';
import { createWells } from './wells.js';

export class UpwellingSimulation {
  constructor(options = {}) {
    this.config = { ...upwelling, ...options };
    this.random = seededRandom(this.config.seed);
    this.surface = new SurfaceTreatment(this.config);
    this.grains = [];
    this.steps = 0;
    this.emitted = 0;
    this.remaining = this.config.supply;
    this.bubbling = true;
    this.fraction = 0;
    this.brushStrokes = new Map();
    this.brushFeedback = {
      serial: 0,
      moved: 0,
      released: 0,
      releasedTotal: 0,
      time: -Infinity,
    };
    this.wells = createWells(this.config);
    this.cellSize = 2 * this.config.grainRadius;
    this.columns = Math.ceil(this.config.width / this.cellSize) + 4;
    this.rows = Math.ceil(this.config.height / this.cellSize) + 4;
    this.head = new Int32Array(this.columns * this.rows).fill(-1);
    this.next = new Int32Array(this.config.supply);
    this.queries = new Uint8Array(this.config.supply);
    this.occupied = [];
  }

  get time() {
    return this.steps / this.config.stepsPerSecond;
  }
  get activeWell() {
    return this.wells[
      Math.min(
        this.wells.length - 1,
        Math.floor(this.emitted / this.config.wellBatch),
      )
    ];
  }

  addGrain(x, y, vx = 0, vy = 0) {
    const grain = {
      id: this.grains.length,
      x,
      y,
      vx,
      vy,
      px: x,
      py: y,
      quiet: 0,
      sleeping: false,
      born: this.time,
    };
    this.grains.push(grain);
    return grain;
  }

  emit() {
    if (!this.bubbling || !this.remaining) {
      this.fraction = 0;
      return;
    }
    const rate =
      this.config.sourceRate *
      (0.7 + 0.3 * Math.sin(this.time * 3.1 + this.config.seed) ** 2);
    this.fraction += rate / this.config.stepsPerSecond;
    const count = Math.min(this.remaining, Math.floor(this.fraction));
    this.fraction -= count;
    for (let i = 0; i < count; i++) {
      const well = this.activeWell;
      const angle = this.random() * Math.PI * 2;
      const radius = this.config.wellRadius * Math.sqrt(this.random());
      this.addGrain(
        well.x + Math.cos(angle) * radius,
        well.y + Math.sin(angle) * radius,
        Math.cos(angle) * this.config.launchSpeed,
        Math.sin(angle) * this.config.launchSpeed,
      );
      this.emitted++;
      this.remaining--;
    }
  }

  buildHash() {
    for (const cell of this.occupied) this.head[cell] = -1;
    this.occupied.length = 0;
    if (this.next.length < this.grains.length) {
      this.next = new Int32Array(this.grains.length);
      this.queries = new Uint8Array(this.grains.length);
    }
    for (let i = this.grains.length - 1; i >= 0; i--) {
      const g = this.grains[i];
      const x = Math.max(
        1,
        Math.min(this.columns - 2, Math.floor(g.x / this.cellSize) + 2),
      );
      const y = Math.max(
        1,
        Math.min(this.rows - 2, Math.floor(g.y / this.cellSize) + 2),
      );
      g.cell = y * this.columns + x;
      if (this.head[g.cell] === -1) this.occupied.push(g.cell);
      this.next[i] = this.head[g.cell];
      this.head[g.cell] = i;
      this.queries[i] = g.sleeping ? 0 : 1;
    }
  }

  contacts() {
    this.buildHash();
    const diameter = this.cellSize;
    for (let i = 0; i < this.grains.length; i++) {
      if (!this.queries[i]) continue;
      const a = this.grains[i];
      for (let y = -1; y <= 1; y++)
        for (let x = -1; x <= 1; x++)
          for (
            let j = this.head[a.cell + y * this.columns + x];
            j !== -1;
            j = this.next[j]
          ) {
            if (j === i || (this.queries[j] && j < i)) continue;
            const b = this.grains[j],
              dx = b.x - a.x,
              dy = b.y - a.y;
            const square = dx * dx + dy * dy;
            if (square >= diameter * diameter) continue;
            const distance = Math.sqrt(square);
            const nx = distance > 1e-8 ? dx / distance : i % 2 ? 1 : -1,
              ny = distance > 1e-8 ? dy / distance : 0;
            if (
              diameter - distance > 0.01 ||
              Math.hypot(b.vx - a.vx, b.vy - a.vy) > this.config.sleepSpeed
            ) {
              a.sleeping = false;
              b.sleeping = false;
              a.quiet = 0;
              b.quiet = 0;
            }
            const wa = a.sleeping ? 0 : 1,
              wb = b.sleeping ? 0 : 1,
              weight = wa + wb;
            if (!weight) continue;
            const correction = (diameter - distance) / weight;
            a.x -= nx * correction * wa;
            a.y -= ny * correction * wa;
            b.x += nx * correction * wb;
            b.y += ny * correction * wb;
            const inward = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
            if (inward < 0) {
              a.vx += ((inward * nx) / weight) * wa;
              a.vy += ((inward * ny) / weight) * wa;
              b.vx -= ((inward * nx) / weight) * wb;
              b.vy -= ((inward * ny) / weight) * wb;
            }
          }
    }
  }

  bounds(g) {
    const c = this.config,
      r = c.grainRadius;
    if (g.x < r) {
      g.x = r;
      g.vx = Math.max(0, g.vx);
    }
    if (g.x > c.width - r) {
      g.x = c.width - r;
      g.vx = Math.min(0, g.vx);
    }
    if (g.y < r) {
      g.y = r;
      g.vy = Math.max(0, g.vy);
    }
    if (g.y > c.height - r) {
      g.y = c.height - r;
      g.vy = Math.min(0, g.vy);
    }
  }

  step() {
    this.emit();
    const c = this.config,
      dt = 1 / c.stepsPerSecond / c.collisionSubsteps;
    for (let sub = 0; sub < c.collisionSubsteps; sub++) {
      for (const g of this.grains) {
        g.px = g.x;
        g.py = g.y;
        if (g.sleeping) continue;
        const grip = this.surface.strengthAt(g.x, g.y);
        const drag = Math.exp(
          -c.drag * (1 + c.greaseDrag * Math.min(3, grip)) * dt,
        );
        g.vx *= drag;
        g.vy *= drag;
        g.x += g.vx * dt;
        g.y += g.vy * dt;
        this.bounds(g);
      }
      for (let pass = 0; pass < c.contactPasses; pass++) this.contacts();
      for (const g of this.grains) {
        this.bounds(g);
        if (g.sleeping) continue;
        g.vx = g.vx * 0.65 + ((g.x - g.px) / dt) * 0.35;
        g.vy = g.vy * 0.65 + ((g.y - g.py) / dt) * 0.35;
        const speed = Math.hypot(g.vx, g.vy);
        if (speed > c.maxSpeed) {
          g.vx *= c.maxSpeed / speed;
          g.vy *= c.maxSpeed / speed;
        }
        if (speed < c.sleepSpeed && Math.hypot(g.x - g.px, g.y - g.py) < 0.01)
          g.quiet++;
        else g.quiet = 0;
        if (g.quiet >= c.sleepSteps * c.collisionSubsteps) {
          g.sleeping = true;
          g.vx = 0;
          g.vy = 0;
        }
      }
    }
    this.steps++;
    this.surface.advanceTo(this.time);
  }

  stamp(point, tx, ty, moved) {
    const radius = this.config.brushWidth / 2 + this.config.grainRadius;
    for (const g of this.grains) {
      // Ground dust remains physical and recoverable in this top-down study.
      const dx = g.x - point.x,
        dy = g.y - point.y,
        distance = Math.hypot(dx, dy);
      if (distance >= radius - 1e-6) continue;
      const nx = distance > 1e-8 ? dx / distance : Math.cos(g.id * 2.399963);
      const ny = distance > 1e-8 ? dy / distance : Math.sin(g.id * 2.399963);
      const push = radius - distance;
      g.x += nx * push;
      g.y += ny * push;
      g.vx =
        nx * this.config.brushSpeed * 0.7 + tx * this.config.brushSpeed * 0.3;
      g.vy =
        ny * this.config.brushSpeed * 0.7 + ty * this.config.brushSpeed * 0.3;
      g.sleeping = false;
      g.quiet = 0;
      this.bounds(g);
      moved.add(g.id);
    }
  }

  record(moved) {
    if (!moved.size) return;
    this.brushFeedback = {
      serial: this.brushFeedback.serial + 1,
      moved: moved.size,
      released: 0,
      releasedTotal: 0,
      time: this.time,
    };
  }

  brush(a, b, stroke = {}) {
    this.surface.paint(a, b, stroke);
    const id = stroke.pointerId ?? 'direct',
      tracked = stroke.pointerId !== undefined;
    const spacing = this.config.brushWidth / 6,
      length = Math.hypot(b.x - a.x, b.y - a.y);
    const tx = length > 1e-8 ? (b.x - a.x) / length : 0,
      ty = length > 1e-8 ? (b.y - a.y) / length : 0;
    const moved = new Set();
    let state = this.brushStrokes.get(id);
    if (stroke.start !== false || !state) {
      state = { remaining: spacing, point: a, tx, ty };
      this.brushStrokes.set(id, state);
      this.stamp(a, tx, ty, moved);
    }
    if (length > 1e-8) {
      let distance = state.remaining;
      while (distance <= length + 1e-9) {
        const t = Math.min(1, distance / length);
        this.stamp(
          { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t },
          tx,
          ty,
          moved,
        );
        distance += spacing;
      }
      state.remaining = distance - length;
      state.point = b;
      state.tx = tx;
      state.ty = ty;
    }
    this.record(moved);
    if (!tracked) this.endBrush(id);
  }

  endBrush(id) {
    const state = this.brushStrokes.get(id);
    if (!state) return;
    this.brushStrokes.delete(id);
    if (this.config.brushWidth / 6 - state.remaining < 1e-6) return;
    const moved = new Set();
    this.stamp(state.point, state.tx, state.ty, moved);
    this.record(moved);
  }

  snapshot() {
    return this.grains.map(({ id, x, y, vx, vy, sleeping }) => ({
      id,
      x,
      y,
      vx,
      vy,
      sleeping,
    }));
  }
}
