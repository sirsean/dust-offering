# Piles

Dust wells up through a stone seen from above. Sweep it ahead of your finger into the marked rings. Each ring brightens as it fills. When all rings hold their share after the wells finish and your fingers lift, you can inspect the arrangement or advance. The stone selector makes every level available for playtesting. Restart repeats the current layout and the URL links directly to the selected stone. [Play Piles](https://piles.dust-offering.sirsean.me/piles)

| Stone         | Wells | Rings | What the player does                                                             |
| ------------- | ----: | ----: | -------------------------------------------------------------------------------- |
| First pile    |     1 |     1 | Move a mound beside its well.                                                    |
| Two sides     |     2 |     2 | Sweep the two mounds in opposite directions.                                     |
| Three islands |     3 |     3 | Place a mound high on the face and two across the base.                          |
| Four corners  |     2 |     4 | Take part of each mound to an upper ring and move the rest into the lower rings. |

The Piles brush pushes grains ahead while preserving their sideways position when the moving finger catches them. An edge pass can take part of a mound, and a centered pass can carry most of it. Taps still push radially. Grains settle under friction and spilled dust remains recoverable.

Add a stone in [piles.js](../src/config/piles.js) with a stable ID, seed, wells with individual grain budgets, and circular targets. Coordinates use the existing 160 × 200 board. Each target needs the level's fill fraction of an equal share of the total supply. Keep the targets inside the triangle and separated. Changing the relation between wells and rings creates different gestures even at the same target count. For example, a middle well can feed two unevenly spaced rings, or a ring can need contributions from both ends of the stone.

Each level has a brush-only solution exercised in Node and with native emulated touch. The touch test plays the four levels in order, verifies that an active finger cannot finish a level, checks grain conservation, and advances with the visible button. The four-ring solution divides both mounds using off-center sweeps. A separate browser test covers direct links, restart, pause and small viewports.
