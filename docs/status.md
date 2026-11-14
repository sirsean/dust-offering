# Project status — playable prototype

The prototype implements the full plan and is ready for human gameplay evaluation. Free Pour, continuous Draw/Rub editing, accumulation, Stop/Resume, Reset, the finite challenge, scoring, saved best, shared challenge links, optional muted-by-default sound, reduced motion, and phone/desktop layouts are implemented.

## Verification

- `npm run check` passes lint, formatting, 21 numerical/unit tests, and the production build. The Playwright suite passes 11 browser scenarios; its desktop duplicate of the touch-only case is intentionally skipped.
- Numerical physics gate passes for 20°/35° transport in both directions, support removal within 0.2 seconds, and the three-width experiment across three fixed seeds. See [physics-results.md](physics-results.md) and `artifacts/physics-splits.jsonl`.
- Exactly 4,800 unobstructed spawns in 2,400 steps; grain accounting, blocked/stopped supply, contact/collection behavior, deterministic replay, all specified score cases, best storage and sharing failures are tested.
- Browser gameplay checks cover full challenges, live splits and widening, mouse and emulated touch, capture cancellation, reset/mode changes, narrow layouts and rotation, hidden-tab recovery, reduced motion, denied storage, and sound controls.
- A real-time scripted challenge emitted all 4,800 grains in 40.05 seconds and scored 831 with no spill. A live cut-widening session increased the left-path share from 44.54% to 61.22%. See [playtest.md](playtest.md), screenshots and `artifacts/playtest-report.json`.
- The retained-pile fixture holds all 6,000 grains. At that extreme, rendering is slower and simulation time can slow to preserve input. No grains are dropped for performance. Real phone hardware and human enjoyment are not yet evaluated.

## Deployment and repository

Public repository: <https://github.com/sirsean/dust-offering>. Production: <https://dust-offering.sirsean.me>. The implementation is developed on `prototype`, then integrated into `main` for the playtest release.

Use direct Wrangler deployments from this environment. The owner has deferred automated GitHub deployments; leave the deployment secret unconfigured. GitHub Actions runs code and browser checks. Production is `npm run deploy`; previews are `npm run deploy:branch -- branch-name`; cleanup is `npm run deploy:branch:delete -- branch-name`. A Git push or branch deletion alone does not deploy or clean up a preview.

## Human evaluation next

Prompt: “Get some dust into both bowls while the stream is running.” Observe discovery of a split, ability to correct it without coaching, and desire to keep experimenting. Then try Challenge. Prioritize real-thumb Rub sensitivity, the useful cut-width range, sound level, and large-pile frame rates on actual phones. Keep `first-offering-v2` stable once published; version physics/scoring changes before comparing new scores.
