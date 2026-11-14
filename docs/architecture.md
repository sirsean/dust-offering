# Architecture — sand on stone

The owner's feedback replaces the drawn-ridge model. The active design is `stone-offering-v2`, with decaying sticky traces and independent multi-touch. Earlier source and measurements are historical. Use Vite, vanilla JavaScript modules and Canvas 2D, with no runtime framework or physics engine.

| Location                           | Responsibility                                                                                                                         |
| ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `src/config/prototype.js`          | Logical dimensions, slow motion/emission, adhesion, brush, limits and challenge defaults                                               |
| `src/config/challenge.js`          | Versioned supply/targets/seed, isolated from old scores                                                                                |
| `src/config/adhesion-scene.js`     | Reproducible gathering, brush and control experiment                                                                                   |
| `src/config/stress-scene.js`       | Retained 6,000-grain stone fixture                                                                                                     |
| `src/simulation/`                  | Seeded continuous particles, stone membership/roughness, contacts, adhesion graph, brush displacement, collection, ground and sleeping |
| `src/game/`                        | DOM-independent challenge state, score, guarded storage and share fallbacks                                                            |
| `src/input/`                       | One brush action, independent per-pointer capture/paths/cancellation and protected stone-only interaction                              |
| `src/rendering/`                   | Procedural stone, decaying coating, literal grain deposits and ground piles, bowl contents, contact footprints and optional sound      |
| `src/main.js`                      | Browser composition, controls, fixed-step scheduling, visibility and result dialog                                                     |
| `tests/`, `scripts/`, `artifacts/` | Behavioral checks, reproducible simulated play and retained evidence                                                                   |

## Sand and stone

Each grain stores continuous position/velocity and an optional bond: weakly attached to stone or attached to an already-bound sand grain. Bare-stone exposure accumulates slowly over a seeded roughness field. Sustained, slow contact with bound sand accumulates attachment much faster. A per-grain seeded threshold makes attachment reproducible without predetermining a bowl or a flow path.

Sand bonds retain parent/child relationships. Brushing releases an attachment and its dependent descendants, clears stale relationships, wakes loose material and applies a short reattachment cooldown. The finger pushes existing grains toward the banks of its swept path and coats the stone beneath. It creates no collision geometry or sand. Incoming grains collide with the actual bound sand circles, so those deposits guide the flow.

Contacts use a stable spatial hash and three contact passes per collision substep. Bound grains have zero inverse mass; loose grains can settle/sleep. Sleeping sand can still form a contact bond. Moving contacts wake neighboring loose material, and a brush wakes loose grains on the stone so removal of support cannot leave frozen dust suspended. Unrelated ground piles stay asleep until falling sand touches them.

## Surface traces

`src/simulation/surface-treatment.js` owns a 160 × 200 grid in fixed logical coordinates. Active cells store strength and the simulation timestamp of their latest update. Exponential decay is evaluated lazily, with a 30-second half-life. The renderer may prune values below 0.002; physics treats those values as zero regardless of rendering, preserving deterministic replay.

A soft radial kernel coats editable stone, with approximately one strength unit per pass and a maximum of six. An initial press also leaves a spot. Midpoint integration normalizes travelled distance, so dense/coalesced pointer events do not amplify a stationary finger or a straight stroke. Independent fingers add to the same field. Bilinear sampling multiplies bare-stone adhesion exposure by `1 + 8 × local strength`. The sand-to-sand attachment rate and brush release cooldown are unchanged. Fading affects future capture; it does not break existing attachments.

The renderer draws a cached grid texture beneath the grains, refreshing after edits and at most every 0.1 simulation seconds while fading. Opacity grows with strength. The trace remains visible under reduced motion and after all contacts lift. Reset creates a fresh field; resize retains the existing one. Simulation time advances while the source is paused and before Challenge begins, but freezes when hidden or after Finish.

Pointer Events use a map keyed by pointer ID. Each entry owns its previous point and capture. Ending, cancelling or losing capture removes only that contact. Reset, mode change and hiding cancel all contacts. Coalesced events are processed per finger; crossing a protected region resets that finger's previous point.

## Ground and accounting

The two bowls collect a downward line crossing at its interpolated x position. A miss is marked but stays in the grain array, falls to a floor and collides with the bowl exteriors and other grains. Those same grains form the rendered bottom piles. There is no aggregate replacement or performance deletion. If a growing pile later spills into a bowl, collection transfers that grain from the missed count into the bowl once.

Two equivalent invariants are tested: `emitted = left + right + grains.length`, and `emitted = left + right + spill + faceCount`. Here `spill` counts retained missed grains, including those still falling; `faceCount` excludes that same group. For Challenge, add remaining supply to either right-hand side to get the fixed starting supply.

The 6,000-grain cap includes stone, loose and ground grains. A full tray pauses new emission and can be reset. Blocking/pausing never builds an emission backlog. Keeping visible missed sand is more important than allowing an invisible, unlimited drain of material.

## Browser behavior

Physics uses 160 × 200 logical units, 60 fixed steps/s and two substeps. Current maximum speed is 16 units/s, gravity 12 units/s² and emission 24 grains/s. DPR is capped at 2. CSS container sizing preserves a uniform 4:5 canvas through rotation; ResizeObserver changes only its pixel backing store. Hidden documents suspend stepping and reset the clock on return.

An 8 ms frame work budget prevents catch-up spirals. Under extreme load simulation time can slow, without skipping particle accounting. Ordinary play must remain responsive and gentle. `?debug` explicitly exposes developer state for repeatable checks; normal play does not expose that mutable handle.

## Scope and hosting

Best scores are local and keyed to the current challenge. Sharing uses native share, then clipboard, then selectable manual text. Sound starts muted and uses native Web Audio after opt-in. There is no backend, leaderboard or analytics. Workers static assets serve the Vite build. The owner has deferred automatic deployment; use direct Wrangler commands and keep other sites in the shared account untouched.
