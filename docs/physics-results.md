# Offscreen drifting-pour measurements

Current model: revision 0.6.0, `stone-offering-v4`. Configuration lives in `src/config/prototype.js`. The fixed-source measurements remain in [archive/stone-v3/](archive/stone-v3/physics-results.md). The source change preserves the existing sand adhesion, directional grease marks and slow speed tuning.

## Delivery

| Parameter                               | Value                                                   |
| --------------------------------------- | ------------------------------------------------------- |
| Birth height                            | y=-4, fully above the visible board                     |
| Source width / lanes / rate             | 18 units / 12 / 24 grains per second                    |
| Horizontal centre                       | x=80, with a 44-unit sway amplitude                     |
| Full cycle                              | 60 simulation seconds                                   |
| Centre at 0 / 15 / 30 / 45 / 60 seconds | 80 / 124 / 80 / 36 / 80                                 |
| Maximum opening speed                   | About 4.61 logical units/s; zero at each turnaround     |
| Grain launch / speed cap                | 3 units/s down, ±0.65 sideways / 16 units/s             |
| Gravity / stepping                      | 12 units/s² / 60 Hz, two substeps, three contact passes |
| Supply / targets                        | 960 / 360 left and 600 right                            |

The opening starts its phase with the first pour. It keeps drifting when emission is paused or blocked, without accumulating a grain backlog. Waiting in Challenge preparation leaves the phase at zero. Hiding and Finish stop stepping; resize preserves the phase. Fresh simulations restart it. The amplitude is bounded so the whole opening stays within the board width.

New grains are already in the particle array and supply accounting while outside the canvas. The edge-clamped spatial hash still compares their real coordinates. They fall naturally into view and receive no horizontal velocity from the moving opening. The renderer draws neither a marker nor a nozzle.

## Reproducible checks

`npm run test:physics` produces [stone-physics.jsonl](../artifacts/stone-physics.jsonl). Three seeded unattended two-minute pours emit every scheduled grain:

| Seed | Emitted / accounted after 60s | Emitted / accounted after 120s | Above board at both samples | Bonds above y=60 after 120s |
| ---- | ----------------------------- | ------------------------------ | --------------------------- | --------------------------- |
| 48   | 1,440 / 1,440                 | 2,880 / 2,880                  | 15                          | 0                           |
| 2026 | 1,440 / 1,440                 | 2,880 / 2,880                  | 15                          | 0                           |
| 914  | 1,440 / 1,440                 | 2,880 / 2,880                  | 15                          | 0                           |

At the cycle boundary, each run has 71 grains above y=36 and 107 above y=60. This includes grains still falling in from y=-4; the extra travel is not a static cap. Deposits continue accumulating lower on the stone, and literal missed grains remain on the ground. All accounting includes offscreen grains.

The 25-second gather / brush / ten-second pour / twenty-second settle scene retains its original central brush coordinates. It releases 10, 7 and 10 bonds for seeds 48, 2026 and 914, with retained counts unchanged at 464 / 464, 431 / 431 and 442 / 442 immediately before/after. The moving opening has distributed most later material to the right at that point in its cycle. Each run emits and accounts for 840 grains, with 180, 157 and 143 grains visible below y=190 after settling.

The isolated downhill-guide control remains unchanged: after four seconds, one pass guides a grain from initial x=70 to x=86.13; three passes guide it to x=95.58, while the bare control stays at x=70. Reversing finger travel gives the same downhill guide, and grains can drift across it.

The suite has 42 numerical/unit checks, including smooth turnaround, opening bounds, actual spawn positions following both sides, wholly offscreen birth followed by visible entry, phase handling, full challenge supply and deterministic replay including source state. The 21 passing browser scenarios check visible arrivals, absence of the former marker, pause/hidden/resize/reset behavior, material, multi-touch and challenge controls. Three desktop duplicates of touch-only cases are skipped.
