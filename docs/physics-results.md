# Sticky-trace physics checks

Current model: `stone-offering-v2`, revision 0.3.0. The [previous slow-sand measurements](archive/stone-v1/physics-results.md) and original ridge measurements remain archived. All defaults live in `src/config/prototype.js`.

## Trace behavior

| Parameter                        | Value                                      |
| -------------------------------- | ------------------------------------------ |
| Field                            | 160 × 200 cells, one logical unit per cell |
| Brush diameter                   | 8 logical units, soft radial kernel        |
| Strength per pass / maximum      | approximately 1 / 6                        |
| Strength half-life               | 30 seconds of simulation time              |
| Negligible-strength cutoff       | 0.002                                      |
| Stone exposure multiplier        | `1 + 8 × strength`                         |
| Base stone / sand exposure rates | 0.025 / 1.6 per second                     |
| Release cooldown                 | 2.5 seconds, unchanged                     |

The numerical suite verifies repeated taps/passes, the cap, exact half-life, adding to a decayed trace, complete expiry, sparse/dense input equivalence, protected regions, and renderer-independent decay. A controlled falling grain remains loose on bare stone, attaches on a three-pass trace, and behaves exactly like the bare-stone control after that trace fully expires. Coating creates no grains or collision geometry. Existing bonds are not dissolved by fading.

The slow source and motion remain unchanged: 16-unit/s speed cap, gravity 12, launch speed 3 downward and ±0.65 sideways, and 24 grains/s. The unobstructed source emits all 960 challenge grains in 2,400 steps. The 60 Hz solver uses two substeps and three contact passes; maximum travel per substep is 0.1333 units, below the 0.65-unit grain radius.

## Gathering and brushing

`npm run test:physics` reproduces the experiment in `src/config/adhesion-scene.js`: gather for 25 seconds, brush from (78,28) to (90,115), pour ten more seconds, then settle twenty. A matching unbrushed control runs alongside each seed. The brush now coats its path as well as releasing sand. Raw results: [stone-physics.jsonl](../artifacts/stone-physics.jsonl).

| Seed | Stone / sand bonds before brush | Bonds released | Retained before / immediately after | Ground grains below y=190 after settling | Emitted / accounted |
| ---- | ------------------------------- | -------------- | ----------------------------------- | ---------------------------------------- | ------------------- |
| 48   | 42 / 161                        | 62             | 541 / 541                           | 134                                      | 838 / 838           |
| 2026 | 41 / 137                        | 61             | 503 / 503                           | 123                                      | 840 / 840           |
| 914  | 42 / 130                        | 63             | 489 / 489                           | 106                                      | 840 / 840           |

The brush preserves mass while releasing dependent attachments. All seeds retain visible ground piles. Natural deposits can block the source, reducing actual emission without consuming supply or creating a backlog. Subsequent flow differs from the unbrushed controls because of the changed deposits and stone treatment.

The suite also checks weak stone versus stronger sand attachment, physical deflection, release cascades and cooldown, continuous brush displacement, sleeping/waking, persistent ground piles, interpolated collection, pause/block/cap behavior, and deterministic replay including trace state. Both accounting equations hold: `emitted = left + right + grains.length` and `emitted = left + right + spill + faceCount`. Challenge adds remaining supply to either side to recover 960. Scores and sharing use the new identifier so earlier physics are not compared.
