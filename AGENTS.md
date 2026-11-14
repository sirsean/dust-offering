# Working on Dust Offering

## Scope and source

Build a standalone, portrait-first browser game at the Black Pyramid: draw ridges, rub gaps, and guide falling dust into two offering bowls. The key experience is widening a gap while the stream runs and seeing the split change gradually.

Read `docs/status.md`, `docs/architecture.md`, and `docs/prototype-plan.md` before substantive work. The plan is a snapshot of the user's Fringe Page; its source URL is in the file. Keep status, decisions, commands, and measured results current as the project changes. Do not silently change the core mechanic or expand into accounts, hosted leaderboards, or other backend services.

## Implementation conventions

- Use Vite, vanilla JavaScript ES modules, semantic HTML, CSS, and Canvas 2D. Avoid frameworks, a physics engine, and unnecessary dependencies.
- Keep simulation, geometry, deterministic randomness, accounting, and scoring independent of the DOM. Rendering and input consume that state; they do not own physics rules.
- Keep tunable defaults in `src/config/`, with units and reasons for changes. Use the fixed 160 × 200 logical playfield and fixed 60 Hz stepping regardless of screen size or display refresh rate.
- Start with circles, rounded short ridge segments, a spatial hash, continuous velocities, and two collision substeps. Preserve the maximum travel bound of one grain radius per substep. Use stable contact ordering and seeded randomness.
- Rub clips ridge geometry; it never deletes dust. Draw must preserve grain counts. Wake grains when their support changes. Collection counts a crossing exactly once, including spill. Never discard grains to conceal a performance problem.
- Keep modules small and named for their responsibility. Prefer clear data and functions over generic abstractions. Document nonobvious numerical choices and invariants near the code.

## Build order and gates

1. Scene: portrait playfield, source, two bowls, center spill, Reset. Untouched dust falls into the gap.
2. Free Pour: Draw, Rub, Stop/Resume, visible piles, proper pointer capture/cancellation and continuous strokes. Pass the physics gate below before scoring, glow, texture, or sound.
3. Challenge: versioned `first-offering-v2`, 40 active pouring seconds, 4,800 grains, targets 1,800 / 3,000, Begin/Finish, local best, share URL.
4. Tune: legibility, performance, accessibility, real-phone playtesting where available. Report tested hardware and limits honestly.

The physics gate requires 20°/35° ramps in both directions, support removal draining within 0.2 seconds, and reproducible three-width split measurements (initial widths 3/6/9, five-second warm-up, ten-second sample, three fixed seeds). At least two widths must carry >=10% down each path, and every widening must raise the gap fraction by >=10 percentage points. Measure locally at the cut and ramp end. Save scene coordinates, seeds, parameters, and measured fractions in the repo. Do not fake the split with random routing, quotas, or invisible barriers.

## Input and presentation

- Use Pointer Events for mouse, pen, and touch. Interpolate strokes, capture one active pointer, and finish cleanly on up/cancel/lost capture.
- Apply `touch-action: none` only to the playfield. Protect source and bowl mouths from edits. Keep controls >=44 CSS pixels tall with selected state exposed.
- Preserve game state during resize/rotation; suspend stepping when hidden and reset the clock on return. Avoid emission backlogs and catch-up bursts.
- Recreate art procedurally using the Mesmegraph references linked in the plan. Keep dust, ridges, cuts, and counts legible on phones. Support reduced decorative motion. Sound is optional and comes last.

## Validation

Use Node 24 and npm with the committed lockfile. Run `npm ci` on a clean checkout and `npm run check` before committing. This runs ESLint, Prettier, Node's test runner, and the production build. Add focused behavioral tests as each mechanic is implemented; do not substitute tests of constants for physics evidence.

Test contact/collection accounting, ramp transport, waking, gap splits, fixed-step emission, deterministic replay, and scoring. Preserve `initial supply = remaining + left + right + spill + on-face grains`, including sleepers. Check 4,800 successful spawns over 2,400 unobstructed steps; stop/block spends no supply and accrues no backlog. Test exact score, one-grain error, partial fill, overfill, total spill, and sharing failures. Manually cover fast strokes, reset, mode switches, resize, hidden tabs, and dust in flight after Stop.

## Repository and deployment

The repository is `sirsean/dust-offering`; `main` is production. Use focused branches for implementation and push reviewable commits. Never commit tokens, `.env` files, generated deployment configs, build outputs, or dependency directories. Do not introduce a license without the owner's choice.

Cloudflare Workers serves static `dist/` assets using `wrangler.json`. Production is `https://dust-offering.sirsean.me`. GitHub Actions checks every push/PR, then deploys trusted repository branch pushes. PR checks do not receive deployment credentials. Branches use isolated Workers and exact custom domains, e.g. `branch-1.dust-offering.sirsean.me`; see `docs/deployment.md` for naming and cleanup.

Use `npm run deploy` for production and `npm run deploy:branch -- branch-name` for a preview. These require authorized Cloudflare credentials. Routine local development needs none. Preserve the shared Cloudflare account and other sites; deployment scripts must target only Dust Offering resources. Keep deploy documentation synchronized with configuration and workflows.
