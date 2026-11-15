# Project status — a wider, uneven pour

Revision 0.8.0 widens the aperture from 18 to 34 units and varies the arriving flow. Slow swells, smaller ripples and occasional short sputters make the stream uneven while keeping grain motion gentle. Persistent stone discovery, the moving offscreen opening, desert palette, multi-touch, fading grease and ground piles remain. The new delivery conditions use `stone-offering-v6`.

Current design: [stone-sand-plan.md](stone-sand-plan.md). Current gameplay evidence: [playtest.md](playtest.md) and `artifacts/stone-*`. Current source and material measurements: [physics-results.md](physics-results.md). Palette references and the 0.5.0 appearance baseline remain in [visual-style.md](visual-style.md) and `artifacts/desert-dusk/`.

## Behavior and checks

- Stone artwork, rim and grease share a persistent local visibility mask. Untouched areas have no silhouette, shadow or outline. Landscape, grains and bowls stay visible.
- A finger pass reveals about 65% at its centre with soft edges; more passes deepen and widen it. Sand gradually reveals its swept paths and resting patches. Discovery follows distance/time rather than event frequency or frame rate, and never changes physics or seeded randomness.
- Traces stack to six and halve in strength every six seconds. A decaying orientation field grips across a stroke while allowing downhill sliding along it. Uphill drawing on the same slope gives the same guide; crossings blend, and grains can drift away.
- Brushing reaches the entire visible stone, including the tip, sides and bottom rim. Swept contacts may end beyond an edge while still coating it. Bowls and the surrounding space remain outside the mask.
- The invisible opening is at y=-4 and spans 34 units with 24 lanes. Its centre sweeps through x=80,124,80,36,80 over 60 seconds. It starts with the first pour, evolves while emission pauses, and freezes while hidden or finished. Reset restarts its phase. Offscreen grains remain accounted for.
- Nominal flow is 24 grains/s, with gradual swells and ripples bounded below 44 grains/s. Irregularly placed 1.4-second sputter clusters produce real brief gaps. Flow samples seed and source time without consuming particle randomness. It does not repeat with the one-minute sway, and paused/blocked emission never builds a backlog.
- Weaker attachment below the inlet and 2.5-second upper bonds let the tip drain. Natural bond release wakes unsupported loose sand without waking bottom piles.
- Touch, pen and mouse share one action. Each finger has its own captured path and footprint. A partial lift/cancel affects only that finger, with no connecting line between contacts.
- Reset and mode changes clear discovery, traces and contacts. Begin preserves preparation brushing. Resize preserves the logical fields. Source pause still allows discovery, fading and settling; hidden pages and finished challenges freeze simulation time. Grease fading leaves discovered stone visible.
- The optional `stone-offering-v6` challenge retains 960 grains and targets 360 / 600, with variable pour duration, no countdown and no time penalty. Earlier bests remain isolated under their previous identifiers.
- Verification covers 52 numerical/unit tests and 27 browser scenarios across emulated phone and desktop. Three desktop duplicates of touch-only cases are intentionally skipped. New checks cover rate bounds, slow swells, genuine sputter gaps, widened births, seed/order independence, no catch-up bursts, full supply and conservation. Discovery, grease, multi-touch, material and challenge checks remain. Lint, formatting and production build are required before release.
- Real hardware feel still needs the owner's evaluation. The real-time player verifies progressive sand discovery, two-finger discovery and grease, material release, conservation, challenge completion and retained-material performance.

## Repository and deployment

Public repo: <https://github.com/sirsean/dust-offering>. Production: <https://dust-offering.sirsean.me>. This revision is developed on `variable-pour`, then integrated into `main`. Preview: <https://variable-pour.dust-offering.sirsean.me>.

Revision 0.7.0 source is commit `421043a`; its evidence is archived under `docs/archive/stone-v5/` and `artifacts/archive/stone-v5/`. The 0.5.0 appearance baseline remains in `artifacts/desert-dusk/`. Earlier revisions remain under `archive/stone-v4/`, `archive/stone-v3/`, `archive/stone-v2/`, `archive/stone-v1/` and `archive/v2/`.

Use direct Wrangler deployment. Automated GitHub deployments remain deferred; no deployment secret should be configured until requested. CI runs code/browser checks. `npm run deploy` publishes production, and `npm run deploy:branch -- variable-pour` publishes the isolated preview. See [deployment.md](deployment.md) for environment-specific writable paths.
