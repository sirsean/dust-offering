# Piles at the Black Pyramid

Dust wells up through a hidden stone. Fingers and grains uncover the face where they touch it. Sweep the dust into faint, broken rings. The fragments brighten as their ring fills. Rust-colored ticks mark excess dust, which can be recovered and moved into another ring. When the wells are quiet and every ring holds its share after your fingers lift, advance to the next offering. [Play Piles](https://piles.dust-offering.sirsean.me/piles)

## The sequence

The four authored opening layouts teach carrying a pile, dividing it, and recovering banks. The fifth offering is the first generated layout. The run opens on the default seed `48`. A link such as `/piles?seed=scablands` starts or resumes that seed on the current browser. Every seed shares the opening four layouts. The seed and offering number determine the position and size of generated rings, the wells and their supplies, and the independent grain seed.

| Offerings | Generated complexity                   |
| --------- | -------------------------------------- |
| 5 to 12   | Four rings and two wells               |
| 13 to 19  | Five rings and smaller targets         |
| 20 onward | Six rings and increasingly tight fills |

The generator chooses among three sets of upper and lower sites, then samples a mix of sites, mirrors the board, and varies positions and radii. It rejects layouts without space for distinct rings, room at the rim, and clearance between wells and goals. Later chapters continue with smaller adjustments toward a practical limit for ring size and fill tolerance. Layouts generate on demand without simulating earlier offerings. A change to the generator or progression format should use a new run version to preserve the meaning of existing checkpoints.

Advancing saves the unlocked offering and the reveal map for the current seed in the browser. Restart repeats the current offering with fresh dust and grease. The revealed stone carries forward within each run. On reload the game resumes the last unlocked offering with freshly prepared dust and the reveal saved at that checkpoint.

## The records

The first record follows offering five. After that, a record follows every seven offerings. Read it over the last arrangement and continue at your own pace. The first five records are Pyramid Order recruitment material. The Order’s teachers use the Black Pyramid as a figure for questions about the mind, and their exercises begin with familiar footsteps and the decision to move a grain of sand. Later entries pair seeded field observations with margin notes. The records are original story material for the prototype. The Order’s scant public history and the Scablands setting come from the Fringe reference pages. [Pyramid Order](https://chatgpt.com/space/page_739e2a9e65cc8191a41bdd629ed27b07) · [Scablands](https://chatgpt.com/space/page_329f295dd5588191af8b0effb8cd9ec6) · [Original Dust Offering plan](https://chatgpt.com/space/page_ad5cbe9d6d2881919e3df3cfb9f08feb)

## Checks

The numerical checks sample repeatability, spacing and cadence across seeds and distant offering numbers. Physical replay uses the same brush API as play to clear representative generated layouts through offering 5,000. The browser suite starts on offering one, follows the opening through the first generated layout and its record, and verifies that a reload restores the next offering and the exact reveal map.
