# Architecture

## Decisions

- **Client:** Vite with vanilla JavaScript ES modules and Canvas 2D, as requested by the prototype plan. No framework or runtime dependencies.
- **Physics:** a bounded continuous particle model with rounded ridge segments, local contacts, and a spatial hash. Independent numerical tests establish the gradual split before scoring. See `physics-results.md`.
- **Server:** none. Cloudflare Workers static assets serve Vite's `dist/`. A custom Worker handler can be added later if a demonstrated need arises.
- **Tests:** built-in Node test runner for DOM-independent behavior, and Playwright for browser mouse/touch gameplay and full challenge runs. ESLint and Prettier handle code and formatting; CI runs `npm run check` and `npm run test:browser`.
- **Hosting:** exact Workers Custom Domains for production and each branch. This gives every branch an independent deployment and lets Cloudflare provision DNS and certificates. No wildcard DNS router is needed.

## Code organization

| Location          | Responsibility                                                                                      |
| ----------------- | --------------------------------------------------------------------------------------------------- |
| `src/main.js`     | Browser composition, frame scheduling, controls, result dialog and URL state                        |
| `src/styles.css`  | Layout and presentation                                                                             |
| `src/config/`     | Physics defaults, versioned challenge, reproducible ramp and stress scenes                          |
| `src/simulation/` | Seeded source, continuous particles, ridge clipping, contacts, collection and sleeping              |
| `src/game/`       | DOM-independent challenge state machine, score, storage and share fallbacks                         |
| `src/input/`      | Single-pointer capture, stroke interpolation and protected edit regions                             |
| `src/rendering/`  | Procedural Canvas 2D scene, dust sprites, bowl mounds, brush, reduced motion and optional Web Audio |
| `public/`         | Static files, favicon, response headers                                                             |
| `scripts/`        | Wrangler deployment, physics measurements and a real-time scripted player                           |
| `tests/`          | Node behavioral tests                                                                               |
| `docs/`           | Source plan, project decisions, status, and deployment runbook                                      |

Simulation state and all geometry/accounting are independent of the DOM. The browser loop owns the fixed-step accumulator; rendering reads state; pointer input produces logical edits. The challenge state machine stays outside the renderer. `?debug` explicitly exposes developer state for reproducible browser checks; ordinary play does not expose that mutable handle.

CSS container sizing keeps the canvas at a uniform 4:5 aspect ratio within its stage during resize/rotation. ResizeObserver adjusts the pixel backing store only, so layout does not wait for a JavaScript resize callback.

## Numerical and product constraints

Use a fixed logical 160 × 200 world, 60 simulation steps/second, and two collision substeps. Device pixel ratio is capped at 2. No simulation rules depend on canvas pixel dimensions. The frame loop stops scheduling further steps after an 8 ms work budget, so extreme loads slow simulation time instead of starving input. A hidden document resets the clock and emits no backlog. Changes to geometry, stepping, or physics must preserve deterministic ordering and grain accounting.

The three-width experiment demonstrates a gradual physical split through a rubbed gap. Its scene configuration and measured outputs are committed. Grain contacts use stable hash ordering and three passes; positional corrections feed back into velocity. Ridge collisions preserve the previous contact side under a loaded pile. Quiet grains can sleep, moving contacts wake local neighbors, and every geometry edit wakes the entire face. This favors correctness of support removal over optimizing isolated wake regions. Changes affecting published scoring conditions require a new challenge identifier.

## Deliberately deferred

No backend, analytics, leaderboard, framework, art pipeline, or persistence service. Bests use guarded local storage. Sharing uses the native API, clipboard, then manual-copy fallback. Audio uses native Web Audio after opt-in, with no sound dependency. Real-phone evaluation remains a human playtest task.
