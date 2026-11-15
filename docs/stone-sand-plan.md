# Sand on stone — current prototype direction

This specification records the owner's gameplay feedback after the first offering prototype. It supersedes the original drawn-ridge mechanic and its old ramp/split gate.

- The earlier game felt much too fast and stressful. Substantially reduce grain speed, acceleration, and emission density. Keep relaxed Free Pour as the default and allow pauses without penalty.
- The triangle is a stone surface. Incoming sand adheres a little to stone and more strongly to existing sand. Physical deposits themselves guide later grains.
- Use one direct brush action. A finger pushes and loosens deposited sand, reshaping its banks and releasing attached grains. No separate Draw/Rub modes, no generated barriers on empty stone.
- Grains can remain stuck to the stone. Rubbed attachments should release their dependent deposits and flow slowly again rather than immediately freezing back in place.
- Misses stay visible as actual resting grains in piles at the bottom, outside the two bowls. Reset clears both the stone and the ground.
- Keep the existing optional challenge, results, saved best, sharing and sound. Give the new conditions a fresh challenge identifier so old scores are not compared with the new model. No countdown or time bonus.

Starting tuning: maximum speed 16 units/s (previously 78), gravity 12 units/s² (160), downward launch 3 units/s (22), emission 24 grains/s (120), lateral launch ±0.65 units/s (±4). Finger diameter 8 logical units. Keep these adjustable and measure the resulting adhesion and brush response before handoff.

For the optional 40-second active pour, derive a new supply of 960 grains and targets 360 / 600 (3:5). Slow settling and rescue time is additional. Weak stone attachment, stronger sand attachment, bond release, visible persistent ground piles, conservation and responsive touch are the new readiness criteria. The original v2 gate is historical.

## Sticky traces and multi-touch — historical revision 0.3.0

The next feedback adds a visible trace wherever fingers brush the stone. That trace increases local stone adhesion, stacks with repeated brushing, and decays gradually. Multiple fingers must work independently and add strength where their paths overlap. Brushing still releases and pushes sand already present.

Use an 8-unit soft footprint, approximately one strength unit per pass and a cap of six. Stone attachment exposure is multiplied by `1 + 8 × strength`. Trace strength halves every 30 seconds of simulation time. Pausing the pour still allows fading and settling; hidden pages and finished challenges freeze both. Decay changes future attachment, without dissolving existing bonds. Reset and mode changes clear the coating; resize preserves it.

Render the field as a light sage trace under the warm sand, with stronger coating visibly brighter. Keep it visible after lifting and under reduced motion. Dose by travelled distance rather than pointer-event frequency. Protect the source and bowls. Give each pointer its own captured stroke, previous point, footprint and cancellation lifecycle. No finger may connect to another finger's path. The changed adhesion uses challenge identifier `stone-offering-v2`, retaining the same slow motion, supply and targets.

## Downhill guidance and full stone access — revision 0.4.0

The latest feedback asks for brushing everywhere on the visible triangle, faster visible fading, directional stickiness that roughly guides sand under gravity, less buildup near the top, and a wider pour. This supersedes the old brush mask and the 30-second decay tuning.

- Use the full outer triangle, from the tip at (80,6) to the base from (1,176) to (159,176), for both interaction and visual clipping. A swept finger may finish outside and still coat the edge. The source remains fixed; brushing its stone surroundings is allowed. Bowls lie outside the triangle.
- Strength halves every six seconds. Use a more direct opacity response so fading is apparent within a few seconds. Repeated passes still add strength, capped at six; pausing the source continues fading.
- Store the local stroke axis as well as strength. Uphill and downhill passes on the same slope give the same guide. Crossings blend their orientations. Grip is stronger across a trace than along it; gravity is partly projected down the slope with residual downward acceleration. Sand may drift off, and horizontal marks cannot suspend it indefinitely. Dots can still increase local capture.
- Widen the source from 12 to 18 logical units and use twelve distributed lanes. Keep emission at 24 grains/s and speed capped at 16 units/s.
- Suppress new bonds above y=45 and taper attachment to full strength by y=72. Bonds formed in that inlet region last 2.5 seconds before gently releasing their descendants. Wake unsupported loose sand as well; keep every grain and preserve ground piles.
- Use challenge identifier `stone-offering-v3`, retaining 960 grains and targets 360 / 600. Measure full supply, two-minute unattended drainage, loose directional guidance, visible fading and all three triangle edges before deploying.

## Desert stone and grease marks — revision 0.5.0

The owner's visual direction is brown, umber, dusk orange and sand: mysterious old stone found in the desert, dust blowing across the Scablands, and greasy finger marks left in the sand on the stone. Use warm weathered mineral tones, pale grains and clay vessels. Layered marks darken instead of glowing; fading returns the underlying stone color. Keep dust legible over both the bare face and marks. Ground the scenery in the Fringe location and visual references, without introducing new lore or symbols. Details, palette ownership and current screenshots are in [visual-style.md](visual-style.md).

This is a rendering and interface pass. The six-second decay, directional grip, brush coverage, multi-touch, inlet drainage, accounting and `stone-offering-v3` challenge remain the same.

## Offscreen drifting pour — revision 0.6.0

Release grains above the gameboard, with no visible line or nozzle at the triangle's tip. The invisible opening moves slowly from side to side rather than always feeding the middle.

Spawn at y=-4, keeping new grains wholly outside the 160 × 200 canvas. Retain the 18-unit-wide opening, twelve lanes, 24 grains/s, slow launch and 16-unit/s speed cap. Move its centre with a sinusoidal 60-second cycle, amplitude 44 around x=80: centre → right at x=124 → centre → left at x=36 → centre. Clamp the amplitude to leave room for the full opening within the board width. Motion comes from fixed simulation time, not viewport size or emitted-grain count. Do not add sideways force to already-falling grains.

Start the phase with the first pour, so waiting in Challenge preparation does not move its starting point. Paused emission still lets the opening drift; hidden pages and finished challenges freeze it with the rest of the simulation. Reset and mode changes restart the phase. Count and retain offscreen grains normally, without a catch-up burst on Resume. Give these changed delivery conditions the new identifier `stone-offering-v4`, keeping the 960-grain supply and 360 / 600 targets.

## Discovering the stone — revision 0.7.0

The owner's next direction makes the triangle initially invisible. Brushing and sand contact reveal it progressively, wherever they touch. Repeated brushing and sustained grain contact uncover more of the local material; untouched stone, including its rim, stays hidden. Keep the desert landscape, bowls and grains visible from the start.

Discovery persists for the current run, independently of the fading sticky grease marks. Begin preserves preparation discovery. Reset and mode changes hide the stone again; resize and hidden recovery preserve it. Discovery changes visibility only, with no change to sand physics, adhesion, source timing or accounting. Use a fresh `stone-offering-v5` challenge identifier because the information available to the player has changed; supply and targets remain 960 and 360 / 600.

Use a soft 6-unit finger reveal radius with about 0.65 visibility gain per pass, capped at full visibility. Use a 2-unit sand halo at 0.24 visibility per contact-second, sampled along each grain's swept path every six fixed steps. Resting sand keeps revealing its patch. Exposure is additive by distance for fingers and by simulation time for sand, avoiding pointer-frequency and frame-rate dependence. Composite both the artwork and grease through this persistent mask, leaving grains above it. All tuning belongs in the shared prototype configuration.

## Wider, uneven pour — revision 0.8.0

The owner asks for a wider aperture and more variable flow: speeding up, slowing down and sometimes sputtering. Widen the opening from 18 to 34 logical units with 24 distributed lanes. Preserve its invisible offscreen position, slow horizontal sway and gentle individual grain motion.

Vary arrival density around the nominal 24 grains/s. Smooth seeded noise changes the broad swell over 4.5-second intervals, with smaller 0.75-second ripples. A 1.4-second sputter cluster occurs at an irregular offset within each 12-second window, breaking into three or four uneven pulses with brief actual gaps. The default instantaneous rate is bounded below 44 grains/s, and each fixed step emits at most one grain. Avoid accumulating missed flow into later bursts.

Use seed/time sampling independent of particle randomness and rendering. Flow follows the opening's existing clock: it starts on first pour, evolves while emission is paused, freezes while hidden/finished, and resets for a new run. It need not repeat with the opening's 60-second sway. A fixed challenge seed keeps shared runs reproducible. Keep supply at 960 and targets 360 / 600, with no fixed pour duration or countdown. Version the changed delivery as `stone-offering-v6`; `sourceFlowVariation: 0` is available for steady laboratory controls.
