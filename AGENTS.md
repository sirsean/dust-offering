# Working on Dust Offering

## Current direction

The owner's latest gameplay feedback supersedes the original ridge prototype. Read `docs/stone-sand-plan.md`, `docs/status.md`, and `docs/architecture.md` before substantive work. The intended experience is quiet, slow sand accumulating on a stone triangle. There is **one brush action**, available to multiple fingers: brush through that sand, dislodge it, and shape the deposits that later sand runs over. Do not reintroduce Draw/Rub modes or invisible player-drawn barriers.

Sand adheres weakly to rough stone and more strongly to other attached sand. Brushing leaves a visible sticky trace: repeated passes stack its strength, and it fades with a six-second half-life. Traces grip across a stroke while allowing downhill sliding along it; drawing uphill must not reverse gravity. Mark depth, adhesion and guidance read the same decaying field. The wider inlet must drain gently, with weaker attachment and temporary upper bonds. Some sand stays on the stone; missed sand remains physically present in piles at the bottom. Relaxed Free Pour is the default. Challenge is optional and must be versioned when its physics, supply, targets, or scoring conditions change. Historical measurements and superseded plans are provenance, not current gates.

## Visual direction

Use the owner's desert palette: brown, umber, dusk orange and sand, grounded in the Fringe's Scablands references. The triangle is worn old stone, the grains are pale dust, and brushed traces read as dark greasy finger marks. Layering makes the marks darker; fading returns them toward the stone's color. Keep the physical grains legible over both stone and grease. The palette is defined by CSS custom properties in `src/styles.css`; `src/rendering/palette.js` reads the canvas colors when rebuilding cached artwork. Avoid green/sage coatings, luminous painted rails, invented lore glyphs and extra interface clutter. See `docs/visual-style.md` for references and current screenshots. Styling alone does not change the challenge identifier.

## Code and simulation

- Use Vite, vanilla JavaScript ES modules, semantic HTML, CSS, Canvas 2D, and optional Web Audio. No framework or full physics engine.
- Keep simulation, seeded randomness, accounting, challenge/scoring, and sharing independent of the DOM. Rendering reads state; pointer input produces brush strokes.
- Use the fixed 160 × 200 logical field, fixed 60 Hz steps, two collision substeps, stable spatial-hash ordering, and seeded randomness. Screen size/DPR must never change physics.
- Keep all tuning defaults in `src/config/`, with logical units. Default motion and emission must remain substantially slower than the original 78-unit/s, 120-grain/s prototype.
- The physical supports are sand grains. Represent adhesion explicitly and release dependent attachments when a supporting bond is brushed away. A stroke moves/releases existing material; it never creates rail geometry or deletes grains.
- Keep missed grains in the simulation and render their resting piles. Count bowl collection once. Preserve `emitted = left + right + all retained grains`; retained grains include those on the stone and those on the ground. `spill` counts retained grains marked as missed, so `emitted = left + right + spill + faceCount` also holds.
- A grain may sleep when resting. Brush edits, weathered bonds and moving contacts must wake affected material. Removing adhesion must not leave frozen unsupported descendants or sleeping loose grains. Never discard grains for performance.
- Prefer plain named functions/data over generic abstractions. Document nonobvious numerical behavior near the solver. Keep status, commands, tuning reports and constraints current.

## Interaction and feel

Use Pointer Events for touch, pen, and mouse. Capture and track every active pointer independently, including each previous stroke point. Releasing, cancelling or losing capture for one finger must not interrupt the others or connect their paths. Interpolate fast strokes and deposit trace strength by distance rather than event frequency. Brush the entire visible triangle, including its tip and bottom rim. A contact centred just outside an edge can still overlap it. Share the triangle geometry between rendering and interaction, clipping effects to the stone; bowls and the surrounding space remain outside. Show each contact footprint, keep controls at least 44 CSS pixels tall, and apply `touch-action: none` only to the canvas.

Preserve all grains, bonds, piles, counts, supply and traces through resize/rotation; suspend stepping while hidden and reset the frame clock on return. Stopping the pour only stops new emission; traces still decay. Trace time follows simulation time and freezes when hidden or finished. Reset/mode changes clear all traces and active contacts. No countdown, rushing cues, or catch-up bursts. Sound starts muted. Reduced motion removes decorative trails while retaining necessary sand movement and functional sticky traces.

## Verification

Use Node 24 and the npm lockfile. Run `npm ci` on clean checkouts and `npm run check` before committing. For gameplay changes run `npm run test:browser`; install Chromium using Playwright or set `PLAYWRIGHT_CHROMIUM_EXECUTABLE` to a system browser. `npm run playtest` runs the real-time scripted player with Vite running.

Test the slow speed bound, full unobstructed supply, sustained inlet drainage, weak stone adhesion versus stronger sand adhesion, contact deflection by real deposits, mass-preserving brushing, bond-release cascades, continuous edge-reaching strokes, fast visible trace decay, downhill guidance in both drawing directions and at crossings, independent simultaneous touches and partial lift/cancellation, persistent missed-sand piles, sleeping/waking, deterministic replay, collection, score/storage/sharing, and reset/mode/resize/hidden recovery. Keep numerical evidence and browser screenshots for the current design. Report emulated touch and real hardware separately; automated play cannot prove human enjoyment.

## Repository and deployment

Public repository: `sirsean/dust-offering`. `main` is production. Work on focused branches and push reviewable commits. Do not add a license without the owner's choice. Never commit credentials, `.env` files, generated deployment config, `dist/`, dependency directories or transient browser reports.

Use direct Wrangler deployment from this environment. The owner has deferred automated GitHub deployments; do not configure an Actions deployment secret until requested. CI runs code/browser checks, with deployment/cleanup steps skipped while the secret is absent.

Production: `https://dust-offering.sirsean.me`, served by Workers static assets from `dist/`. Use `npm run deploy` for production, `npm run deploy:branch -- branch-name` for an isolated preview, and `npm run deploy:branch:delete -- branch-name` for cleanup. Branch previews have exact custom domains such as `stone-sand.dust-offering.sirsean.me`. Protect the other Workers and DNS records in the shared account. See `docs/deployment.md` for the environment-specific writable cache/config paths.
