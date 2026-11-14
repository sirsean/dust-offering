import { prototype } from '../config/prototype.js';
import { interpolate, nearestPoint, Ridges } from './geometry.js';
import { seededRandom } from './random.js';

export class Simulation {
  constructor(options = {}) {
    this.config = { ...prototype, ...options };
    this.random = seededRandom(this.config.seed ?? 48);
    this.ridges = new Ridges(this.config);
    this.grains = [];
    this.steps = 0;
    this.nextId = 0;
    this.emitted = 0;
    this.remaining = this.config.supply ?? Infinity;
    this.pouring = true;
    this.blocked = false;
    this.emissionFraction = 0;
    this.left = 0;
    this.right = 0;
    this.spill = 0;
    this.onMove = null;
    this.geometryVersion = 0;
    this.cellSize = this.config.grainRadius * 2;
    this.columns = Math.ceil(this.config.width / this.cellSize) + 4;
    this.rows = Math.ceil(this.config.height / this.cellSize) + 4;
    this.head = new Int32Array(this.columns * this.rows);
    this.next = new Int32Array(this.config.freePourCap);
  }

  addGrain(x, y, vx = 0, vy = 0) {
    const grain = {
      id: this.nextId++,
      x,
      y,
      px: x,
      py: y,
      vx,
      vy,
      sleeping: false,
      quiet: 0,
    };
    this.grains.push(grain);
    return grain;
  }

  sourceClear(x, y) {
    const diameter = this.config.grainRadius * 2;
    for (const grain of this.grains) {
      if (
        Math.abs(grain.x - x) < diameter &&
        Math.hypot(grain.x - x, grain.y - y) < diameter
      )
        return false;
    }
    for (const segment of this.ridges.nearby(x, y)) {
      const point = nearestPoint(x, y, segment);
      if (
        Math.hypot(point.x - x, point.y - y) <
        this.config.grainRadius + this.config.ridgeThickness / 2
      )
        return false;
    }
    return true;
  }

  emit() {
    this.blocked = false;
    if (!this.pouring || !this.remaining) {
      this.emissionFraction = 0;
      return;
    }
    this.emissionFraction +=
      this.config.sourceRate / this.config.stepsPerSecond;
    const count = Math.floor(this.emissionFraction + 1e-9);
    this.emissionFraction -= count;
    for (let i = 0; i < count && this.remaining > 0; i++) {
      if (this.grains.length >= this.config.freePourCap) {
        this.blocked = true;
        break;
      }
      // Try seeded candidates across the source. Failed attempts spend no supply
      // and are never carried forward as a catch-up burst.
      let x;
      let available = false;
      for (let attempt = 0; attempt < this.config.sourceLanes; attempt++) {
        const lane = (this.emitted * 3 + attempt) % this.config.sourceLanes;
        x =
          this.config.sourceX -
          this.config.sourceWidth / 2 +
          ((lane + 0.5) * this.config.sourceWidth) / this.config.sourceLanes +
          (this.random() - 0.5) * 0.18;
        if (this.sourceClear(x, this.config.sourceY)) {
          available = true;
          break;
        }
      }
      if (!available) {
        this.blocked = true;
        break;
      }
      this.addGrain(
        x,
        this.config.sourceY,
        (this.random() * 2 - 1) * this.config.launchSpeed,
        this.config.sourceSpeed,
      );
      this.remaining--;
      this.emitted++;
    }
    if (this.blocked) this.emissionFraction = 0;
  }

  resolveRidge(grain) {
    const radius = this.config.grainRadius + this.config.ridgeThickness / 2;
    for (const segment of this.ridges.nearby(grain.x, grain.y)) {
      const point = nearestPoint(grain.x, grain.y, segment);
      const dx = grain.x - point.x;
      const dy = grain.y - point.y;
      const distance2 = dx * dx + dy * dy;
      if (distance2 >= radius * radius) continue;
      const distance = Math.sqrt(distance2);
      let nx = distance > 1e-8 ? dx / distance : 0;
      let ny = distance > 1e-8 ? dy / distance : -1;
      let penetration = radius - distance;
      // Grain contact projection can cross a support's centreline even though
      // integration respects the travel bound. Keep the side from the start of
      // this substep, instead of ejecting a loaded grain through the underside.
      const previous = nearestPoint(grain.px, grain.py, segment);
      const oldX = grain.px - previous.x;
      const oldY = grain.py - previous.y;
      const oldDistance = Math.hypot(oldX, oldY);
      if (oldDistance > 1e-8 && dx * oldX + dy * oldY < 0) {
        nx = oldX / oldDistance;
        ny = oldY / oldDistance;
        penetration = radius - (dx * nx + dy * ny);
      }
      grain.x += nx * penetration;
      grain.y += ny * penetration;
      const inward = grain.vx * nx + grain.vy * ny;
      if (inward < 0) {
        grain.vx -= inward * nx;
        grain.vy -= inward * ny;
        const tangent = -grain.vx * ny + grain.vy * nx;
        const friction =
          Math.sign(tangent) *
          Math.min(Math.abs(tangent), -inward * this.config.ridgeFriction);
        grain.vx += friction * ny;
        grain.vy -= friction * nx;
      }
    }
  }

  buildHash() {
    this.head.fill(-1);
    if (this.next.length < this.grains.length)
      this.next = new Int32Array(this.grains.length);
    for (let i = this.grains.length - 1; i >= 0; i--) {
      const grain = this.grains[i];
      const column = Math.max(
        1,
        Math.min(this.columns - 2, Math.floor(grain.x / this.cellSize) + 2),
      );
      const row = Math.max(
        1,
        Math.min(this.rows - 2, Math.floor(grain.y / this.cellSize) + 2),
      );
      const cell = row * this.columns + column;
      grain.cell = cell;
      this.next[i] = this.head[cell];
      this.head[cell] = i;
    }
  }

  resolveGrains() {
    this.buildHash();
    const diameter = this.config.grainRadius * 2;
    for (let i = 0; i < this.grains.length; i++) {
      const a = this.grains[i];
      for (let oy = -1; oy <= 1; oy++) {
        for (let ox = -1; ox <= 1; ox++) {
          for (
            let j = this.head[a.cell + oy * this.columns + ox];
            j !== -1;
            j = this.next[j]
          ) {
            if (j <= i) continue;
            const b = this.grains[j];
            if (a.sleeping && b.sleeping) continue;
            const dx = b.x - a.x;
            const dy = b.y - a.y;
            const distance2 = dx * dx + dy * dy;
            if (distance2 >= diameter * diameter) continue;
            const distance = Math.sqrt(distance2);
            const nx = distance > 1e-8 ? dx / distance : i % 2 ? 1 : -1;
            const ny = distance > 1e-8 ? dy / distance : 0;
            if (
              (a.sleeping || b.sleeping) &&
              (Math.hypot(b.vx - a.vx, b.vy - a.vy) > this.config.sleepSpeed ||
                diameter - distance > 0.2)
            ) {
              this.wakeAround(a.cell);
              this.wakeAround(b.cell);
            }
            const weightA = a.sleeping ? 0 : 1;
            const weightB = b.sleeping ? 0 : 1;
            const weight = weightA + weightB;
            const correction = (diameter - distance) / weight;
            a.x -= nx * correction * weightA;
            a.y -= ny * correction * weightA;
            b.x += nx * correction * weightB;
            b.y += ny * correction * weightB;
            const inward = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
            if (inward < 0) {
              const impulse = -inward / weight;
              a.vx -= impulse * nx * weightA;
              a.vy -= impulse * ny * weightA;
              b.vx += impulse * nx * weightB;
              b.vy += impulse * ny * weightB;
              const tangent = -(b.vx - a.vx) * ny + (b.vy - a.vy) * nx;
              const friction =
                Math.sign(tangent) *
                Math.min(
                  Math.abs(tangent) / weight,
                  impulse * this.config.grainFriction,
                );
              a.vx -= friction * ny * weightA;
              a.vy += friction * nx * weightA;
              b.vx += friction * ny * weightB;
              b.vy -= friction * nx * weightB;
            }
          }
        }
      }
    }
  }

  wakeAround(cell) {
    for (let y = -1; y <= 1; y++)
      for (let x = -1; x <= 1; x++)
        for (
          let i = this.head[cell + y * this.columns + x];
          i !== -1;
          i = this.next[i]
        ) {
          this.grains[i].sleeping = false;
          this.grains[i].quiet = 0;
        }
  }

  wakeAll() {
    for (const grain of this.grains) {
      grain.sleeping = false;
      grain.quiet = 0;
    }
    this.geometryVersion = this.ridges.version;
  }

  collect(grain) {
    const c = this.config;
    if (grain.y >= c.collectionY && grain.py < c.collectionY) {
      const t = (c.collectionY - grain.py) / (grain.y - grain.py);
      const x = grain.px + (grain.x - grain.px) * t;
      if (x >= c.leftMouth[0] && x <= c.leftMouth[1]) this.left++;
      else if (x >= c.rightMouth[0] && x <= c.rightMouth[1]) this.right++;
      else this.spill++;
      return true;
    }
    if (
      grain.x < -c.grainRadius ||
      grain.x > c.width + c.grainRadius ||
      grain.y > c.height
    ) {
      this.spill++;
      return true;
    }
    return false;
  }

  step() {
    if (this.geometryVersion !== this.ridges.version) this.wakeAll();
    this.emit();
    const c = this.config;
    const dt = 1 / c.stepsPerSecond / c.collisionSubsteps;
    for (const grain of this.grains) {
      grain.frameX = grain.x;
      grain.frameY = grain.y;
    }
    for (let substep = 0; substep < c.collisionSubsteps; substep++) {
      for (const grain of this.grains) {
        grain.px = grain.x;
        grain.py = grain.y;
        if (grain.sleeping) continue;
        grain.vy += c.gravity * dt;
        const speed = Math.hypot(grain.vx, grain.vy);
        if (speed > c.maxSpeed) {
          grain.vx *= c.maxSpeed / speed;
          grain.vy *= c.maxSpeed / speed;
        }
        grain.x += grain.vx * dt;
        grain.y += grain.vy * dt;
        this.resolveRidge(grain);
      }
      for (let pass = 0; pass < c.contactPasses; pass++) {
        this.resolveGrains();
        for (const grain of this.grains)
          if (!grain.sleeping) this.resolveRidge(grain);
      }
      let retained = 0;
      for (const grain of this.grains) {
        if (!grain.sleeping) {
          // Feed positional contact impulses back into velocity. Without this,
          // a deep supported pile accumulates hidden downward speed even while
          // its contacts project it upward, and continually churns.
          grain.vx =
            grain.vx * (1 - c.contactVelocityBlend) +
            ((grain.x - grain.px) / dt) * c.contactVelocityBlend;
          grain.vy =
            grain.vy * (1 - c.contactVelocityBlend) +
            ((grain.y - grain.py) / dt) * c.contactVelocityBlend;
        }
        this.onMove?.(grain);
        if (!this.collect(grain)) this.grains[retained++] = grain;
      }
      this.grains.length = retained;
    }
    for (const grain of this.grains)
      if (!grain.sleeping) {
        if (
          Math.hypot(grain.vx, grain.vy) < c.sleepSpeed &&
          Math.hypot(grain.x - grain.frameX, grain.y - grain.frameY) <
            c.sleepMovement
        )
          grain.quiet++;
        else grain.quiet = 0;
        if (grain.quiet >= c.sleepSteps) {
          grain.sleeping = true;
          grain.vx = 0;
          grain.vy = 0;
        }
      }
    this.steps++;
  }

  edit(a, b, mode) {
    const version = this.ridges.version;
    if (mode === 'rub')
      interpolate(a, b, this.config.rubWidth / 4, (point) =>
        this.ridges.rub(point.x, point.y, this.config.rubWidth / 2),
      );
    else this.ridges.add(a, b);
    if (version !== this.ridges.version) this.wakeAll();
    // Geometry edits wake every retained grain, including affected supports.
    // Adding support separates overlap but never changes grain counts/velocities.
    for (const grain of this.grains) {
      const vx = grain.vx;
      const vy = grain.vy;
      this.resolveRidge(grain);
      grain.vx = vx;
      grain.vy = vy;
    }
  }
}
