# Physics verification — first-offering-v2

The numerical gate passed before challenge scoring and visual polish were added. Subsequent support and velocity fixes were followed by the same gate again. Final counts are retained in [physics-splits.jsonl](../artifacts/physics-splits.jsonl); rerun with `npm run test:physics`.

## Final parameters

The complete configuration is in `src/config/prototype.js`, with the versioned challenge in `src/config/challenge.js`.

| Parameter                                     | Value                                                                 |
| --------------------------------------------- | --------------------------------------------------------------------- |
| World                                         | 160 × 200 logical units                                               |
| Fixed stepping                                | 60 Hz, 2 collision substeps, 3 contact passes per substep             |
| Gravity / maximum speed                       | 160 units/s² / 78 units/s                                             |
| Grain radius / ridge thickness / Rub diameter | 0.65 / 2 / 3 units                                                    |
| Source                                        | 120 grains/s, 12 units wide, seeded sideways speed −4 to +4 units/s   |
| Initial downward source speed                 | 22 units/s                                                            |
| Spawn distribution                            | 8 stratified source lanes, seeded ±0.09-unit jitter, stride 3         |
| Ridge / grain Coulomb friction                | 0.025 / 0.22                                                          |
| Position impulse feedback into velocity       | 0.5 blend per substep                                                 |
| Sleep thresholds                              | speed <1.5 units/s and displacement <0.06 units per step for 30 steps |
| Free Pour cap                                 | 6,000 retained grains, including sleepers                             |
| Challenge                                     | 4,800 grains, targets 1,800 / 3,000, seed 48                          |

The source's downward launch and stratification prevent the source from obstructing itself while producing the full planned rate. It still uses seeded positions and velocities. A blocked source spends no supply and accrues no backlog. Contact projection feeds back into velocity so a deep pile does not accumulate hidden downward speed. Ridge projection preserves the particle's previous side when other grain contacts push it across a ridge centreline. These are physical contact corrections, not path routing rules.

## Three-width experiment

Configuration: `src/config/physics-scene.js`. Source centre (43,42), 12 units wide. Ramp from (30,70) to (135,108.2169), 20° below horizontal. Cut centre (85,90.0184). All runs use the same scene; only cut width and seed change. Warm up for 300 steps (5 seconds), sample for 600 steps (10 seconds). The same configuration file preserves the optional horizontal catch from (50,80) to (110,80), its cut at (80,80), and its pour/settle timings for the pile-drain test.

The gap detector is a plane four units below the ramp, bounded locally after the cut; the other detector is two units past the ramp end. A grain is classified once. These measurements do not use bowl counts. Rounded ridge ends and the grain radius remain part of the collision geometry.

| Seed | 3-unit cut: gap / end | Gap fraction | 6-unit cut: gap / end | Gap fraction | 9-unit cut: gap / end | Gap fraction |
| ---- | --------------------- | ------------ | --------------------- | ------------ | --------------------- | ------------ |
| 48   | 24 / 1,151            | 2.04%        | 231 / 942             | 19.69%       | 437 / 739             | 37.16%       |
| 2026 | 28 / 1,143            | 2.39%        | 225 / 950             | 19.15%       | 436 / 739             | 37.11%       |
| 914  | 21 / 1,149            | 1.79%        | 227 / 952             | 19.25%       | 434 / 734             | 37.16%       |

For every seed, both the 6- and 9-unit cuts sustain more than 10% on each path. Both widenings increase the gap fraction by more than 10 percentage points. The smallest cut mostly bridges; wider cuts progressively capture more flow. There are no random bowl choices, quotas, invisible barriers, or discarded grains.

## Other gates

- Independent grains traverse 20° and 35° ramps in both directions without stair-step jams.
- A horizontal catch holds a visible pile. After a 12-unit opening is rubbed, draining begins within the required 0.2 seconds. Geometry changes wake all retained grains immediately; moving contacts wake sleeping neighbors through the spatial hash.
- An unobstructed source emits exactly 4,800 grains over 2,400 simulation steps. The initial blank face spills all 4,800 grains after settling.
- Accounting is checked throughout deterministic replay and the challenge: supply remaining + left + right + spill + on-face grains = 4,800.
- The 6,000-grain stress container retains all grains. No grain is removed for performance. Collection interpolates the line crossing and removes each collected grain once.
- Replaying a seed and identical edits at identical steps gives an identical state in the same Node runtime.

## Performance bounds

Normal play retains a few hundred active grains. The extreme retained-pile fixture intentionally keeps all 6,000 grains on the face and is slower. The browser loop uses an 8 ms work budget between physics steps to avoid a catch-up spiral; each physics step remains 1/60 second. Under extreme load, simulation time can slow while input and rendering continue. No supply, grain, or collision step is silently dropped. See the measured browser limits in [playtest.md](playtest.md).
