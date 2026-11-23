# Project status

Piles opens at the production domain. It has sequential seeded offerings, persistent stone discovery and Pyramid Order records between chapters. The falling-sand game is available at `/pour` and the original top-down study is at `/lab`. [Play Dust Offering](https://dust-offering.sirsean.me) · [Piles design and checks](piles.md) · [Top-down study](upwelling-study.md)

## Falling-sand release

Revision 0.11.0 / `stone-offering-v8` changes the grains from radius 0.65 to 0.13 and nominal flow from 24 to 120 grains/s. A separately seeded breeze and size-dependent drag gently move loose dust. Finger sweeps, hidden-stone discovery, grease, bowls, permanent missed-sand piles, font, controls and quiet Free Pour completion remain.

Current measurements, screenshots, implementation and limits: [fine-dust.md](fine-dust.md). Current design: [stone-sand-plan.md](stone-sand-plan.md). Code structure: [architecture.md](architecture.md). The preceding tactile-play experiment is preserved in [gameplay-review.md](gameplay-review.md), with its baseline reports and artifacts.

Challenge scales to 4,800 grains and targets 1,800 / 3,000, preserving the 3:5 ratio and approximate pour duration. Historical bests stay separate. Free Pour retains up to 30,000 actual grains, including ground piles. No particles are discarded or substituted for performance.

Verification: 69 unit checks and 35 browser scenarios pass (three touch-only desktop duplicates skipped). The isolated cloud benchmark measured about 60 fps at entry and after two minutes, about 56 fps with 30,000 pinned grains, and about 35 fps after releasing 6,078 grains with two fingers. In that extreme scene simulation advances at about 0.59 times wall time; no mass is lost. Phone hardware performance remains to be checked.

Fine disks render into one transparent pixel layer. The collision solver clears occupied bins, caches fixed grains and still queries sleeping face grains for adhesion. Brush/adhesion/collection/sleep transitions invalidate the cache. Per-cell grease decay is reused within a simulation timestamp. Physics uses three substeps and two contact passes at 60 Hz, with speed capped at 16 logical units/s.

Revision 0.11.0 is preserved on `fine-dust`. The previous gameplay pass remains available for comparison. [Fine dust](https://fine-dust.dust-offering.sirsean.me) · [Gameplay feel](https://gameplay-feel.dust-offering.sirsean.me)
