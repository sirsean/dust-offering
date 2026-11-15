# Project status — desert dusk and greasy finger marks

Revision 0.5.0 gives the game the owner's brown, umber, dusk-orange and sand palette. The full stone face is weathered desert rock, the grains are pale dust, the vessels read as clay, and finger traces are dark grease marks that deepen with layering and fade back into the stone. The physical model remains `stone-offering-v3`, including full-triangle multi-touch, loose downhill guidance and the wider draining inlet.

Current design: [stone-sand-plan.md](stone-sand-plan.md). Visual references, palette and current screenshots: [visual-style.md](visual-style.md), `artifacts/desert-dusk/`. Architecture and tuning: [architecture.md](architecture.md), [physics-results.md](physics-results.md). The 0.4.0 material baseline is retained in [playtest.md](playtest.md) and `artifacts/stone-*`.

## Behavior and checks

- Traces stack to six and halve in strength every six seconds. A decaying orientation field grips across a stroke while allowing downhill sliding along it. Uphill drawing on the same slope gives the same guide; crossings blend, and grains can drift away.
- Brushing reaches the entire visible stone, including the tip, sides and bottom rim. Swept contacts may end beyond an edge while still coating it. Bowls and the surrounding space remain outside the mask.
- The source is 18 units wide rather than 12, with twelve lanes and the same 24-grain/s emission rate. Weaker attachment below the inlet and 2.5-second upper bonds let the tip drain. Natural bond release wakes unsupported loose sand without waking bottom piles.
- Touch, pen and mouse share one action. Each finger has its own captured path and footprint. A partial lift/cancel affects only that finger, with no connecting line between contacts.
- Reset and mode changes clear traces and contacts. Resize preserves the field. Source pause still allows fading and settling; hidden pages and finished challenges freeze simulation time.
- The optional `stone-offering-v3` challenge retains 960 grains and targets 360 / 600, with no countdown or time penalty. Earlier bests remain isolated under their previous identifiers.
- Verification covers 38 numerical/unit tests and 19 browser scenarios across emulated phone and desktop. Three desktop duplicates of touch-only cases are intentionally skipped. Coverage includes three seeded two-minute unattended pours, slope guidance, reverse strokes, horizontal marks, crossings, visible six-second decay, edge-reaching input and unsupported sleeping sand. Lint, formatting and production build are required before release.
- Real hardware feel still needs the owner's evaluation. The automated player verifies visible response, layering, decay, material release, conservation, challenge completion and retained-material performance.

## Repository and deployment

Public repo: <https://github.com/sirsean/dust-offering>. Production: <https://dust-offering.sirsean.me>. This revision is developed on `desert-dusk`, then integrated into `main`. Preview: <https://desert-dusk.dust-offering.sirsean.me>.

Revision 0.4.0 source is commit `93f756b`; its physics and real-time material measurements remain the baseline for this visual pass. Revision 0.3.0 source is commit `7475680`, with evidence under `archive/stone-v2/`. Revision 0.2.0 source is commit `4f31c72`, with evidence under `archive/stone-v1/`. Original ridge source is commit `bef6b51`, with evidence under `archive/v2/`.

Use direct Wrangler deployment. Automated GitHub deployments remain deferred; no deployment secret should be configured until requested. CI runs code/browser checks. `npm run deploy` publishes production, and `npm run deploy:branch -- desert-dusk` publishes the isolated preview. See [deployment.md](deployment.md) for environment-specific writable paths.
