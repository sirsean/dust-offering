# Gameplay review and experiments

This pass starts from revision 0.9.0 (`1f3ed66`). The owner finds the game insufficiently compelling and authorizes experimenting, comparing and iterating. Preserve its quiet mood, one brush action, real sand, hidden stone, desert materials, Fringe typography and direct entry. Improvement means a clearer invitation to touch, a satisfying response and a reason for another gesture. Human fun and return play remain unmeasured until people try it.

## Baseline evidence

The previous numerical tests establish correctness, not engagement. A frozen baseline worktree, repeatable physical fixtures, native emulated-touch playthroughs and captures are used for comparison. Shared desktop tools are unavailable in this session, despite an enabled desktop capability; these are headless Chromium observations, not physical-device or human testing.

- At three seconds the canonical pour has 73 grains but none in the central brushing area, and none attached. The first swipe can reveal stone but cannot yet shape sand there.
- At ten seconds there are 103 grains in the central area, with twelve attached. Meaningful material interaction arrives later than the invitation to touch.
- In the controlled 153-grain deposit, a left swipe moves 45 grains immediately and sends 40 to the left bowl within eight seconds. A right swipe sends 42 to the right. The core already has useful steering; its reach and immediacy are limited.
- The same straight stroke sampled once or forty times differs by only 0.088 logical units per grain on average. Sampling is not the baseline's main defect; reassess it if new carry behavior introduces greater variation.
- After sixty seconds, passive rain has revealed about 7,093 visibility-cell equivalents. Discovery progresses substantially without brushing, reducing the player's authorship.
- Collection feedback is a small number change and a barely changing fill level. Optional bowl tones exist, but brushing itself is silent. A subtle response to actual movement/arrival could make outcomes easier to read.

Raw baseline: [physics](../artifacts/gameplay-review/baseline-physics.json). Native-touch play and candidate comparisons are recorded below. Counts and timings below are behavioral measures, never a numeric fun score.

## Ideas and selection criteria

| Idea                                                               | Potential benefit                                                        | Decision to test                                                                     |
| ------------------------------------------------------------------ | ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------ |
| Dust already in flight on entering Free Pour                       | Something physical to touch immediately                                  | Test a short, physically simulated warm start, with discovery still initially hidden |
| A broader finger footprint                                         | Work remains visible outside a finger; moves a meaningful amount of sand | Test 14 logical units against eight                                                  |
| Carry sand partly along the swipe                                  | More direct steering and scooping, alongside displaced banks             | Compare low, moderate and excessive carry; keep slow speed bounds                    |
| Wider, stronger local discovery; slower passive reveal             | The player visibly authors the stone's emergence                         | Compare immediate response and unattended discovery                                  |
| Softer brush sound tied to actual material                         | More tactile feedback without a score notification                       | Test only after explicit Sound opt-in                                                |
| Bowl impact response                                               | Make successful arrivals legible                                         | Test a restrained response tied to actual collected grains                           |
| Fresh Free Pour seeds                                              | New material patterns on another visit/reset                             | Keep replay by seed; fixed Challenge remains fair                                    |
| Small completion/collection prompts                                | Give a reason for the next swipe                                         | Tested a quiet discovery meter and optional fresh stone                              |
| Combos, countdowns, streaks, escalating speed                      | Easy urgency and score chasing                                           | Reject for this relaxing direction                                                   |
| Invented relic glyphs, unlock currencies, cosmetic dust explosions | More spectacle or progression                                            | Defer: would obscure the physical interaction or add unsupported lore                |
| Screenshots/pattern saving                                         | Reward self-expression                                                   | Defer until shaping the material is satisfying                                       |

## Evaluation rules

Compare the same seeds and gestures with the original, using controlled deposits as well as normal pours. Measure material available for the first swipe, moved/released grains, direction of carry, bowl outcomes, sampling sensitivity, retained mass, speed bounds, independence of simultaneous fingers, visible reveal and feedback lifetime. Check quiet/reduced-motion behavior, pauses, hiding, resets, challenge supply and performance. Keep failed trials and their reasons. Ship a coherent selected candidate with a comparison preview; do not label automated interaction evidence as proof of increased human enjoyment or retention.

## Iteration 1 — have something worth touching

Cold entry invites a gesture before the central field contains sand. Preparing the actual shower for six, nine or twelve seconds gives 30, 91 and 88 centrally touchable grains respectively with seed 48. Nine seconds is selected: enough material before significant collection, without starting with a heavily filled scene. Preparation takes roughly a tenth of a second in this cloud environment, preserves source-born material and accounting, and clears only discovery. Challenge keeps empty preparation and finite supply.

The finger grows from eight to fourteen logical units, roughly 18 to 32 CSS pixels on the standard phone board. Finger reveal grows from radius six / gain 0.65 to ten / 0.8. The response is visible around a contact rather than a thin line beneath it. Passive reveal falls from 0.24 to 0.08/contact-second, giving gestures more authorship.

The same opening diagonal in native emulated-touch sessions directly moves zero grains in the old build and 38 in the selected scene, releasing ten. The selected first material response occurs about 32 ms into that gesture, including dispatch and path travel. This is not a physical-device rendering-latency benchmark.

## Iteration 2 — make a sweep feel like a sweep

Trials compare carry 0, 0.6 and 1.0. Moderate 0.6 is selected: the strongest carry raises directional velocity without consistently improving bowl delivery or leaving better banks.

The first carry implementation increases sparse/dense position difference to about 0.8 logical units. Physical sampling is therefore changed to preserve travelled-distance residuals per pointer, with a final endpoint flush. The same path then agrees to floating-point precision. A stationary held contact cannot pump sand. A lift cannot flush another finger, and a late flush cannot edit a finished result.

| Controlled 153-grain bank                       | Original | Selected |
| ----------------------------------------------- | -------- | -------- |
| Immediately moved grains                        | 45       | 92       |
| Intended left-bowl delivery after eight seconds | 40       | 82       |
| Opposite-bowl delivery                          | 0        | 2        |
| Mirrored intended right-bowl delivery           | 42       | 79       |

All 153 grains remain accounted for. Raw trials retain [wide-only](../artifacts/gameplay-review/wide-brush.json), [moderate](../artifacts/gameplay-review/moderate-carry.json), [strong](../artifacts/gameplay-review/strong-carry.json), [sampled moderate](../artifacts/gameplay-review/sampled-carry.json), [sampled strong](../artifacts/gameplay-review/sampled-strong.json) and [final](../artifacts/gameplay-review/final-physics.json) states.

## Iteration 3 — preserve flow and reject gummy variants

The untuned broad smear exposes a problem: a horizontal layered patch can hold a grain near y=101 after ten seconds. Reducing all cross-stroke drag to five fixes that, but weakens useful sloping guidance; the fixture's intended left delivery falls from about 82 to 65. The selected solution instead reduces grip near horizontal: from 0.35 of normal at flat to full grip at axis y=0.35. Meaningful slopes retain control while flat smears drain. No invisible collision rails are added.

Four- and six-second release cooldowns do not consistently improve the scripted player's benefit, so the original 2.5 seconds remains. [Four-second](../artifacts/gameplay-review/longer-release.json), [six-second](../artifacts/gameplay-review/excessive-release.json) and [policy](../artifacts/gameplay-review/excessive-release-agency.json) records preserve those rejected trials.

Increasing stone adhesion to 0.045 or 0.08 creates denser deposits but does not improve early material availability and generally reduces useful collection from purposeful swipes. It risks making play feel like repeated maintenance. The original 0.025 remains. [Richer deposits](../artifacts/gameplay-review/richer-deposits-physics.json), [moderately sticky policy](../artifacts/gameplay-review/richer-deposits-agency.json) and [very sticky policy](../artifacts/gameplay-review/very-sticky-agency.json) retain the alternatives.

## Iteration 4 — let the material answer

Recently brushed real grains leave a short readable wake. Actual bowl arrivals produce a restrained surface wave and rim response, without cosmetic replacement particles or score explosions. Reduced motion omits these decorations.

With Sound explicitly enabled, moved sand drives short filtered dry texture and bowl arrivals produce quiet tones. Both bowls can naturally form a chord when fed together, without a combo counter. The final phase records 23 texture events, eight bowl tones and peak signal 0.02465, well below digital clipping. Mute/hide silences it; new scenes do not replay old contacts. Subjective timbre and device loudness still need real listening.

Recorded sessions include diagonals, stream crossing, scooping, two fingers, a slow curve and paused reshaping. [Baseline](../artifacts/gameplay-review/baseline/report.json), [strong](../artifacts/gameplay-review/strong/report.json), [intermediate](../artifacts/gameplay-review/selected/report.json) and [final](../artifacts/gameplay-review/final/report.json) records distinguish direct effects from grains merely falling during a gesture. Preparation intentionally changes physical age, so their final wall-time totals must not be treated as a causal collection comparison.

Silent real-time opening excerpts: [before](../artifacts/gameplay-review/before.webm) and [after](../artifacts/gameplay-review/after.webm). They preserve real speed; Playwright video does not record sound.

## Iteration 5 — a quiet reason for another gesture

Free Pour now shows actual opacity-weighted stone coverage in a thin readout. At 82% it acknowledges “Stone found” and offers “New stone.” Completion does not end the scene or discard the creation. Reset varies the seeded shower and mineral weathering, retaining the palette and shape without invented glyphs, currencies or unlock ladders.

The threshold leaves room around the soft rim rather than requiring tiny edge cleanup. A scripted uncovering pattern reaches it after 36.8 simulation seconds in three seeds. At 42 seconds it has about 99% coverage; an equally aged idle scene has about 17–20%. This establishes reachable, touch-driven progress, not human completion time or enjoyment.

The [readout-on](../artifacts/gameplay-review/goal/goal-on.png) and [readout-off](../artifacts/gameplay-review/goal/goal-off.png) captures compare its visual cost in the same scene. It occupies a slim existing HUD row and leaves the field clear. [Completion](../artifacts/gameplay-review/goal/stone-found.png), [fresh stone](../artifacts/gameplay-review/goal/fresh-stone.png), [layout record](../artifacts/gameplay-review/goal/report.json) and [discovery trials](../artifacts/gameplay-review/discovery-goal.json) retain the results.

The goal is retained as a prototype hypothesis. It may supply satisfying completion or may feel like a cleaning checklist. An agent sweeping a grid cannot settle that distinction. Self-directed shaping remains available indefinitely, with no demand to complete or reset.

## Does interaction matter more?

A state-aware policy seeks real deposits and makes ten purposeful swipes during sixty simulation seconds, choosing a bowl from the target ratio. It uses matched idle controls, the same seeds and the same shower. It is not a model of novice human skill.

| Seed | Old additional collection over idle | Selected additional collection over idle |
| ---- | ----------------------------------- | ---------------------------------------- |
| 48   | 95                                  | 249                                      |
| 2026 | 190                                 | 253                                      |
| 914  | 191                                 | 218                                      |
| Mean | 158.7                               | 240                                      |

The benefit of this policy rises by about 51%, with idle collection unchanged. This supports stronger agency rather than a generally faster/easier pour. It does not mean a human will collect or enjoy the game 51% more. Full [old](../artifacts/gameplay-review/baseline-agency.json) and [selected](../artifacts/gameplay-review/final-agency.json) records include every action and all conservation checks.

## Selected candidate and uncertainty

The selected loop is: material is ready → a sweep moves a noticeable bank → later flow changes → arrivals answer → brushing uncovers the object → finding it offers a fresh variation. It preserves slow motion, no urgency, one action, the desert materials and Fringe lettering.

All 63 numerical/unit checks and 33 browser scenarios pass, with three desktop touch duplicates skipped. The isolated 6,000-grain scene averages 20.98 ms/frame; a 71.4 ms tap releases 126 grains with none lost, comparable in cost to the previous cloud baseline. The full source, playthrough, audio and accounting evidence is in [playtest.md](playtest.md) and [physics-results.md](physics-results.md).

Human fun, addictiveness, retention and a durable reason to play for ten minutes remain unmeasured. Some gestures still miss the moving stream. A goal achievable by bare-stone brushing can become rote cleanup. The bowl challenge remains abstract, and optional sound may be tactile for some players and repetitive for others. Those are specific next human questions, not grounds for fabricating a positive verdict.

For the next hands-on comparison, spend a minute in the [old build](https://fringe-controls.dust-offering.sirsean.me) and [selected preview](https://gameplay-feel.dust-offering.sirsean.me). Try a slow curve, scoop a deposit toward the other bowl, use two fingers and toggle Sound. The decisive observation is whether finding one stone invites voluntary further play. If that remains flat, the next substantial experiment should give sand a meaningful spatial objective, such as a few hand-authored offering scenes, rather than increasing speed or adding more progress systems.

## Reproduction

Use Node 24 and Chromium:

```sh
npm run check
PLAYWRIGHT_CHROMIUM_EXECUTABLE=/usr/bin/chromium npm run test:browser
node scripts/feel-check.js . /tmp/feel.json
node scripts/agency-check.js . /tmp/agency.json
node scripts/discovery-check.js
```

For native-touch recording, run Vite, install Playwright ffmpeg, then run `PLAYWRIGHT_CHROMIUM_EXECUTABLE=/usr/bin/chromium node scripts/feel-playtest.js http://127.0.0.1:5173 candidate`. An optional fourth JSON argument supplies trial simulation settings. Carry overrides do not alter preparation; recorded settings and timing identify each historical trial. The frozen baseline is commit `1f3ed66`, reproducible in a detached worktree with the same lockfile and a separate local port.

Full recordings stay in `/tmp`; the repository keeps short silent excerpts, captures and durable JSON. No credentials, browser sessions or participant analytics are committed.
