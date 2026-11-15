# Project status — Fringe lettering and mechanical controls

Revision 0.9.0 applies the owner's FringeV2 font throughout the interface and Canvas text. Worn, sand-blasted mechanical controls use recessed housings, beveled key faces and amber selection indicators. The opening explanation box and its dismissal logic are removed, so Free Pour starts directly. Persistent discovery, the wide uneven pour, desert palette, multi-touch, fading grease and ground piles retain their 0.8.0 tuning and `stone-offering-v6` challenge.

Current design: [stone-sand-plan.md](stone-sand-plan.md). Current visual evidence: [visual-style.md](visual-style.md) and `artifacts/fringe-controls/`. The unchanged 0.8.0 physical and real-time baseline remains in [playtest.md](playtest.md), [physics-results.md](physics-results.md) and `artifacts/stone-*`.

## Behavior and checks

- The supplied font is hosted locally and preloaded. It covers headings, controls, results, copy fields, notices and bowl counts. Canvas reads the inherited CSS font family. No initial help box, saved hint state or dismissal callback remains.
- Controls have static grit and wear, physical bevels, clear active/pressed/disabled states and a visible keyboard outline. Touch targets remain at least 44 pixels high. Phone, 320-pixel narrow, landscape and desktop captures verify that the font fits without page overflow; the result and manual-copy flow are checked too.
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

Public repo: <https://github.com/sirsean/dust-offering>. Production: <https://dust-offering.sirsean.me>. This revision is developed on `fringe-controls`, then integrated into `main`. Preview: <https://fringe-controls.dust-offering.sirsean.me>.

Revision 0.8.0 source is commit `1527287`; its material and flow evidence remains the current physical baseline. Revision 0.7.0 (`421043a`) evidence is archived under `docs/archive/stone-v5/` and `artifacts/archive/stone-v5/`. The 0.5.0 palette baseline remains in `artifacts/desert-dusk/`. Earlier revisions remain under the other archive directories.

Use direct Wrangler deployment. Automated GitHub deployments remain deferred; no deployment secret should be configured until requested. CI runs code/browser checks. `npm run deploy` publishes production, and `npm run deploy:branch -- fringe-controls` publishes the isolated preview. See [deployment.md](deployment.md) for environment-specific writable paths.
