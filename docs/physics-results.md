# Wider variable-pour measurements

Current revision: 0.8.0, challenge `stone-offering-v6`. Configuration lives in `src/config/prototype.js`; the pure flow profile is in `src/simulation/source-flow.js`. The aperture is wider and arrival density varies, while individual grain motion, adhesion, grease and discovery retain their previous tuning. Earlier evidence is in [archive/stone-v5/](archive/stone-v5/physics-results.md). Current browser play and rendering evidence is in [playtest.md](playtest.md).

## Delivery

| Parameter                               | Value                                                        |
| --------------------------------------- | ------------------------------------------------------------ |
| Birth height                            | y=-4, fully above the visible board                          |
| Source width / lanes                    | 34 units / 24, previously 18 / 12                            |
| Arrival rate                            | Nominal 24 grains/s, smooth swells and ripples; below 44     |
| Sputters                                | 1.4-second clusters, 3–4 uneven pulses, brief zero-rate gaps |
| Horizontal centre                       | x=80, with a 44-unit sway amplitude                          |
| Full cycle                              | 60 simulation seconds                                        |
| Centre at 0 / 15 / 30 / 45 / 60 seconds | 80 / 124 / 80 / 36 / 80                                      |
| Maximum opening speed                   | About 4.61 logical units/s; zero at each turnaround          |
| Grain launch / speed cap                | 3 units/s down, ±0.65 sideways / 16 units/s                  |
| Gravity / stepping                      | 12 units/s² / 60 Hz, two substeps, three contact passes      |
| Supply / targets                        | 960 / 360 left and 600 right                                 |

The broad swell interpolates between seed-derived values over 4.5 seconds, with smaller 0.75-second ripples. Before sputter gating, the rate lies within 8.448–43.008 grains/s. Each 12-second window places its cluster at a seeded offset; the rate does not repeat with the opening's one-minute sway. Only arrival density changes: no gust forces or speed increases are applied to grains. Default emission is at most one grain per fixed step. Challenge retains its finite supply, with no fixed pour duration or countdown.

The opening starts its phase with the first pour. It keeps drifting when emission is paused or blocked, without accumulating a grain backlog. Waiting in Challenge preparation leaves the phase at zero. Hiding and Finish stop stepping; resize preserves the phase. Fresh simulations restart it. The amplitude is bounded so the whole opening stays within the board width.

New grains are already in the particle array and supply accounting while outside the canvas. The edge-clamped spatial hash still compares their real coordinates. They fall naturally into view and receive no horizontal velocity from the moving opening. The renderer draws neither a marker nor a nozzle.

## Reproducible checks

`npm run test:physics` reproduces the physical scenes. Current raw output is [stone-physics.jsonl](../artifacts/stone-physics.jsonl). Three seeded unattended two-minute pours emit every scheduled grain, with no blocked steps:

| Seed | Emitted / accounted after 60s | Emitted / accounted after 120s | Peak rate over 120s | Upper bonds after 120s |
| ---- | ----------------------------- | ------------------------------ | ------------------- | ---------------------- |
| 48   | 1,270 / 1,270                 | 2,555 / 2,555                  | 39.49 grains/s      | 0                      |
| 2026 | 1,257 / 1,257                 | 2,631 / 2,631                  | 40.28 grains/s      | 0                      |
| 914  | 1,209 / 1,209                 | 2,581 / 2,581                  | 39.43 grains/s      | 0                      |

At 120 seconds, the runs have 79, 72 and 55 grains above y=36, with 12, 18 and 8 still above the board. Sampling once per second during each run finds upper-region maxima of 107, 106 and 105: busier flow passes through without an adhesive cap. No bonds remain above y=60 at either minute sample. Deposits continue accumulating lower on the stone, and actual missed grains remain on the ground. All accounting includes offscreen grains.

The 25-second gather / brush / ten-second pour / twenty-second settle scene retains its original central brush coordinates. It releases 4, 4 and 6 bonds for seeds 48, 2026 and 914, with retained counts unchanged at 390 / 390, 389 / 389 and 373 / 373 immediately before/after. Each run emits and accounts for 737, 707 and 659 grains, with 129, 116 and 91 grains visible below y=190 after settling. The wider moving stream distributes material away from the fixed central brush path.

The isolated downhill-guide control remains unchanged: after four seconds, one pass guides a grain from initial x=70 to x=86.13; three passes guide it to x=95.58, while the bare control stays at x=70. Reversing finger travel gives the same downhill guide, and grains can drift across it.

The current suite has 52 numerical/unit checks and 27 passing browser scenarios. New checks cover smooth rate changes, bounds, brief genuine gaps, nonrepeating profiles, different seeds, sample-order independence, no consumption of particle randomness, wider actual births, no blocked/catch-up bursts, full supply and conservation. Discovery, grease, multi-touch, material and challenge checks remain. Three desktop duplicates of touch-only cases are skipped. `sourceFlowVariation: 0` supplies a constant-rate control for isolated source-obstruction checks.
