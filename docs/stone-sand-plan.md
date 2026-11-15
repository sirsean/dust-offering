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
