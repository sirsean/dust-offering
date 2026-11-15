import { prototype } from '../config/prototype.js';
import {
  editableStone,
  insideStone,
  interpolate,
  stoneRoughness,
} from './geometry.js';
import { seededRandom } from './random.js';
import { SurfaceTreatment } from './surface-treatment.js';

export class Simulation {
  constructor(options = {}) {
    this.config = { ...prototype, ...options };
    this.random = seededRandom(this.config.seed);
    this.surface = new SurfaceTreatment(this.config);
    this.traceSample = {};
    this.grains = [];
    this.steps = 0;
    this.sourceStartStep = null;
    this.nextId = 0;
    this.emitted = 0;
    this.remaining = this.config.supply ?? Infinity;
    this.pouring = true;
    this.blocked = false;
    this.blockReason = null;
    this.emissionFraction = 0;
    this.left = 0;
    this.right = 0;
    this.spill = 0;
    this.lastBrushReleased = 0;
    this.cellSize = this.config.grainRadius * 2;
    this.columns = Math.ceil(this.config.width / this.cellSize) + 4;
    this.rows = Math.ceil(this.config.height / this.cellSize) + 4;
    this.head = new Int32Array(this.columns * this.rows);
    this.next = new Int32Array(this.config.freePourCap);
  }

  get faceCount() {
    return this.grains.length - this.spill;
  }
  get attachedCount() {
    return this.grains.reduce((total, grain) => total + Boolean(grain.bond), 0);
  }
  get time() {
    return this.steps / this.config.stepsPerSecond;
  }

  get sourceTime() {
    return this.sourceStartStep === null
      ? 0
      : (this.steps - this.sourceStartStep) / this.config.stepsPerSecond;
  }

  get sourceX() {
    const c = this.config;
    const margin = c.sourceWidth / 2 + c.grainRadius;
    const amplitude = Math.max(
      0,
      Math.min(
        c.sourceSwayAmplitude,
        c.sourceX - margin,
        c.width - margin - c.sourceX,
      ),
    );
    return (
      c.sourceX +
      amplitude *
        Math.sin((2 * Math.PI * this.sourceTime) / c.sourceSwaySeconds)
    );
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
      bond: null,
      bondExpires: Infinity,
      parent: null,
      children: new Set(),
      threshold: -Math.log(Math.max(1e-9, 1 - this.random())),
      stoneExposure: 0,
      sandExposure: 0,
      releasedUntil: 0,
      candidate: null,
      missed: false,
      sleeping: false,
      quiet: 0,
    };
    this.grains.push(grain);
    return grain;
  }

  sourceClear(x, y) {
    const diameter = this.config.grainRadius * 2;
    return !this.grains.some(
      (grain) =>
        Math.abs(grain.x - x) < diameter &&
        Math.hypot(grain.x - x, grain.y - y) < diameter,
    );
  }

  emit() {
    this.blocked = false;
    this.blockReason = null;
    if (!this.pouring || !this.remaining) {
      this.emissionFraction = 0;
      return;
    }
    // Start with the first pour, not time spent preparing a challenge. Once
    // started, the opening follows simulation time even while emission pauses.
    if (this.sourceStartStep === null) this.sourceStartStep = this.steps;
    const centre = this.sourceX;
    this.emissionFraction +=
      this.config.sourceRate / this.config.stepsPerSecond;
    const count = Math.floor(this.emissionFraction + 1e-9);
    this.emissionFraction -= count;
    for (let i = 0; i < count && this.remaining > 0; i++) {
      if (this.grains.length >= this.config.freePourCap) {
        this.blocked = true;
        this.blockReason = 'full';
        break;
      }
      let x;
      let available = false;
      for (let attempt = 0; attempt < this.config.sourceLanes; attempt++) {
        const lane = (this.emitted * 5 + attempt) % this.config.sourceLanes;
        x =
          centre -
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
        this.blockReason = 'source';
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

  anchor(grain, bond, parent = null) {
    grain.parent?.children.delete(grain);
    grain.bond = bond;
    grain.bondExpires =
      grain.y < this.config.inletBlendY
        ? this.time + this.config.inletBondSeconds
        : Infinity;
    grain.parent = parent;
    parent?.children.add(grain);
    grain.vx = 0;
    grain.vy = 0;
    grain.sleeping = false;
  }

  release(grain) {
    const stack = [grain];
    let released = 0;
    while (stack.length) {
      const current = stack.pop();
      for (const child of current.children)
        if (child.parent === current) stack.push(child);
      current.children.clear();
      current.parent?.children.delete(current);
      if (current.bond) released++;
      current.bond = null;
      current.bondExpires = Infinity;
      current.parent = null;
      current.sleeping = false;
      current.quiet = 0;
      current.stoneExposure = 0;
      current.sandExposure = 0;
      current.threshold = Math.max(0.6, current.threshold);
      current.releasedUntil = this.time + this.config.brushReleaseSeconds;
    }
    return released;
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
      grain.cell = row * this.columns + column;
      this.next[i] = this.head[grain.cell];
      this.head[grain.cell] = i;
    }
  }

  wakeAround(cell) {
    for (let y = -1; y <= 1; y++)
      for (let x = -1; x <= 1; x++) {
        for (
          let i = this.head[cell + y * this.columns + x];
          i !== -1;
          i = this.next[i]
        ) {
          const grain = this.grains[i];
          if (!grain.bond) {
            grain.sleeping = false;
            grain.quiet = 0;
          }
        }
      }
  }

  contacts() {
    this.buildHash();
    const diameter = this.config.grainRadius * 2;
    const reach = diameter + 0.03;
    for (let i = 0; i < this.grains.length; i++) {
      const a = this.grains[i];
      for (let oy = -1; oy <= 1; oy++)
        for (let ox = -1; ox <= 1; ox++) {
          for (
            let j = this.head[a.cell + oy * this.columns + ox];
            j !== -1;
            j = this.next[j]
          ) {
            if (j <= i) continue;
            const b = this.grains[j];
            if ((a.bond && b.bond) || (a.sleeping && b.sleeping)) continue;
            const dx = b.x - a.x;
            const dy = b.y - a.y;
            const distance2 = dx * dx + dy * dy;
            if (distance2 > reach * reach) continue;
            if (a.bond && !b.bond) b.candidate = a;
            if (b.bond && !a.bond) a.candidate = b;
            if (distance2 >= diameter * diameter) continue;
            const distance = Math.sqrt(distance2);
            const nx = distance > 1e-8 ? dx / distance : i % 2 ? 1 : -1;
            const ny = distance > 1e-8 ? dy / distance : 0;
            if (
              (a.sleeping || b.sleeping) &&
              Math.hypot(b.vx - a.vx, b.vy - a.vy) > this.config.sleepSpeed
            ) {
              this.wakeAround(a.cell);
              this.wakeAround(b.cell);
            }
            const wa = a.bond || a.sleeping ? 0 : 1;
            const wb = b.bond || b.sleeping ? 0 : 1;
            const weight = wa + wb;
            if (!weight) continue;
            const correction = (diameter - distance) / weight;
            a.x -= nx * correction * wa;
            a.y -= ny * correction * wa;
            b.x += nx * correction * wb;
            b.y += ny * correction * wb;
            const inward = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
            if (inward < 0) {
              const impulse = -inward / weight;
              a.vx -= impulse * nx * wa;
              a.vy -= impulse * ny * wa;
              b.vx += impulse * nx * wb;
              b.vy += impulse * ny * wb;
              const tangent = -(b.vx - a.vx) * ny + (b.vy - a.vy) * nx;
              const friction =
                Math.sign(tangent) *
                Math.min(
                  Math.abs(tangent) / weight,
                  impulse * this.config.grainFriction,
                );
              a.vx -= friction * ny * wa;
              a.vy += friction * nx * wa;
              b.vx += friction * ny * wb;
              b.vy -= friction * nx * wb;
            }
          }
        }
    }
  }

  boundaries(grain) {
    const radius = this.config.grainRadius;
    if (grain.x < radius) {
      grain.x = radius;
      grain.vx = Math.max(0, grain.vx);
    }
    if (grain.x > this.config.width - radius) {
      grain.x = this.config.width - radius;
      grain.vx = Math.min(0, grain.vx);
    }
    if (grain.y > 198 - radius) {
      grain.y = 198 - radius;
      grain.vy = Math.min(0, grain.vy);
      grain.vx *= 0.94;
    }
    // The bowls stand on the ground. Their outer walls keep already-missed
    // sand in visible pockets beside/between them, rather than inside a shell.
    if (grain.missed && grain.y >= this.config.collectionY && grain.y <= 199) {
      for (const [left, right] of [
        this.config.leftMouth,
        this.config.rightMouth,
      ]) {
        if (grain.x > left - radius && grain.x < right + radius) {
          if (
            grain.px <= left ||
            (grain.px < right && grain.x < (left + right) / 2)
          ) {
            grain.x = left - radius;
            grain.vx = Math.min(0, grain.vx);
          } else {
            grain.x = right + radius;
            grain.vx = Math.max(0, grain.vx);
          }
        }
      }
    }
  }

  collect(grain) {
    const c = this.config;
    if (grain.py < c.collectionY && grain.y >= c.collectionY) {
      const t = (c.collectionY - grain.py) / (grain.y - grain.py);
      const x = grain.px + (grain.x - grain.px) * t;
      if (x >= c.leftMouth[0] && x <= c.leftMouth[1]) {
        if (grain.missed) this.spill--;
        this.left++;
        return true;
      }
      if (x >= c.rightMouth[0] && x <= c.rightMouth[1]) {
        if (grain.missed) this.spill--;
        this.right++;
        return true;
      }
      if (!grain.missed) {
        grain.missed = true;
        this.spill++;
      }
    }
    return false;
  }

  adhere(grain, dt) {
    if (
      grain.bond ||
      grain.missed ||
      this.time < grain.releasedUntil ||
      !editableStone(grain.x, grain.y)
    )
      return;
    // Let the inlet drain. Both kinds of bond taper in below the source;
    // transient upper bonds shed their descendants instead of growing a plug.
    const inlet = Math.max(
      0,
      Math.min(
        1,
        (grain.y - this.config.inletClearY) /
          Math.max(1e-6, this.config.inletBlendY - this.config.inletClearY),
      ),
    );
    if (!inlet) return;
    if (
      grain.candidate?.bond &&
      Math.hypot(grain.vx, grain.vy) < this.config.adhesionSpeed
    ) {
      grain.sandExposure += this.config.sandAdhesionRate * inlet * dt;
      if (grain.sandExposure >= grain.threshold) {
        this.anchor(grain, 'sand', grain.candidate);
        return;
      }
    } else grain.sandExposure *= 0.99;
    const trace = this.surface.sampleAt(grain.x, grain.y, this.traceSample);
    grain.stoneExposure +=
      this.config.stoneAdhesionRate *
      inlet *
      stoneRoughness(grain.x, grain.y) *
      (1 +
        this.config.traceAdhesionGain *
          trace.strength *
          (1 - this.config.traceSlideCaptureReduction * trace.coherence)) *
      dt;
    if (grain.stoneExposure >= grain.threshold) this.anchor(grain, 'stone');
  }

  capSpeed(grain) {
    const speed = Math.hypot(grain.vx, grain.vy);
    if (speed > this.config.maxSpeed) {
      grain.vx *= this.config.maxSpeed / speed;
      grain.vy *= this.config.maxSpeed / speed;
    }
  }

  wakeStone() {
    for (const grain of this.grains)
      if (!grain.bond && !grain.missed) {
        grain.sleeping = false;
        grain.quiet = 0;
      }
  }

  flow(grain, dt) {
    const c = this.config;
    const trace = this.surface.sampleAt(grain.x, grain.y, this.traceSample);
    const grip = (trace.coherence * trace.strength) / (1 + trace.strength);
    const guide = c.traceGuideGain * grip;
    // Gravity projected along the stroke, with residual downward acceleration
    // across it. Even a horizontal trace cannot carry sand uphill or suspend it.
    grain.vx += c.gravity * guide * trace.x * trace.y * dt;
    grain.vy += c.gravity * (1 - guide + guide * trace.y * trace.y) * dt;
    if (grip > 0) {
      const along =
        (grain.vx * trace.x + grain.vy * trace.y) *
        Math.exp(-c.traceAlongDrag * grip * dt);
      const across =
        (-grain.vx * trace.y + grain.vy * trace.x) *
        Math.exp(-c.traceCrossDrag * grip * dt);
      grain.vx = along * trace.x - across * trace.y;
      grain.vy = along * trace.y + across * trace.x;
    }
  }

  step() {
    this.emit();
    const c = this.config;
    const dt = 1 / c.stepsPerSecond / c.collisionSubsteps;
    let weathered = false;
    for (const grain of this.grains) {
      if (grain.bond && this.time >= grain.bondExpires) {
        this.release(grain);
        weathered = true;
      }
      grain.frameX = grain.x;
      grain.frameY = grain.y;
    }
    // Sleeping loose grains can rest above an upper bond without belonging
    // to its attachment tree. Wake them too when that support weathers away.
    if (weathered) this.wakeStone();
    for (let substep = 0; substep < c.collisionSubsteps; substep++) {
      for (const grain of this.grains) {
        grain.px = grain.x;
        grain.py = grain.y;
        grain.candidate = null;
        if (grain.bond || grain.sleeping) continue;
        this.flow(grain, dt);
        this.capSpeed(grain);
        grain.x += grain.vx * dt;
        grain.y += grain.vy * dt;
        this.boundaries(grain);
      }
      for (let pass = 0; pass < c.contactPasses; pass++) {
        this.contacts();
        for (const grain of this.grains)
          if (!grain.bond && !grain.sleeping) this.boundaries(grain);
      }
      let retained = 0;
      for (const grain of this.grains) {
        if (!grain.bond && !grain.sleeping) {
          grain.vx =
            grain.vx * (1 - c.contactVelocityBlend) +
            ((grain.x - grain.px) / dt) * c.contactVelocityBlend;
          grain.vy =
            grain.vy * (1 - c.contactVelocityBlend) +
            ((grain.y - grain.py) / dt) * c.contactVelocityBlend;
          this.capSpeed(grain);
        }
        // Resting against attached sand can form a stronger bond even after
        // the contact solver puts that grain to sleep. Ground grains cannot.
        if (!grain.bond) this.adhere(grain, dt);
        if (!this.collect(grain)) this.grains[retained++] = grain;
      }
      this.grains.length = retained;
    }
    for (const grain of this.grains)
      if (!grain.bond && !grain.sleeping) {
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
    this.surface.advanceTo(this.time);
  }

  brush(a, b, stroke) {
    this.surface.paint(a, b, stroke);
    const radius = this.config.brushWidth / 2;
    const length = Math.hypot(b.x - a.x, b.y - a.y);
    const tx = length > 1e-6 ? (b.x - a.x) / length : 0;
    const ty = length > 1e-6 ? (b.y - a.y) / length : 1;
    let released = 0;
    interpolate(a, b, radius / 2, (point) => {
      for (const grain of this.grains) {
        if (grain.missed || !insideStone(grain.x, grain.y)) continue;
        const dx = grain.x - point.x;
        const dy = grain.y - point.y;
        const distance = Math.hypot(dx, dy);
        if (distance > radius + this.config.grainRadius) continue;
        released += this.release(grain);
        // Push material toward the two banks of the finger's path, preserving
        // its count. The released centre can then drain slowly under gravity.
        const side = Math.sign(-dx * ty + dy * tx) || (grain.id % 2 ? 1 : -1);
        const nx = -ty * side;
        const ny = tx * side;
        const push = Math.min(1.4, Math.max(0, radius - distance) * 0.65);
        grain.x += nx * push;
        grain.y += ny * push;
        grain.vx =
          nx * this.config.brushSpeed * 0.65 +
          tx * this.config.brushSpeed * 0.35;
        grain.vy =
          ny * this.config.brushSpeed * 0.65 +
          ty * this.config.brushSpeed * 0.35;
        this.boundaries(grain);
        this.capSpeed(grain);
      }
    });
    this.wakeStone();
    this.lastBrushReleased = released;
    return released;
  }

  snapshot() {
    return this.grains.map(
      ({ id, x, y, vx, vy, bond, bondExpires, parent, missed, sleeping }) => ({
        id,
        x,
        y,
        vx,
        vy,
        bond,
        bondExpires,
        parent: parent?.id ?? null,
        missed,
        sleeping,
      }),
    );
  }
}
