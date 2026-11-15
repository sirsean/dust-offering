# Tactile brush and discovery measurements

Current model: revision 0.10.0 / `stone-offering-v7`. Defaults live in `src/config/prototype.js`; prepared entry and the discovery goal live in `src/config/free-pour.js`. The previous v6 baseline is in [archive/stone-v6/](archive/stone-v6/physics-results.md). The complete trial history is in [gameplay-review.md](gameplay-review.md).

## Physical defaults

| Parameter                            | Current value                                                                        |
| ------------------------------------ | ------------------------------------------------------------------------------------ |
| Logical field / fixed stepping       | 160 × 200; 60 Hz; two substeps, three contact passes                                 |
| Grain radius / gravity / speed cap   | 0.65 / 12 units/s² / 16 units/s                                                      |
| Offscreen source                     | y=-4; 34 units wide; 24 lanes                                                        |
| Flow and sway                        | Nominal 24 grains/s, bounded below 44 with sputters; 60-second sway ±44              |
| Finger / carry / imposed brush speed | Width 14 / carry 0.6 / speed 9                                                       |
| Physical sampling                    | Width / 6 by distance, carried across events per pointer; endpoint flush             |
| Weak stone / stronger sand adhesion  | 0.025 / 1.6, unchanged                                                               |
| Release / upper bond lifetime        | 2.5 seconds / 2.5 seconds                                                            |
| Grease                               | Strength cap 6, six-second half-life; directional cross/along drag 9 / 0.35          |
| Near-flat grip                       | 0.35 of normal, ramping to full at axis y=0.35                                       |
| Finger discovery                     | Radius 10, gain 0.8/pass                                                             |
| Sand discovery                       | Radius 2, gain 0.08/contact-second                                                   |
| Free entry / completion              | Nine seconds of real preparation, then hidden discovery; completion at coverage 0.82 |
| Challenge                            | Fixed seed 48, 960 grains, targets 360 / 600                                         |

Preparation preserves actual source-born material, source phase and accounting. Only the discovery field is replaced, and stationary reveal-complete flags are invalidated. Challenge has no preparation advance. Screen size and rendering never change physics.

## Agency comparison

The controlled deposit contains 153 real attached grains. The same left sweep is compared with the frozen 0.9.0 baseline:

| Measure                                             | Baseline    | Selected              |
| --------------------------------------------------- | ----------- | --------------------- |
| Grains moved immediately                            | 45          | 92                    |
| Collected by intended left bowl after eight seconds | 40          | 82                    |
| Collected by opposite bowl                          | 0           | 2                     |
| Mean sparse/dense immediate position difference     | 0.088 units | About 3 × 10⁻¹⁶ units |

A mirrored selected sweep delivers 79 right and one left. Every run accounts for all 153 grains. The sampling comparison concerns immediate brush positions; later contact trajectories can diverge slightly with floating-point/interpolated-field differences.

A material-seeking policy makes ten swipes during a one-minute cold simulation, using the same seeds and shower as its idle counterfactual:

| Seed | Baseline idle / active collected | Selected idle / active collected |
| ---- | -------------------------------- | -------------------------------- |
| 48   | 418 / 513                        | 418 / 667                        |
| 2026 | 423 / 613                        | 423 / 676                        |
| 914  | 402 / 593                        | 402 / 620                        |

Average additional collection due to the scripted policy rises from 158.7 to 240 grains, about 51%. This is an agency proxy, not a fun score or a prediction of human performance. Raw [baseline](../artifacts/gameplay-review/baseline-agency.json) and [selected](../artifacts/gameplay-review/final-agency.json) records include every gesture and all accounting.

## Source, guidance and material checks

[stone-physics.jsonl](../artifacts/stone-physics.jsonl) records fresh controlled scenes and three unattended two-minute pours. Seeds 48, 2026 and 914 emit/account for 2,555, 2,631 and 2,581 grains, with zero blocked steps and zero upper bonds at the final sample. The unchanged source remains bounded and drains without a cap.

The fixed central gather/brush/settle scene releases 15, 7 and 14 bonds, preserving retained material immediately at 390, 389 and 373 grains. Final emitted/accounted totals are 737, 707 and 659. The scene's central path is deliberately unchanged; the separate adaptive policy tests purposeful targeting.

After four seconds, a single sloping pass guides a controlled grain from x=70 to x=92.95; three passes reach x=95.93. Reversing finger travel gives the same downhill result, and a bare control stays at x=70. Flat marks now let the grain drain instead of lingering inside the wider smear. No generated rail geometry is present.

The suite covers 63 numerical/unit checks and 33 passing browser scenarios, plus three intentionally skipped desktop touch duplicates. New coverage includes prepared entry, fresh/replayed seeds, same-path sampling, stationary holds, independent residuals, completion, Finish lifecycle and actual material/audio feedback.

Reproduce using `npm run test:physics`, `node scripts/feel-check.js . /tmp/feel.json`, `node scripts/agency-check.js . /tmp/agency.json` and `node scripts/discovery-check.js`. Real-time and load evidence is in [playtest.md](playtest.md).
