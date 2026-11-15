# Project status — an offscreen drifting pour

Revision 0.6.0 releases dust above the board from an invisible opening that sways horizontally. The line at the triangle's tip is removed. The desert palette, full-triangle multi-touch, greasy downhill guides, slow motion and retained ground piles remain in place. The changed delivery conditions use `stone-offering-v4`.

Current design: [stone-sand-plan.md](stone-sand-plan.md). Current measurements and gameplay: [physics-results.md](physics-results.md), [playtest.md](playtest.md), `artifacts/stone-*` and `artifacts/pour-*`. Palette references and the 0.5.0 appearance baseline remain in [visual-style.md](visual-style.md) and `artifacts/desert-dusk/`.

## Behavior and checks

- Traces stack to six and halve in strength every six seconds. A decaying orientation field grips across a stroke while allowing downhill sliding along it. Uphill drawing on the same slope gives the same guide; crossings blend, and grains can drift away.
- Brushing reaches the entire visible stone, including the tip, sides and bottom rim. Swept contacts may end beyond an edge while still coating it. Bowls and the surrounding space remain outside the mask.
- The invisible opening is at y=-4, spans 18 units and emits 24 grains/s from twelve lanes. Its centre sweeps from x=80 to 124, back through 80 to 36, then to 80 over 60 simulation seconds. It starts with the first pour, keeps drifting during a pour pause, and freezes while hidden or finished. Reset restarts its phase. Offscreen grains remain accounted for.
- Weaker attachment below the inlet and 2.5-second upper bonds let the tip drain. Natural bond release wakes unsupported loose sand without waking bottom piles.
- Touch, pen and mouse share one action. Each finger has its own captured path and footprint. A partial lift/cancel affects only that finger, with no connecting line between contacts.
- Reset and mode changes clear traces and contacts. Resize preserves the field. Source pause still allows fading and settling; hidden pages and finished challenges freeze simulation time.
- The optional `stone-offering-v4` challenge retains 960 grains and targets 360 / 600, with no countdown or time penalty. Earlier bests remain isolated under their previous identifiers.
- Verification covers 42 numerical/unit tests and 21 browser scenarios across emulated phone and desktop. Three desktop duplicates of touch-only cases are intentionally skipped. New coverage includes offscreen birth and entry, actual arrivals from both sides, smooth bounded source motion, phase handling during preparation/pause/reset/hidden/resize, no source marker, deterministic replay and full supply. Existing material, multi-touch and challenge checks remain. Lint, formatting and production build are required before release.
- Real hardware feel still needs the owner's evaluation. The automated player verifies visible response, layering, decay, material release, conservation, challenge completion and retained-material performance.

## Repository and deployment

Public repo: <https://github.com/sirsean/dust-offering>. Production: <https://dust-offering.sirsean.me>. This revision is developed on `drifting-pour`, then integrated into `main`. Preview: <https://drifting-pour.dust-offering.sirsean.me>.

Revision 0.5.0 source is commit `bd7324d`, with appearance evidence in `artifacts/desert-dusk/`. Fixed-source `stone-offering-v3` measurements from revision 0.4.0 (`93f756b`) are archived under `docs/archive/stone-v3/` and `artifacts/archive/stone-v3/`. Older revisions remain in `archive/stone-v2/`, `archive/stone-v1/` and `archive/v2/`.

Use direct Wrangler deployment. Automated GitHub deployments remain deferred; no deployment secret should be configured until requested. CI runs code/browser checks. `npm run deploy` publishes production, and `npm run deploy:branch -- drifting-pour` publishes the isolated preview. See [deployment.md](deployment.md) for environment-specific writable paths.
