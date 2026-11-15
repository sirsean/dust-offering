# Architecture — sand on stone

The active design is `stone-offering-v6`: a wide, variable offscreen pour with occasional sputters, an initially hidden stone discovered by fingers and sand, slow grains, fading downhill guides and full-triangle multi-touch. Earlier source and measurements are historical. Use Vite, vanilla JavaScript modules and Canvas 2D, with no runtime framework or physics engine.

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

Revision 0.5.0's desert appearance uses CSS custom properties in `src/styles.css` as the palette source for both DOM controls and Canvas artwork. `src/rendering/palette.js` reads those tokens during `Renderer.resize()`, when cached artwork is rebuilt. The stone, scenery and three sand-color sprites are cached; per-grain drawing only selects a sprite by grain ID. Visual randomness uses separate seeds and never consumes the simulation's random stream. See [visual-style.md](visual-style.md) for the Scablands references and visual review.

## Sand and stone

Each grain stores continuous position/velocity and an optional bond: weakly attached to stone or attached to an already-bound sand grain. Bare-stone exposure accumulates slowly over a seeded roughness field. Sustained, slow contact with bound sand accumulates attachment much faster. A per-grain seeded threshold makes attachment reproducible without predetermining a bowl or a flow path.

Sand bonds retain parent/child relationships. Brushing releases an attachment and its dependent descendants, clears stale relationships, wakes loose material and applies a short reattachment cooldown. The finger pushes existing grains toward the banks of its swept path and coats the stone beneath. It creates no collision geometry or sand. Incoming grains collide with the actual bound sand circles, so those deposits guide the flow.

Contacts use a stable spatial hash and three contact passes per collision substep. Bound grains have zero inverse mass; loose grains can settle/sleep. Sleeping sand can still form a contact bond. Moving contacts wake neighboring loose material, and a brush wakes loose grains on the stone so removal of support cannot leave frozen dust suspended. Unrelated ground piles stay asleep until falling sand touches them.

The source spans 34 units with 24 distributed lanes. New adhesion is suppressed above y=45 and ramps to full strength by y=72, for both stone and sand bonds. Bonds formed above y=72 expire after 2.5 simulation seconds, releasing their descendants with the usual cooldown. This prevents a permanent cap at the tip. Weathering also wakes loose sand on the face, which may have been resting on that support without belonging to its bond tree. Missed ground grains remain asleep. The artificial full-face stress fixture explicitly pins its bonds until brushed; natural drainage has separate long-pour checks.

## Moving opening

The opening is invisible and centred at y=-4, above the canvas. `Simulation.sourceStartStep` is null until the first active pour. Thereafter `sourceTime` derives from fixed-step elapsed time, so pausing or blocking emission does not stop the drift. Challenge preparation leaves the phase at zero; hidden pages and Finish freeze it because stepping stops. A fresh simulation restarts the phase.

`Simulation.sourceX` is `80 + 44 × sin(2π × sourceTime / 60)` with default tuning. The amplitude is bounded by the board width, opening width and grain radius. Emission samples seeded lanes around the current centre. Existing particles retain their velocity and receive no artificial sideways impulse from the moving opening. The challenge inherits these settings directly from the prototype instead of overriding the source height.

Grains born above y=0 remain in the same particle array, collision hash and accounting as all other retained material. The hash clamps its edge cells while still using actual coordinates for contact distances. Rendering naturally clips offscreen particles. There is no source line or source-specific brush instruction; only a full retained tray produces the existing Reset notice.

## Variable arrival flow

`src/simulation/source-flow.js` is a pure function of configuration, seed and source time. It uses integer hashing and smooth interpolation between seeded values, independently of particle randomness. `Simulation.sourceRate` exposes the current instantaneous rate. The nominal 24 grains/s is multiplied by a slow 4.5-second swell (0.4–1.6) and smaller 0.75-second ripples (0.88–1.12). Before sputter gating the rate lies within 8.448–43.008 grains/s. Intervals describe noise sampling, not a repeating wave; the profile does not repeat every sway cycle.

Each 12-second window has a seeded offset for a 1.4-second sputter cluster. Three or four pulses have uneven quiet portions and softly edged returns, allowing actual brief zero-rate gaps. This changes density only; source launch velocity, gravity and the speed cap stay gentle. The emission fraction integrates the rate at each fixed step. No flow accrues while paused, full or obstructed; a natural zero-rate gap contributes nothing. At the default peak, at most one grain can be born per step.

Reading the flow in debug tools or rendering cannot advance its sequence. It follows the same source clock through preparation, pauses, hidden recovery and reset. Setting `sourceFlowVariation: 0` bypasses both fluctuations and sputters for controlled experiments. Supply remains 960, but pour duration now depends on the profile and pauses; there is no timer-derived supply. Challenge v6 isolates the new delivery conditions from prior bests.

## Persistent discovery

`src/simulation/surface-discovery.js` owns a separate 160 × 200 logical visibility grid. It starts at zero, adds local exposure up to one, and never decays. It does not affect contacts, adhesion, random numbers or particle accounting. Fingers use a soft 6-unit radius and distance-normalized gain of 0.65 per pass, including initial taps. Each active pointer follows the same independent swept path used for grease and dislodging sand.

Every six fixed steps (0.1 seconds), retained grains deposit time-normalized exposure along their swept paths. Only actual grain-radius contact with the triangle qualifies; the soft reveal halo extends two units around that contact. Rate is 0.24 per second at the kernel centre. Bound and sleeping grains continue uncovering the stone beneath them. Fully exposed stationary patches can be skipped until their grain moves; ground and offscreen grains reveal nothing. Per-grain sample position/step stays current even when the patch is complete.

The renderer caches the landscape separately from transparent stone artwork, including its rim. It composes stone and fading grease, then masks both with the discovery bitmap. The composite refreshes when discovery grows, grease changes, or the 0.1-second fading interval elapses. Grains and bowls draw above/around it. No unrevealed outline or shadow is painted. Resizing rebuilds artwork without changing the logical grid. Reset and mode changes replace the field; Begin, hidden recovery and grease decay preserve it. A new first-use hint introduces discovery. Challenge v5 separates the changed visibility conditions from earlier scores.

## Surface traces

`src/simulation/surface-treatment.js` owns a 160 × 200 grid in fixed logical coordinates. Active cells store strength, two orientation components and the simulation timestamp of their latest update. Exponential decay is evaluated lazily, with a six-second half-life. The renderer may prune values below 0.002; physics treats those values as zero regardless of rendering, preserving deterministic replay.

A soft radial kernel coats editable stone, with approximately one strength unit per pass and a maximum of six. An initial press also leaves a spot. Midpoint integration normalizes travelled distance, so dense/coalesced pointer events do not amplify a stationary finger or a straight stroke. Independent fingers add to the same field. Edge-overlapping texels remain in the grid, while the rendered texture is clipped to the exact shared triangle and physics samples only actual stone points. This covers the apex and rim without a blank strip.

Stroke orientation uses weighted `cos(2θ)` and `sin(2θ)` components. This treats opposite finger travel on the same slope identically, blends bends and opposing slopes, and allows perpendicular crossings to cancel guidance while retaining their coating strength. Bilinear sampling produces local strength, axis and directional coherence. Strength and both components decay together.

For loose grains, the axis is oriented downhill. Gravity is partly projected along it, retaining a downward component across it. Drag across the axis is stronger than along it. Grip grows as `coherence × strength / (1 + strength)`; the speed cap still applies. Traces have no collision geometry and grains can drift off them. Horizontal strokes slow crossing but do not suspend grains indefinitely. Permanent stone capture is multiplied by `1 + 8 × strength × (1 − 0.9 × coherence)`, so coherent strokes favour sliding and taps retain stronger local capture. The sand-to-sand attachment rate and release cooldown are otherwise unchanged. Fading changes future grip/capture, without dissolving lower-face bonds.

The renderer draws a cached grid texture beneath the grains, refreshing after edits and at most every 0.1 simulation seconds while fading. Opacity is `0.52 × min(1, strength / 3)^0.75`. Revision 0.5.0 renders this as dark umber grease: stronger marks darken, and decay lightens them back toward the stone. The trace remains visible under reduced motion and after all contacts lift. Reset creates a fresh field; resize retains the existing one. Simulation time advances while the source is paused and before Challenge begins, but freezes when hidden or after Finish.

Pointer Events use a map keyed by pointer ID. Each entry owns its previous point and capture. Ending, cancelling or losing capture removes only that contact. Reset, mode change and hiding cancel all contacts. Coalesced events are processed per finger. A swept footprint is checked against the triangle's three expanded half-planes, retaining segments that leave or cross the stone between sparse events. The field and grain brush clip their effects to stone; the bowls and invisible opening lie outside the mask.

## Ground and accounting

The two bowls collect a downward line crossing at its interpolated x position. A miss is marked but stays in the grain array, falls to a floor and collides with the bowl exteriors and other grains. Those same grains form the rendered bottom piles. There is no aggregate replacement or performance deletion. If a growing pile later spills into a bowl, collection transfers that grain from the missed count into the bowl once.

Two equivalent invariants are tested: `emitted = left + right + grains.length`, and `emitted = left + right + spill + faceCount`. Here `spill` counts retained missed grains, including those still falling; `faceCount` excludes that same group. For Challenge, add remaining supply to either right-hand side to get the fixed starting supply.

The 6,000-grain cap includes stone, loose and ground grains. A full tray pauses new emission and can be reset. Blocking/pausing never builds an emission backlog. Keeping visible missed sand is more important than allowing an invisible, unlimited drain of material.

## Browser behavior

Physics uses 160 × 200 logical units, 60 fixed steps/s and two substeps. Current maximum speed is 16 units/s and gravity is 12 units/s². Variable emission uses a nominal 24 grains/s, bounded below 44 with brief zero-rate sputter gaps. DPR is capped at 2. CSS container sizing preserves a uniform 4:5 canvas through rotation; ResizeObserver changes only its pixel backing store. Hidden documents suspend stepping and reset the clock on return.

An 8 ms frame work budget prevents catch-up spirals. Under extreme load simulation time can slow, without skipping particle accounting. Ordinary play must remain responsive and gentle. `?debug` explicitly exposes developer state for repeatable checks; normal play does not expose that mutable handle.

## Scope and hosting

Best scores are local and keyed to the current challenge. Sharing uses native share, then clipboard, then selectable manual text. Sound starts muted and uses native Web Audio after opt-in. There is no backend, leaderboard or analytics. Workers static assets serve the Vite build. The owner has deferred automatic deployment; use direct Wrangler commands and keep other sites in the shared account untouched.
