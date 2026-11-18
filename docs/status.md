# Project status — fine dust and gentle air

A separate top-down experiment on `top-down-lab` compares Level, Clear, Piles and Paths with dust welling up through the stone. See [upwelling-study.md](upwelling-study.md) for the playable preview, controlled comparisons, rejected variants and limits. It has 60 controlled simulations plus native touch sessions. Piles/Paths reach stable completion, and the selected sessions hold roughly 60 fps at 3,600 retained grains in headless Chromium. Full checks pass 80 unit tests and 42 browser cases. It is a prospective mechanics study; the falling-game production release below remains the baseline.

Revision 0.11.0 / `stone-offering-v8` changes the grains from radius 0.65 to 0.13 and nominal flow from 24 to 120 grains/s. A separately seeded breeze and size-dependent drag gently move loose dust. Finger sweeps, hidden-stone discovery, grease, bowls, permanent missed-sand piles, font, controls and quiet Free Pour completion remain.

Current measurements, screenshots, implementation and limits: [fine-dust.md](fine-dust.md). Current design: [stone-sand-plan.md](stone-sand-plan.md). Code structure: [architecture.md](architecture.md). The preceding tactile-play experiment is preserved in [gameplay-review.md](gameplay-review.md), with its baseline reports and artifacts.

Challenge scales to 4,800 grains and targets 1,800 / 3,000, preserving the 3:5 ratio and approximate pour duration. Historical bests stay separate. Free Pour retains up to 30,000 actual grains, including ground piles. No particles are discarded or substituted for performance.

Verification: 69 unit checks and 35 browser scenarios pass (three touch-only desktop duplicates skipped). The isolated cloud benchmark measured about 60 fps at entry and after two minutes, about 56 fps with 30,000 pinned grains, and about 35 fps after releasing 6,078 grains with two fingers. In that extreme scene simulation advances at about 0.59 times wall time; no mass is lost. Phone hardware performance remains to be checked.

Fine disks render into one transparent pixel layer. The collision solver clears occupied bins, caches fixed grains and still queries sleeping face grains for adhesion. Brush/adhesion/collection/sleep transitions invalidate the cache. Per-cell grease decay is reused within a simulation timestamp. Physics uses three substeps and two contact passes at 60 Hz, with speed capped at 16 logical units/s.

Repository: <https://github.com/sirsean/dust-offering>. Production: <https://dust-offering.sirsean.me>. This revision is developed on `fine-dust` and integrated into `main`, with preview <https://fine-dust.dust-offering.sirsean.me>. The previous revision remains at <https://gameplay-feel.dust-offering.sirsean.me> for comparison. Use direct Wrangler deployment; automated GitHub deployment remains deferred.
