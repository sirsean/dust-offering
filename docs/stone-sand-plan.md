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
