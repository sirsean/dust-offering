> Historical fixed-source `stone-offering-v3` evidence. The offscreen drifting source is documented in the [current status](../../status.md).

# Downhill guidance and inlet drainage

Current physical model: `stone-offering-v3`, measured in revision 0.4.0 and retained without changes in the 0.5.0 visual pass. Configuration lives in `src/config/prototype.js`. Current appearance is documented in [visual-style.md](../../visual-style.md). Earlier evidence remains in [archive/stone-v2/](../stone-v2/physics-results.md) and the older archive directories.

## Trace response

| Parameter                    | Value                                                 |
| ---------------------------- | ----------------------------------------------------- |
| Interactive triangle         | Full visible outer face: (80,6), (159,176), (1,176)   |
| Grid / finger diameter       | One-unit cells / 8 units                              |
| Strength per pass / maximum  | Approximately 1 / 6                                   |
| Strength half-life           | 6 seconds, previously 30                              |
| Guidance fraction            | `0.85 × coherence × strength / (1 + strength)`        |
| Cross-axis / along-axis drag | 9 / 0.35 per second, multiplied by grip               |
| Stone capture multiplier     | `1 + 8 × strength × (1 − 0.9 × coherence)`            |
| Source width / lanes         | 18 / 12, previously 12 / 8                            |
| Inlet attachment             | None above y=45; linear ramp to full strength at y=72 |
| Upper-bond lifetime          | 2.5 seconds, followed by release and cooldown         |

Motion remains capped at 16 units/s, with gravity 12 units/s² and emission 24 grains/s. The 60 Hz solver uses two substeps and three contact passes. Maximum travel per substep remains 0.1333 units, below the 0.65-unit grain radius. Supply and targets remain 960 and 360 / 600.

`npm run test:physics` saves reproducible guidance, adhesion and inlet measurements to stdout. Current raw evidence is [stone-physics.jsonl](../../../artifacts/archive/stone-v3/stone-physics.jsonl).

## Loose downhill guidance

A single grain starts at (70,80) with downward speed 12. Draw a slope from (65,70) to (105,150), then simulate four seconds. Adhesion is disabled in this control to isolate guidance from permanent bonds.

| Coating                                              | Final x | Final y |
| ---------------------------------------------------- | ------- | ------- |
| Bare stone                                           | 70.00   | 143.35  |
| One pass                                             | 86.13   | 140.06  |
| Three passes                                         | 95.58   | 136.70  |
| Six passes                                           | 96.34   | 136.19  |
| Three uphill passes on the same slope                | 95.58   | 136.70  |
| Three mirrored left-sloping passes, starting at x=90 | 64.42   | 136.70  |

Every grain remains loose, continues downward and respects the speed cap. Three passes produce stronger lateral guidance than one, but the grain ends 2.77 units away from the slope's centre line. There is no collision rail. Separate tests verify crossing-orientation blending and downward drainage through horizontal traces. A stationary coated spot still increases actual stone capture; fully expired coating returns to bare-stone behavior.

## Unattended inlet comparison

Run the same seeds for two minutes without brushing. The baseline uses the actual 0.3.0 source at commit `7475680`; raw results are [stone-inlet-baseline.jsonl](../../../artifacts/archive/stone-v3/stone-inlet-baseline.jsonl). Baseline reproduction: export that commit's `src/` and `package.json` with `git archive`, import its `Simulation` with Node, and step 7,200 times per seed, sampling at steps 3,600 and 7,200. Current reproduction is included in `npm run test:physics`.

| Seed | Grains above y=36 after 60s, old → new | Grains above y=60 after 60s, old → new | Grains above y=60 after 120s, old → new | Current emitted / accounted after 120s |
| ---- | -------------------------------------- | -------------------------------------- | --------------------------------------- | -------------------------------------- |
| 48   | 190 → 44                               | 350 → 91                               | 351 → 211                               | 2,880 / 2,880                          |
| 2026 | 206 → 44                               | 336 → 124                              | 341 → 183                               | 2,880 / 2,880                          |
| 914  | 197 → 44                               | 354 → 83                               | 358 → 185                               | 2,880 / 2,880                          |

The tip count falls by about 78% and remains at 44 grains across all three runs and both sample times. The upper area remains capable of accumulating sand farther below the inlet, but its 60-second count is about 71% lower on average. No source clearing is needed for the current runs to emit every scheduled grain. Lower-face deposits and literal ground piles remain present; no grain is deleted to obtain these results.

## Deposits and conservation

The existing 25-second gather / brush / ten-second pour / twenty-second settle experiment releases 48, 47 and 40 bonds for seeds 48, 2026 and 914. Immediately before and after brushing, retained counts remain 505 / 505, 512 / 512 and 519 / 519. All three runs emit and account for 840 grains and leave at least 130 grains visible below y=190 after settling.

The 38-test numerical/unit suite also covers full supply, weak stone versus stronger sand capture, dependent release, weathering and unsupported sleeping sand, continuous edge strokes, field decay independent of rendering, deterministic replay with orientation state, persistent missed piles, interpolated collection, pause/block/cap behavior, challenge scoring, isolated bests and sharing. Both accounting equations remain true: `emitted = left + right + grains.length` and `emitted = left + right + spill + faceCount`.
