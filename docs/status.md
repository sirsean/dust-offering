# Project status — tactile play and a quiet discovery loop

Revision 0.10.0 follows an extensive gameplay review of 0.9.0. Free Pour now starts with real dust already in flight, uses a broader sweep with moderate carry, and gives clearer physical and optional audio feedback. Brushing has more authorship over discovery. A small uncovering meter leads to “Stone found” and an optional “New stone,” without interrupting play. Normal free runs vary their shower and weathering; Challenge remains fixed and uses `stone-offering-v7`.

Current design: [stone-sand-plan.md](stone-sand-plan.md). Trial history, rejected ideas and before/after evidence: [gameplay-review.md](gameplay-review.md). Current architecture: [architecture.md](architecture.md). Numerical and real-time evidence: [physics-results.md](physics-results.md), [playtest.md](playtest.md) and `artifacts/gameplay-review/`.

## Selected behavior

- Free Pour prepares nine seconds of its actual offscreen emitter. Every grain, count and timestamp is retained; only discovery is cleared before entry. There is material to touch immediately. Fresh seeds vary normal runs; `?debug&seed=48` repeats a prepared scene. Challenge still begins empty at source time zero with seed 48 and all 960 grains.
- A 14-unit finger moves actual sand into banks and carries some along its path (carry 0.6, brush speed 9). Independent residual spacing makes sparse/dense events agree. Holding still cannot pump sand. Lifts/cancels flush only that contact; late residual edits clear Finish eligibility.
- Stone and sand adhesion, the 2.5-second release cooldown, 16-unit/s fall bound, 34-unit aperture and variable nominal 24-grain/s shower remain. Near-horizontal grease loses effective grip so broad marks do not become dams.
- Finger reveal uses radius 10 and gain 0.8/pass; passive contact reveal is slower at 0.08/s. Discovery persists after grease fades. At 82% opacity-weighted face coverage, Free Pour acknowledges the stone and offers a fresh one. The creation remains playable, with no modal, countdown, streak or automatic reset.
- Wakes on recently brushed real grains and brief bowl responses make effects visible. Optional filtered brushing texture and bowl tones respond to actual contacts/arrivals. Sound starts muted; hiding and muting silence it. Reduced motion omits the decorative wakes/waves.
- The warm desert palette, Fringe font, mechanical controls, initially hidden face, independently tracked fingers, permanent ground piles, bests/sharing and direct entry remain.

## Verification and interpretation

All 63 numerical/unit tests and 33 browser scenarios pass; three desktop duplicates of touch-only cases are skipped. The review also includes controlled deposits, three matched active/idle policies, preparation and discovery trials, rejected tuning variants, several real-time native emulated-touch sessions, an actual audio-signal check, layout captures and the isolated 6,000-grain load scene.

The selected sweep moves about twice as much material in the controlled deposit. A scripted player's additional collection over idle rises from about 159 to 240 grains per minute across three seeds. These are improvements in control and pacing, not measurements of human enjoyment, addictiveness or retention. The next evaluation is whether the new response and gentle completion make a human want another swipe.

## Repository and deployment

Repository: <https://github.com/sirsean/dust-offering>. Production: <https://dust-offering.sirsean.me>. This revision is developed on `gameplay-feel` and integrated into `main`. Preview: <https://gameplay-feel.dust-offering.sirsean.me>. The earlier interface build remains at <https://fringe-controls.dust-offering.sirsean.me> for human comparison.

Revision 0.9.0 is `1f3ed66`; its material baseline is archived under `docs/archive/stone-v6/` and `artifacts/archive/stone-v6/`. The 0.9.0 interface captures remain in `artifacts/fringe-controls/`, and older evidence stays in its existing archives.

Use direct Wrangler deployment; automated GitHub deployment remains deferred. Run `npm run deploy` for production or `npm run deploy:branch -- gameplay-feel` for the preview. No deployment secret should be configured until requested. See [deployment.md](deployment.md).
