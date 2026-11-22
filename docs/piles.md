# Piles

Dust wells up through a stone seen from above. Sweep it ahead of your finger into faint, broken rings. The fragments brighten as their ring fills. Rust-colored ticks and an “overfilled” message mark excess dust. Sweep the excess into a ring that still needs it. When dust has stopped surfacing and every ring holds its share after your fingers lift, you can inspect the arrangement or advance. The stone selector makes every level available for playtesting. Restart repeats the current layout and the URL links directly to the selected stone. [Play Piles](https://piles.dust-offering.sirsean.me/piles)

| Stone         | Wells | Rings | What the player does                                                    |
| ------------- | ----: | ----: | ----------------------------------------------------------------------- |
| First pile    |     1 |     1 | Carry a mound down the length of the face.                              |
| Two sides     |     1 |     2 | Split an upper mound and move the halves to opposite sides of the base. |
| Three islands |     1 |     3 | Divide one mound among the upper ring and the two lower corners.        |
| Four corners  |     2 |     4 | Split both mounds and carry the portions to four separate rings.        |

The Piles brush pushes grains ahead while preserving their sideways position when the moving finger catches them. An edge pass can take part of a mound, and a centered pass can carry most of it. Taps still push radially. Grains settle under friction and spilled dust remains recoverable.

Add a stone in [piles.js](../src/config/piles.js) with a stable ID, seed, wells with individual grain budgets, and circular targets. Coordinates use the existing 160 × 200 board. The target quantity is an equal share of the total supply with tolerance on either side. For example, a fill fraction of 0.7 accepts 70% to 130% of one share, rounded inward to whole grains. The broken artwork stays close to the circular scoring boundary and is stable through resize and restart. Keep targets inside the triangle and separated. Moving wells farther from targets and using fewer wells than targets call for longer sweeps and deliberate splits.

Each level has a brush-only solution exercised in Node and with native emulated touch. The touch test plays the four levels in order, verifies that an active finger cannot finish a level, checks grain conservation, and advances with the visible button. The sequence also overfills a ring and then moves excess dust to another ring. A separate browser test covers direct links, restart, pause and small viewports.
