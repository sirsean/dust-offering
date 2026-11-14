> Historical 0.2.0 evidence from commit `4f31c72`, before sticky traces and multi-touch. See the [current status](../../status.md).

# Sand-on-stone physics checks

This is the current `stone-offering-v1` model. The old drawn-ridge experiment is archived separately. Full parameters are in `src/config/prototype.js`; the current direction is documented in `../../stone-sand-plan.md`.

## Pace and material

| Parameter                    | Current                                        | Original prototype              |
| ---------------------------- | ---------------------------------------------- | ------------------------------- |
| Maximum speed                | 16 units/s                                     | 78                              |
| Gravity                      | 12 units/s²                                    | 160                             |
| Downward launch speed        | 3 units/s                                      | 22                              |
| Sideways launch              | ±0.65 units/s                                  | ±4                              |
| Emission                     | 24 grains/s                                    | 120                             |
| Finger diameter              | 8 units                                        | separate Draw/Rub tools         |
| Field / stepping             | 160 × 200, 60 Hz, 2 substeps, 3 contact passes | same logical field              |
| Grain radius                 | 0.65 units                                     | 0.65                            |
| Stone / sand attachment rate | 0.025 / 1.6 per second of eligible exposure    | no adhesion                     |
| Low-speed sand attachment    | below 7 units/s, sustained contact             | —                               |
| Brush release cooldown       | 2.5 seconds                                    | —                               |
| Retained cap                 | 6,000, including missed sand on the ground     | ground misses used to disappear |

The maximum integration travel is 0.1333 units per substep, below one grain radius. Speed is capped after contact feedback as well as before integration. The source uses eight seeded lanes to avoid obstructing itself at the lower launch speed. An unobstructed 24-grain/s source emits exactly 960 grains in 2,400 steps; natural deposits can obstruct it without building a catch-up burst.

## Reproducible adhesion and brush experiment

`src/config/adhesion-scene.js` specifies seeds 48, 2026 and 914. Let material accumulate for 25 seconds, brush from (78,28) to (90,115), pour another ten seconds and settle for twenty. Run a matching unbrushed control for each seed. Raw evidence is [stone-physics.jsonl](../../../artifacts/archive/stone-v1/stone-physics.jsonl), reproduced by `npm run test:physics`.

| Seed | Stone bonds before brush | Sand bonds before brush | Bonds released | Retained grains before / immediately after | Ground grains below y=190 after settling |
| ---- | ------------------------ | ----------------------- | -------------- | ------------------------------------------ | ---------------------------------------- |
| 48   | 42                       | 161                     | 62             | 541 / 541                                  | 131                                      |
| 2026 | 41                       | 137                     | 61             | 503 / 503                                  | 119                                      |
| 914  | 42                       | 130                     | 63             | 489 / 489                                  | 105                                      |

All three runs form substantially more sand bonds than bare-stone bonds. The brush changes existing material without adding/deleting grains. Subsequent flow differs from the unbrushed controls; there is no artificial path selection. Treatment runs each emit and account for 840 grains. The control can emit slightly fewer when its unbrushed source becomes obstructed.

## Behavioral coverage

Tests show weak capture on bare stone, faster capture against bound sand, fixed positions after attachment, and physical deflection by a bank made of grains. Releasing a root removes bonds from a full dependent chain outside the immediate brush footprint. A continuous fast stroke cannot leave gaps in its physical action. Brush impulses and subsequent motion obey the slow velocity cap.

Misses persist in all three ground pockets. Resting grains remain present across further simulation steps. Bowl crossings are interpolated and counted once; a grain later entering a bowl transfers from the missed count rather than being counted twice. Source pause/block/full-cap behavior and deterministic replay preserve mass. The 6,000-grain fixture remains accounted for when brushed.

Both mass equations are checked: `emitted = left + right + retained`, and `emitted = left + right + spill + faceCount`. For Challenge, `remaining + emitted = 960`. The new targets 360 / 600 preserve the 3:5 ratio, with a new identifier and extra settling time. The old ramp/split gate is not applicable to this user-directed change in mechanic.
