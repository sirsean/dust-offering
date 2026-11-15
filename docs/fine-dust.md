# Fine dust and desert air — revision 0.11.0

The requested experiment uses grains one fifth the diameter and five times the emission, with a gentle breeze. The previous version remains at <https://gameplay-feel.dust-offering.sirsean.me>; the new preview is <https://fine-dust.dust-offering.sirsean.me>, and production is <https://dust-offering.sirsean.me>.

## Size, flow and interaction

| Setting                                  | Previous          | Fine dust         |
| ---------------------------------------- | ----------------- | ----------------- |
| Radius, logical units                    | 0.65              | 0.13              |
| Diameter                                 | 1.3               | 0.26              |
| Nominal variable flow                    | 24/s              | 120/s             |
| Release lanes across the 34-unit opening | 24                | 120               |
| Retained capacity                        | 6,000             | 30,000            |
| Finite supply                            | 960               | 4,800             |
| Left / right targets                     | 360 / 600         | 1,800 / 3,000     |
| Challenge                                | stone-offering-v7 | stone-offering-v8 |

Five times the number of disks one fifth the diameter gives one fifth the total projected area. The dust therefore looks lighter and finer. There is no artificial one-pixel minimum, enlarged sprite, or cosmetic replacement dust. Every emitted grain participates in physics and rendering. Ground piles remain actual retained grains. Bowl fill and challenge supply scale with the new count so the approximate pour duration and 3:5 target ratio remain familiar.

The source keeps its invisible offscreen release, slow sixty-second sway, broad 34-unit aperture and seeded swells/sputters. Peak flow is below 216/s; up to four grains may be emitted in one 60 Hz step. Pauses and the retained cap accumulate no backlog. The 120 lanes use a coprime stride, avoiding a repeating subset or obvious coarse lanes.

Finger width, carrying, independent contacts and grease remain. Smaller contacts change individual trajectories and deposit density; old scores are isolated. Passive reveal per grain falls from 0.08 to 0.016/contact-second so five times the grains do not automatically uncover the stone five times faster. Brushing remains the stronger means of uncovering it.

## Air

`src/simulation/air.js` supplies a separately seeded, smooth spatial airflow field. Slow shared gusts and local curls generate horizontal velocity up to 2.8 logical units/s and vertical air velocity up to 0.45. Bilinear sampling avoids per-grain trigonometry. The field follows source time: it freezes when hidden, drifts while emission is paused, and waiting before Challenge Begin does not alter its starting weather.

Drag follows `airResistance × airReferenceRadius / grainRadius`. With defaults 0.16, 0.65 and 0.13, fine dust responds at 0.8/s; a coarse grain would respond at 0.16/s. Air nudges velocity toward the local airflow rather than adding unbounded random acceleration. Gravity remains 12 units/s² and the speed cap stays 16. Over the stone, exposure is reduced to 0.4 to preserve brush guidance; it fades near the floor. Bound and sleeping grains are unaffected until actual contact/release wakes them. `airResistance: 0` provides a controlled comparison.

## Performance work

The first direct implementation was too slow at the full retained count. Separate tiny sprite calls dominated drawing: around 80 ms/frame for 30,000 grains in the initial test. That version is retained in [first/report.json](../artifacts/fine-dust/first/report.json).

The selected implementation:

- Rasterizes every real disk into a reused transparent pixel layer using precomputed circular coverage and subpixel positions. One layer upload/composite replaces thousands of Canvas sprite calls.
- Clears occupied collision bins rather than the full fine grid, which has roughly twenty-five times as many cells.
- Separates moving/sleeping-face queries from cached fixed deposits. Anchor/release, ground sleep/wake and retained-array compaction invalidate the fixed partition. A cached-versus-forced-rebuild test checks identical trajectories through births, attachments, collection and brushing.
- Reuses each grease cell's exact decay value within a simulation timestamp, with immediate invalidation after painting.
- Uses three collision substeps and two contact passes. Maximum substep travel remains below the fine radius, with six solver passes per fixed step.

No grains are deleted, merged, substituted or hidden for performance. Under extreme load the existing fixed-step work budget can slow simulation time instead of starving input or losing mass.

## Evidence and limits

The benchmark uses Linux headless Chromium, a 390 × 844 viewport, DPR 2 and native emulated touch. It measures 180 animation-frame intervals per phase, simulation/drawing CPU times and the ratio of simulated to wall time. These are cloud-desktop observations, not physical phone measurements. Run benchmarks alone, after the unit/browser suites finish.

[Coarse baseline](../artifacts/fine-dust/coarse/report.json), [initial fine sprites](../artifacts/fine-dust/first/report.json), [first bitmap trial](../artifacts/fine-dust/raster/report.json), [cached-grid trial](../artifacts/fine-dust/cached/report.json) and [selected result](../artifacts/fine-dust/final/report.json) preserve the iteration history. Historical trials have their complete configuration recorded; the selected release additionally uses 120 lanes and source-clock air. Do not confuse frame rate with simulation throughput in the saturated scene.

The selected isolated run measured:

| Scene                            | Retained grains | Mean frame rate | Simulation / wall time |
| -------------------------------- | --------------- | --------------- | ---------------------- |
| Entry                            | 1,166           | 59.7 fps        | 1.00                   |
| After two minutes pouring        | 7,635           | 59.7 fps        | 1.00                   |
| Full pinned deposits             | 30,000          | 55.7 fps        | 0.97                   |
| After a large two-finger release | 29,572          | 35.3 fps        | 0.59                   |

At the saturated count, the native two-finger path released 6,078 actual grains. Brush/end processing averaged 3.3 ms and its 95th percentile was 6.4 ms; this measures handler CPU, not physical-device input-to-display latency. The final state kept 213 left + 215 right + 29,572 retained = 30,000 emitted. The old 6,000-grain fixture averaged about 34 fps before and after brushing, at roughly real-time simulation; the new extreme has a similar display rate after brushing but slower physics. The bitmap layer reduces drawing at 30,000 from about 80 ms to about 5 ms per frame in these cloud runs.

All 69 unit checks and 35 browser scenarios pass, with three desktop touch duplicates skipped. Unit verification includes the complete 68-test check plus the focused six air/cache checks, including the added preparation-clock regression. The full browser run covers both viewport projects. Hosted checks verify the exact built assets over TLS and replay those hosted bytes/security headers in Chromium; its separate CA store does not trust the environment's HTTPS proxy. No TLS verification is disabled. The preview delivered 577 grains in five simulation seconds and all were accounted for.

The retained-cap fixture pins real grains until brushing. The two-finger sweep releases thousands and preserves all emitted mass across bowls and retained material. Ordinary two-minute pouring, full deposits and the moving released material are measured separately. The extreme fixture can remain slower than real time; it is a useful limit, not a promised phone frame rate.

Unit and browser checks cover exact size/rate/cap scaling, bounded smooth seeded air, stronger drag for fine grains, fixed bonds, Challenge weather preparation, collision-cache correctness, full finite supply, long inlet drainage, persistent ground piles, subpixel disk coverage and resizing, physical brushes, independent fingers, discovery, grease decay, optional audio and scoring/sharing. Browser captures and reports live under `artifacts/fine-dust/`.

```sh
npm run check
PLAYWRIGHT_CHROMIUM_EXECUTABLE=/usr/bin/chromium npm run test:browser
# With Vite running; run without other test jobs competing for the CPU:
PLAYWRIGHT_CHROMIUM_EXECUTABLE=/usr/bin/chromium node scripts/dust-playtest.js http://127.0.0.1:5173 artifacts/fine-dust/final
```
