import { Simulation } from '../simulation/simulation.js';
import { challenge } from '../config/challenge.js';
import { freePour } from '../config/free-pour.js';
import { SurfaceDiscovery } from '../simulation/surface-discovery.js';

export function scoreOffering(left, right, config = challenge) {
  const error =
    Math.abs(left - config.leftTarget) + Math.abs(right - config.rightTarget);
  return Math.max(
    0,
    Math.floor(
      (1000 * (config.startingSupply - error)) / config.startingSupply,
    ),
  );
}

export class Game {
  constructor(mode = 'free', freeOptions = {}) {
    this.freeOptions = freeOptions;
    this.reset(mode);
  }

  reset(mode = this.mode) {
    this.mode = mode;
    this.phase = mode === 'challenge' ? 'ready' : 'running';
    const options =
      mode === 'challenge'
        ? challenge
        : {
            ...this.freeOptions,
            seed:
              this.freeOptions.seed ??
              crypto.getRandomValues(new Uint32Array(1))[0],
          };
    this.sim = new Simulation(options);
    this.sim.pouring = mode === 'free';
    if (mode === 'free') {
      const seconds = this.freeOptions.warmupSeconds ?? freePour.warmupSeconds;
      for (
        let i = 0;
        i < Math.round(seconds * this.sim.config.stepsPerSecond);
        i++
      )
        this.sim.step();
      // The shower is already in flight, but the player has not discovered the
      // stone. Do not reveal its silhouette during the preparation work.
      this.sim.discovery = new SurfaceDiscovery(this.sim.config);
      for (const grain of this.sim.grains) grain.revealComplete = false;
    }
    this.quietSteps = 0;
    this.exhaustedSteps = 0;
    this.canFinish = false;
    this.result = null;
  }

  begin() {
    if (this.phase !== 'ready') return;
    this.phase = 'running';
    this.sim.pouring = true;
  }

  get discovery() {
    return {
      coverage: this.sim.discovery.coverage,
      complete: this.sim.discovery.coverage >= freePour.discoveryGoal,
    };
  }

  togglePour() {
    if (this.phase === 'running' && this.sim.remaining > 0)
      this.sim.pouring = !this.sim.pouring;
  }

  edit(a, b, stroke) {
    if (this.phase === 'finished') return;
    this.sim.brush(a, b, stroke);
    this.quietSteps = 0;
    this.exhaustedSteps = 0;
    this.canFinish = false;
  }

  endBrush(id) {
    if (this.phase === 'finished') {
      this.sim.brushStrokes.delete(id);
      return;
    }
    const before = this.sim.brushFeedback.serial;
    this.sim.endBrush(id);
    if (this.sim.brushFeedback.serial !== before) {
      this.quietSteps = 0;
      this.exhaustedSteps = 0;
      this.canFinish = false;
    }
  }

  step() {
    if (this.phase === 'finished') return;
    this.sim.step();
    if (
      this.mode === 'challenge' &&
      this.phase === 'running' &&
      this.sim.remaining === 0
    ) {
      this.exhaustedSteps++;
      const moving = this.sim.grains.some(
        (g) => !g.bond && Math.hypot(g.vx, g.vy) > 0.45,
      );
      this.quietSteps = moving ? 0 : this.quietSteps + 1;
      this.canFinish =
        this.quietSteps >= 60 ||
        this.exhaustedSteps >=
          challenge.finishDelaySeconds * challenge.stepsPerSecond;
    }
  }

  finish() {
    if (
      !this.canFinish ||
      this.mode !== 'challenge' ||
      this.sim.remaining !== 0
    )
      return null;
    this.result = {
      score: scoreOffering(this.sim.left, this.sim.right),
      left: this.sim.left,
      right: this.sim.right,
      spill: this.sim.spill,
      onFace: this.sim.faceCount,
    };
    this.phase = 'finished';
    this.sim.pouring = false;
    return this.result;
  }
}
