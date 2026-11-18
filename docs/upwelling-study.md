# Top-down stone studies

The November 18 proposal changes the basic activity: dust wells up through a stone seen from above, rests without gravity, and is pushed with fingers. This branch provides four playable studies and controlled automated comparisons. The strongest candidates are **Piles** (gathering three balanced islands) and **Paths** (shaping a target). These are candidates for human play, not a finding that people enjoy or return to them.

Preview: <https://top-down-lab.dust-offering.sirsean.me/lab?goal=gather&seed=48>. Choose Level, Clear, Piles or Paths to compare goals with the same seed and well schedule. Restart repeats a round; New stone varies its wells and target. Guide can be hidden to inspect the creation. The existing falling-sand production game stays at <https://dust-offering.sirsean.me>.

## Options considered

| Idea                                                               | Why a finger might want to move                                                                                  | Main risk                                                                                   | Decision                                                 |
| ------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| Level a thin veil                                                  | Broad, repetitive raking gradually evens the material                                                            | Many strokes without many new decisions; easily becomes maintenance                         | Built and tested                                         |
| Clear a marked patch                                               | An immediate visible channel/clearing, with dust accumulating around it                                          | A single repeated clearing action can solve most of the problem                             | Built and tested; useful introductory task               |
| Gather three islands                                               | Move actual piles into three regions while dividing a finite supply; new wells change which pile needs attention | A wide finger can disturb already placed dust; some layouts are much easier                 | Built and tested; strongest initial candidate            |
| Shape paths                                                        | Build an arrangement with both filled bands and empty gaps; different approaches can produce the same pattern    | Fingers push rather than paint; overprecise templates may fight the material                | Built and tested; stronger follow-on challenge           |
| Carve negative-space patterns                                      | Start with a veil and rake clear channels; strokes themselves create the image                                   | Needs a different initial distribution, so it is not a matched comparison here              | Next candidate if positive paths feel awkward            |
| Reveal a relief or complete a small sequence of stone arrangements | Each creation exposes something or poses a new spatial problem, supplying a reason to begin another              | Requires careful authored scenes; arbitrary meters/unlocks will not solve weak manipulation | Recommended next progression experiment, not implemented |
| Preserve and revisit a creation                                    | A local collection can reward self-expression                                                                    | Adds features before establishing that shaping is satisfying                                | Deferred                                                 |

## Shared material and interaction

`src/lab/` is isolated from the falling simulation. The study uses the same fine 0.13-radius grains, desert palette, Fringe font, mechanical keys, optional dry material audio and independent Pointer Events. It deliberately shows the stone and target guides so spatial experiments can be read without discovering an invisible boundary first. That is a study choice, not a change to production's reveal mechanic.

Three seeded wells occupy upper, middle and lower portions of the face. A finite 3,600-grain supply emerges in three 1,200-grain phases at a gently varying rate, taking about thirty-five simulation seconds. Entry prepares five seconds of the actual source so there is material within reach immediately. No fixed clock or countdown is displayed. Pause wells stops only new emergence; dust continues settling and grease continues fading. After all dust surfaces, the player has unlimited shaping time.

There is no gravity, collection bowl, directional wind or automatic transport toward the goal. Radial births, actual grain contacts and finger contact produce motion. Surface friction stops it. Resting grains wake on meaningful impacts. Grease increases local drag and fades with the existing six-second half-life. A finger is a moving soft disk: it pushes existing material ahead/aside rather than painting grains or creating rails. Physical samples retain travelled-distance residuals per pointer; holding still cannot repeatedly pump the material.

Dust can be pushed off any side of the stone, remains visible and physical on the surrounding ground, and can be swept back. The original input binding keeps its stone mask by default; the study opts into the whole canvas. No grain is deleted, collected or replaced. `emitted = grains.length`, and `emitted + remaining = supply`, are checked throughout automated play.

## What counts as a successful arrangement

Piles uses exact circular regions and caps each region at one third of the required supply. One giant pile cannot substitute for three balanced ones. Clear counts grains on the stone outside the exact marked circle; pushing everything off the face cannot win. Level and Paths compare coarse density distributions with the target, so one heap anywhere on a path cannot stand in for the entire shape.

Progress includes material still underground in its denominator. A new well therefore cannot lower progress merely by increasing the emitted count. Completion waits until the full supply surfaces and reaches the study threshold: Level 70%, Clear 90%, Piles 75%, Paths 70%. It acknowledges the arrangement without a modal, auto-reset or loss of the creation. The fit numbers are objective alignment measures, not fun ratings.

## Iteration findings

1. The first broad physical design was directly controllable. In the initial seed, targeted strokes created useful changes for gathering and paths, while clearing needed very few meaningful moves. [First run](../artifacts/upwelling/first/review.json).
2. Scoring a gathered island as an exact Gaussian density was too fussy. It could penalize a visually sensible pile. The study now rewards membership and balance in three visible regions. Stratified wells also avoid repeatedly presenting all material at the bottom. [Second pass](../artifacts/upwelling/second/review.json).
3. An early Clear layout reached about 98% while idle because the marked patch missed the wells. The final patch covers a real middle well, selected without changing anyone's physics. This is why idle controls matter. [Clear-target investigation](../artifacts/upwelling/clear-fix/review.json).
4. Contact inspection found that a small collision could change a sleeping grain's stored velocity without waking it. Weighted contact resolution now leaves sleeping grains fixed until an actual impact wakes them. A regression checks zero velocities in sleeping material. [Pre-fix record](../artifacts/upwelling/before-sleep-fix/review.json).
5. Circular objectives initially inherited ten-unit cell boundaries from the density metric. Final Piles/Clear scoring uses actual grain positions at the drawn rims. The first planner retained its coarse one-stroke model and stalled near a circle rim in native playback. A later planner predicts exact circular membership while keeping coarse density predictions for Level/Paths. It still has no future emission knowledge and applies only actual input strokes. [Cell-scored comparison](../artifacts/upwelling/cell-scored/review.json).

6. Native playback exposed that same coarse-rim limitation in the testing policy. The selected comparison uses exact circular prediction and retains the earlier [coarse-policy runs](../artifacts/upwelling/coarse-policy/review.json) and [native session](../artifacts/upwelling/browser/report.json), rather than treating that plateau as a human control limit.

## Controlled gameplay comparison

The selected `upwelling-v3` experiment contains 48 matched runs: four goals × three seeds × four policies. Each begins with the same five-second physical preparation and then advances fifty simulation seconds, with at most 24 input strokes. Idle does nothing. Random seeks real sand but chooses an arbitrary direction. Sweep repeats broad horizontal strokes. Purposeful observes current material and the visible target, predicts one geometric sweep, and executes it through the public brush API. It cannot move grains directly or inspect future emissions.

Strokes in this numerical comparison are applied instantaneously, with settling/source steps between them. This isolates agency but is not a human motor model. The separate native-touch run uses actual browser input, moving over time.

Mean final fit across three seeds, after at most 24 strokes. Values compare policies **within** a study; different studies have different objectives.

| Study |  Idle | Random sand-seeking | Repeated broad sweeps | Purposeful |
| ----- | ----: | ------------------: | --------------------: | ---------: |
| Level |  8.1% |               40.2% |                 12.7% |      51.3% |
| Clear | 66.7% |               68.8% |                 68.3% |      95.5% |
| Piles | 34.6% |               24.6% |                 27.0% |      81.2% |
| Paths |  9.0% |               23.3% |                  8.3% |      62.3% |

The [selected raw report](../artifacts/upwelling/final/review.json) records every stroke, seed, state score and mass check. Twelve [longer runs](../artifacts/upwelling/extended/review.json) allow up to 48 strokes over one hundred additional seconds. All three Piles and Paths cases reach their completion thresholds in these longer runs. Level remains below 70% for this greedy policy even after many strokes; this supports the concern about repeated coverage, not a claim that a human cannot solve it.

Captures show an important tactile limit: the finger naturally leaves curved banks and wisps rather than smooth filled blobs. Positive Paths can therefore require sideways placement and cleanup; the fit score does not establish that those refinements feel good. Negative-space carving remains a worthwhile next comparison.

Piles offers the largest distinction between deliberate placement and arbitrary swiping in this setup. Paths also rewards intent strongly and asks for more refinement. Clear is readily understandable but concentrates its work in one patch. Level improves through fairly undirected movement and is a weaker candidate for the central loop.

## Native touch and performance

The [first browser report and captures](../artifacts/upwelling/browser/report.json) retain native emulated-touch play for each study. A [longer selected-policy session](../artifacts/upwelling/browser-extended/report.json) tests Piles and Paths with up to 48 gestures. The planner reads snapshots outside the page; it drives actual touch events, with moving fingers and live settling. It begins these strokes after the finite dust has surfaced, so its totals are not a causal comparison with the earlier during-emergence policies. Frames are sampled separately from planning, at entry and after shaping, on a 390 × 844 DPR 2 headless Chromium viewport. Physical phone feel, sound and sustained hardware performance remain untested.

The selected live-touch sessions reached stable completion after settling:

| Study | Native strokes | Settled fit | Final mean frame rate | Brush/end CPU, p95 |
| ----- | -------------: | ----------: | --------------------: | -----------------: |
| Piles |             29 |       76.5% |              60.0 fps |             0.4 ms |
| Paths |             26 |       70.6% |              60.0 fps |             0.4 ms |

All 3,600 grains remain in each session; settling proceeds at approximately real time. Brush CPU timings exclude browser input/compositor latency. The earlier four-study sessions also held about 60 fps at entry and after shaping. These results show responsive control at this finite study size, not performance promises for every phone or for an unlimited dust population.

The complete local checks pass: **80 unit tests and 42 browser scenarios**, with four desktop touch duplicates skipped.

Unit checks cover no preferred motion axis, finite well emission, pause/resume, retained/recoverable ground dust, stopped motion, speed bounds, independent finger residuals, sparse/dense strokes, deterministic replay, goal/physics independence, objective mass loopholes and exact visible rims. Browser checks cover real multi-touch, simultaneous releases, seeded comparisons, guide/restart/new-stone behavior, freeze/rotation and narrow/landscape layouts. Existing falling-game tests run alongside them.

## What to build on next

Start human evaluation with **Piles**, then **Paths** using the same seed. The decisive observations are whether pushing feels direct, whether placing the last part of a pile is satisfying rather than fiddly, and whether another arrangement is voluntarily chosen. Current replay variation is modest: wells, a mirrored/shifted target and a fresh physical layout. This is not yet a progression system.

If the manipulation works, build a small authored sequence: one-well relocation, three-way balance, then a broad connecting pattern with different emergence locations. Completion should leave a beautiful arrangement, optionally saved locally. A new stone should present a new spatial problem rather than require the same routine. If pushing along a positive template feels awkward, test negative-space carving with a veil; do not compensate by adding timers, streaks or forced daily chores.

## Reproduce

```sh
npm run check
PLAYWRIGHT_CHROMIUM_EXECUTABLE=/usr/bin/chromium npm run test:browser
node scripts/upwelling-review.js --output=artifacts/upwelling/final
node scripts/upwelling-review.js --purposeful-only --seconds=100 --gestures=48 --output=artifacts/upwelling/extended
# With Vite running; run live performance capture without other test jobs:
PLAYWRIGHT_CHROMIUM_EXECUTABLE=/usr/bin/chromium node scripts/upwelling-playtest.js
PLAYWRIGHT_CHROMIUM_EXECUTABLE=/usr/bin/chromium node scripts/upwelling-playtest.js --extended --output=artifacts/upwelling/browser-extended
npm run deploy:branch -- top-down-lab
```

The experiment lives at `/lab` in the built multi-page site (`/lab.html` under Vite). The ordinary game remains the other entry. There are no new runtime dependencies, external analytics, stored user data or cross-version score writes. Stop local dev/test servers after verification, as requested by the owner.
