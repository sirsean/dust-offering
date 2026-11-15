# Project status — discovering the stone

Revision 0.7.0 starts with the entire triangle invisible. Fingers and sand gradually reveal only the areas they touch. Repeated contact uncovers more stone, and discovery lasts for the current run. The moving offscreen pour, desert palette, full-triangle multi-touch, fading greasy downhill guides, slow motion and retained ground piles remain in place. The changed visibility conditions use `stone-offering-v5`.

Current design: [stone-sand-plan.md](stone-sand-plan.md). Current gameplay evidence: [playtest.md](playtest.md) and `artifacts/stone-*`. Unchanged physical tuning and baseline measurements: [physics-results.md](physics-results.md). Palette references and the 0.5.0 appearance baseline remain in [visual-style.md](visual-style.md) and `artifacts/desert-dusk/`.

## Behavior and checks

- Stone artwork, rim and grease share a persistent local visibility mask. Untouched areas have no silhouette, shadow or outline. Landscape, grains and bowls stay visible.
- A finger pass reveals about 65% at its centre with soft edges; more passes deepen and widen it. Sand gradually reveals its swept paths and resting patches. Discovery follows distance/time rather than event frequency or frame rate, and never changes physics or seeded randomness.
- Traces stack to six and halve in strength every six seconds. A decaying orientation field grips across a stroke while allowing downhill sliding along it. Uphill drawing on the same slope gives the same guide; crossings blend, and grains can drift away.
- Brushing reaches the entire visible stone, including the tip, sides and bottom rim. Swept contacts may end beyond an edge while still coating it. Bowls and the surrounding space remain outside the mask.
- The invisible opening is at y=-4, spans 18 units and emits 24 grains/s from twelve lanes. Its centre sweeps from x=80 to 124, back through 80 to 36, then to 80 over 60 simulation seconds. It starts with the first pour, keeps drifting during a pour pause, and freezes while hidden or finished. Reset restarts its phase. Offscreen grains remain accounted for.
- Weaker attachment below the inlet and 2.5-second upper bonds let the tip drain. Natural bond release wakes unsupported loose sand without waking bottom piles.
- Touch, pen and mouse share one action. Each finger has its own captured path and footprint. A partial lift/cancel affects only that finger, with no connecting line between contacts.
- Reset and mode changes clear discovery, traces and contacts. Begin preserves preparation brushing. Resize preserves the logical fields. Source pause still allows discovery, fading and settling; hidden pages and finished challenges freeze simulation time. Grease fading leaves discovered stone visible.
- The optional `stone-offering-v5` challenge retains 960 grains and targets 360 / 600, with no countdown or time penalty. Earlier bests remain isolated under their previous identifiers.
- Verification covers 48 numerical/unit tests and 25 browser scenarios across emulated phone and desktop. Three desktop duplicates of touch-only cases are intentionally skipped. Discovery checks cover blank initial pixels, local cumulative brushing, sand-only reveal, all edges, multi-touch, persistence after grease fades, resize/hidden/reset behavior, deterministic replay and identical physics with discovery enabled/disabled. Existing source, material, pile and challenge checks remain. Lint, formatting and production build are required before release.
- Real hardware feel still needs the owner's evaluation. The real-time player verifies progressive sand discovery, two-finger discovery and grease, material release, conservation, challenge completion and retained-material performance.

## Repository and deployment

Public repo: <https://github.com/sirsean/dust-offering>. Production: <https://dust-offering.sirsean.me>. This revision is developed on `reveal-stone`, then integrated into `main`. Preview: <https://reveal-stone.dust-offering.sirsean.me>.

Revision 0.6.0 source is commit `ca5b0fb`; its evidence is archived under `docs/archive/stone-v4/` and `artifacts/archive/stone-v4/`. The 0.5.0 appearance baseline remains in `artifacts/desert-dusk/`. Earlier revisions remain in `archive/stone-v3/`, `archive/stone-v2/`, `archive/stone-v1/` and `archive/v2/`.

Use direct Wrangler deployment. Automated GitHub deployments remain deferred; no deployment secret should be configured until requested. CI runs code/browser checks. `npm run deploy` publishes production, and `npm run deploy:branch -- reveal-stone` publishes the isolated preview. See [deployment.md](deployment.md) for environment-specific writable paths.
