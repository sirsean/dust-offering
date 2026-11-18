import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { UpwellingSimulation } from '../src/lab/simulation.js';
import { createGoal, evaluateGoal, goalTypes } from '../src/lab/goals.js';
import { chooseStroke, performStroke } from '../src/lab/policy.js';
import { seededRandom } from '../src/simulation/random.js';
import { upwelling } from '../src/config/upwelling.js';

const seeds = process.argv.includes('--quick') ? [48] : [48, 2026, 914];
const directory =
  process.argv.find((v) => v.startsWith('--output='))?.slice(9) ??
  'artifacts/upwelling';
const seconds = Number(
  process.argv.find((v) => v.startsWith('--seconds='))?.slice(10) ?? 50,
);
const budget = Number(
  process.argv.find((v) => v.startsWith('--gestures='))?.slice(11) ?? 24,
);
const policies = process.argv.includes('--purposeful-only')
  ? ['purposeful']
  : ['idle', 'random', 'sweep', 'purposeful'];
const results = [];
for (const seed of seeds)
  for (const type of Object.keys(goalTypes))
    for (const policy of policies) {
      const sim = new UpwellingSimulation({ seed }),
        goal = createGoal(type, seed),
        random = seededRandom(seed ^ 0x51e5);
      for (let i = 0; i < 300; i++) sim.step();
      const start = evaluateGoal(sim, goal),
        actions = [];
      const begin = performance.now();
      for (let step = 0; step < seconds * 60; step++) {
        if (step % 120 === 30 && actions.length < budget) {
          const stroke = chooseStroke(
            sim,
            goal,
            policy,
            random,
            Math.floor(step / 120),
          );
          if (stroke) {
            const before = evaluateGoal(sim, goal).fit;
            performStroke(sim, stroke);
            actions.push({
              ...stroke,
              time: sim.time,
              before,
              after: evaluateGoal(sim, goal).fit,
            });
          }
        }
        sim.step();
        assert.equal(sim.emitted, sim.grains.length);
        assert.equal(sim.emitted + sim.remaining, sim.config.supply);
      }
      const result = {
        seed,
        type,
        policy,
        wallMilliseconds: performance.now() - begin,
        start,
        final: evaluateGoal(sim, goal),
        emitted: sim.emitted,
        retained: sim.grains.length,
        gestures: actions.length,
        actions,
      };
      results.push(result);
      console.log(
        JSON.stringify({
          seed,
          type,
          policy,
          fit: result.final.fit,
          outside: result.final.outside,
          gestures: actions.length,
          milliseconds: result.wallMilliseconds,
        }),
      );
    }
await mkdir(directory, { recursive: true });
await writeFile(
  `${directory}/review.json`,
  `${JSON.stringify({ date: new Date().toISOString(), config: upwelling, seeds, simulationSeconds: seconds + 5, gestureBudget: budget, description: 'Matched physics and well schedule; purposeful planner observes current material and target, predicts one geometric stroke, and uses the real brush API. No human fun score.', results }, null, 2)}\n`,
);
