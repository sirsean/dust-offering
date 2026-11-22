# Piles

Dust wells up through a stone seen from above. Sweep it ahead of your finger into faint, broken rings. The fragments brighten as their ring fills. Rust-colored ticks and an “overfilled” message mark excess dust. Sweep the excess into a ring that still needs it. When dust has stopped surfacing and every ring holds its share after your fingers lift, you can inspect the arrangement or advance. The stone selector makes every level available for playtesting. Restart repeats the current layout and the URL links directly to the selected stone. [Play Piles](https://piles.dust-offering.sirsean.me/piles)

The stone begins hidden. Finger passes and real grain contact gradually uncover its surface and rim, while the rings remain visible as destinations. All four layouts use one stone texture and share the same reveal map. Advancing, selecting a layout, and restarting keep the uncovered areas visible. Each layout has its own dust and temporary grease, and opening the page afresh begins with an undiscovered stone.

| Stone         | Wells | Rings | What the player does                                                    |
| ------------- | ----: | ----: | ----------------------------------------------------------------------- |
| First pile    |     1 |     1 | Carry a mound down the length of the face.                              |
| Two sides     |     1 |     2 | Split an upper mound and move the halves to opposite sides of the base. |
| Three islands |     1 |     3 | Divide one mound among the upper ring and the two lower corners.        |
| Four corners  |     2 |     4 | Split both mounds and carry the portions to four separate rings.        |

The Piles brush pushes grains forward and outward. The sides of a mound peel away as the finger moves, so long sweeps leave banks along the route. Follow those banks with another pass to bring the remaining dust into a ring, or branch off toward a ring that still needs it. Taps push radially. Grains settle under friction and spilled dust remains recoverable.

Add a stone in [piles.js](../src/config/piles.js) with a stable ID, seed, wells with individual grain budgets, and circular targets. Coordinates use the existing 160 × 200 board. The target quantity is an equal share of the total supply with tolerance on either side. For example, a fill fraction of 0.7 accepts 70% to 130% of one share, rounded inward to whole grains. The broken artwork stays close to the circular scoring boundary and is stable through resize and restart. Keep targets inside the triangle and separated. Moving wells farther from targets and using fewer wells than targets call for longer sweeps and deliberate splits.

The brush in `piles-v3` blends the stroke direction with outward pressure before pushing each grain to the edge of the finger. The previous full forward carry is the comparison case in the unit test. The former sweep routes finish all four levels at full carry and leave unfinished arrangements with the new brush. The first stone's straight sweep moved 328 of 520 grains into the ring in the numerical comparison. It takes 364 to finish. All grains stay in play.

The emulated-touch playthrough checks that the first sweep leaves work to do and that follow-up sweeps complete all four levels. It verifies that an active finger cannot finish a level, checks grain conservation, and advances with the visible button. Separate checks exercise overfill recovery, direct links, restart, pause and small viewports.
