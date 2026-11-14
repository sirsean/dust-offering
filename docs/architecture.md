# Architecture

## Decisions

- **Client:** Vite with vanilla JavaScript ES modules and Canvas 2D, as requested by the prototype plan. No framework or runtime dependencies.
- **Physics:** a bounded continuous particle model with rounded ridge segments, local contacts, and a spatial hash. This is the next implementation phase, not part of the scaffold.
- **Server:** none. Cloudflare Workers static assets serve Vite's `dist/`. A custom Worker handler can be added later if a demonstrated need arises.
- **Tests:** built-in Node test runner for DOM-independent behavior. ESLint and Prettier handle code and formatting; `npm run check` is the CI entry point.
- **Hosting:** exact Workers Custom Domains for production and each branch. This gives every branch an independent deployment and lets Cloudflare provision DNS and certificates. No wildcard DNS router is needed.

## Code organization

| Location                  | Responsibility                                                          |
| ------------------------- | ----------------------------------------------------------------------- |
| `src/main.js`             | Browser entry and future composition of input, simulation, and renderer |
| `src/styles.css`          | Layout and presentation                                                 |
| `src/config/prototype.js` | Frozen starting physics/challenge defaults, with logical units          |
| `public/`                 | Static files, favicon, response headers                                 |
| `scripts/`                | Deployment targeting and Wrangler invocation                            |
| `tests/`                  | Node behavioral tests                                                   |
| `docs/`                   | Source plan, project decisions, status, and deployment runbook          |

Create `src/simulation/`, `src/rendering/`, `src/input/`, and `src/game/` as their first modules are needed. Keep simulation state and all geometry/accounting independent of the DOM. The browser loop owns the fixed-step accumulator; rendering reads state; pointer input produces logical edits. Keep the challenge state machine outside the renderer.

## Numerical and product constraints

Use a fixed logical 160 × 200 world, 60 simulation steps/second, and initially two substeps. Cap the rendering device pixel ratio independently. No simulation rules depend on canvas pixel dimensions. Changes to geometry, stepping, or physics must preserve deterministic ordering and grain accounting.

The prototype must demonstrate a gradual physical split through a rubbed gap. The three-width experiment in the plan is the gate before adding scoring or polish. When implemented, keep its reproducible scene configuration and measured outputs with the source. Changes affecting scoring conditions require a new challenge identifier.

## Deliberately deferred

No backend, analytics, leaderboard, framework, art pipeline, persistence service, or sound dependency. Local storage will be enough for challenge bests; native sharing plus copy/manual fallback will be enough for score sharing. The current holding screen only verifies the delivery path.
