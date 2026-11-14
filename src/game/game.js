import { Simulation } from '../simulation/simulation.js';
import { challenge } from '../config/challenge.js';

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
  constructor(mode = 'free') {
    this.reset(mode);
  }

  reset(mode = this.mode) {
    this.mode = mode;
    this.phase = mode === 'challenge' ? 'ready' : 'running';
    this.sim = new Simulation(mode === 'challenge' ? challenge : {});
    this.sim.pouring = mode === 'free';
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

  togglePour() {
    if (this.phase === 'running' && this.sim.remaining > 0)
      this.sim.pouring = !this.sim.pouring;
  }

  edit(a, b) {
    if (this.phase === 'finished') return;
    this.sim.brush(a, b);
    this.quietSteps = 0;
    this.exhaustedSteps = 0;
    this.canFinish = false;
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
