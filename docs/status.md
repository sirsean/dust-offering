# Project status — slow sand on stone

Revision 0.2.0 implements the owner's latest feedback. Grains move at a much gentler pace over a textured stone triangle, weakly attach to stone, and bind more strongly to other sand. A single brush action releases and redistributes actual material. Draw/Rub tool modes and their generated barriers are removed. Missed sand stays in the simulation and forms visible bottom piles.

Current design: [stone-sand-plan.md](stone-sand-plan.md). The original ridge specification and v2 measurements are historical; they do not describe the current mechanic.

## Behavior and evidence

- Local validation passes: 25 numerical/unit tests, lint, formatting, production build, and 11 browser scenarios. The desktop duplicate of the touch-only case is intentionally skipped.
- Maximum speed 78 → 16 units/s; gravity 160 → 12; emission 120 → 24 grains/s; launch speed 22 → 3 units/s. The slow, sparse pour is the default.
- The single 8-unit brush has no effect on blank stone, releases attached descendants, pushes existing grains aside and delays their reattachment. Incoming sand follows physical deposits rather than drawn rails.
- Literal missed grains remain on the ground, participate in contacts, and survive a paused pour. Reset clears both stone and ground.
- The optional `stone-offering-v1` challenge uses 960 grains and targets 360 / 600, with extra settling/rescue time. Old bests remain stored under their old identifier and are not compared with this model.
- Numerical checks cover speed, adhesion contrast, dependent release, conservation, persistent piles, source blocking, seeded replay, scoring and sharing. Browser checks cover the new mouse/touch action, the slower pour, piles, full challenge, reset, storage, sound, rotation, source/bowl protection and hidden recovery.
- Current measurements and simulated play are recorded in [physics-results.md](physics-results.md), [playtest.md](playtest.md), and `artifacts/stone-*`. Physical-phone relaxation and tactile response still need the owner's evaluation.

## Work and deployment

Public repo: <https://github.com/sirsean/dust-offering>. Production: <https://dust-offering.sirsean.me>. This revision is developed on `stone-sand`, then integrated into `main` for the next playtest. Historical v2 source is commit `bef6b51`; its reports and screenshots are under `docs/archive/v2/` and `artifacts/archive/v2/`.

Use direct Wrangler deployments. Automated GitHub deployments remain deferred and no deployment secret should be configured until requested. CI runs code/browser checks. `npm run deploy` publishes production; `npm run deploy:branch -- stone-sand` publishes a branch preview; use `npm run deploy:branch:delete -- branch-name` for cleanup.
